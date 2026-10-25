// Pure change detection between two synced caches: new absence, warnings and grades.
// The first time a service is seen it is a silent baseline, so a fresh login never floods notifications.
import { curriculumCourses } from '../data/curriculum';
import { canonical, courseRows, number, rowsDeep, text, type Cache, type Row } from './academic';
import { marks } from './marks';

export type AlertKind = 'absence' | 'warning' | 'midterm' | 'coursework' | 'final' | 'courses';
export type ChangeAlert = { id: string; kind: AlertKind; title: string; body: string; route: string };

const titles = new Map(curriculumCourses.map(c => [canonical(c.code), c.title]));
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayLabel(d: Date, isAr: boolean) {
  return isAr ? `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`
    : `${EN_DAYS[d.getDay()]}, ${d.getDate()} ${EN_MONTHS[d.getMonth()]}`;
}
/** Uses a date the university sent with the record; otherwise the day the app noticed it. */
function rowDate(r: Row): Date | null {
  for (const [k, v] of Object.entries(r)) {
    if (!/date/i.test(k) || (typeof v !== 'string' && typeof v !== 'number')) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 2000) return d;
  }
  return null;
}
function hash(s: string) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
const fmt = (n: number) => String(Math.round(n * 10) / 10);
const pct = (r: Row) => number(r.AbcensePercentage ?? r.AbsencePercentage ?? r.AbsencePercent);
const stable = (r: Row) => JSON.stringify(Object.keys(r).sort().map(k => [k, r[k] && typeof r[k] === 'object' ? null : r[k]]));

function details(r: Row) {
  const out: string[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (/^course(code|name|namear|nameen)$/i.test(k) || /id$/i.test(k) || (v && typeof v === 'object')) continue;
    if (!/warn|name|reason|type|level|desc|note|text|title|status|percent/i.test(k)) continue;
    const s = text(v).trim(); if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 3).join(' · ');
}
export function assessmentKind(label: string): 'midterm' | 'coursework' | 'final' {
  if (/mid|ميد|منتصف|نصف/i.test(label)) return 'midterm';
  if (/final|فاينل|نهائ/i.test(label)) return 'final';
  return 'coursework';
}
/** Grade services to sync: only the courses on the student's own schedule. */
export function gradeActions(cache: Cache, max = 14) {
  const seen = new Map<string, string>();
  for (const r of [...courseRows(cache, 'SEC_CURRENT'), ...courseRows(cache, 'SEC_SCHEDULE')]) { const c = canonical(r.CourseCode); if (c && !seen.has(c)) seen.set(c, text(r.CourseCode).trim()); }
  return [...seen.values()].slice(0, max).map(code => `GRADES:${code}`);
}

export function diffAlerts(prev: Cache, next: Cache, isAr: boolean, now = new Date()): ChangeAlert[] {
  const out: ChangeAlert[] = [];
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const when = (r?: Row) => `${tr('اليوم', 'Day')}: ${dayLabel((r && rowDate(r)) || now, isAr)}`;
  const schedule = courseRows(next, 'SEC_SCHEDULE');
  const named = (code: string, rows: Row[]) => {
    const c = canonical(code);
    for (const r of [...rows, ...schedule.filter(s => canonical(s.CourseCode) === c)]) {
      const n = (isAr ? text(r.CourseName) || text(r.CourseNameAR) || text(r.CourseNameEN) : text(r.CourseNameEN) || text(r.CourseName)).trim();
      if (n) return `${n} (${code})`;
    }
    const t = titles.get(c); return t ? `${t} (${code})` : code;
  };

  if (prev.SEC_ATTENDANCE && next.SEC_ATTENDANCE) {
    const old = new Map<string, number>();
    for (const r of courseRows(prev, 'SEC_ATTENDANCE')) { const p = pct(r), c = canonical(r.CourseCode); if (p !== null && !old.has(c)) old.set(c, p); }
    const done = new Set<string>();
    for (const r of courseRows(next, 'SEC_ATTENDANCE')) {
      const c = canonical(r.CourseCode); if (done.has(c)) continue; done.add(c);
      const p = pct(r); if (p === null) continue;
      const before = old.get(c) ?? 0; if (p <= before + 0.01) continue;
      out.push({ id: `abs:${c}:${fmt(p)}`, kind: 'absence', route: '/service/SEC_ATTENDANCE',
        title: tr(`غياب جديد في ${named(text(r.CourseCode), [r])}`, `New absence: ${named(text(r.CourseCode), [r])}`),
        body: [tr(`نسبة غيابك بقت ${fmt(p)}%`, `Absence is now ${fmt(p)}%`) + (before > 0 ? tr(` (كانت ${fmt(before)}%)`, ` (was ${fmt(before)}%)`) : ''), when(r)].join('\n') });
    }
  }

  if (prev.SEC_WARNINGS && next.SEC_WARNINGS) {
    const old = new Set(courseRows(prev, 'SEC_WARNINGS').map(stable));
    for (const r of courseRows(next, 'SEC_WARNINGS')) {
      const f = stable(r); if (old.has(f)) continue; old.add(f);
      out.push({ id: `warn:${hash(f)}`, kind: 'warning', route: '/service/SEC_WARNINGS',
        title: tr(`إنذار جديد: ${named(text(r.CourseCode), [r])}`, `New warning: ${named(text(r.CourseCode), [r])}`),
        body: [details(r), when(r)].filter(Boolean).join('\n') });
    }
  }

  if (prev.SEC_TRANSCRIPT && next.SEC_TRANSCRIPT) {
    const key = (r: Row) => `${canonical(r.CourseCode)}|${text(r.GradeName).trim().toUpperCase()}`;
    const old = new Set(courseRows(prev, 'SEC_TRANSCRIPT').map(key));
    for (const r of courseRows(next, 'SEC_TRANSCRIPT')) {
      const g = text(r.GradeName).trim(); if (!g) continue;
      const k = key(r); if (old.has(k)) continue; old.add(k);
      out.push({ id: `final:${hash(k)}`, kind: 'final', route: '/grades?mode=final',
        title: tr(`نتيجة الفاينل نزلت: ${named(text(r.CourseCode), [r])}`, `Final result: ${named(text(r.CourseCode), [r])}`),
        body: [tr(`تقديرك: ${g}`, `Grade: ${g}`), when(r)].join('\n') });
    }
  }

  // New registered courses (a new term or an added course).
  if (prev.SEC_CURRENT && next.SEC_CURRENT) {
    const codes = (c: Cache) => new Set(courseRows(c, 'SEC_CURRENT').map(r => canonical(r.CourseCode)).filter(Boolean));
    const before = codes(prev), after = codes(next);
    const added = [...after].filter(c => !before.has(c));
    if (before.size && added.length) {
      const rows = courseRows(next, 'SEC_CURRENT');
      const names = added.map(c => { const r = rows.find(x => canonical(x.CourseCode) === c); return named(text(r?.CourseCode) || c, r ? [r] : []); });
      const term = [...before].every(c => !after.has(c));
      out.push({ id: `courses:${hash([...after].sort().join(','))}`, kind: 'courses', route: '/grades',
        title: term ? tr('ترم جديد: موادك اتحدثت', 'New term: your courses are updated') : tr('مادة جديدة اتسجلت', 'New course registered'),
        body: [names.slice(0, 4).join('\n') + (names.length > 4 ? tr(` و${names.length - 4} كمان`, ` +${names.length - 4} more`) : ''), when()].join('\n') });
    }
  }

  for (const key of Object.keys(next)) {
    if (!key.startsWith('GRADES:') || !prev[key]) continue;
    const code = key.slice(7);
    const old = new Map(marks(prev[key]?.data).map(m => [m.key, m.value]));
    for (const m of marks(next[key]?.data)) {
      if (!m.value || old.get(m.key) === m.value) continue;
      const what = m.part === 'quiz' ? tr('درجة كويز', 'Quiz mark')
        : { midterm: tr('درجة الميد', 'Midterm mark'), coursework: tr('درجة كورس ورك', 'Coursework mark'), final: tr('درجة الفاينل', 'Final mark') }[m.kind];
      out.push({ id: `grade:${canonical(code)}:${hash(m.part === 'quiz' ? m.key : m.label)}:${m.value}`, kind: m.kind, route: m.kind === 'final' ? '/grades?mode=final' : '/grades',
        title: tr(`${what} نزلت: ${named(code, [])}`, `${what} posted: ${named(code, [])}`),
        body: [`${m.label}: ${m.value}${m.max ? tr(` من ${m.max}`, ` / ${m.max}`) : ''}`, when()].join('\n') });
    }
  }
  return out;
}