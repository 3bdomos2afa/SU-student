// Student-friendly term names ("سنة أولى · ترم تاني") and the real term order (Fall → Spring → Summer).
// The portal names each academic-year record by a calendar year: "2023" holds Spring 2023, Summer 2023 and Fall 2023,
// so Spring/Summer of "2023" belong to the 2022/23 study year. A "2022/2023" name is used as is.
export type TermKind = 'fall' | 'spring' | 'summer' | 'other';
export type StudyTerm = { serial: number; year: number; index: number; summer: boolean; kind: TermKind; start: number | null };
export type TermLike = { serial: number; year: string; en: string; ar: string; semesterId?: number | null };
const ORD_AR = ['أولى', 'تانية', 'تالتة', 'رابعة', 'خامسة', 'سادسة', 'سابعة', 'تامنة', 'تاسعة', 'عاشرة'];
const ORDER: Record<TermKind, number> = { fall: 0, spring: 1, other: 1, summer: 2 };
export const isSummer = (en: string, ar = '') => /summer|صيف|سمر/i.test(`${en} ${ar}`);

export function termKind(t: Pick<TermLike, 'en' | 'ar' | 'semesterId'>): TermKind {
  if (t.semesterId === 1) return 'fall';
  if (t.semesterId === 2) return 'spring';
  if (t.semesterId === 3) return 'summer';
  const s = `${t.en} ${t.ar}`;
  if (/summer|صيف|سمر/i.test(s)) return 'summer';
  if (/spring|ربيع|second|ثان|تاني/i.test(s)) return 'spring';
  if (/fall|autumn|خريف|first|أول|اول/i.test(s)) return 'fall';
  return 'other';
}
/** First calendar year of the study year this term belongs to (2022 for Fall 2022, Spring 2023 and Summer 2023). */
export function academicStart(t: TermLike): number | null {
  const pair = /((?:19|20)\d{2})\s*[/\-–]\s*(?:19|20)?\d{2}/.exec(t.year || '');
  if (pair) return Number(pair[1]);
  const y = /(?:19|20)\d{2}/.exec(`${t.year} ${t.en} ${t.ar}`);
  if (!y) return null;
  const k = termKind(t);
  return k === 'spring' || k === 'summer' ? Number(y[0]) - 1 : Number(y[0]);
}
/** Oldest first. Uses the study year + Fall/Spring/Summer when every term has a year, otherwise the portal serial. */
export function orderTerms<T extends TermLike>(list: T[]): T[] {
  const s = new Map(list.map(t => [t, academicStart(t)]));
  if (list.some(t => s.get(t) === null)) return [...list].sort((a, b) => a.serial - b.serial);
  return [...list].sort((a, b) => (s.get(a)! - s.get(b)!) || (ORDER[termKind(a)] - ORDER[termKind(b)]) || (a.serial - b.serial));
}
/** Entry year = first 4 digits of the student code (e.g. 2022… → 2022). */
export function entryYearOf(code: string | null | undefined): number | null {
  const m = /^\s*((?:19|20)\d{2})/.exec(code || '');
  return m ? Number(m[1]) : null;
}

/** Position of each term in the student's own journey (year 1 = the entry year). No limit at 4 years. */
export function studyTerms(list: TermLike[], entryYear?: number | null): Map<number, StudyTerm> {
  const out = new Map<number, StudyTerm>(); const ordered = orderTerms(list);
  const starts = ordered.map(academicStart);
  if (ordered.length && starts.every(v => v !== null)) {
    const first = Math.min(...(starts as number[]));
    const entry = entryYear && entryYear <= first && entryYear >= first - 12 ? entryYear : first;
    const seen = new Map<number, number>();
    ordered.forEach((t, i) => {
      const start = starts[i] as number, kind = termKind(t), year = start - entry + 1;
      const n = kind === 'summer' ? seen.get(year) ?? 0 : (seen.get(year) ?? 0) + 1; seen.set(year, n);
      const index = kind === 'fall' ? 1 : kind === 'spring' ? 2 : Math.max(1, n);
      out.set(t.serial, { serial: t.serial, year, index, summer: kind === 'summer', kind, start });
    });
    return out;
  }
  let year = 0, index = 0, lastName: string | null = null;
  for (const t of ordered) {
    const kind = termKind(t), summer = kind === 'summer', name = (t.year || '').trim();
    const newYear = year === 0 || (name && lastName ? name !== lastName : kind === 'fall');
    if (newYear) { year++; index = 0; }
    if (!summer) index = kind === 'spring' ? Math.max(index + 1, 2) : index + 1;
    out.set(t.serial, { serial: t.serial, year, index, summer, kind, start: null });
    if (name) lastName = name;
  }
  return out;
}

export type LabelPart = 'full' | 'term' | 'year' | 'short' | 'yshort' | 'span' | 'long';
export function studyLabel(s: StudyTerm | undefined, ar: boolean, part: LabelPart = 'full'): string {
  if (!s) return '';
  if (part === 'long') { const sp = studyLabel(s, ar, 'span'); return sp ? `${studyLabel(s, ar)} · ${sp}` : studyLabel(s, ar); }
  if (part === 'span') return s.start === null ? '' : `${s.start}/${String(s.start + 1).slice(2)}`;
  if (part === 'short') return s.summer ? (ar ? 'سمر' : 'Sum') : `${ar ? 'ت' : 'T'}${s.index}`;
  if (part === 'yshort') return `${ar ? 'س' : 'Y'}${s.year}`;
  const y = ar ? `سنة ${ORD_AR[s.year - 1] ?? s.year}` : `Year ${s.year}`;
  const t = s.summer ? (ar ? 'سمر' : 'Summer') : ar ? (s.index === 1 ? 'ترم أول' : s.index === 2 ? 'ترم تاني' : `ترم ${s.index}`) : `Term ${s.index}`;
  if (part === 'term') return t;
  if (part === 'year') return y;
  return s.summer ? (ar ? `سمر ${y}` : `${y} · Summer`) : `${y} · ${t}`;
}

/** The term that normally follows (Fall → Spring → Summer → next year's Fall). */
export function nextStudyTerm(s: StudyTerm | undefined): StudyTerm | undefined {
  if (!s) return undefined;
  const start = s.start === null ? null : s.start;
  if (s.summer) return { serial: s.serial + 1, year: s.year + 1, index: 1, summer: false, kind: 'fall', start: start === null ? null : start + 1 };
  if (s.index >= 2) return { serial: s.serial + 1, year: s.year, index: s.index, summer: true, kind: 'summer', start };
  return { serial: s.serial + 1, year: s.year, index: s.index + 1, summer: false, kind: 'spring', start };
}
/** Which term a calendar date falls in: Sep–Jan Fall, Feb–Jun Spring, Jul–Aug Summer. */
export function calendarTerm(d = new Date()): { kind: TermKind; start: number } {
  const m = d.getMonth() + 1, y = d.getFullYear();
  if (m >= 9) return { kind: 'fall', start: y };
  if (m === 1) return { kind: 'fall', start: y - 1 };
  return { kind: m <= 6 ? 'spring' : 'summer', start: y - 1 };
}
/** The next term from today's date (Fall now → Spring next), with the study year counted from the entry year. */
export function upcomingStudyTerm(pos: Map<number, StudyTerm>, entry: number | null | undefined, now = new Date()): StudyTerm | undefined {
  const c = calendarTerm(now);
  const kind: TermKind = c.kind === 'fall' ? 'spring' : c.kind === 'spring' ? 'summer' : 'fall';
  const start = c.kind === 'summer' ? c.start + 1 : c.start;
  const starts = [...pos.values()].map(s => s.start).filter((v): v is number => v !== null);
  const first = starts.length ? Math.min(...starts) : null;
  const base = entry && (first === null || (entry <= first && entry >= first - 12)) ? entry : first;
  if (base === null) return nextStudyTerm([...pos.values()].at(-1));
  return { serial: 0, year: Math.max(1, start - base + 1), index: kind === 'spring' ? 2 : 1, summer: kind === 'summer', kind, start };
}
