import { courseRows, canonical, number, text, timetable, type Cache, type Row } from './academic';
import { recordsOf } from './portal';
import { courseByCode } from '../data/curriculum-helpers';
/** University student code (starts with 20…), not the internal StudentID. */
export function studentCode(cache: Cache): string {
  let found = '';
  const walk = (v: unknown, depth: number) => {
    if (found || depth > 5) return;
    if (Array.isArray(v)) v.forEach(x => walk(x, depth + 1));
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      for (const k of ['StudentCode', 'Student_Code', 'StudentNo', 'UniversityCode']) { const s = text(o[k]).trim(); if (s) { found = s; return; } }
      Object.values(o).forEach(x => walk(x, depth + 1));
    }
  };
  walk(cache.SEC_PROFILE?.data, 0); if (!found) walk(cache.SEC_PERSONAL?.data, 0);
  return found;
}
/** First two names only, so the hero never truncates. */
export const shortName = (name: string) => name.trim().split(/\s+/).slice(0, 2).join(' ');

export type CurrentCourse = { code: string; title: string; credits: number | null; row: Row };
/** The courses the student is registered in this term (once each). */
export function currentCourses(cache: Cache): CurrentCourse[] {
  const list = [...recordsOf(cache.SEC_CURRENT?.data), ...recordsOf(cache.SEC_SCHEDULE?.data), ...courseRows(cache, 'SEC_TIMETABLE')].filter(r => r && r.CourseCode);
  const m = new Map<string, CurrentCourse>();
  for (const r of list) {
    const c = canonical(r.CourseCode); const prev = m.get(c);
    const title = text(r.CourseNameEN) || text(r.CourseName) || courseByCode.get(text(r.CourseCode))?.title || text(r.CourseCode);
    if (!prev) m.set(c, { code: text(r.CourseCode), title, credits: number(r.CreditHours), row: r });
    else if (prev.credits === null && number(r.CreditHours) !== null) prev.credits = number(r.CreditHours);
  }
  if (!m.size) for (const s of timetable(cache)) if (!m.has(canonical(s.code))) m.set(canonical(s.code), { code: s.code, title: s.title || s.code, credits: null, row: {} as Row });
  return [...m.values()];
}
/** Saturday-first week order (Egyptian week). */
export const WEEK = [6, 0, 1, 2, 3, 4] as const;
export const DAY_COLORS: Record<number, string> = { 6: '#4F46E5', 0: '#0891B2', 1: '#16A34A', 2: '#D97706', 3: '#DB2777', 4: '#7C3AED', 5: '#64748B' };
export const toMinutes = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : 9999; };