// Google -> UnicodeSIS sign-in broker (OAuth 2.0 authorization-code + PKCE S256).
// The mobile app never sees Google tokens. It receives a one-time code and swaps it
// (with its PKCE verifier) for the matching student's portal session.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const s256 = (v) => createHash('sha256').update(v).digest('base64url');
const rand = () => randomBytes(32).toString('base64url');
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const json = (status, body) => ({ status, json: body });
const page = (status, text) => ({ status, text });

export function createBroker({ config, adapter, google, now = () => Date.now() }) {
  const pending = new Map(); // google state -> app request
  const codes = new Map(); // one-time app code -> verified student
  const sweep = () => {
    const t = now();
    for (const m of [pending, codes]) for (const [k, v] of m) if (v.exp < t) m.delete(k);
  };
  const googleRedirect = config.baseUrl + '/oauth/google/callback';

  function authorize(q) {
    sweep();
    if (q.response_type !== 'code') return page(400, 'unsupported_response_type');
    if (!config.appClientIds.includes(q.client_id)) return page(400, 'invalid_client');
    if (q.redirect_uri !== config.appRedirect) return page(400, 'invalid_redirect_uri');
    if (q.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(q.code_challenge || '')) return page(400, 'invalid_request');
    if (!q.state || q.state.length > 512) return page(400, 'invalid_request');
    if (pending.size > 5000) return page(503, 'busy');
    const id = rand(), nonce = rand();
    pending.set(id, { appState: q.state, challenge: q.code_challenge, clientId: q.client_id, nonce, exp: now() + 10 * 60e3 });
    return { status: 302, location: google.authorizeUrl({ state: id, nonce, redirectUri: googleRedirect, hd: config.allowedDomain }) };
  }

  async function googleCallback(q) {
    sweep();
    const p = q.state ? pending.get(q.state) : undefined;
    if (!p) return page(400, 'Sign-in expired. Return to the app and try again.');
    pending.delete(q.state);
    const back = (params) => ({ status: 302, location: config.appRedirect + '?' + new URLSearchParams({ ...params, state: p.appState }) });
    if (q.error || !q.code) return back({ error: 'access_denied' });
    let claims;
    try { claims = await google.exchange({ code: q.code, redirectUri: googleRedirect, nonce: p.nonce }); }
    catch { return back({ error: 'server_error' }); }
    const email = String(claims.email || '').toLowerCase();
    if (claims.email_verified !== true || !email) return back({ error: 'access_denied' });
    if (config.allowedDomain && !(email.endsWith('@' + config.allowedDomain) && claims.hd === config.allowedDomain))
      return back({ error: 'access_denied', error_description: 'domain' });
    let student;
    try { student = await adapter.findStudentByEmail(email); } catch { return back({ error: 'server_error' }); }
    if (!student) return back({ error: 'access_denied', error_description: 'no_student' });
    if (codes.size > 5000) return back({ error: 'temporarily_unavailable' });
    const code = rand();
    codes.set(code, { student, email, challenge: p.challenge, clientId: p.clientId, exp: now() + 2 * 60e3 });
    return back({ code });
  }

  async function token(form) {
    sweep();
    if (form.grant_type !== 'authorization_code') return json(400, { error: 'unsupported_grant_type' });
    const c = form.code ? codes.get(form.code) : undefined;
    if (c) codes.delete(form.code); // one-time, even when the verifier is wrong
    if (!c || c.clientId !== form.client_id || form.redirect_uri !== config.appRedirect) return json(400, { error: 'invalid_grant' });
    if (!form.code_verifier || !safeEq(s256(form.code_verifier), c.challenge)) return json(400, { error: 'invalid_grant' });
    let s;
    try { s = await adapter.issuePortalSession(c.student, { email: c.email }); } catch { return json(502, { error: 'server_error' }); }
    const tok = s && (s.Token || s.token);
    if (typeof tok !== 'string' || !s.StudentID) return json(502, { error: 'server_error' });
    return json(200, { student: { Token: tok, StudentID: String(s.StudentID), FirstNameEN: s.FirstNameEN, LastNameEN: s.LastNameEN } });
  }

  return { authorize, googleCallback, token, _sizes: () => ({ pending: pending.size, codes: codes.size }) };
}