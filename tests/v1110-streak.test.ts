import test from 'node:test';
import assert from 'node:assert/strict';
import { freshFocus, pauseFocus, startFocus } from '../src/lib/focus';
import { normalizeStudy } from '../src/lib/study-state';
import {
  addDays, computeStreak, creditFocus, dayKey, dayTotals, emptyStreak, eveningReminder, hm, markTask, normalizeStreak,
  startFree, stopFree, streakView, weekStart, type Day,
} from '../src/lib/streak';

const at = (d: number, h = 10, m = 0) => new Date(2026, 9, d, h, m).getTime();

test('days and Saturday→Friday weeks', () => {
  assert.equal(dayKey(at(27)), '2026-10-27');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(weekStart('2026-10-27'), '2026-10-24');
  assert.equal(weekStart('2026-10-24'), '2026-10-24');
  assert.equal(weekStart('2026-10-30'), '2026-10-24');
  assert.equal(hm(135), '2:15'); assert.equal(hm(0), '0:00');
});

test('focus timer counts only minutes actually studied, with the task id', () => {
  const run = startFocus(freshFocus(25, 'DB sheet', 't1'), at(27));
  const paused = pauseFocus(run, at(27, 10, 10));
  const s = creditFocus(emptyStreak(), run, paused, at(27, 10, 10));
  assert.equal(s.timer.length, 1);
  assert.deepEqual(s.timer[0], { d: '2026-10-27', m: 10, task: 't1', title: 'DB sheet' });
  // a session left running past its end only counts its length
  const late = creditFocus(emptyStreak(), run, freshFocus(25), at(27, 13));
  assert.equal(late.timer[0].m, 25);
  // under a minute is ignored, and an unchanged session is not credited
  assert.equal(creditFocus(emptyStreak(), run, pauseFocus(run, at(27) + 30000), at(27) + 30000).timer.length, 0);
  assert.equal(creditFocus(emptyStreak(), run, run, at(27, 10, 20)).timer.length, 0);
});

test('a timed task ticked done is not counted twice; unticking removes it', () => {
  let s = creditFocus(emptyStreak(), startFocus(freshFocus(50, 'DB', 't1'), at(27)), freshFocus(50), at(27, 10, 20));
  s = markTask(s, { id: 't1', title: 'DB', duration: 50 }, true, at(27, 11));
  s = markTask(s, { id: 't2', title: 'Networks', duration: 30 }, true, at(27, 12));
  const d = dayTotals(s)['2026-10-27'];
  assert.equal(d.total, 80); // 20 timer + 30 rest of t1 + 30 t2
  assert.deepEqual(d.items.map(i => [i.kind, i.m]), [['timer', 20], ['task', 30], ['task', 30]]);
  s = markTask(s, { id: 't2', title: 'Networks' }, false);
  assert.equal(dayTotals(s)['2026-10-27'].total, 50);
  // a task with no duration counts 25 minutes
  assert.equal(dayTotals(markTask(emptyStreak(), { id: 'x', title: 'x' }, true, at(27)))['2026-10-27'].total, 25);
});

test('free-study stopwatch', () => {
  let s = startFree(emptyStreak(), at(27, 9));
  assert.equal(startFree(s, at(27, 9, 5)).free, s.free); // already running
  s = stopFree(s, at(27, 9, 30));
  assert.equal(s.free, null);
  assert.deepEqual(s.timer, [{ d: '2026-10-27', m: 30, free: true }]);
  // capped at 12 hours if forgotten
  assert.equal(stopFree(startFree(emptyStreak(), at(1)), at(5)).timer[0].m, 720);
});

test('streak: one rest day per week, best streak, today never breaks it', () => {
  const d = (n: number): Day => ({ total: n, items: [] });
  const totals: Record<string, Day> = {
    '2026-10-19': d(60), '2026-10-21': d(60), '2026-10-22': d(90), // 20th = rest day
    '2026-10-24': d(60), '2026-10-25': d(70), // 23rd missed after the week's rest → reset; 26th = new week's rest
    '2026-10-27': d(20),
  };
  const v = streakView(totals, 60, '2026-10-27');
  assert.equal(v.current, 2); assert.equal(v.best, 3);
  assert.equal(v.met, false); assert.equal(v.today, 20); assert.ok(Math.abs(v.pct - 1 / 3) < 1e-9);
  assert.deepEqual(v.week.map(w => w.state), ['met', 'met', 'rest', 'today', 'future', 'future', 'future']);
  assert.equal(v.restLeft, false);
  const done = streakView({ ...totals, '2026-10-27': d(60) }, 60, '2026-10-27');
  assert.equal(done.current, 3); assert.equal(done.week[3].state, 'met');
  assert.deepEqual(streakView({}, 60, '2026-10-27'), { current: 0, best: 0, today: 0, pct: 0, met: false, week: streakView({}, 60, '2026-10-27').week, restLeft: true });
});

test('live view includes the running timer and stopwatch', () => {
  const s = { ...startFree(emptyStreak(), at(27, 9)), target: 60 };
  const v = computeStreak(s, startFocus(freshFocus(25, 'X'), at(27, 9)), at(27, 9, 30));
  assert.equal(v.today, 55); assert.equal(v.items.length, 2);
});

test('normalize keeps valid data and drops junk, also inside study state', () => {
  const s = normalizeStreak({ target: 9999, timer: [{ d: '2026-10-27', m: 15, task: 't' }, { d: 'bad', m: 5 }, { d: '2026-10-27', m: -1 }],
    done: { a: { d: '2026-10-27', m: 40, title: 'A' }, b: '2026-10-27' }, free: 'x', remind: false });
  assert.equal(s.target, 720); assert.equal(s.timer.length, 1); assert.deepEqual(Object.keys(s.done), ['a']);
  assert.equal(s.free, null); assert.equal(s.remind, false);
  assert.deepEqual(normalizeStreak(null), emptyStreak());
  assert.equal(normalizeStudy({ streak: { target: 120 } }).streak?.target, 120);
  assert.equal(normalizeStudy({}).streak, undefined);
});

test('evening reminder at 9 PM, skipped to tomorrow when today is done', () => {
  const s = emptyStreak();
  const r = eveningReminder(s, false, 4, true, at(27, 10))!;
  assert.equal(r.at, at(27, 21)); assert.equal(r.route, '/streak'); assert.match(r.body, /4 يوم/);
  assert.equal(eveningReminder(s, true, 4, true, at(27, 10))!.at, at(28, 21));
  assert.equal(eveningReminder(s, false, 0, false, at(27, 22))!.at, at(28, 21));
  assert.equal(eveningReminder({ ...s, remind: false }, false, 1, true, at(27, 10)), null);
});