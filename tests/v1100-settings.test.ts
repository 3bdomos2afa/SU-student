import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studentCode } from '../src/lib/student';

test('settings: real student code, no data sharing, clear erase warning', () => {
  const s = readFileSync('src/app/(tabs)/settings.tsx', 'utf8');
  assert.doesNotMatch(s, /buildDataSample|Share data sample|عيّنة البيانات/);
  assert.doesNotMatch(s, /session\.studentId/);
  assert.match(s, /studentCode\(/);
  assert.match(s, /a\.eraseAll\(\)/);
  assert.match(s, /مفيش رجوع/);
  assert.match(s, /@\/components\/portal-entry/);
  const ctx = readFileSync('src/context/app-context.tsx', 'utf8');
  assert.match(ctx, /eraseAll/);
  assert.match(ctx, /wipePrivate\(/);
});

test('student code comes from the profile, not the internal id', () => {
  const cache = { SEC_PROFILE: { at: 'now', data: { StudentData: [{ StudentID: 12323, StudentCode: '2022012345' }] } } };
  assert.equal(studentCode(cache as never), '2022012345');
});