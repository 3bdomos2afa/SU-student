// Study streak: a day counts when the student studies the daily target.
// Studied time = focus-timer minutes actually run + free-study stopwatch + finished tasks (their planned duration
// minus any timer minutes already spent on that same task, so nothing is counted twice).
import { focusLeft, type Focus } from './focus';

export type TimerEntry = { d: string; m: number; task?: string; title?: string; free?: true };
/** A finished task, frozen when it was ticked (so deleting the task later doesn't erase studied days). */
export type DoneEntry = { d: string; m: number; title: string };
export type Streak = { target: number; timer: TimerEntry[]; done: Record<string, DoneEntry>; free: number | null; remind: boolean };
export const TARGETS = [60, 120, 180, 240, 300, 360] as const;
export const emptyStreak = (): Streak => ({ target: 180, timer: [], done: {}, free: null, remind: true });
export const DEFAULT_TASK_MIN = 25;
export const EVENING_HOUR = 21;

const pad = (n: number) => String(n).padStart(2, '0');
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const KEY = /^\d{4}-\d{2}-\d{2}$/;
const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon: safe across daylight-saving changes
};
export const addDays = (k: string, n: number) => {
  const d = parse(k);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
};
/** Egyptian week: Saturday → Friday. */
export const weekStart = (k: string) => addDays(k, -((parse(k).getDay() + 1) % 7));
const mins = (v: number) => Math.min(720, Math.round(v * 10) / 10);

export function normalizeStreak(v: unknown): Streak {
  const s = v && typeof v === 'object' ? (v as Partial<Streak>) : {};
  const out = emptyStreak();
  if (typeof s.target === 'number' && Number.isFinite(s.target)) out.target = Math.max(30, Math.min(720, Math.round(s.target)));
  if (Array.isArray(s.timer))
    out.timer = s.timer
      .filter((e) => e && typeof e.d === 'string' && KEY.test(e.d) && typeof e.m === 'number' && Number.isFinite(e.m) && e.m > 0)
      .slice(-800)
      .map((e) => ({
        d: e.d, m: mins(e.m),
        ...(typeof e.task === 'string' && e.task ? { task: e.task.slice(0, 100) } : {}),
        ...(typeof e.title === 'string' && e.title ? { title: e.title.slice(0, 120) } : {}),
        ...(e.free === true ? { free: true as const } : {}),
      }));
  if (s.done && typeof s.done === 'object' && !Array.isArray(s.done))
    out.done = Object.fromEntries(
      Object.entries(s.done)
        .filter(([k, e]) => k.length <= 100 && e && typeof e === 'object' && typeof e.d === 'string' && KEY.test(e.d) && typeof e.m === 'number' && Number.isFinite(e.m) && e.m > 0)
        .slice(-600)
        .map(([k, e]) => [k, { d: e.d, m: mins(e.m), title: typeof e.title === 'string' ? e.title.slice(0, 120) : '' }]),
    );
  if (typeof s.free === 'number' && Number.isFinite(s.free) && s.free > 0) out.free = s.free;
  if (s.remind === false) out.remind = false;
  return out;
}

/** Seconds a running focus session has actually counted down since it was (re)started. */
export function focusStudied(f: Focus | undefined, now = Date.now()) {
  if (!f || f.endAt === null) return 0;
  return Math.max(0, f.remaining - focusLeft(f, now));
}

export function addTimer(s: Streak, seconds: number, at: number, extra: Omit<TimerEntry, 'd' | 'm'> = {}): Streak {
  const m = mins(seconds / 60);
  if (!(m >= 1)) return s; // under a minute is noise
  return { ...s, timer: [...s.timer.slice(-799), { d: dayKey(at), m, ...extra }] };
}

/** Credits the running focus session when it is paused, reset, replaced or finished. */
export function creditFocus(s: Streak, prev: Focus | undefined, next: Focus | undefined, now = Date.now()): Streak {
  if (!prev || prev.endAt === null) return s;
  if (next && next.endAt === prev.endAt && next.remaining === prev.remaining) return s;
  const end = Math.min(now, prev.endAt);
  return addTimer(s, focusStudied(prev, end), end, { ...(prev.taskId ? { task: prev.taskId } : {}), ...(prev.title ? { title: prev.title } : {}) });
}

export const startFree = (s: Streak, now = Date.now()): Streak => (s.free !== null ? s : { ...s, free: now });
export function stopFree(s: Streak, now = Date.now()): Streak {
  if (s.free === null) return s;
  const secs = Math.min(12 * 3600, Math.max(0, (now - s.free) / 1000));
  return { ...addTimer(s, secs, now, { free: true }), free: null };
}

/** Ticking a task done stores its planned minutes for that day; unticking removes them. */
export function markTask(s: Streak, t: { id: string; title: string; duration?: number }, done: boolean, now = Date.now()): Streak {
  const next = { ...s.done };
  if (done) next[t.id] = { d: dayKey(now), m: mins(t.duration || DEFAULT_TASK_MIN), title: t.title.slice(0, 120) };
  else delete next[t.id];
  return { ...s, done: next };
}

/** What the screens show right now: the running timer and stopwatch are included live. */
export function liveStreak(s: Streak, focus: Focus | undefined, now = Date.now()) {
  return stopFree(creditFocus(s, focus, undefined, now), now);
}

export type DayItem = { kind: 'timer' | 'free' | 'task'; title: string; m: number };
export type Day = { total: number; items: DayItem[] };

export function dayTotals(s: Streak): Record<string, Day> {
  const out: Record<string, Day> = {};
  const day = (k: string) => (out[k] ??= { total: 0, items: [] });
  const timed: Record<string, number> = {};
  for (const e of s.timer) {
    const d = day(e.d);
    d.total += e.m;
    const kind = e.free ? 'free' : 'timer';
    const same = d.items.find((i) => i.kind === kind && i.title === (e.title ?? ''));
    if (same) same.m += e.m;
    else d.items.push({ kind, title: e.title ?? '', m: e.m });
    if (e.task) timed[e.task] = (timed[e.task] ?? 0) + e.m;
  }
  for (const [id, e] of Object.entries(s.done)) {
    const m = Math.max(0, e.m - (timed[id] ?? 0));
    if (m < 1) continue;
    const d = day(e.d);
    d.total += m;
    d.items.push({ kind: 'task', title: e.title, m });
  }
  for (const d of Object.values(out)) {
    d.total = Math.round(d.total * 10) / 10;
    for (const i of d.items) i.m = Math.round(i.m * 10) / 10;
  }
  return out;
}

export type DotState = 'met' | 'rest' | 'today' | 'missed' | 'future';
export type StreakView = { current: number; best: number; today: number; pct: number; met: boolean; week: { key: string; state: DotState }[]; restLeft: boolean };

/**
 * Walks every day from the first studied day to today. A day that misses the target is forgiven once per
 * Saturday→Friday week (rest day) if a streak is running; otherwise the streak resets. Today never breaks it.
 */
export function streakView(totals: Record<string, Day>, target: number, today = dayKey()): StreakView {
  const val = (k: string) => totals[k]?.total ?? 0;
  const first = Object.keys(totals).filter((k) => val(k) > 0).sort()[0];
  const rests = new Set<string>(); const usedWeek = new Set<string>();
  let run = 0, best = 0;
  if (first && first <= today)
    for (let k = first; k <= today; k = addDays(k, 1)) {
      if (val(k) >= target) { run++; best = Math.max(best, run); continue; }
      if (k === today) continue;
      const w = weekStart(k);
      if (run > 0 && !usedWeek.has(w)) { usedWeek.add(w); rests.add(k); continue; }
      run = 0;
    }
  const ws = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(ws, i);
    const state: DotState = key > today ? 'future' : val(key) >= target ? 'met' : rests.has(key) ? 'rest' : key === today ? 'today' : 'missed';
    return { key, state };
  });
  const t = val(today);
  return { current: run, best, today: t, pct: Math.min(1, t / target), met: t >= target, week, restLeft: !usedWeek.has(ws) };
}

export function computeStreak(s: Streak, focus: Focus | undefined, now = Date.now()) {
  const totals = dayTotals(liveStreak(s, focus, now));
  const today = dayKey(now);
  return { ...streakView(totals, s.target, today), items: totals[today]?.items ?? [] };
}

/** "2:15" */
export const hm = (min: number) => `${Math.floor(min / 60)}:${pad(Math.floor(min % 60))}`;

/** One evening nudge at 9 PM when today's target isn't reached yet (tomorrow's if today is done or it's past 9). */
export function eveningReminder(s: Streak, met: boolean, current: number, ar = true, now = Date.now()) {
  if (!s.remind) return null;
  const at = new Date(now); at.setHours(EVENING_HOUR, 0, 0, 0);
  if (met || at.getTime() <= now + 60000) at.setDate(at.getDate() + 1);
  const body = ar
    ? current > 0 ? `متضيّعش ستريك الـ${current} يوم 🔥 لسه فاضلك وقت تكمّل هدفك` : `هدفك النهارده ${hm(s.target)} ساعة — يلا ابدأ بربع ساعة بس`
    : current > 0 ? `Don’t lose your ${current}-day streak 🔥 there’s still time` : `Today’s goal is ${hm(s.target)} h — start with 15 minutes`;
  return { id: `streak-${dayKey(at.getTime())}`, at: at.getTime(), title: ar ? '🔥 الستريك مستنيك' : '🔥 Your streak is waiting', body, route: '/streak' as const };
}