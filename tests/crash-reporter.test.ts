import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const plugin = require('../plugins/with-crash-reporter.cjs');

const template = `class MainApplication : Application(), ReactApplication {

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}
`;

test('MainApplication patch installs the reporter in attachBaseContext, skips RN boot in the crash process, and is idempotent', () => {
  const patched = plugin.patchMainApplication(template);
  assert.match(patched, /override fun attachBaseContext\(base: android.content.Context\) \{\n    super.attachBaseContext\(base\)\n    CrashReporter.install\(this\)/);
  assert.match(patched, /override fun onCreate\(\) \{\n    if \(CrashReporter.isCrashProcess\(this\)\) \{ super.onCreate\(\); return \}\n    super.onCreate\(\)\n    loadReactNative\(this\)/);
  assert.equal(plugin.patchMainApplication(patched), patched);
  assert.throws(() => plugin.patchMainApplication('class MainApplication {}'));
});
test('manifest gets one isolated, non-exported crash activity', () => {
  const manifest: any = { application: [{ $: {}, activity: [{ $: { 'android:name': '.MainActivity' } }] }] };
  plugin.patchManifest(manifest); plugin.patchManifest(manifest);
  const crash = manifest.application[0].activity.filter((a: any) => a.$['android:name'] === '.CrashActivity');
  assert.equal(crash.length, 1);
  assert.equal(crash[0].$['android:exported'], 'false');
  assert.equal(crash[0].$['android:process'], ':crash');
});
test('Kotlin sources are pure Android and carry the app package', () => {
  const sources = plugin.kotlinSources('com.unicodesis.student');
  for (const [name, text] of Object.entries(sources) as [string, string][]) {
    assert.match(text, /^package com\.unicodesis\.student\n/, name);
    assert.doesNotMatch(text, /__PACKAGE__|com\.facebook\.react|expo\.modules|sessionStorage|password|Token|java\.net|okhttp/i, name);
  }
  assert.match(sources['CrashReporter.kt'], /setDefaultUncaughtExceptionHandler/);
  assert.match(sources['CrashReporter.kt'], /Process.killProcess\(Process.myPid\(\)\)/);
  assert.match(sources['CrashActivity.kt'], /class CrashActivity : Activity\(\)/);
  assert.match(sources['CrashActivity.kt'], /ACTION_SEND/);
});
test('plugin is part of the app config and shipped files', () => {
  const app = require('../app.json').expo;
  assert.ok(app.plugins.includes('./plugins/with-crash-reporter.cjs'));
  const preflight = readFileSync('scripts/build-preflight.cjs', 'utf8');
  for (const f of ['plugins/with-crash-reporter.cjs', 'plugins/crash-reporter.kt.txt', 'plugins/crash-activity.kt.txt']) assert.ok(preflight.includes(f), f);
});