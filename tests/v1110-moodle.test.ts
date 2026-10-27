import test from 'node:test';
import assert from 'node:assert/strict';
import { itemsFrom, type MCourse } from '../src/lib/moodle';
import { ago, allRows, bySection, courseRows, extOf, filesLabel, fmtSize, kindOf, latest, mimeOf, safeName, searchRows } from '../src/lib/moodle-files';

const sections = [
  { name: 'Week 1', modules: [
    { id: 11, modname: 'resource', name: 'Lecture 01', url: 'https://k/mod/resource/view.php?id=11', contents: [{ type: 'file', filename: 'Lecture 01 - Intro.pdf', fileurl: 'https://k/webservice/pluginfile.php/1/a.pdf', timemodified: 1700000000, filesize: 2516582 }] },
    { id: 12, modname: 'folder', name: 'Sheets', contents: [
      { type: 'file', filename: 'sheet1.docx', fileurl: 'https://k/p/s1.docx', timemodified: 1700100000, filesize: 880000 },
      { type: 'file', filename: 'sheet2.docx', fileurl: 'https://k/p/s2.docx', timemodified: 1700200000 }] },
    { id: 13, modname: 'assign', name: 'Assignment 1', contents: [] },
  ] },
  { name: 'Week 2', modules: [{ id: 14, modname: 'url', name: 'Slides link', url: 'https://k/mod/url/view.php?id=14' }, { id: 15, modname: 'resource', name: 'Lab 02', url: 'https://k/mod/resource/view.php?id=15' }] },
];
const course: MCourse = { code: 'ISD 242', title: 'Database Systems', ref: null, items: itemsFrom(sections) };

test('Moodle file size is kept and each folder file becomes its own row with the old read key', () => {
  const r = courseRows(course);
  assert.deepEqual(r.map(x => x.key), ['cm11:Lecture 01 - Intro.pdf', 'cm12:sheet1.docx', 'cm12:sheet2.docx', 'cm15']);
  assert.equal(r[0].size, 2516582); assert.equal(r[2].size, null);
  assert.equal(r[0].title, 'Lecture 01'); assert.equal(r[1].title, 'Sheets — sheet1.docx');
  assert.equal(r[3].direct, false); assert.ok(r.slice(0, 3).every(x => x.direct));
});

test('latest files are newest first, sections keep upload order', () => {
  const r = courseRows(course);
  assert.deepEqual(latest(r, 2).map(x => x.key), ['cm12:sheet2.docx', 'cm12:sheet1.docx']);
  assert.deepEqual(bySection(r).map(g => [g.section, g.rows.length]), [['Week 1', 3], ['Week 2', 1]]);
});

test('search matches every word across file, code and course title, Arabic-normalized', () => {
  const r = allRows([course, { ...course, code: 'INT 232', title: 'شبكات الحاسب', items: itemsFrom([{ name: 'المحاضرة', modules: [{ id: 99, modname: 'resource', name: 'محاضرة الشبكات', contents: [{ type: 'file', filename: 'net.pptx', fileurl: 'x' }] }] }]) }]);
  assert.equal(searchRows(r, 'isd242 lecture').length, 1);
  assert.equal(searchRows(r, 'sheet').length, 2);
  assert.equal(searchRows(r, 'محاضره').length, 1);
  assert.equal(searchRows(r, '  ').length, 0);
});

test('file names, types and labels', () => {
  assert.equal(safeName('a/b:c?.pdf'), 'a_b_c_.pdf'); assert.equal(safeName('...'), 'file');
  assert.equal(extOf('X.PPTX'), 'pptx'); assert.equal(kindOf('x.pptx'), 'slides'); assert.equal(kindOf('x'), 'other');
  assert.equal(mimeOf('a.pdf'), 'application/pdf'); assert.equal(mimeOf('a.weird'), 'application/octet-stream');
  assert.equal(fmtSize(2516582), '2.4 MB'); assert.equal(fmtSize(880000), '859 KB'); assert.equal(fmtSize(null), '');
  assert.deepEqual([0, 1, 2, 3, 10, 11, 14].map(n => filesLabel(n)), ['مفيش ملفات', 'ملف واحد', 'ملفين', '3 ملفات', '10 ملفات', '11 ملف', '14 ملف']);
  const now = new Date(2026, 9, 27, 10).getTime(); const s = (d: number) => new Date(2026, 9, 27 - d, 9).getTime() / 1000;
  assert.deepEqual([0, 1, 2, 5].map(d => ago(s(d), true, now)), ['النهارده', 'امبارح', 'من يومين', 'من 5 أيام']);
});