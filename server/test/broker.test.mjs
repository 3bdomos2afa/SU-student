import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign, randomBytes } from 'node:crypto';
import { createBroker, s256 } from '../src/broker.mjs';
import { googleClient } from '../src/google.mjs';

const GOOGLE_ID = 'web-client.apps.googleusercontent.com';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const sign = (claims, kid = 'k1', key = privateKey) => {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', kid })).toString('base64url');
  const p = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${h}.${p}.${createSign('RSA-SHA256').update(`${h}.${p}`).sign(key).toString('base64url')}`;
};

function setup({ claims = {}, student = { StudentID: '100001', FirstNameEN: 'Test', LastNameEN: 'Student' }, domain = 'su.edu.eg' } = {}) {
  let lastNonce;
  const fetchImpl = async (url, init) => {
    if (url.includes('/certs')) return { ok: true, json: async () => ({ keys: [jwk] }) };
    assert.match(String(init.body), /client_secret=secret/);
    const c = { iss: 'https://accounts.google.com', aud: GOOGLE_ID, exp: Math.floor(Date.now() / 1000) + 300, email: 'Student.Test@su.edu.eg', email_verified: true, hd: 'su.edu.eg', nonce: lastNonce, ...claims };
    return { ok: true, json: async () => ({ id_token: sign(c) }) };
  };
  const g = googleClient({ clientId: GOOGLE_ID, clientSecret: 'secret', fetchImpl });
  const google = { ...g, authorizeUrl: (o) => { lastNonce = o.nonce; return g.authorizeUrl(o); } };
  const adapter = {
    findStudentByEmail: async (email) => (email === 'student.test@su.edu.eg' ? student : null),
    issuePortalSession: async (s) => ({ Token: 'portal-token-1234567890', StudentID: s.StudentID, FirstNameEN: s.FirstNameEN, LastNameEN: s.LastNameEN }),
  };
  const config = { baseUrl: 'https://sso.su.edu.eg', appRedirect: 'unicodesis://oauth/callback', appClientIds: ['su-student-android'], allowedDomain: domain };
  return createBroker({ config, adapter, google });
}

async function signInFlow(broker, verifier = randomBytes(32).toString('base64url')) {
  const a = broker.authorize({ response_type: 'code', client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback', code_challenge: s256(verifier), code_challenge_method: 'S256', state: 'app-state' });
  assert.equal(a.status, 302);
  const g = new URL(a.location);
  assert.equal(g.origin, 'https://accounts.google.com');
  assert.equal(g.searchParams.get('redirect_uri'), 'https://sso.su.edu.eg/oauth/google/callback');
  const cb = await broker.googleCallback({ state: g.searchParams.get('state'), code: 'google-code' });
  const back = new URL(cb.location);
  return { back, verifier };
}

test('full Google sign-in returns the matching student session', async () => {
  const broker = setup();
  const { back, verifier } = await signInFlow(broker);
  assert.equal(back.protocol, 'unicodesis:');
  assert.equal(back.searchParams.get('state'), 'app-state');
  const code = back.searchParams.get('code');
  assert.ok(code);
  const t = await broker.token({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback' });
  assert.equal(t.status, 200);
  assert.deepEqual(t.json.student, { Token: 'portal-token-1234567890', StudentID: '100001', FirstNameEN: 'Test', LastNameEN: 'Student' });
  const again = await broker.token({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback' });
  assert.equal(again.status, 400, 'codes are single use');
});

test('wrong PKCE verifier is rejected and burns the code', async () => {
  const broker = setup();
  const { back, verifier } = await signInFlow(broker);
  const code = back.searchParams.get('code');
  const bad = await broker.token({ grant_type: 'authorization_code', code, code_verifier: 'x'.repeat(43), client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback' });
  assert.equal(bad.status, 400);
  const good = await broker.token({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback' });
  assert.equal(good.status, 400);
});

test('unknown client, redirect or plain PKCE is refused', () => {
  const broker = setup();
  const base = { response_type: 'code', client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback', code_challenge: s256('v'.repeat(43)), code_challenge_method: 'S256', state: 's' };
  assert.equal(broker.authorize({ ...base, client_id: 'evil' }).status, 400);
  assert.equal(broker.authorize({ ...base, redirect_uri: 'https://evil.example/cb' }).status, 400);
  assert.equal(broker.authorize({ ...base, code_challenge_method: 'plain' }).status, 400);
});

test('other email domains, unverified emails and unknown students are denied', async () => {
  for (const claims of [{ email: 'x@gmail.com', hd: undefined }, { email_verified: false }]) {
    const { back } = await signInFlow(setup({ claims }));
    assert.equal(back.searchParams.get('error'), 'access_denied');
    assert.equal(back.searchParams.get('code'), null);
  }
  const { back } = await signInFlow(setup({ student: null }));
  assert.equal(back.searchParams.get('error_description'), 'no_student');
});

test('forged or wrong-audience Google tokens are rejected', async () => {
  const g = googleClient({ clientId: GOOGLE_ID, clientSecret: 's', fetchImpl: async () => ({ ok: true, json: async () => ({ keys: [jwk] }) }) });
  const good = { iss: 'accounts.google.com', aud: GOOGLE_ID, exp: Math.floor(Date.now() / 1000) + 60, nonce: 'n' };
  assert.equal((await g.verifyIdToken(sign(good), 'n')).aud, GOOGLE_ID);
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  await assert.rejects(g.verifyIdToken(sign(good, 'k1', other), 'n'));
  await assert.rejects(g.verifyIdToken(sign({ ...good, aud: 'other' }), 'n'));
  await assert.rejects(g.verifyIdToken(sign(good), 'different-nonce'));
  await assert.rejects(g.verifyIdToken(sign({ ...good, exp: 1 }), 'n'));
});

test('a replayed Google callback state is refused', async () => {
  const broker = setup();
  const a = broker.authorize({ response_type: 'code', client_id: 'su-student-android', redirect_uri: 'unicodesis://oauth/callback', code_challenge: s256('v'.repeat(43)), code_challenge_method: 'S256', state: 's' });
  const state = new URL(a.location).searchParams.get('state');
  assert.equal((await broker.googleCallback({ state, code: 'c' })).status, 302);
  assert.equal((await broker.googleCallback({ state, code: 'c' })).status, 400);
});