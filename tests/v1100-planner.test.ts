import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical } from '../src/lib/academic';
import { curriculumCourses } from '../src/data/curriculum';
import { GRADE_SCALE, gradeForPercent } from '../src/data/curriculum-helpers';
import { cappedGrade, fillPlan, gradePoints, suggestions } from '../src/lib/planner';
import { studyLabel, studyTerms, upcomingStudyTerm } from '../src/lib/term-label';

const passedCodes = ['HU110', 'CSW110', 'HU230', 'HU111', 'ISD100', 'MA110', 'CSW241', 'INT349W', 'ST120', 'CSW234', 'CSW232', 'HU213', 'HU212', 'MA111', 'INT110', 'CSW221', 'CSW242', 'INT489'];
const passed = new Set(passedCodes.map(canonical));
const completed = new Set(curriculumCourses.filter(c => passed.has(canonical(c.code))).map(c => c.code));
const failures = { [canonical('HU100')]: 2, [canonical('INT232')]: 1, [canonical('ISD220')]: 1, [canonical('HU194')]: 1 };

test('only available courses; failed first, then next-term semester, then the other', () => {
  const list = suggestions({ completed, earned: 55, registered: new Set(), passed, failures }, 2);
  const codes = list.map(s => canonical(s.course.code));
  for (const s of list) for (const p of s.course.prerequisites) if (!/credit/i.test(p)) assert.ok(completed.has(p), `${s.course.code} needs ${p}`);
  assert.ok(!codes.includes('INT343'), 'INT343 needs CSW338');
  assert.ok(!codes.includes('MA111'), 'passed courses never show');
  const groups = list.map(s => s.group);
  assert.deepEqual([...groups].sort((a, b) => ['retake', 'term', 'other'].indexOf(a) - ['retake', 'term', 'other'].indexOf(b)), groups);
  assert.equal(list[0].group, 'retake');
  assert.ok(list.filter(s => s.group === 'term').every(s => s.course.semester === 2));
});

test('fills the hour load as fully as possible, retakes first', () => {
  const list = suggestions({ completed, earned: 55, registered: new Set(), passed, failures }, 2);
  for (const L of [9, 12, 18]) {
    const plan = fillPlan(list, L);
    const h = plan.reduce((s, c) => s + curriculumCourses.find(x => x.code === c)!.credits, 0);
    assert.equal(h, L, `load ${L}`);
    assert.ok(plan.includes('INT 232'));
  }
});

test('next term from the calendar: October → Spring of the same study year', () => {
  const pos = studyTerms([{ serial: 1, year: '2022', en: 'Fall', ar: '' }], 2022);
  const n = upcomingStudyTerm(pos, 2022, new Date(2026, 9, 27))!;
  assert.equal(n.kind, 'spring');
  assert.equal(studyLabel(n, true, 'long'), 'سنة خامسة · ترم تاني · 2026/27');
  assert.equal(upcomingStudyTerm(pos, 2022, new Date(2027, 2, 1))!.summer, true);
});

test('official grade scale (effective Fall 2018)', () => {
  assert.deepEqual(GRADE_SCALE.map(g => [g.grade, g.points]), [['A+', 4], ['A', 3.8], ['A-', 3.6], ['B+', 3.3], ['B', 3], ['C+', 2.7], ['C', 2.4], ['D', 2], ['F', 0]]);
  assert.equal(gradeForPercent(95), 'A+'); assert.equal(gradeForPercent(89.9), 'A-'); assert.equal(gradeForPercent(60), 'D'); assert.equal(gradeForPercent(59), 'F');
  assert.equal(gradePoints('B-'), null);
  assert.equal(cappedGrade('C', 3), 'D'); assert.equal(cappedGrade('D', 3), 'D');
});