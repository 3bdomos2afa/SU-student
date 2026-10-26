// Absence as the university counts it: exclusion (حرمان) at 25%. The app never invents warnings.
import { canonical, courseRows, number, text, type Cache, type Row } from './academic';
export const EXCLUSION = 25;
export const NOTICE_AT = 20;
export const absencePct = (r: Row) => number(r.AbcensePercentage ?? r.AbsencePercentage ?? r.AbsencePercent);
/** Bar position on a 0–25% scale. */
export const absenceScale = (p: number | null) => (p === null ? 0 : Math.max(0, Math.min(1, p / EXCLUSION)));
export type AbsenceTone = 'none' | 'low' | 'mid' | 'high' | 'out';
export function absenceTone(p: number | null): AbsenceTone {
  if (p === null || p <= 0) return 'none';
  if (p < 10) return 'low';
  if (p < NOTICE_AT) return 'mid';
  if (p < EXCLUSION) return 'high';
  return 'out';
}
export const toneColor = (t: AbsenceTone) => ({ none: '#16A34A', low: '#16A34A', mid: '#F59E0B', high: '#F97316', out: '#EF4444' })[t];
export function absenceByCourse(cache: Cache) {
  const m = new Map<string, number | null>();
  for (const r of courseRows(cache, 'SEC_ATTENDANCE')) { const c = canonical(r.CourseCode); if (!m.has(c)) m.set(c, absencePct(r)); }
  return m;
}
export function dateOf(r: Row): number | null {
  for (const k of ['AttenDay', 'AttendanceDate', 'AbsenceDate', 'LectureDate', 'WarningDate', 'Date', 'CreatedDate', 'InsertDate']) {
    const s = text(r[k]).trim(); if (!s) continue;
    const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
    const t = dmy ? new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime() : Date.parse(s);
    if (Number.isFinite(t)) return t;
  }
  return null;
}
/** Dated absences of one course, newest first. */
export function absenceDetails(cache: Cache, code: string): Row[] {
  const rows = courseRows(cache, 'SEC_ABSENCE', code);
  return rows.map((r, i) => ({ r, i, t: dateOf(r) })).sort((a, b) => (b.t ?? -1) - (a.t ?? -1) || b.i - a.i).map(x => x.r);
}
export function warningRows(cache: Cache, code: string): Row[] {
  return courseRows(cache, 'SEC_WARNINGS', code).map((r, i) => ({ r, i, t: dateOf(r) })).sort((a, b) => (b.t ?? -1) - (a.t ?? -1) || b.i - a.i).map(x => x.r);
}
export function warningPercent(r: Row): number | null {
  for (const [k, v] of Object.entries(r)) if (/percent|ratio|نسبة/i.test(k)) { const n = number(v); if (n !== null) return n; }
  return null;
}