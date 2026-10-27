import { createPublicKey, createVerify } from 'node:crypto';

const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

export function googleClient({ clientId, clientSecret, fetchImpl = fetch, now = () => Date.now() }) {
  let jwks = null, jwksAt = 0;
  async function keys() {
    if (!jwks || now() - jwksAt > 3600e3) {
      const r = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs');
      if (!r.ok) throw new Error('google_jwks');
      jwks = (await r.json()).keys; jwksAt = now();
    }
    return jwks;
  }
  async function verifyIdToken(idToken, nonce) {
    const [h, p, s] = String(idToken || '').split('.');
    if (!h || !p || !s) throw new Error('id_token_format');
    const header = JSON.parse(Buffer.from(h, 'base64url').toString());
    if (header.alg !== 'RS256') throw new Error('id_token_alg');
    const jwk = (await keys()).find((k) => k.kid === header.kid);
    if (!jwk) throw new Error('id_token_kid');
    const ok = createVerify('RSA-SHA256').update(h + '.' + p).verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'));
    if (!ok) throw new Error('id_token_signature');
    const c = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (!ISSUERS.includes(c.iss) || c.aud !== clientId || !(c.exp * 1000 > now()) || c.nonce !== nonce) throw new Error('id_token_claims');
    return c;
  }
  return {
    authorizeUrl({ state, nonce, redirectUri, hd }) {
      const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      u.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account', ...(hd ? { hd } : {}) }).toString();
      return u.toString();
    },
    async exchange({ code, redirectUri, nonce }) {
      const r = await fetchImpl('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }).toString(),
      });
      if (!r.ok) throw new Error('google_token');
      const { id_token } = await r.json();
      return verifyIdToken(id_token, nonce);
    },
    verifyIdToken,
  };
}