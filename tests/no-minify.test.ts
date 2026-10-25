import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const plugin = require('../plugins/with-android-no-minify.cjs');

test('R8 minify and resource shrinking are forced off, overriding template defaults', () => {
  const items: any[] = [
    { type: 'comment', value: 'Enable R8' },
    { type: 'property', key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
    { type: 'property', key: 'hermesEnabled', value: 'true' },
  ];
  plugin.applyProperties(items); plugin.applyProperties(items);
  const get = (k: string) => items.filter(i => i.key === k);
  assert.equal(get('android.enableMinifyInReleaseBuilds').length, 1);
  assert.equal(get('android.enableMinifyInReleaseBuilds')[0].value, 'false');
  assert.equal(get('android.enableShrinkResourcesInReleaseBuilds')[0].value, 'false');
  assert.equal(get('hermesEnabled')[0].value, 'true');
});
test('no-minify plugin is in the app config and required by preflight', () => {
  const app = require('../app.json').expo;
  assert.ok(app.plugins.includes('./plugins/with-android-no-minify.cjs'));
  assert.ok(readFileSync('scripts/build-preflight.cjs', 'utf8').includes('plugins/with-android-no-minify.cjs'));
});