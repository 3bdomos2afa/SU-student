import test from 'node:test';
import assert from 'node:assert/strict';
import { edgeStrips } from '../src/lib/map-geometry';
import { buildDataSample, sampleValue } from '../src/lib/data-sample';

test('map connector strips stay far below the Android 100 MB bitmap limit on every density', () => {
  for (const d of [1, 2, 2.625, 3, 3.5, 4]) {
    const s = edgeStrips(3124, 1690, d);
    assert.ok(s.bytes <= 6e6 + 1, `density ${d}: ${s.bytes}`);
    assert.ok(s.count * s.size >= 3124);
  }
});
test('data sample masks secrets and identity but keeps course fields', () => {
  const v = sampleValue({ Token: 'abc', StudentID: 77, StudentName: 'X', NationalID: '29', Mobile: '01', CourseName: 'Math', CourseCode: 'INT 101', StudentDegree: 40, rows: Array.from({ length: 40 }, (_, i) => ({ i })) }) as any;
  assert.equal(v.Token, '•••'); assert.equal(v.StudentID, '•••'); assert.equal(v.StudentName, '•••');
  assert.equal(v.NationalID, '•••'); assert.equal(v.Mobile, '•••');
  assert.equal(v.CourseName, 'Math'); assert.equal(v.CourseCode, 'INT 101'); assert.equal(v.StudentDegree, 40);
  assert.equal(v.rows.length, 26);
});
test('data sample stays shareable in size', () => {
  const big = { SEC_TRANSCRIPT: { at: 'now', data: Array.from({ length: 5000 }, (_, i) => ({ CourseCode: `C${i}`, Note: 'x'.repeat(150) })) } };
  assert.ok(buildDataSample(big, '1.7.3').length <= 150000);
});
