import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { curriculumCourses } from '../src/data/curriculum';
import { unlocksOf } from '../src/data/curriculum-helpers';

const read = (p: string) => fs.readFileSync(p, 'utf8');

test('map tab is renamed and no longer uses the heavy canvas', () => {
  assert.match(read('src/components/chrome.tsx'), /plan: \{ on: 'map', off: 'map-outline', ar: 'الخريطة', en: 'Map' \}/);
  const plan = read('src/app/(tabs)/plan.tsx');
  assert.ok(plan.includes("tr('الخريطة', 'Map')"));
  assert.ok(!plan.includes('MapCanvas'));
});

test('every prerequisite of every course resolves or is a credit rule', () => {
  const codes = new Set(curriculumCourses.map(c => c.code));
  for (const c of curriculumCourses) for (const p of c.prerequisites) assert.ok(codes.has(p) || /\d+\s*credit/i.test(p), `${c.code} -> ${p}`);
  assert.ok(curriculumCourses.some(c => unlocksOf(c.code).length > 0));
});

test('brand assets and identity stay consistent', () => {
  const app = JSON.parse(read('app.json')).expo;
  assert.equal(app.slug, 'su-student');
  assert.equal(app.android.package, 'com.unicodesis.student');
  assert.equal(app.android.adaptiveIcon.backgroundColor, '#4338CA');
  for (const f of ['icon.png', 'android-icon-foreground.png', 'splash-icon.png', 'favicon.png']) assert.ok(fs.statSync(`assets/images/${f}`).size > 1000, f);
  assert.ok(read('src/components/brand.tsx').includes('export function BrandMark'));
});

test('notification channel ids stay stable', () => {
  const n = read('src/lib/notifications.ts');
  assert.ok(n.includes("TASK_CHANNEL='su-tasks-v2'"));
  assert.ok(n.includes("setNotificationChannelAsync('study'"));
});