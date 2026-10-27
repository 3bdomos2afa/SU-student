import test from 'node:test';
import assert from 'node:assert/strict';
import { academicStart, calendarTerm, entryYearOf, nextStudyTerm, orderTerms, studyLabel, studyTerms, termKind } from '../src/lib/term-label';

// Same shape as the real portal: year records named by calendar year, serials chronological.
const real = [
  ['2022', 'Fall'], ['2023', 'Spring'], ['2023', 'Summer'], ['2023', 'Fall'], ['2024', 'Spring'], ['2024', 'Summer'],
  ['2024', 'Fall'], ['2025', 'Spring'], ['2025', 'Summer'],
].map(([year, en], i) => ({ serial: 100 + i, year, en, ar: '' }));

test('calendar-named years become study years: Fall → Spring → Summer', () => {
  const m = studyTerms(real, 2022);
  assert.deepEqual(orderTerms(real).map(t => studyLabel(m.get(t.serial), true)), [
    'سنة أولى · ترم أول', 'سنة أولى · ترم تاني', 'سمر سنة أولى',
    'سنة تانية · ترم أول', 'سنة تانية · ترم تاني', 'سمر سنة تانية',
    'سنة تالتة · ترم أول', 'سنة تالتة · ترم تاني', 'سمر سنة تالتة']);
  assert.equal(studyLabel(m.get(101), true, 'long'), 'سنة أولى · ترم تاني · 2022/23');
});

test('summer never sorts before spring, even with odd serials', () => {
  const odd = [{ serial: 5, year: '2023', en: 'Summer', ar: '' }, { serial: 9, year: '2023', en: 'Spring', ar: '' }, { serial: 1, year: '2022', en: 'Fall', ar: '' }];
  assert.deepEqual(orderTerms(odd).map(t => t.en), ['Fall', 'Spring', 'Summer']);
  assert.equal(termKind({ en: '', ar: '', semesterId: 3 }), 'summer');
  assert.equal(academicStart({ serial: 1, year: '2024/2025', en: 'Spring', ar: '' }), 2024);
});

test('entry year comes from the student code and years go past 4', () => {
  assert.equal(entryYearOf('20220123'), 2022); assert.equal(entryYearOf('12323'), null);
  const late = [{ serial: 1, year: '2027', en: 'Fall', ar: 'خريف' }];
  assert.equal(studyLabel(studyTerms(late, 2022).get(1), true), 'سنة سادسة · ترم أول');
  assert.equal(studyLabel(studyTerms(late, null).get(1), true), 'سنة أولى · ترم أول');
});

test('next term and calendar term', () => {
  const m = studyTerms(real, 2022);
  assert.equal(nextStudyTerm(m.get(108))?.kind, 'fall');
  assert.deepEqual(calendarTerm(new Date(2026, 9, 26)), { kind: 'fall', start: 2026 });
  assert.deepEqual(calendarTerm(new Date(2027, 2, 1)), { kind: 'spring', start: 2026 });
});