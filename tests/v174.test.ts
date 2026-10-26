import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPortal } from '../src/lib/portal';
import { academic, terms, timetable } from '../src/lib/academic';
import { displayRecords, fieldLabel, formatValue, hiddenField } from '../src/lib/field-labels';

const session = { studentId: '42', token: 'test-session-token', name: 'T', signedInAt: '2026-10-25T00:00:00Z' };
function mock(route: (u: URL, method: string) => [number, unknown]) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: unknown, opt?: { method?: string }) => {
    const u = new URL(String(input)); assert.equal(u.hostname, 'unicodesis.su.edu.eg'); assert.equal(u.port, '150');
    const [status, body] = route(u, opt?.method ?? 'GET');
    return new Response(status === 404 ? '' : JSON.stringify(body), { status });
  }) as typeof fetch;
  return () => { globalThis.fetch = original; };
}
test('a 404 from the university means "no records yet", not a failed sync', async () => {
  const undo = mock(() => [404, null]);
  try { assert.deepEqual(await requestPortal('SEC_WARNINGS', session), []); assert.deepEqual(await requestPortal('SEC_ADVISING', session), []); }
  finally { undo(); }
});
test('full transcript history: every term with its own GPA summary, oldest first', async () => {
  const undo = mock((u, m) => {
    const p = u.pathname;
    if (p.endsWith('ARG_SelectAcademicYearByStudent')) return [200, [{ serial: 12, Name: '2023' }]];
    if (p.endsWith('Get_SemesterYeaByYearId')) { assert.equal(u.searchParams.get('YearID'), '12'); return [200, [
      { YearID: 12, Name: '2023', SemesterNameEN: 'Spring', SemesterNameAR: 'ربيع', SemesterYearserial: 42 },
      { YearID: 12, Name: '2023', SemesterNameEN: 'Fall', SemesterNameAR: 'خريف', SemesterYearserial: 41 },
      { YearID: 12, Name: '2023', SemesterNameEN: 'Summer', SemesterNameAR: 'صيف', SemesterYearserial: 43, IsCurrent: true }]]; }
    if (p.endsWith('SelectStudentTranscriptBySemester')) {
      assert.equal(m, 'POST'); assert.equal(u.searchParams.get('StudentID'), '42');
      const s = u.searchParams.get('SemesterYearId');
      if (s === '41') return [200, [{ CourseCode: 'MA111', GradeName: 'F', CreditHours: 4, EnrollmentStudentID: 7, StudentTransferID: 0 }]];
      if (s === '42') return [200, [{ CourseCode: 'MA111', GradeName: 'D', CreditHours: 4, EnrollmentStudentID: 8, StudentTransferID: 0 }]];
      return [404, null];
    }
    if (p.endsWith('SelectSTudentSemesterSummery')) { const late = u.searchParams.get('EnrollmentStudentId') === '8';
      return [200, [{ CGPA: late ? 1.5 : 0, GPA: late ? 1 : 0, CumEarnedCredits: late ? 4 : 0, CumAttemptCredits: 8, Semester_year: late ? 42 : 41 }]]; }
    return [404, null];
  });
  try {
    const cache = { SEC_HISTORY: { data: await requestPortal('SEC_HISTORY', session), at: 'now' } };
    assert.deepEqual(terms(cache).map(t => `${t.ar} ${t.year}`), ['خريف 2023', 'ربيع 2023']);
    const a = academic(cache);
    assert.equal(a.gpa, 1.5); assert.equal(a.earned, 4); assert.equal(a.attempted, 8);
    assert.ok(a.passed.has('MA111')); assert.equal(a.failures.MA111, 1); assert.equal(a.history.length, 2);
  } finally { undo(); }
});
test('timetable understands LCTR/LCLB codes, trims seconds and starts the week on Saturday', () => {
  const slots = timetable({ SEC_TIMETABLE: { at: 'now', data: [
    { CourseCode: 'CSW263', TypeNameEN: 'LCTR', SubTypeID: 3, WeekDay: 'Tuesday', StartTime: '13:00:00', EndTime: '14:59:00', InstructorName: 'Dr X' },
    { CourseCode: 'ISD220', TypeNameEN: 'LCLB', SubTypeID: 4, WeekDay: 'Saturday', StartTime: '11:00:00', EndTime: '12:59:00' }] } });
  assert.deepEqual(slots.map(s => [s.code, s.type, s.start]), [['ISD220', 'section', '11:00'], ['CSW263', 'lecture', '13:00']]);
  assert.equal(slots[1].teachers, 'Dr X');
});
test('records are shown with Arabic labels and values, internal IDs hidden', () => {
  assert.ok(hiddenField('StudentID')); assert.ok(hiddenField('Year_SemesterID')); assert.ok(hiddenField('NationID'));
  assert.equal(hiddenField('CourseCode'), false);
  assert.equal(fieldLabel('AbsencePercentage', 'ar'), 'نسبة الغياب');
  assert.equal(formatValue('TypeNameEN', 'LCTR', 'ar'), 'محاضرة');
  assert.equal(formatValue('AttendanceStatus', 'Unexcused Absent', 'ar'), 'غياب بدون عذر');
  assert.equal(formatValue('AttenDay', '2026-09-26T00:00:00', 'ar'), '2026-09-26');
  assert.equal(formatValue('IsActive', 0, 'ar'), 'لأ');
  const profile = displayRecords({ StudentEmails: null, StudentEducation: [{ Year: 2023 }], StudentData: [{ StudentCode: '1', FacultyName_EN: 'IT' }] });
  assert.deepEqual(profile.map(r => Object.keys(r)[0]), ['StudentCode', 'Year']);
});
