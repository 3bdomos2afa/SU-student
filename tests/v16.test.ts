import test from 'node:test';
import assert from 'node:assert/strict';
import { diffAlerts, gradeActions, assessmentKind } from '../src/lib/change-alerts';

const e = (data: unknown) => ({ data, at: '2026-10-24T10:00:00Z' });
const now = new Date(2026, 9, 24, 12); // Saturday 24 October 2026

test('first sync is a silent baseline', () => {
  assert.deepEqual(diffAlerts({}, { SEC_ATTENDANCE: e([{ CourseCode: 'INT 301', AbcensePercentage: 10 }]), SEC_TRANSCRIPT: e([{ CourseCode: 'INT 301', GradeName: 'A' }]) }, true, now), []);
});
test('new absence names the course, the day and the percentage', () => {
  const prev = { SEC_ATTENDANCE: e([{ CourseCode: 'INT 301', CourseName: 'شبكات', AbcensePercentage: 5 }]) };
  const a = diffAlerts(prev, { SEC_ATTENDANCE: e([{ CourseCode: 'INT 301', CourseName: 'شبكات', AbcensePercentage: 10 }]) }, true, now);
  assert.equal(a.length, 1); assert.equal(a[0].kind, 'absence');
  assert.match(a[0].title, /شبكات/); assert.match(a[0].body, /10%/); assert.match(a[0].body, /كانت 5%/); assert.match(a[0].body, /السبت 24 أكتوبر/);
  assert.deepEqual(diffAlerts(prev, prev, true, now), []);
});
test('a new warning alerts with its own date and details', () => {
  const a = diffAlerts({ SEC_WARNINGS: e([]) }, { SEC_WARNINGS: e([{ CourseCode: 'INT 301', WarningName: 'إنذار أول', WarningDate: '2026-10-20T09:00:00' }]) }, true, now);
  assert.equal(a.length, 1); assert.equal(a[0].kind, 'warning');
  assert.match(a[0].body, /إنذار أول/); assert.match(a[0].body, /الثلاثاء 20 أكتوبر/);
});
test('midterm, coursework and final marks are detected and classified', () => {
  const k = 'GRADES:INT 301';
  const prev = { [k]: e([{ TemplateDetails: 'Midterm', StudentDegree: '', MaxDegree: 20 }, { TemplateDetails: 'Quiz 1', StudentDegree: '8', MaxDegree: 10 }]) };
  const next = { [k]: e([{ TemplateDetails: 'Midterm', StudentDegree: '17', MaxDegree: 20 }, { TemplateDetails: 'Quiz 1', StudentDegree: '8', MaxDegree: 10 }, { TemplateDetails: 'Final Exam', StudentDegree: '50', MaxDegree: 60 }]) };
  const a = diffAlerts(prev, next, true, now);
  assert.deepEqual(a.map(x => x.kind), ['midterm', 'final']);
  assert.match(a[0].body, /17 من 20/); assert.match(a[0].title, /درجة الميد/);
  assert.equal(assessmentKind('أعمال السنة'), 'coursework'); assert.equal(assessmentKind('امتحان نصف الترم'), 'midterm');
});
test('a final grade in the transcript alerts once', () => {
  const a = diffAlerts({ SEC_TRANSCRIPT: e([{ CourseCode: 'INT 301', GradeName: '' }]) }, { SEC_TRANSCRIPT: e([{ CourseCode: 'INT 301', GradeName: 'A-' }]) }, false, now);
  assert.equal(a.length, 1); assert.equal(a[0].kind, 'final'); assert.match(a[0].body, /A-/);
});
test('grade sync covers only the student own schedule', () => {
  assert.deepEqual(gradeActions({ SEC_SCHEDULE: e([{ CourseCode: 'INT 301' }, { CourseCode: 'INT301' }, { CourseCode: 'MTH 101' }]) }), ['GRADES:INT 301', 'GRADES:MTH 101']);
});