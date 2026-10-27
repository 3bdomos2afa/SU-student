// Matches a portal course (code, title, doctor) to its Moodle copies and names the term of each copy.
// Moodle keeps one copy per term (and per group), so the newest copy with the same doctor is "the" folder
// and the older copies with that doctor become "old files".
import type { MCourseRef } from './moodle';

export type Current = { code: string; title: string; teachers?: string[] };
export type TermKind = 'fall' | 'spring' | 'summer';
export type TermTag = { kind: TermKind | null; year: number | null };

const key = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const codes = (s: string) => [...(s || '').toUpperCase().matchAll(/([A-Z]{2,5})\s*[-_.]?\s*(\d{3,4})/g)].map(m => m[1] + m[2]);

export const normAr = (s: string) =>
  (s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const words = (s: string) => normAr(s).split(/[^a-z\u0621-\u064a]+/).filter(Boolean);

const TITLE_WORDS = new Set(['dr', 'prof', 'professor', 'doctor', 'eng', 'engineer', 'mr', 'mrs', 'ms', 'miss', 'assoc', 'assist', 'asst', 'lecturer',
  'instructor', 'ta', 'al', 'el', 'ibn', 'bin', 'دكتور', 'دكتوره', 'الدكتور', 'الدكتوره', 'استاذ', 'الاستاذ', 'استاذه', 'الاستاذه', 'مهندس', 'المهندس', 'مهندسه']);
const AR: Record<string, string> = { 'ب': 'b', 'ت': 't', 'ث': 't', 'ج': 'g', 'ح': 'h', 'خ': 'k', 'د': 'd', 'ذ': 's', 'ر': 'r', 'ز': 's', 'س': 's', 'ش': 's', 'ص': 's',
  'ض': 'd', 'ط': 't', 'ظ': 's', 'غ': 'g', 'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h' };
const LAT: Record<string, string> = { j: 'g', q: 'k', c: 'k', x: 'ks', z: 's', v: 'f', p: 'b' };

/** Consonant skeleton, so "ناصر" and "Nasser" (or "تميمي" and "Tamimy") compare equal. */
function skel(w: string) {
  let s = '';
  if (/[a-z]/.test(w)) {
    const t = w.replace(/ph/g, 'f').replace(/th/g, 't').replace(/dh/g, 'd').replace(/sh|ch/g, 's').replace(/kh/g, 'k').replace(/gh/g, 'g');
    for (const ch of t) s += /[aeiouyw]/.test(ch) ? '' : LAT[ch] ?? ch;
  } else for (const ch of w) s += AR[ch] ?? '';
  s = s.replace(/(.)\1+/g, '$1');
  return s.length > 2 ? s.replace(/h$/, '') : s;
}
function variants(w: string) {
  const out = new Set([skel(w)]);
  if (w.startsWith('ال') && w.length > 4) out.add(skel(w.slice(2)));
  if (/^(al|el)/.test(w) && w.length > 5) out.add(skel(w.slice(2)));
  out.delete('');
  return out;
}
export const nameTokens = (s: string) => words(s).filter(w => w.length >= 2 && !TITLE_WORDS.has(w));
function same(a: string, b: string) {
  if (a === b) return true;
  const B = variants(b);
  for (const x of variants(a)) if (x.length >= 2 && B.has(x)) return true;
  return false;
}

/** 2 = same person (two names, or the whole of a one-word name); 1 = only the first name; 0 = different. */
export function nameMatch(portal: string, other: string): 0 | 1 | 2 {
  const p = nameTokens(portal), o = nameTokens(other);
  if (!p.length || !o.length) return 0;
  const hit = p.map(w => o.some(x => same(w, x)));
  if (hit.filter(Boolean).length >= Math.min(2, p.length, o.length)) return 2;
  return hit[0] ? 1 : 0;
}
/** Best match of any portal doctor against the copy's Moodle teachers or the copy's own name. */
export function teacherLevel(teachers: string[], r: MCourseRef): 0 | 1 | 2 {
  let best: 0 | 1 | 2 = 0;
  for (const t of teachers) for (const o of [...r.teachers, r.fullname]) { const m = nameMatch(t, o); if (m > best) best = m; }
  return best;
}

export const codeMatch = (code: string, r: MCourseRef) => [r.shortname, r.fullname, r.idnumber].some(s => codes(s).includes(key(code)));
const STOP = new Set(['and', 'of', 'the', 'for', 'to', 'in', 'on', 'with', 'an', 'introduction', 'intro', 'مقدمه', 'في', 'الي', 'من']);
const noAl = (w: string) => (w.startsWith('ال') && w.length > 4 ? w.slice(2) : w);
/** Every main word of the portal title appears in the Moodle course name ("Software Engineering" ≠ "Software Testing"). */
export function titleMatch(title: string, r: MCourseRef) {
  const t = words(title).filter(w => w.length >= 3 && !STOP.has(w)).map(noAl);
  if (!t.length) return false;
  const hay = words(`${r.fullname} ${r.shortname}`).map(noAl);
  return t.every(a => hay.some(b => b === a || (a.length >= 4 && b.length >= 4 && (b.startsWith(a.slice(0, 5)) || a.startsWith(b)))));
}
export const isCandidate = (c: Current, r: MCourseRef) => codeMatch(c.code, r) || titleMatch(c.title, r);

const newest = (a: MCourseRef, b: MCourseRef) => b.startdate - a.startdate || Number(b.enrolled) - Number(a.enrolled) || b.id - a.id;
/**
 * The folder for a current course = the newest Moodle copy with the same code (or title) AND the student's doctor.
 * Older copies with that doctor are returned as `old`. Without a doctor match it falls back to the newest copy of the code.
 */
export function pickCopies(c: Current, list: MCourseRef[]): { main: MCourseRef | null; old: MCourseRef[]; byTeacher: boolean } {
  const t = (c.teachers ?? []).filter(x => nameTokens(x).length);
  const seen = new Set<number>();
  const all = list.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true))).map(r => ({ r, code: codeMatch(c.code, r), lvl: t.length ? teacherLevel(t, r) : 0 }))
    .filter(x => x.code || (x.lvl > 0 && titleMatch(c.title, x.r)));
  all.sort((a, b) => newest(a.r, b.r));
  const older = (main: MCourseRef, rs: MCourseRef[]) => rs.filter(r => r.id !== main.id && (!main.startdate || r.startdate < main.startdate)).slice(0, 8);
  if (t.length) {
    const mine = all.filter(x => x.lvl > 0);
    const main = (mine.find(x => x.lvl === 2) ?? mine[0])?.r;
    if (main) return { main, old: older(main, mine.map(x => x.r)), byTeacher: true };
  }
  const byCode = all.filter(x => x.code).map(x => x.r);
  const main = byCode[0] ?? null;
  return { main, old: main && !t.length ? older(main, byCode) : [], byTeacher: false };
}

/** Which term a Moodle copy belongs to: from its name first, otherwise from its start date (Cairo time). */
export function termOf(r: Pick<MCourseRef, 'fullname' | 'shortname' | 'idnumber' | 'startdate'>): TermTag {
  const t = normAr(`${r.fullname} ${r.shortname} ${r.idnumber}`);
  let kind: TermKind | null = /summer|صيف|سمر/.test(t) ? 'summer'
    : /fall|autumn|(first|1st)\W*(term|sem)|(الترم|الفصل|ترم)\s*(الدراسي\s*)?(الاول|اول)/.test(t) ? 'fall'
      : /spring|(second|2nd)\W*(term|sem)|(الترم|الفصل|ترم)\s*(الدراسي\s*)?(الثاني|التاني|تاني|ثاني)/.test(t) ? 'spring' : null;
  let year: number | null = null;
  if (r.startdate > 0) {
    const d = new Date((r.startdate + 3 * 3600) * 1000); const m = d.getUTCMonth() + 1, y = d.getUTCFullYear();
    year = m >= 8 ? y : y - 1;
    if (!kind) kind = m >= 8 ? 'fall' : m <= 5 ? 'spring' : 'summer';
  } else {
    const y = /20\d\d/.exec(t);
    if (y) year = kind && kind !== 'fall' ? Number(y[0]) - 1 : Number(y[0]);
  }
  return { kind, year };
}
const KIND: Record<TermKind, [string, string]> = { fall: ['ترم أول', 'Fall'], spring: ['ترم تاني', 'Spring'], summer: ['سمر', 'Summer'] };
export function termLabel(tag: TermTag, ar = true) {
  const k = tag.kind ? KIND[tag.kind][ar ? 0 : 1] : ar ? 'ترم مش معروف' : 'Unknown term';
  return tag.year ? `${k} · ${tag.year}/${String((tag.year + 1) % 100).padStart(2, '0')}` : k;
}

/** The student's doctors for a course from the timetable (lecture doctors first; section TAs only if no lecture). */
export function teachersFor(slots: { code: string; type: string; teachers: string }[], code: string, extra?: unknown) {
  const k = key(code);
  const mine = slots.filter(s => key(s.code) === k && s.teachers);
  const lec = mine.filter(s => s.type === 'lecture');
  const src = (lec.length ? lec : mine).map(s => s.teachers);
  if (typeof extra === 'string' && extra.trim()) src.push(extra);
  const out: string[] = [];
  for (const s of src) for (const n of s.split(/\s*[·,،;|]\s*/)) { const x = n.trim(); if (x && nameTokens(x).length && !out.includes(x)) out.push(x); }
  return out.slice(0, 4);
}