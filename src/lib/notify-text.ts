// Notification wording: Egyptian Arabic, masculine or feminine (from the student's university record),
// with plain English fallbacks. Pure functions so they are unit-tested.
import { text, type Cache } from './academic';

export type Gender = 'm' | 'f';
export type GenderPref = 'auto' | 'm' | 'f';

/** Reads GenderName / Gender / Sex from the student's profile or personal data. */
export function detectGender(cache: Cache): Gender | null {
  let found: Gender | null = null;
  const walk = (v: unknown, depth: number) => {
    if (found || depth > 5 || !v) return;
    if (Array.isArray(v)) { v.forEach(x => walk(x, depth + 1)); return; }
    if (typeof v !== 'object') return;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (found) return;
      if (/gender|^sex|النوع|الجنس/i.test(k) && (typeof x === 'string' || typeof x === 'number')) {
        const s = text(x).trim().toLowerCase();
        if (/female|أنث|انث|^f$|^بنت/.test(s)) found = 'f';
        else if (/male|ذكر|^m$|^ولد/.test(s)) found = 'm';
      } else if (x && typeof x === 'object') walk(x, depth + 1);
    }
  };
  walk(cache.SEC_PROFILE?.data, 0); if (!found) walk(cache.SEC_PERSONAL?.data, 0);
  return found;
}
export const isFemale = (pref: GenderPref | undefined, cache: Cache) => pref === 'f' || ((pref ?? 'auto') === 'auto' && detectGender(cache) === 'f');

const pad = (n: number) => String(n).padStart(2, '0');
/** "09:30" → "9:30 ص", "13:05" → "1:05 م". */
export function clock(hhmm: string, ar = true) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim()); if (!m) return hhmm;
  const h = Number(m[1]), h12 = h % 12 || 12;
  return ar ? `${h12}:${m[2]} ${h < 12 ? 'ص' : 'م'}` : `${h12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}
const minutesAr = (m: number) => (m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتين' : m <= 10 ? `${m} دقايق` : `${m} دقيقة`);
const hoursAr = (h: number) => (h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : h <= 10 ? `${h} ساعات` : `${h} ساعة`);
/** 135 → "ساعتين و15 دقيقة". */
export function duration(min: number, ar = true) {
  const t = Math.max(0, Math.floor(min)), h = Math.floor(t / 60), m = t % 60;
  if (!ar) return h ? `${h}h ${pad(m)}m` : `${m} min`;
  if (!h) return minutesAr(m);
  return m ? `${hoursAr(h)} و${minutesAr(m)}` : hoursAr(h);
}
/** Lead time chosen for a task: 5 → "5 دقايق", 60 → "ساعة". */
export const lead = (min: number, ar = true) => duration(min, ar);

export const kindAr = (type: string) => (type === 'section' ? 'سكشن' : type === 'lecture' ? 'محاضرة' : 'ميعاد');
const kindEn = (type: string) => (type === 'section' ? 'section' : type === 'lecture' ? 'lecture' : 'session');
export const kindOf = (type: string, ar = true) => (ar ? kindAr(type) : kindEn(type));

/** g(female, masculine, feminine) */
const g = (f: boolean, m: string, fm: string) => (f ? fm : m);

export const say = {
  ready: (f: boolean, task: string, when: string, ar = true) => ar ? `${g(f, 'جاهز', 'جاهزة')} لـ ${task} بعد ${when}؟` : `Ready for ${task} in ${when}?`,
  now: (f: boolean, task: string, ar = true) => ar ? `يلا، وقت ${task} دلوقتي` : `${task} starts now`,
  overdue: (f: boolean, ar = true) => ar ? g(f, 'متراكمش المذاكرة عشان هتندم', 'متراكميش المذاكرة عشان هتندمي') : 'Don’t let studying pile up.',
  streak1: (f: boolean, ar = true) => ar ? g(f, 'الاستريك هيضيع، روح ذاكر 🔥', 'الاستريك هيضيع، روحي ذاكري 🔥') : 'Your streak is slipping — go study 🔥',
  streak2: (f: boolean, ar = true) => ar ? g(f, 'يابني روح ذاكر، هتندم والله', 'يابنتي روحي ذاكري، هتندمي والله') : 'Go study now, you’ll regret it otherwise.',
  streak3: (f: boolean, ar = true) => ar ? g(f, 'نام نام، ضيعت اليوم ومذاكرتش حاجة 😴', 'نامي نامي، ضيعتي اليوم ومذاكرتيش حاجة 😴') : 'Go to sleep — no studying today 😴',
  summary(f: boolean, min: number, ar = true) {
    const d = duration(min, ar);
    if (!ar) return min < 60 ? `You studied under an hour today (${d}). Try for more.` : `You studied ${d} today.`;
    if (min < 60) return g(f, `ذاكرت النهاردة أقل من ساعة (${d})، حاول تذاكر أكتر`, `ذاكرتي النهاردة أقل من ساعة (${d})، حاولي تذاكري أكتر`);
    if (min < 180) return g(f, `ذاكرت النهاردة ${d}، أحسن من مفيش`, `ذاكرتي النهاردة ${d}، أحسن من مفيش`);
    if (min < 240) return g(f, `عاش! ذاكرت النهاردة ${d} 💪`, `عاش! ذاكرتي النهاردة ${d} 💪`);
    return g(f, `عاش، تقدير إن شاء الله! ذاكرت النهاردة ${d} 🏆`, `عاش، تقدير إن شاء الله! ذاكرتي النهاردة ${d} 🏆`);
  },
  absence: (f: boolean, kind: string, course: string, pct: string, ar = true) => ar
    ? `${g(f, 'انت غبت', 'انتي غبتي')} ${kind ? kind + ' ' : 'في '}${course} ونسبة الغياب وصلت ${pct}%`
    : `You missed a ${kind || 'class'} in ${course}. Absence is now ${pct}%`,
  warning: (level: 1 | 2 | null, course: string, ar = true) => ar
    ? `جالك إنذار ${level === 1 ? 'أول (10%) ' : level === 2 ? 'تاني (20%) ' : ''}في مادة ${course}`
    : `Warning${level ? ` #${level} (${level * 10}%)` : ''} in ${course}`,
  coursework: (course: string, ar = true) => ar ? `درجة الكورس ورك نزلت مادة ${course}` : `Coursework mark posted: ${course}`,
  quiz: (course: string, ar = true) => ar ? `درجة كويز نزلت مادة ${course}` : `Quiz mark posted: ${course}`,
  midterm: (course: string, ar = true) => ar ? `استر يا ستااار 🙏 درجات الميد ظهرت: ${course}` : `Midterm marks are out: ${course}`,
  final: (course: string, ar = true) => ar ? `استر يا ستااار 🙏 درجات الفاينل ظهرت: ${course}` : `Final results are out: ${course}`,
  moodleFile: (doctor: string, file: string, course: string, ar = true) => ar
    ? `${doctor ? `الدكتور ${doctor}` : 'الدكتور'} رفع المحاضرة ${file} – ${course}` : `${doctor || 'Your doctor'} uploaded ${file} – ${course}`,
  moodleAssign: (doctor: string, name: string, course: string, ar = true) => ar
    ? `${doctor ? `الدكتور ${doctor}` : 'الدكتور'} رفع اسايمنت ${name} في مادة ${course}` : `${doctor || 'Your doctor'} posted assignment ${name} in ${course}`,
};
export const isAssignment = (name: string) => /اسايمنت|أسايمنت|assignment|assign\b|تكليف/i.test(name);