// N12: a doctor uploaded a new lecture file or assignment on KMoodle. The first load is a silent baseline.
import { loadMoodle, MoodleError, type MCourse, type MoodleData } from './moodle';
import { loadPrivate, savePrivate, removePrivate } from './vault';
import { deliverAlerts } from './alert-delivery';
import { currentCourses } from './student';
import { academic, type Cache } from './academic';
import { teachersFor } from './moodle-match';
import { isAssignment, say } from './notify-text';

export type MoodleAlert = { id: string; kind: 'moodle'; title: string; body: string; route: string };
const doctorOf = (c: MCourse) => (c.teachers?.[0] ?? c.ref?.teachers?.[0] ?? '').replace(/^(د\s*\.?|dr\s*\.?|doctor)\s*/i, '').trim();

export function moodleAlerts(prev: MoodleData | null | undefined, next: MoodleData, isAr: boolean): MoodleAlert[] {
  if (!prev || !Array.isArray(prev.courses) || prev.user !== next.user) return [];
  const seen = new Set(prev.courses.flatMap(c => (c.items ?? []).map(i => i.key)));
  const had = new Map(prev.courses.map(c => [c.code, (c.items ?? []).length]));
  const out: MoodleAlert[] = [];
  for (const c of next.courses) {
    // A course that had no content before (not matched / not enrolled yet) is a baseline, not a flood.
    if (!had.get(c.code)) continue;
    const course = c.title || c.code, doc = doctorOf(c);
    for (const i of c.items ?? []) {
      if (seen.has(i.key) || (i.kind !== 'file' && i.kind !== 'assign')) continue;
      const assign = i.kind === 'assign' || isAssignment(i.name);
      out.push({ id: `moodle:${i.key}`, kind: 'moodle', route: '/moodle',
        title: assign ? say.moodleAssign(doc, i.name, course, isAr) : say.moodleFile(doc, i.name, course, isAr),
        body: i.section || (isAr ? 'افتح KMoodle من التطبيق' : 'Open KMoodle in the app') });
    }
  }
  return out;
}
/** Courses the student is registered in, with their doctors (same list the KMoodle screen uses). */
export const moodleCurrent = (cache: Cache) => {
  const slots = academic(cache).slots;
  return currentCourses(cache).map(c => ({ code: c.code, title: c.title, teachers: teachersFor(slots, c.code, c.row?.InstructorName) }));
};
/** Background/foreground check: reload KMoodle with the saved token, store it and notify new files. */
export async function moodleCheck(owner: string, cache: Cache, isAr: boolean) {
  const K = { token: `su:v2:moodle:${owner}`, data: `su:v2:moodle-data:${owner}` };
  const token = await loadPrivate<string | null>(K.token, null);
  if (!token) return 0;
  const prev = await loadPrivate<MoodleData | null>(K.data, null);
  try {
    const next = await loadMoodle(token, moodleCurrent(cache));
    await savePrivate(K.data, next);
    return await deliverAlerts(owner, moodleAlerts(prev, next, isAr), isAr);
  } catch (e) {
    // An expired KMoodle token is renewed silently next time the KMoodle screen opens (remembered Google account).
    if (e instanceof MoodleError && e.code === 'expired') await removePrivate(K.token);
    return 0;
  }
}
