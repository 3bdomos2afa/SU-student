import test from 'node:test';
import assert from 'node:assert/strict';
import { academic, canonical } from '../src/lib/academic';
import { curriculumCourses } from '../src/data/curriculum';
import { courseByCode } from '../src/data/curriculum-helpers';

const term = (serial: number, year: string, en: string, courses: [string, string][]) =>
  ({ SemesterYearserial: serial, Year: year, SemesterNameEN: en, SemesterNameAR: '', Summary: null, Courses: courses.map(([CourseCode, GradeName]) => ({ CourseCode, GradeName, CreditHours: 3 })) });

test('official study plan prerequisites (pages 1–4)', () => {
  const pre = (c: string) => courseByCode.get(c)!.prerequisites.map(canonical).sort();
  assert.equal(curriculumCourses.length, 49);
  assert.deepEqual(pre('CSW232'), ['CSW110']);
  assert.deepEqual(pre('CSW121'), ['INT110']);
  assert.deepEqual(pre('INT343'), ['CSW338', 'INT341']);
  assert.deepEqual(pre('INT338'), ['INT232', 'INT353']);
  assert.deepEqual(pre('INT423'), ['MA110']);
  assert.deepEqual(pre('INT499'), ['INT498']);
  assert.equal(courseByCode.get('HU 230')!.credits, 1);
  assert.equal(courseByCode.get('HU111')!.credits, 3);
  assert.ok(courseByCode.get('INT349W'));
});

test('passed = any passing attempt, any code spelling', () => {
  const cache = { SEC_HISTORY: { at: 'now', data: [
    term(1, '2022', 'Fall', [['MA111', 'F'], ['HU110', 'C+']]),
    term(2, '2023', 'Fall', [['INT 349W', 'B+'], ['MA 111', 'F']]),
    term(3, '2025', 'Fall', [['ma-111', ' D '], ['CSW242', 'F']]),
    term(4, '2025', 'Summer', [['CSW 242', 'C+']]),
  ] }, SEC_CURRENT: { at: 'now', data: [{ CourseCode: 'CSW242' }, { CourseCode: 'INT232' }] } };
  const a = academic(cache as never);
  for (const c of ['MA111', 'HU110', 'INT349W', 'CSW242']) assert.ok(a.passed.has(canonical(c)), c);
  assert.equal(a.failures[canonical('MA111')], 2);
  assert.ok(!a.registered.has('CSW242')); assert.ok(a.registered.has('INT232'));
});