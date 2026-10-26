import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createBroker } from './src/broker.mjs';
import { googleClient } from './src/google.mjs';
import { createHttpServer } from './src/http.mjs';

const env = (k, d) => {
  const v = process.env[k] ?? d;
  if (v === undefined || v === '') { console.error(`Missing ${k}. See server/README_AR.md`); process.exit(1); }
  return v;
};
const baseUrl = env('PUBLIC_BASE_URL').replace(/\/+$/, '');
if (!baseUrl.startsWith('https://')) { console.error('PUBLIC_BASE_URL must be https://'); process.exit(1); }

const config = {
  baseUrl,
  appRedirect: env('APP_REDIRECT', 'unicodesis://oauth/callback'),
  appClientIds: env('APP_CLIENT_IDS', 'su-student-android,su-student-ios').split(',').map((s) => s.trim()).filter(Boolean),
  allowedDomain: (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase(),
};
const adapterPath = resolve(env('ADAPTER', './adapter.mjs'));
const adapter = await import(pathToFileURL(adapterPath).href);
if (typeof adapter.findStudentByEmail !== 'function' || typeof adapter.issuePortalSession !== 'function') {
  console.error('Adapter must export findStudentByEmail(email) and issuePortalSession(student)'); process.exit(1);
}
const google = googleClient({ clientId: env('GOOGLE_CLIENT_ID'), clientSecret: env('GOOGLE_CLIENT_SECRET') });
const port = Number(process.env.PORT || 8080);
createHttpServer(createBroker({ config, adapter, google })).listen(port, () => {
  console.log(`SU Student SSO broker on :${port} -> ${baseUrl}`);
});