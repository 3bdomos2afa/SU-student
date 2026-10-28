import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unrestricted, vendorOf, vendorSteps } from '../src/lib/battery-vendor';

test('phone brands that need an extra auto-start step are recognised', () => {
  assert.equal(vendorOf('Xiaomi'), 'xiaomi');
  assert.equal(vendorOf('redmi'), 'xiaomi');
  assert.equal(vendorOf('samsung'), 'samsung');
  assert.equal(vendorOf('realme'), 'oppo');
  assert.equal(vendorOf('HONOR'), 'huawei');
  assert.equal(vendorOf('google'), null);
  assert.ok(vendorSteps('xiaomi', true)[0].includes('التشغيل التلقائي'));
});

test('background is healthy only when not optimised and not restricted', () => {
  assert.equal(unrestricted({ supported: true, ignoring: true, restricted: false, brand: '' }), true);
  assert.equal(unrestricted({ supported: true, ignoring: false, restricted: false, brand: '' }), false);
  assert.equal(unrestricted({ supported: true, ignoring: true, restricted: true, brand: '' }), false);
  assert.equal(unrestricted({ supported: false, ignoring: false, restricted: false, brand: '' }), true);
});

test('battery card lives in Settings only, never on the home screen', () => {
  assert.ok(readFileSync('src/app/(tabs)/settings.tsx', 'utf8').includes('<BackgroundHealth/>'));
  assert.ok(!readFileSync('src/app/(tabs)/index.tsx', 'utf8').includes('BackgroundHealth'));
});

test('native module exposes the battery functions and the permission is declared', () => {
  const kt = readFileSync('modules/su-focus/android/src/main/java/expo/modules/sufocus/SuFocusModule.kt', 'utf8');
  for (const f of ['batteryStatus', 'requestUnrestricted', 'openAutostart', 'ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS']) assert.ok(kt.includes(f), f);
  const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  assert.ok(app.android.permissions.includes('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'));
});