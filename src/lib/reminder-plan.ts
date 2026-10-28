import { localDate, validDate, validTime, type Slot } from './academic';
import type { Task } from './study-state';
import type { Focus } from './focus';
import { clock, kindOf, lead, say, type GenderPref } from './notify-text';

/** Every notification type has its own switch. On by default; `enabled` is the master switch. */
export type ReminderPrefs = {
  v: 2; enabled: boolean; gender: GenderPref;
  daily: boolean; classes: boolean; tasks: boolean; overdue: boolean; streak: boolean; summary: boolean;
  coursework: boolean; midterm: boolean; final: boolean; absence: boolean; warning: boolean; moodle: boolean;
};
export const defaultReminders: ReminderPrefs = {
  v: 2, enabled: true, gender: 'auto', daily: true, classes: true, tasks: true, overdue: true, streak: true, summary: true,
  coursework: true, midterm: true, final: true, absence: true, warning: true, moodle: true,
};
export const PREF_KEYS = ['daily', 'classes', 'tasks', 'overdue', 'streak', 'summary', 'coursework', 'midterm', 'final', 'absence', 'warning', 'moodle'] as const;
export type PrefKey = typeof PREF_KEYS[number];
/** Older versions saved reminders switched off by default, so they are upgraded to on (individual opt-outs kept). */
export function normalizePrefs(v: unknown): ReminderPrefs {
  const s = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const out: ReminderPrefs = { ...defaultReminders };
  for (const k of PREF_KEYS) if (s[k] === false) out[k] = false;
  if (s.v === 2 && s.enabled === false) out.enabled = false;
  if (s.gender === 'm' || s.gender === 'f') out.gender = s.gender;
  return out;
}
/** Whether a university/KMoodle change alert of this kind should be shown. */
export function alertAllowed(prefs: unknown, kind: string) {
  const s = normalizePrefs(prefs); if (!s.enabled) return false;
  return (PREF_KEYS as readonly string[]).includes(kind) ? s[kind as PrefKey] : true;
}
/** loud = task/focus alerts on the high-priority channel with the app's chime. */
export type PlannedReminder = { id: string; at: number; title: string; body: string; route: '/study' | '/timetable' | '/streak' | '/service/SEC_WARNINGS'; fingerprint: string; loud?: boolean };
/** Minutes before a task to remind; -1 = no reminder, 0 = only at start. Default 5. */
export const taskRemind = (t: Task) => (typeof t.remind === 'number' ? t.remind : 5);
export type PlanExtra = { female?: boolean; todayMin?: number; target?: number; streakOn?: boolean };
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const teacher = (s: string) => s.split(/[,،/|\n]+/).map(x => x.trim()).filter(Boolean)[0] ?? '';

export function reminderPlan(tasks: Task[], slots: Slot[], focus: Focus, prefs: ReminderPrefs, ar: boolean, now = Date.now(), extra: PlanExtra = {}): PlannedReminder[] {
  const p = normalizePrefs(prefs);
  if (!p.enabled) return [];
  const f = extra.female === true;
  const out: PlannedReminder[] = [];
  const add = (id: string, at: number, title: string, body: string, route: PlannedReminder['route'], loud = false) => {
    if (Number.isFinite(at) && at > now + 1000) out.push({ id: 'su13-' + id, at, title, body, route, loud, fingerprint: JSON.stringify([at, title, body, route, loud]) });
  };
  if (focus.endAt) add('focus', focus.endAt, ar ? '🎉 جلسة التركيز خلصت' : '🎉 Focus session complete', ar ? 'برافو! خد بريك صغير وارجع كمّل.' : 'Nice work! Take a short break.', '/study', true);

  for (const t of tasks) {
    if (t.done || !t.date || !t.time || !validDate(t.date) || !validTime(t.time)) continue;
    const d = new Date(`${t.date}T${t.time}:00`); if (d.getTime() > now + 14 * 86400000) continue;
    const name = t.title.trim() || (ar ? 'المذاكرة' : 'studying');
    const span = t.duration ? (ar ? ` · ${t.duration} دقيقة` : ` · ${t.duration} min`) : '';
    const before = taskRemind(t);
    if (p.tasks && before >= 0) add('task-' + t.id + '-pre', d.getTime() - before * 60000,
      before > 0 ? `⏰ ${say.ready(f, name, lead(before, ar), ar)}` : `⏰ ${say.now(f, name, ar)}`,
      ar ? `الساعة ${clock(t.time)}${span}` : `At ${clock(t.time, false)}${span}`, '/study', true);
    // Two hours after the planned time and still not ticked.
    if (p.overdue) add('task-' + t.id + '-late', d.getTime() + 2 * 3600000, `📚 ${name}`, say.overdue(f, ar), '/study');
  }

  for (let offset = 0; offset < 7; offset++) {
    const day = new Date(now); day.setDate(day.getDate() + offset);
    const list = slots.filter(s => s.day === day.getDay() && HHMM.test(s.start.trim())).sort((a, b) => a.start.localeCompare(b.start));
    if (p.daily && list.length) {
      const d = new Date(day); d.setHours(7, 0, 0, 0);
      const items = list.map(s => ar ? `${kindOf(s.type)} ${s.title || s.code} الساعة ${clock(s.start)}` : `${kindOf(s.type, false)} ${s.title || s.code} at ${clock(s.start, false)}`);
      add('day-' + localDate(d), d.getTime(), ar ? '☀️ يومك النهاردة' : '☀️ Your day',
        ar ? `عليك النهاردة ${items.join('، و')}` : `Today: ${items.join(', ')}`, '/timetable');
    }
    if (p.classes) list.forEach((s, i) => {
      const m = HHMM.exec(s.start.trim())!;
      const d = new Date(day); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
      const doc = teacher(s.teachers);
      const where = ar ? [s.room ? `في روم ${s.room}` : '', doc ? `ودكتور ${doc}` : ''].filter(Boolean).join(' ')
        : [s.room ? `Room ${s.room}` : '', doc].filter(Boolean).join(' · ');
      add('class-' + localDate(d) + '-' + i, d.getTime() - 600000,
        ar ? `📍 عليك ${kindOf(s.type)} ${s.title || s.code} كمان 10 دقايق` : `📍 ${kindOf(s.type, false)} ${s.title || s.code} in 10 minutes`,
        where || (ar ? 'افتح الجدول للتفاصيل.' : 'Open the timetable for details.'), '/timetable');
    });
  }

  // Study streak nudges and the end-of-day summary (today + the next two days, so they work without opening the app).
  const target = extra.target ?? 180;
  for (let offset = 0; offset < 3; offset++) {
    const day = new Date(now); day.setDate(day.getDate() + offset);
    const at = (h: number, m: number) => { const d = new Date(day); d.setHours(h, m, 0, 0); return d.getTime(); };
    const studied = offset === 0 ? Math.max(0, extra.todayMin ?? 0) : 0;
    const key = localDate(day);
    if (p.streak && extra.streakOn !== false && studied < target) {
      add('streak-' + key + '-1', at(21, 0), ar ? '🔥 الاستريك' : '🔥 Streak', say.streak1(f, ar), '/streak');
      add('streak-' + key + '-2', at(22, 0), ar ? '🔥 الاستريك' : '🔥 Streak', say.streak2(f, ar), '/streak');
    }
    if (p.streak && studied < 1) add('streak-' + key + '-3', at(23, 30), ar ? '🌙 خلاص' : '🌙 Day over', say.streak3(f, ar), '/streak');
    if (p.summary && studied >= 1) add('sum-' + key, at(23, 45), ar ? '📊 ملخص مذاكرة النهاردة' : '📊 Today’s study', say.summary(f, studied, ar), '/streak');
  }

  // Leave space below the iOS pending-notification limit; the focus alarm always stays.
  const focusItem = out.find(x => x.id === 'su13-focus');
  const rest = out.filter(x => x !== focusItem).sort((a, b) => a.at - b.at);
  return [...(focusItem ? [focusItem] : []), ...rest].slice(0, 60);
}