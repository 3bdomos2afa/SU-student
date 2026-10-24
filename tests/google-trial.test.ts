import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { googleTestAvailable, googleTestURL } from '../src/lib/google-webview-test';
const require = createRequire(import.meta.url);
const config = require('../app.config.cjs');
const plugin = require('../plugins/with-google-webview-test.cjs');
const helper = readFileSync('plugins/google-test-popup.java.txt', 'utf8');
const source = readFileSync('node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java', 'utf8');
const anchor = '    @Override\n    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {';

test('trial capability requires explicit Android build configuration', () => {
  for (const extra of [null, {}, { googleWebViewTest: false }, { googleWebViewTest: 'true' }]) assert.equal(googleTestAvailable('android', extra), false);
  assert.equal(googleTestAvailable('ios', { googleWebViewTest: true }), false);
  assert.equal(googleTestAvailable('web', { googleWebViewTest: true }), false);
  assert.equal(googleTestAvailable('android', { googleWebViewTest: true }), true);
});
test('Google test only accepts exact HTTPS accounts origin without userinfo', () => {
  assert.equal(googleTestURL('https://accounts.google.com/o/oauth2/auth?state=example'), true);
  for (const u of ['http://accounts.google.com', 'https://accounts.google.com.evil.test', 'https://google.com',
    'https://accounts.google.com:8443', 'https://name@accounts.google.com', 'javascript:alert(1)', 'bad']) assert.equal(googleTestURL(u), false, u);
});
test('standard profiles never get test package, UA capability or native patch', () => {
  const oldFlag = process.env.SU_GOOGLE_WEBVIEW_TEST, oldProfile = process.env.EAS_BUILD_PROFILE;
  const base = require('../app.json').expo;
  try {
    for (const [flag, profile] of [['0', 'preview'], ['1', 'production'], ['1', 'preview'], ['0', 'google-test']]) {
      process.env.SU_GOOGLE_WEBVIEW_TEST = flag; process.env.EAS_BUILD_PROFILE = profile;
      const result = config({ config: base });
      assert.equal(result.extra.googleWebViewTest, false);
      assert.equal(result.android.package, 'com.unicodesis.student');
      assert.equal(result.plugins.at(-1)[1].enabled, false);
    }
    process.env.SU_GOOGLE_WEBVIEW_TEST = '1'; process.env.EAS_BUILD_PROFILE = 'google-test';
    const result = config({ config: base });
    assert.equal(result.extra.googleWebViewTest, true);
    assert.equal(result.android.package, 'com.unicodesis.student.googletrial');
    assert.equal(result.scheme, 'unicodesis-trial');
    assert.equal(result.plugins.at(-1)[1].enabled, true);
  } finally {
    if (oldFlag === undefined) delete process.env.SU_GOOGLE_WEBVIEW_TEST; else process.env.SU_GOOGLE_WEBVIEW_TEST = oldFlag;
    if (oldProfile === undefined) delete process.env.EAS_BUILD_PROFILE; else process.env.EAS_BUILD_PROFILE = oldProfile;
  }
});
test('native popup patch is idempotent and fails on unknown source', () => {
  assert.equal(source.includes('SU_GOOGLE_TEST_POPUP_V1'), false, 'standard node_modules must be restored before tests');
  const patched = plugin.patchText(source, helper);
  assert.notEqual(patched, source);
  assert.equal(plugin.patchText(patched, helper), patched);
  assert.throws(() => plugin.patchText(source.replace(anchor, 'changed upstream'), helper));
});
test('normal build restores exact original native code; tampered backup fails closed', () => {
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
test('login test is explicit opt-in, default off and credentials are never read by app script', () => {
  const ui = readFileSync('src/components/portal-modal.tsx', 'utf8');
  assert.match(ui, /useState\(false\)/);
  assert.match(ui, /Alert.alert/);
  assert.match(ui, /userAgent=\{testEnabled \? GOOGLE_TEST_USER_AGENT : undefined\}/);
  assert.match(ui, /onOpenWindow=\{testEnabled \? undefined/);
  assert.match(ui, /location.origin!==/);
  assert.doesNotMatch(ui, /querySelector|\.value\b|getElementsBy|ExternalStudentLogin/);
});
test('test build command selects isolated APK profile; rejects arbitrary arguments', () => {
  const dry = spawnSync(process.execPath, ['scripts/build-google-test.cjs', '--dry-run'], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(JSON.parse(dry.stdout).package, 'com.unicodesis.student.googletrial');
  assert.ok(JSON.parse(dry.stdout).args.includes('google-test'));
  const invalid = spawnSync(process.execPath, ['scripts/build-google-test.cjs', '--unsafe'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
});