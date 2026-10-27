import policy from './google-webview-policy.json';
export const GOOGLE_TEST_USER_AGENT = policy.userAgent;
export function googleTestAvailable(os: string, extra: unknown): boolean {
  return os === 'android' && !!extra && typeof extra === 'object'
    && (extra as Record<string, unknown>).googleWebViewTest === true;
}
// Only top-level Google account navigation; ordinary mode never uses this.
export function googleTestURL(url: string): boolean {
  try {
    const u = new URL(url);
    return !u.username && !u.password && u.origin === policy.googleOrigin;
  } catch { return false; }
}
