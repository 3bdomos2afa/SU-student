import { curriculumCourses, type CurriculumCourse } from './curriculum';

/** Program total stated by the student; the listed courses add up to 143. */
export const PROGRAM_TOTAL_CREDITS = 144;
export const LISTED_CREDITS = curriculumCourses.reduce((s, c) => s + c.credits, 0);

/** "INT 349W", "int-349w", "INT349W" → "INT349W" */
export const codeKey = (v: unknown) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const byKey = new Map(curriculumCourses.map((c) => [codeKey(c.code), c] as const));
export const courseByCode = {
  get: (code: string) => byKey.get(codeKey(code)),
  has: (code: string) => byKey.has(codeKey(code)),
  values: () => byKey.values(),
  get size() { return byKey.size; },
};

/** "Passing 95 credit hours" → 95 */
export function creditCondition(prerequisite: string): number | null {
  const m = /(\d+)\s*credit/i.exec(prerequisite);
  return m ? Number(m[1]) : null;
}

export function unlocksOf(code: string) {
  return curriculumCourses.filter((c) => c.prerequisites.includes(code));
}

export function earnedCredits(completed: Set<string>) {
  return curriculumCourses.reduce((s, c) => (completed.has(c.code) ? s + c.credits : s), 0);
}

export type CourseStatus = 'completed' | 'available' | 'locked';

export function courseStatus(course: CurriculumCourse, completed: Set<string>, earned: number) {
  if (completed.has(course.code)) return { status: 'completed' as CourseStatus, missing: [] as string[] };
  const missing = course.prerequisites.filter((p) => {
    const hours = creditCondition(p);
    return hours !== null ? earned < hours : !completed.has(p);
  });
  return { status: (missing.length ? 'locked' : 'available') as CourseStatus, missing };
}

/** Official Sinai University scale (effective Fall 2018). min = lowest percentage for the grade. */
export const GRADE_SCALE: { grade: string; points: number; min: number }[] = [
  { grade: 'A+', points: 4.0, min: 95 },
  { grade: 'A', points: 3.8, min: 90 },
  { grade: 'A-', points: 3.6, min: 85 },
  { grade: 'B+', points: 3.3, min: 80 },
  { grade: 'B', points: 3.0, min: 75 },
  { grade: 'C+', points: 2.7, min: 70 },
  { grade: 'C', points: 2.4, min: 65 },
  { grade: 'D', points: 2.0, min: 60 },
  { grade: 'F', points: 0, min: 0 },
];
export const gradeForPercent = (p: number) => GRADE_SCALE.find((g) => p >= g.min)?.grade ?? 'F';

export const LOAD_REFERENCES = [12, 18, 21] as const;