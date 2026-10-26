import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { googleTestAvailable, googleTestURL } from '../src/lib/google-webview-test';
const require = createRequire(import.meta.url);
const config = require('../app.config.cjs');
const plugin = require('../plugins/with-google-webview-test.cjs');
const helper = readFileSync('plugins/google-test-popup.java.txt', 'utf8');
const source = readFileSync('node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java', 'utf8');
const anchor = '    @Override\n    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {';

test('Google-in-WebView capability is Android only and requires the build flag', () => {
  for (const extra of [null, {}, { googleWebViewTest: false }, { googleWebViewTest: 'true' }]) assert.equal(googleTestAvailable('android', extra), false);
  assert.equal(googleTestAvailable('ios', { googleWebViewTest: true }), false);
  assert.equal(googleTestAvailable('web', { googleWebViewTest: true }), false);
  assert.equal(googleTestAvailable('android', { googleWebViewTest: true }), true);
});
test('Google popup only accepts exact HTTPS accounts origin without userinfo', () => {
  assert.equal(googleTestURL('https://accounts.google.com/o/oauth2/auth?state=example'), true);
  for (const u of ['http://accounts.google.com', 'https://accounts.google.com.evil.test', 'https://google.com',
    'https://accounts.google.com:8443', 'https://name@accounts.google.com', 'javascript:alert(1)', 'bad']) assert.equal(googleTestURL(u), false, u);
});
test('normal builds enable Google-in-WebView with the standard package; SU_GOOGLE_WEBVIEW=0 disables it', () => {
  const old = process.env.SU_GOOGLE_WEBVIEW;
  const base = require('../app.json').expo;
  try {
    delete process.env.SU_GOOGLE_WEBVIEW;
    let result = config({ config: base });
    assert.equal(result.extra.googleWebViewTest, true);
    assert.equal(result.android.package, 'com.unicodesis.student');
    assert.equal(result.name, base.name);
    assert.equal(result.plugins.at(-1)[1].enabled, true);
    process.env.SU_GOOGLE_WEBVIEW = '0';
    result = config({ config: base });
    assert.equal(result.extra.googleWebViewTest, false);
    assert.equal(result.plugins.at(-1)[1].enabled, false);
    assert.equal(result.android.package, 'com.unicodesis.student');
  } finally {
    if (old === undefined) delete process.env.SU_GOOGLE_WEBVIEW; else process.env.SU_GOOGLE_WEBVIEW = old;
  }
});
test('native popup patch is idempotent and fails on unknown source', () => {
  assert.equal(source.includes('SU_GOOGLE_TEST_POPUP_V1'), false, 'standard node_modules must be restored before tests');
  const patched = plugin.patchText(source, helper);
  assert.notEqual(patched, source);
  assert.equal(plugin.patchText(patched, helper), patched);
  assert.throws(() => plugin.patchText(source.replace(anchor, 'changed upstream'), helper));
});
test('disabled build restores exact original native code; tampered backup fails closed', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'su-native-test-'));
  const target = path.join(root, 'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java');
  try {
    mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, source);
    plugin.syncPatch(root, true);
    assert.match(readFileSync(target, 'utf8'), /SU_GOOGLE_TEST_POPUP_V1/);
    plugin.syncPatch(root, true);
    plugin.syncPatch(root, false);
    assert.equal(readFileSync(target, 'utf8'), source);
    plugin.syncPatch(root, true);
    writeFileSync(target + '.su-original', 'tampered');
    assert.throws(() => plugin.syncPatch(root, false), /checksum/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('popup preserves native opener, cancels certificate errors and contains no session bridge', () => {
  assert.match(helper, /transport.setWebView\(child\)/);
  assert.match(helper, /handler.cancel\(\)/);
  assert.doesNotMatch(helper, /handler.proceed|\.addJavascriptInterface\(|evaluateJavascript|sessionStorage|postMessage|ExternalStudentLogin/);
  assert.match(helper, /child.destroy\(\)/);
  assert.match(helper, /request.deny\(\)/);
});
test('Google mode follows the build capability and app script never reads credentials', () => {
  const ui = readFileSync('src/components/portal-modal.tsx', 'utf8');
  assert.match(ui, /useState\(testAvailable\)/);
  assert.match(ui, /userAgent=\{googleMode \? GOOGLE_TEST_USER_AGENT : undefined\}/);
  assert.match(ui, /onOpenWindow=\{googleMode \? undefined/);
  assert.match(ui, /location.origin!==/);
  assert.doesNotMatch(ui, /querySelector|\.value\b|getElementsBy|ExternalStudentLogin|Alert\.alert/);
});