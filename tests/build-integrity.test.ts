import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { syncResult } from '../src/lib/sync-result';
const require = createRequire(import.meta.url);
const { checkRelease } = require('../scripts/build-preflight.cjs');

test('release dependency metadata matches package-lock exactly', () => {
  assert.deepEqual(checkRelease(path.resolve('.')), []);
});
test('old lock, omitted hidden file and changed source are caught before building', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'su-preflight-'));
  const pkg = { name: 'test', version: '1.6.2', dependencies: { expo: '~58.0.19', 'react-native-webview': '14.0.1' } };
  try {
    writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg));
    writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({
      name: 'test', version: '1.0.0', packages: { '': { name: 'test', version: '1.0.0', dependencies: { expo: '~58.0.17' } } },
    }));
    writeFileSync(path.join(root, 'SOURCE-MANIFEST.json'), JSON.stringify([{ path: 'package.json', sha256: 'wrong' }]));
    const errors = checkRelease(root);
    assert.ok(errors.some((s: string) => s.includes('different version')));
    assert.ok(errors.some((s: string) => s.includes('dependencies.expo')));
    assert.ok(errors.some((s: string) => s.includes('dependencies.react-native-webview')));
    assert.ok(errors.some((s: string) => s.includes('.easignore')));
    assert.ok(errors.some((s: string) => s.includes('Release file changed: package.json')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('cloud pre-install checks exclude server and generated files without skipping package checks', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'su-cloud-'));
  try {
    const entries = JSON.parse(readFileSync('SOURCE-MANIFEST.json', 'utf8'));
    for (const entry of entries) {
      if (entry.path.startsWith('server/') || ['.gitignore', '.easignore'].includes(entry.path)) continue;
      const target = path.join(root, entry.path); mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(entry.path));
    }
    writeFileSync(path.join(root, 'SOURCE-MANIFEST.json'), JSON.stringify(entries));
    assert.deepEqual(checkRelease(root, false), []);
    assert.ok(checkRelease(root, true).some((s: string) => s.includes('server/')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('a failed course grade or skipped service makes synchronization partial', () => {
  assert.deepEqual(syncResult(15, 14, 1), { succeeded: 14, errors: 1, skipped: 0, complete: false, hasUpdates: true });
  assert.deepEqual(syncResult(13, 2, 1), { succeeded: 2, errors: 11, skipped: 10, complete: false, hasUpdates: true });
  assert.equal(syncResult(0, 0, 0).complete, false);
  assert.equal(syncResult(3, 0, 3).hasUpdates, false);
  assert.equal(syncResult(15, 15, 0).complete, true);
});
test('sync worker does not ignore grade errors or claim all university data is correct', () => {
  const source = readFileSync('src/context/app-context.tsx', 'utf8');
  assert.doesNotMatch(source, /if\(!action\.startsWith\('GRADES:'\)\)failures\+\+/);
  assert.doesNotMatch(source, /All your university data is updated and ready/);
  assert.match(source, /syncResult\(requested,successes,failures\)/);
});