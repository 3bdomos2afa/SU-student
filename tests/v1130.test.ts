import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clock, detectGender, duration, isAssignment, isFemale, say } from '../src/lib/notify-text';
import { alertAllowed, normalizePrefs, PREF_KEYS } from '../src/lib/reminder-plan';
import { autoOrder } from '../src/lib/sync-plan';
const read = (p: string) => readFileSync(p, 'utf8');
const e = (data: unknown) => ({ data, at: new Date().toISOString() });

test('gender comes from the university profile, with a manual override', () => {
  const f = { SEC_PROFILE: e({ StudentData: [{ StudentCode: '1', GenderName: 'أنثى' }] }) };
  const m = { SEC_PERSONAL: e([{ GenderName: 'Male' }]) };
  assert.equal(detectGender(f as never), 'f'); assert.equal(detectGender(m as never), 'm'); assert.equal(detectGender({}), null);
  assert.equal(isFemale('auto', f as never), true); assert.equal(isFemale('m', f as never), false); assert.equal(isFemale('f', {}), true);
});
test('study summary thresholds and feminine wording', () => {
  assert.match(say.summary(false, 40), /أقل من ساعة/);
  assert.match(say.summary(false, 90), /أحسن من مفيش/);
  assert.match(say.summary(false, 200), /^عاش!/);
  assert.match(say.summary(false, 250), /تقدير/);
  assert.match(say.summary(true, 90), /^ذاكرتي/);
  assert.match(say.streak1(true), /روحي ذاكري/); assert.match(say.overdue(false), /متراكمش/);
  assert.equal(duration(135), 'ساعتين و15 دقيقة'); assert.equal(clock('13:05'), '1:05 م');
});
test('university and KMoodle alert texts', () => {
  assert.match(say.midterm('شبكات'), /استر يا ستااار.*الميد/);
  assert.match(say.final('شبكات'), /الفاينل/);
  assert.match(say.coursework('شبكات'), /الكورس ورك/);
  assert.match(say.warning(1, 'شبكات'), /أول \(10%\)/); assert.match(say.warning(2, 'شبكات'), /تاني \(20%\)/);
  assert.match(say.absence(true, 'سكشن', 'شبكات', '15'), /^انتي غبتي سكشن شبكات.*15%/);
  assert.match(say.moodleFile('أحمد', 'Lec 3', 'شبكات'), /الدكتور أحمد رفع المحاضرة Lec 3/);
  assert.match(say.moodleAssign('أحمد', 'Assignment 1', 'شبكات'), /رفع اسايمنت/);
  assert.ok(isAssignment('Assignment 2')); assert.ok(isAssignment('اسايمنت الشبكات')); assert.ok(!isAssignment('Lecture 4'));
});
test('every notification type has its own switch', () => {
  const p = normalizePrefs(null);
  assert.equal(PREF_KEYS.length, 12); assert.ok(PREF_KEYS.every(k => p[k] === true));
  assert.equal(alertAllowed({ ...p, midterm: false }, 'midterm'), false);
  assert.equal(alertAllowed({ ...p, midterm: false }, 'final'), true);
  assert.equal(alertAllowed({ ...p, enabled: false }, 'final'), false);
});
test('auto sync is light and always refreshes the profile', () => {
  assert.ok(autoOrder({}).includes('SEC_PROFILE'));
});
test('no noisy notifications: no synced alert and no background "sign in again"', () => {
  assert.doesNotMatch(read('src/lib/background-sync.ts'), /سجّل دخولك تاني|expired:\$\{/);
  assert.doesNotMatch(read('src/context/app-context.tsx'), /notifyNow/);
});
test('silent re-login, Google popup fix, hidden bug report and CGPA-first transcript', () => {
  assert.match(read('src/app/_layout.tsx'), /<SilentRelogin \/>/);
  const s = read('src/components/silent-relogin.tsx');
  assert.match(s, /s\.studentId !== a\.session\?\.studentId/); assert.match(s, /COOLDOWN/);
  const j = read('plugins/google-test-popup.java.txt');
  assert.match(j, /accounts\.youtube\.com/); assert.match(j, /parent\.loadUrl\(url\)/); assert.match(j, /تسجيل الدخول بجوجل/);
  assert.ok(!JSON.parse(read('app.json')).expo.plugins.includes('./plugins/with-crash-reporter.cjs'));
  assert.doesNotMatch(read('src/components/error-boundary.tsx'), /ابعت الكود/);
  assert.match(read('src/components/gpa-chart.tsx'), /p\.cgpa \?\? p\.gpa/);
  assert.match(read('src/lib/moodle-alerts.ts'), /baseline/);
});