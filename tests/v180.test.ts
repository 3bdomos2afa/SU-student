import test from 'node:test';
import assert from 'node:assert/strict';
import { diffAlerts } from '../src/lib/change-alerts';
import { nextStudyTerm, studyLabel, studyTerms } from '../src/lib/term-label';
import { absenceScale, absenceTone } from '../src/lib/absence';
import { LOADS, cappedGrade, defaultLoad, gradePoints, pick, projectGpa } from '../src/lib/planner';
import { courseTopicId, emptyNotebook, normalizeIndex, titleFrom, withCourseTopics } from '../src/lib/notebook';
import { parseLaunch } from '../src/lib/moodle';
import { WEEK, shortName, studentCode } from '../src/lib/student';
import { curriculumCourses } from '../src/data/curriculum';

const e = (data: unknown) => ({ data, at: '2026-10-24T10:00:00Z' });
const now = new Date(2026, 9, 24, 12);

test('one absence heads-up at 20%, never a self-made warning', () => {
  const p = (v: number) => ({ SEC_ATTENDANCE: e([{ CourseCode: 'INT 301', CourseName: 'شبكات', AbcensePercentage: v }]) });
  assert.deepEqual(diffAlerts(p(10), p(15), true, now), []);
  const a = diffAlerts(p(15), p(20), true, now);
  assert.equal(a.length, 1); assert.equal(a[0].kind, 'absence'); assert.match(a[0].title, /20%/); assert.match(a[0].body, /25%/);
  assert.equal(a[0].route, '/absence?code=INT%20301');
  assert.deepEqual(diffAlerts(p(20), p(23), true, now), []);
});
test('terms are named by study year, not by calendar', () => {
  const list = [
    { serial: 1, year: '2024/2025', en: 'Fall', ar: '' }, { serial: 2, year: '2024/2025', en: 'Spring', ar: '' },
    { serial: 3, year: '2024/2025', en: 'Summer', ar: '' }, { serial: 4, year: '2025/2026', en: 'Fall', ar: '' }];
  const m = studyTerms(list);
  assert.deepEqual(list.map(t => studyLabel(m.get(t.serial), true)), ['سنة أولى · ترم أول', 'سنة أولى · ترم تاني', 'سمر سنة أولى', 'سنة تانية · ترم أول']);
  assert.equal(nextStudyTerm(m.get(2))?.summer, true);
});
test('absence scale runs to 25%', () => {
  assert.equal(absenceScale(25), 1); assert.equal(absenceScale(12.5), 0.5); assert.equal(absenceScale(null), 0);
  assert.equal(absenceTone(26), 'out');
});
test('planner loads and GPA rules', () => {
  assert.deepEqual([...LOADS], [9, 12, 18, 20, 21]);
  assert.equal(defaultLoad(1.8), 12); assert.equal(defaultLoad(2.1), 18); assert.equal(defaultLoad(3, true), 9);
  const chosen = pick(curriculumCourses.slice(0, 12), 9);
  assert.ok(chosen.reduce((s, c) => s + (curriculumCourses.find(x => x.code === c)?.credits ?? 0), 0) <= 9);
  assert.equal(cappedGrade('A', 3), 'D'); assert.equal(cappedGrade('A', 2), 'A');
  const A = gradePoints('A')!; const r = projectGpa({ points: 60, hours: 30 }, [{ credits: 3, grade: 'A', attempt: 1 }]);
  assert.ok(Math.abs((r.termGpa ?? 0) - A) < 1e-9); assert.ok(Math.abs((r.cgpa ?? 0) - (60 + 3 * A) / 33) < 1e-9);
});
test('notebook makes one topic per course once', () => {
  const nb = withCourseTopics(emptyNotebook(), [{ code: 'INT 301', title: 'Networks' }]);
  assert.equal(nb.topics.length, 1); assert.equal(nb.topics[0].id, courseTopicId('INT 301'));
  assert.equal(withCourseTopics(nb, [{ code: 'INT 301', title: 'Networks' }]), nb);
  assert.equal(withCourseTopics({ ...emptyNotebook(), hidden: [courseTopicId('INT 301')] }, [{ code: 'INT 301', title: 'x' }]).topics.length, 0);
  assert.equal(normalizeIndex({ topics: 5 }).topics.length, 0); assert.equal(titleFrom('\n  Lecture 3 \nnotes'), 'Lecture 3');
});
test('moodle launch token is parsed', () => {
  const url = 'moodlemobile://token=' + btoa('0123456789abcdef0123456789abcdef:::abcdefABCDEF1234567890');
  assert.equal(parseLaunch(url)?.token, 'abcdefABCDEF1234567890'); assert.equal(parseLaunch('https://x'), null);
});
test('home shows the university code and two names', () => {
  assert.equal(shortName('Abdelrahman  Mostafa Ahmed Ali'), 'Abdelrahman Mostafa');
  assert.equal(studentCode({ SEC_PROFILE: e({ StudentData: [{ StudentID: 77, StudentCode: '2023001234' }] }) } as never), '2023001234');
  assert.equal(WEEK[0], 6);
});