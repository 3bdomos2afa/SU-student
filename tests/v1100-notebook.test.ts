import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanStroke, normalizeBody } from '../src/lib/notebook';
import { buildNoteHtml, NOTE_LINE, NOTE_LINES, printNoteHtml, sanitizeNoteHtml, textToHtml } from '../src/lib/note-html';

const labels = { placeholder: 'p', color: 'c', highlight: 'h', size: 's', list: 'l', align: 'a', big: 'b', heading: 'h', normal: 'n', noList: 'x', none: 'o', clearFormat: 'f', right: 'r', center: 'c', left: 'l', indent: 'i', outdent: 'o' };

test('notebook page is 4x taller than before', () => {
  assert.equal(NOTE_LINE * NOTE_LINES, 34 * 24 * 4);
});

test('note editor script is valid JavaScript and escapes page content', () => {
  const html = buildNoteHtml({ body: { text: 'x', html: '<b>hi</b></script><script>alert(1)</script>', strokes: [{ c: '#000000', w: 3, d: 'M1 1 L2 2', y: 2 }] }, width: 360, isAr: true, labels, ink: '#2563EB', pen: 3 });
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 2);
  scripts.forEach(s => assert.doesNotThrow(() => new Function(s)));
  assert.ok(!html.includes('alert(1)'));
  assert.ok(html.includes('touchstart') && html.includes('hiliteColor') && html.includes('insertOrderedList'));
});

test('sanitizer keeps formatting but drops scripts and handlers', () => {
  const out = sanitizeNoteHtml('<span style="color:red" onclick="x()">a</span><img src=x onerror=y><iframe src="z"></iframe><ol style="list-style-type:lower-alpha"><li>1</li></ol>');
  assert.ok(out.includes('style="color:red"') && out.includes('lower-alpha'));
  assert.ok(!/onclick|onerror|<img|<iframe/i.test(out));
});

test('old plain-text pages still open', () => {
  assert.equal(textToHtml('a\n\nb<'), '<div>a</div><div><br></div><div>b&lt;</div>');
  const b = normalizeBody({ text: 'hey', strokes: [{ c: '#123456', w: 3, d: 'M1 1 L5 5', y: 5 }, { c: 'red;x', w: 3, d: 'M1 1"/><script>', y: 1 }] });
  assert.equal(b.strokes.length, 1);
  assert.equal(b.html, undefined);
});

test('strokes are validated', () => {
  assert.equal(cleanStroke({ c: 'url(x)', w: 999, d: 'M1 1 L2 2', y: -3, o: 0.35 })?.w, 40);
  assert.equal(cleanStroke({ c: '#fff', w: 2, d: 'M1 1 Z<', y: 1 }), null);
  assert.equal(cleanStroke({ c: '#fff', w: 2, d: 'M1 1 L2 2', y: 1, o: 0.35 })?.o, 0.35);
});

test('pdf document includes title, dates and drawing', () => {
  const doc = printNoteHtml({ title: 'محاضرة <1>', subtitle: 'تاريخ الإنشاء: x', html: '<b>a</b>', strokes: [{ c: '#000', w: 3, d: 'M1 1 L9 9', y: 9 }], width: 360, isAr: true });
  assert.ok(doc.includes('محاضرة &lt;1&gt;') && doc.includes('تاريخ الإنشاء') && doc.includes('<path d="M1 1 L9 9"'));
});