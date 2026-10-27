// Registration planning and GPA projection rules for Sinai University (IT curriculum).
import { curriculumCourses } from '../data/curriculum';
import { GRADE_SCALE, courseStatus, unlocksOf } from '../data/curriculum-helpers';
import { canonical } from './academic';

export type PlanCourse = (typeof curriculumCourses)[number];
export const LOADS = [9, 12, 18, 20, 21] as const;
/** 9 in summer, 12 when CGPA < 2, otherwise 18. */
export function defaultLoad(cgpa: number | null, summer = false) { return summer ? 9 : cgpa !== null && cgpa < 2 ? 12 : 18; }

export type PlanInput = { completed: Set<string>; earned: number; registered: Set<string>; passed: Set<string>; failures: Record<string, number> };
/** Courses the student can take next: never passed or currently registered ones; failed courses first. */
export function candidates(p: PlanInput): PlanCourse[] {
  return curriculumCourses
    .filter(c => c.credits > 0 && !p.passed.has(canonical(c.code)) && !p.completed.has(c.code) && !p.registered.has(canonical(c.code))
      && courseStatus(c, p.completed, p.earned).status === 'available')
    .sort((a, b) => (p.failures[canonical(b.code)] ?? 0) - (p.failures[canonical(a.code)] ?? 0) || a.level - b.level
      || unlocksOf(b.code).length - unlocksOf(a.code).length || a.semester - b.semester);
}
export type Suggestion = { course: PlanCourse; failures: number; group: 'retake' | 'term' | 'other' };
const GROUP = { retake: 0, term: 1, other: 2 } as const;
/** Only courses whose prerequisites are all passed. Order: failed before → the next term's semester → the other semester. */
export function suggestions(p: PlanInput, nextSemester: 1 | 2 | null): Suggestion[] {
  return curriculumCourses
    .filter(c => !p.passed.has(canonical(c.code)) && !p.completed.has(c.code) && !p.registered.has(canonical(c.code))
      && courseStatus(c, p.completed, p.earned).status === 'available')
    .map((course): Suggestion => { const failures = p.failures[canonical(course.code)] ?? 0;
      return { course, failures, group: failures > 0 ? 'retake' : nextSemester === null || course.semester === nextSemester ? 'term' : 'other' }; })
    .sort((a, b) => GROUP[a.group] - GROUP[b.group] || b.failures - a.failures || a.course.level - b.course.level
      || unlocksOf(b.course.code).length - unlocksOf(a.course.code).length || a.course.code.localeCompare(b.course.code));
}
/** Fill the load as fully as possible. Ties go to the plan with more failed courses, then to the priority order. */
export function fillPlan(list: Suggestion[], load: number): string[] {
  const retakes = list.filter(s => s.group === 'retake').slice(0, 10), rest = list.filter(s => !retakes.includes(s));
  const best = (items: Suggestion[], cap: number): string[] => {
    const n = items.length; if (cap <= 0 || !n) return [];
    const can = Array.from({ length: n + 1 }, () => new Array<boolean>(cap + 1).fill(false)); can[n][0] = true;
    for (let i = n - 1; i >= 0; i--) { const c = items[i].course.credits; for (let x = 0; x <= cap; x++) can[i][x] = can[i + 1][x] || (x >= c && can[i + 1][x - c]); }
    let T = cap; while (T > 0 && !can[0][T]) T--;
    const out: string[] = [];
    for (let i = 0; i < n; i++) { const c = items[i].course.credits; if (T >= c && can[i + 1][T - c]) { out.push(items[i].course.code); T -= c; } }
    return out;
  };
  const cr = (codes: string[]) => codes.reduce((h, c) => h + (list.find(s => s.course.code === c)?.course.credits ?? 0), 0);
  let pickPlan: string[] = [], score = [-1, -1];
  for (let m = (1 << retakes.length) - 1; m >= 0; m--) {
    const chosen = retakes.filter((_, i) => m & (1 << i)).map(s => s.course.code); const h = cr(chosen);
    if (h > load) continue;
    const plan = [...chosen, ...best(rest, load - h)]; const sc = [cr(plan), chosen.length];
    if (sc[0] > score[0] || (sc[0] === score[0] && sc[1] > score[1])) { score = sc; pickPlan = plan; }
  }
  return pickPlan;
}
export function pick(list: PlanCourse[], load: number): string[] {
  const out: string[] = []; let h = 0;
  for (const c of list) if (h + c.credits <= load) { out.push(c.code); h += c.credits; }
  return out;
}
/** Replace one draft course with the next suitable candidate (cycles through the list). */
export function swapCourse(draft: string[], code: string, list: PlanCourse[], load: number): string[] {
  const by = new Map(list.map(c => [c.code, c]));
  const hours = draft.reduce((s, c) => s + (by.get(c)?.credits ?? 0), 0);
  const old = by.get(code)?.credits ?? 0;
  const idx = list.findIndex(c => c.code === code);
  for (let k = 1; k <= list.length; k++) {
    const c = list[(idx + k + list.length) % list.length];
    if (!c || c.code === code || draft.includes(c.code)) continue;
    if (hours - old + c.credits <= load) return draft.map(d => (d === code ? c.code : d));
  }
  return draft;
}

export const PASS_PERCENT = 60;
export const gradePoints = (g: string) => GRADE_SCALE.find(x => x.grade === g)?.points ?? null;
/** From the third attempt the best possible grade is D. */
export function cappedGrade(g: string, attempt: number) { const p = gradePoints(g); return attempt >= 3 && p !== null && p > (gradePoints('D') ?? 2) ? 'D' : g; }
/** Old attempts stay in the cumulative record, so a retake adds its hours again on top of the base. */
export function projectGpa(base: { points: number; hours: number } | null, items: { credits: number; grade?: string; attempt: number }[]) {
  let pts = 0, h = 0;
  for (const i of items) {
    if (!i.grade || !i.credits) continue;
    const p = gradePoints(cappedGrade(i.grade, i.attempt)); if (p === null) continue;
    pts += p * i.credits; h += i.credits;
  }
  const termGpa = h ? pts / h : null;
  const cgpa = h && base && base.hours + h > 0 ? (base.points + pts) / (base.hours + h) : null;
  return { termGpa, cgpa, hours: h, points: pts };
}