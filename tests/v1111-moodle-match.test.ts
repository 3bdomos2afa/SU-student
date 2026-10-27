import test from 'node:test';
import assert from 'node:assert/strict';
import type { MCourseRef } from '../src/lib/moodle';
import { nameMatch, pickCopies, teachersFor, termLabel, termOf, titleMatch } from '../src/lib/moodle-match';

const ts = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 1000;
const C = (id: number, fullname: string, start: number, teachers: string[] = [], enrolled = false): MCourseRef =>
  ({ id, fullname, shortname: '', idnumber: '', startdate: start, enrolled, teachers });

test('Arabic portal doctor names match English Moodle names', () => {
  assert.equal(nameMatch('د/ ناصر تميمي', 'Dr. Nasser Tamimi'), 2);
  assert.equal(nameMatch('ناصر تميمي', 'Nasser Mohamed El-Tamimy'), 2);
  assert.equal(nameMatch('أ.د. محمد السيد', 'Prof. Mohamed Elsayed'), 2);
  assert.equal(nameMatch('ناصر تميمي', 'Dr Nasser Ahmed'), 1);
  assert.equal(nameMatch('ناصر تميمي', 'Dr. Ahmed Hassan'), 0);
  assert.equal(nameMatch('ناصر تميمي', 'ناصر التميمي'), 2);
});

test('course title must match all its main words', () => {
  assert.ok(titleMatch('Software Engineering', C(1, 'Software Engineering - Dr Nasser', 0)));
  assert.ok(!titleMatch('Software Engineering', C(1, 'Software Testing', 0)));
  assert.ok(titleMatch('هندسة البرمجيات', C(1, 'برمجيات - هندسة 2025', 0)));
});

const list = [
  C(10, 'SWE301 Software Engineering Fall 2025', ts(2025, 9, 27), ['Nasser Tamimi']),
  C(11, 'SWE301 Software Engineering Fall 2025 (G2)', ts(2025, 9, 27), ['Ahmed Hassan'], true),
  C(5, 'Software Engineering - Summer 2025', ts(2025, 7, 1), ['Nasser Tamimi']),
  C(3, 'SWE 301 Spring 2025', ts(2025, 2, 8), ['Dr. Nasser Tamimi']),
  C(2, 'SWE 301 Fall 2024', ts(2024, 10, 1), ['Mona Ali']),
  C(1, 'Software Testing', ts(2024, 10, 1), ['Nasser Tamimi']),
];

test('newest copy with the same doctor is the folder; older ones with that doctor are old files', () => {
  const p = pickCopies({ code: 'SWE 301', title: 'Software Engineering', teachers: ['د/ ناصر تميمي'] }, list);
  assert.equal(p.main?.id, 10); assert.equal(p.byTeacher, true);
  assert.deepEqual(p.old.map(r => r.id), [5, 3]);
});

test('without a doctor match: newest copy of the code, no other doctor’s old folders', () => {
  const none = pickCopies({ code: 'SWE 301', title: 'Software Engineering', teachers: ['شخص غريب'] }, list);
  assert.equal(none.main?.id, 11); assert.equal(none.byTeacher, false); assert.deepEqual(none.old, []);
  const unknown = pickCopies({ code: 'SWE 301', title: 'Software Engineering' }, list);
  assert.equal(unknown.main?.id, 11); assert.deepEqual(unknown.old.map(r => r.id), [3, 2]);
  assert.equal(pickCopies({ code: 'ABC 100', title: 'Nothing' }, list).main, null);
});

test('term of each copy: first, second or summer with the academic year', () => {
  assert.equal(termLabel(termOf(list[0])), 'ترم أول · 2025/26');
  assert.equal(termLabel(termOf(list[2])), 'سمر · 2024/25');
  assert.equal(termLabel(termOf(list[3])), 'ترم تاني · 2024/25');
  assert.equal(termLabel(termOf(list[3]), false), 'Spring · 2024/25');
  assert.equal(termLabel(termOf(C(9, 'SWE 301', ts(2026, 2, 14)))), 'ترم تاني · 2025/26');
  assert.equal(termLabel(termOf(C(9, 'برمجيات الفصل الدراسي الأول 2024', 0))), 'ترم أول · 2024/25');
  assert.equal(termLabel(termOf(C(9, 'X', 0))), 'ترم مش معروف');
});

test('doctors come from the lecture slots of the timetable', () => {
  const slots = [{ code: 'SWE 301', type: 'section', teachers: 'م/ علي حسن' }, { code: 'SWE301', type: 'lecture', teachers: 'د/ ناصر تميمي · د/ منى علي' },
    { code: 'ISD 242', type: 'lecture', teachers: 'x y' }];
  assert.deepEqual(teachersFor(slots, 'SWE 301'), ['د/ ناصر تميمي', 'د/ منى علي']);
  assert.deepEqual(teachersFor(slots.slice(0, 1), 'SWE 301'), ['م/ علي حسن']);
});