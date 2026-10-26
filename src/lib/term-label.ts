// Student-friendly term names: "سنة أولى · ترم أول" instead of "Fall 2024".
export type StudyTerm = { serial: number; year: number; index: number; summer: boolean };
type TermLike = { serial: number; year: string; en: string; ar: string };
const ORD_AR = ['أولى', 'تانية', 'تالتة', 'رابعة', 'خامسة', 'سادسة', 'سابعة', 'تامنة', 'تاسعة', 'عاشرة'];
export const isSummer = (en: string, ar = '') => /summer|صيف/i.test(`${en} ${ar}`);
const isFirst = (en: string, ar = '') => /fall|autumn|خريف/i.test(`${en} ${ar}`);

/** Position of each term in the student's own journey. A new study year starts when the academic-year name changes (or at a fall term). */
export function studyTerms(list: TermLike[]): Map<number, StudyTerm> {
  const out = new Map<number, StudyTerm>();
  let year = 0, index = 0, lastName: string | null = null;
  for (const t of [...list].sort((a, b) => a.serial - b.serial)) {
    const summer = isSummer(t.en, t.ar), name = (t.year || '').trim();
    const newYear = year === 0 || (name && lastName ? name !== lastName : !summer && isFirst(t.en, t.ar));
    if (newYear) { year++; index = 0; }
    if (!summer) index++;
    out.set(t.serial, { serial: t.serial, year, index, summer });
    if (name) lastName = name;
  }
  return out;
}

export function studyLabel(s: StudyTerm | undefined, ar: boolean, part: 'full' | 'term' | 'year' = 'full'): string {
  if (!s) return '';
  const y = ar ? `سنة ${ORD_AR[s.year - 1] ?? s.year}` : `Year ${s.year}`;
  const t = s.summer ? (ar ? 'سمر' : 'Summer') : ar ? (s.index === 1 ? 'ترم أول' : s.index === 2 ? 'ترم تاني' : `ترم ${s.index}`) : `Term ${s.index}`;
  if (part === 'term') return t;
  if (part === 'year') return y;
  return s.summer ? (ar ? `سمر ${y}` : `${y} · Summer`) : `${y} · ${t}`;
}

/** The term that normally follows (term 1 → term 2 → summer → next year term 1). */
export function nextStudyTerm(s: StudyTerm | undefined): StudyTerm | undefined {
  if (!s) return undefined;
  if (s.summer) return { serial: s.serial + 1, year: s.year + 1, index: 1, summer: false };
  if (s.index >= 2) return { serial: s.serial + 1, year: s.year, index: s.index, summer: true };
  return { serial: s.serial + 1, year: s.year, index: s.index + 1, summer: false };
}