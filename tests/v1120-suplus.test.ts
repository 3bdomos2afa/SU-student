import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ION_TO_LUCIDE, LUCIDE } from '../src/data/lucide';

const read = (p: string) => fs.readFileSync(p, 'utf8');

test('SU+ 1.14.1 name, version and brand colours', () => {
  const app = JSON.parse(read('app.json')).expo;
  assert.equal(app.name, 'SU+');
  assert.equal(app.version, '1.14.1');
  assert.equal(app.android.package, 'com.unicodesis.student');
  assert.equal(JSON.parse(read('package.json')).version, '1.14.1');
  assert.match(read('src/lib/theme.ts'), /#6A4BEF/);
  assert.match(read('src/components/brand.tsx'), /#D6F77E/);
});

test('home hero no longer shows the old slogan', () => {
  assert.doesNotMatch(read('src/app/(tabs)/index.tsx'), /ذاكر شوية|brag a lot/);
});

test('every icon used in the app maps to an inlined Lucide icon', () => {
  for (const [ion, luc] of Object.entries(ION_TO_LUCIDE)) assert.ok(LUCIDE[luc], `${ion} -> ${luc}`);
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${f.name}`;
      if (f.isDirectory()) walk(p);
      else if (/\.tsx$/.test(f.name)) files.push(p);
    }
  };
  walk('src');
  for (const f of files) if (f !== 'src/components/icon.tsx') assert.doesNotMatch(read(f), /import \{ Ionicons \} from '@expo\/vector-icons'/, f);
});