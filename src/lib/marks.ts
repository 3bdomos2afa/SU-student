// Tolerant parser for coursework / midterm / quiz / final marks.
// The university has not published real mark rows for the test account yet, so field names are matched
// loosely (case-insensitive, several known spellings) instead of trusting one exact shape.
import { number, rowsDeep, text, type Row } from './academic';

export type MarkKind = 'midterm' | 'coursework' | 'final';
export type MarkPart = 'activity' | 'quiz';
export type Mark = { key: string; label: string; value: string; max: string; score: number | null; outOf: number | null; kind: MarkKind; part: MarkPart };

const LABELS = ['templatedetails', 'groups', 'templatename', 'activityname', 'quizname', 'assessmentname', 'itemname', 'examname', 'groupname', 'typename', 'title', 'name', 'description'];
const VALUES = ['studentdegree', 'studentmark', 'studentscore', 'studentgrade', 'degree', 'mark', 'score'];
const MAXES = ['maxdegree', 'maxmark', 'fullmark', 'maxscore', 'totaldegree', 'outof', 'max'];

function field(r: Row, keys: string[]) {
  const lower = new Map(Object.entries(r).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lower.get(k);
    if ((typeof v === 'string' || typeof v === 'number') && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}
const hasField = (r: Row, keys: string[]) => Object.keys(r).some(k => keys.includes(k.toLowerCase()));
export const isMarkRow = (r: Row) => hasField(r, VALUES) || hasField(r, ['templatedetails']);

export function markKind(label: string, part: MarkPart): MarkKind {
  if (part === 'quiz') return 'coursework';
  if (/mid|ميد|منتصف|نصف/i.test(label)) return 'midterm';
  if (/final|فاينل|نهائ/i.test(label)) return 'final';
  return 'coursework';
}

/** New caches store [{_part, data}] (activity + quizzes); older caches stored the activity rows directly. */
function parts(data: unknown): { part: MarkPart; rows: Row[] }[] {
  if (Array.isArray(data) && data.some(x => x && typeof x === 'object' && '_part' in (x as Row))) {
    return data.filter((x): x is Row => !!x && typeof x === 'object' && '_part' in (x as Row))
      .map(x => ({ part: x._part === 'quiz' ? 'quiz' as const : 'activity' as const, rows: rowsDeep(x.data) }));
  }
  return [{ part: 'activity', rows: rowsDeep(data) }];
}

export function marks(data: unknown): Mark[] {
  const out: Mark[] = [];
  const seen = new Set<string>();
  for (const { part, rows } of parts(data)) {
    rows.filter(isMarkRow).forEach((r, i) => {
      const label = field(r, LABELS) || (part === 'quiz' ? `Quiz ${i + 1}` : `#${i + 1}`);
      const key = `${part}|${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      const value = field(r, VALUES), max = field(r, MAXES);
      out.push({ key, label, value, max, score: number(value), outOf: number(max), kind: markKind(label, part), part });
    });
  }
  return out;
}

/** Sum of the marks that are actually published (with a known maximum). */
export function markTotal(list: Mark[]) {
  let score = 0, outOf = 0, n = 0;
  for (const m of list) if (m.score !== null && m.outOf !== null && m.outOf > 0) { score += m.score; outOf += m.outOf; n++; }
  return n ? { score, outOf } : null;
}
export const markText = (v: unknown) => text(v);