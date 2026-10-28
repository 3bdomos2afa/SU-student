// What each sync asks the university for, and how stale per-course marks are dropped after a term change.
import type { Cache } from './academic';
import { gradeActions } from './change-alerts';
import { SYNC_ORDER } from './portal';

// Background runs are short and rationed by the OS: fetch what changes (courses, marks, absence, warnings,
// results) every time, and the heavy full-history walk at most every 6 hours.
const LIGHT = ['SEC_CURRENT', 'SEC_SCHEDULE', 'SEC_TIMETABLE', 'SEC_TRANSCRIPT', 'SEC_SUMMARY', 'SEC_ATTENDANCE', 'SEC_WARNINGS'];
export function backgroundOrder(prev: Cache, now = Date.now()) {
  const list = SYNC_ORDER.filter(k => LIGHT.includes(k));
  const old = Date.parse(prev.SEC_HISTORY?.at ?? '');
  if (!Number.isFinite(old) || now - old > 6 * 3600000) list.push('SEC_HISTORY');
  return list;
}

/** Automatic foreground syncs (app open, back online, every 10 min): profile + what changes; heavy walkers every 6 h. */
export function autoOrder(prev: Cache, now = Date.now()) {
  const list = ['SEC_PROFILE', ...backgroundOrder(prev, now)];
  const old = Date.parse(prev.SEC_ABSENCE?.at ?? '');
  if ('SEC_ABSENCE' in Object.fromEntries(SYNC_ORDER.map(k => [k, 1])) && (!Number.isFinite(old) || now - old > 6 * 3600000)) list.push('SEC_ABSENCE');
  return [...new Set(list)].filter(k => SYNC_ORDER.includes(k));
}

/** Removes marks of courses the student is no longer registered in (e.g. after moving to a new term). */
export function pruneGrades(cache: Cache): Cache {
  const keep = new Set(gradeActions(cache));
  if (!keep.size) return cache;
  const stale = Object.keys(cache).filter(k => k.startsWith('GRADES:') && !keep.has(k));
  if (!stale.length) return cache;
  const out = { ...cache };
  for (const k of stale) delete out[k];
  return out;
}