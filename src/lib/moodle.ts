// kmoodle.su.edu.eg (Moodle "Sinai University Kantara LMS") through the official Moodle mobile web service.
import { pickCopies, type Current } from './moodle-match';
export const MOODLE = 'https://kmoodle.su.edu.eg';
export const launchUrl = (passport: string) =>
  `${MOODLE}/admin/tool/mobile/launch.php?service=moodle_mobile_app&passport=${encodeURIComponent(passport)}&urlscheme=moodlemobile`;

/** moodlemobile://token=BASE64(md5(site+passport):::token[:::privatetoken]) */
export function parseLaunch(url: string): { signature: string; token: string } | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/token=([A-Za-z0-9+/=_-]+)/i.exec(url.trim());
  if (!m) return null;
  let raw = '';
  try { raw = atob(m[1].replace(/-/g, '+').replace(/_/g, '/')); } catch { return null; }
  const [signature, token] = raw.split(':::');
  if (!/^[a-f0-9]{32}$/i.test(signature ?? '') || !/^[a-zA-Z0-9]{16,64}$/.test(token ?? '')) return null;
  return { signature: signature.toLowerCase(), token };
}

export function encodeArgs(v: unknown, prefix = '', out: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x, i) => encodeArgs(x, `${prefix}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) encodeArgs(x, prefix ? `${prefix}[${k}]` : k, out);
  else if (v !== undefined && v !== null) out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(typeof v === 'boolean' ? (v ? '1' : '0') : String(v))}`);
  return out;
}
export class MoodleError extends Error { constructor(public code: string, message: string) { super(message || code); } }
type Any = Record<string, any>;
export async function ws<T>(token: string, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${MOODLE}/webservice/rest/server.php?moodlewsrestformat=json&wsfunction=${fn}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: [`wstoken=${encodeURIComponent(token)}`, ...encodeArgs(args)].join('&'),
    });
  } catch { throw new MoodleError('network', 'network'); }
  if (!r.ok) throw new MoodleError('network', `HTTP ${r.status}`);
  const j = await r.json().catch(() => null);
  if (j && typeof j === 'object' && !Array.isArray(j) && (j.exception || j.errorcode))
    throw new MoodleError(j.errorcode === 'invalidtoken' ? 'expired' : String(j.errorcode ?? 'error'), String(j.message ?? ''));
  return j as T;
}

export const codeKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const codesIn = (s: string) => [...(s || '').toUpperCase().matchAll(/([A-Z]{2,5})\s*[-_.]?\s*(\d{3,4})/g)].map(m => m[1] + m[2]);
export type MCourseRef = { id: number; fullname: string; shortname: string; idnumber: string; startdate: number; enrolled: boolean; teachers: string[] };
/** The newest Moodle copy of a course (old summer/previous-term copies often exist). */
export function bestMatch(code: string, list: MCourseRef[]): MCourseRef | null {
  const k = codeKey(code);
  const hits = list.filter(c => [c.shortname, c.fullname, c.idnumber].some(s => codesIn(s).includes(k)));
  hits.sort((a, b) => b.startdate - a.startdate || b.id - a.id || Number(b.enrolled) - Number(a.enrolled));
  return hits[0] ?? null;
}

export type MFile = { name: string; url: string; time: number | null; size?: number | null };
export type MItem = { key: string; cmid: number; kind: 'file' | 'assign' | 'quiz' | 'link' | 'page' | 'forum' | 'other'; mod: string; name: string; section: string; url: string;
  files: MFile[]; time: number | null; due: number | null; open: number | null; submitted: boolean | null; instance: number | null };
const KIND: Record<string, MItem['kind']> = { resource: 'file', folder: 'file', assign: 'assign', quiz: 'quiz', url: 'link', page: 'page', book: 'page', forum: 'forum' };
const pos = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
export function itemsFrom(sections: unknown): MItem[] {
  if (!Array.isArray(sections)) return [];
  const out: MItem[] = [];
  for (const s of sections as Any[]) for (const m of (Array.isArray(s?.modules) ? s.modules : []) as Any[]) {
    if (!m || m.uservisible === false || m.modname === 'label' || !m.name) continue;
    const files: MFile[] = (Array.isArray(m.contents) ? m.contents : []).filter((f: Any) => f?.type === 'file' && f.fileurl)
      .map((f: Any) => ({ name: String(f.filename ?? ''), url: String(f.fileurl), time: pos(f.timemodified) ?? pos(f.timecreated), size: pos(f.filesize) }));
    const dates: Any[] = Array.isArray(m.dates) ? m.dates : [];
    const at = (...ids: string[]) => pos(dates.find(d => ids.includes(String(d?.dataid)))?.timestamp);
    const times = files.map(f => f.time).filter((t): t is number => !!t);
    out.push({ key: `cm${m.id}`, cmid: Number(m.id), kind: KIND[String(m.modname)] ?? 'other', mod: String(m.modname ?? ''), name: String(m.name), section: String(s.name ?? ''),
      url: String(m.url ?? ''), files, time: times.length ? Math.max(...times) : at('timecreated', 'timemodified'), due: at('duedate', 'timeclose'), open: at('allowsubmissionsfromdate', 'timeopen'),
      submitted: null, instance: pos(m.instance) });
  }
  return out;
}
export const withToken = (url: string, token: string) => `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
const ref = (c: Any, enrolled: boolean): MCourseRef => ({ id: Number(c.id), fullname: String(c.fullname ?? c.displayname ?? ''), shortname: String(c.shortname ?? ''), idnumber: String(c.idnumber ?? ''),
  startdate: Number(c.startdate) || 0, enrolled, teachers: (Array.isArray(c.contacts) ? c.contacts : []).map((x: Any) => String(x?.fullname ?? '')).filter(Boolean) });

export type MOld = { ref: MCourseRef; items: MItem[]; ok: boolean };
/** `ref` = newest copy of the course with the student's doctor; `old` = older copies (other terms) with the same doctor. */
export type MCourse = { code: string; title: string; ref: MCourseRef | null; items: MItem[]; teachers?: string[]; byTeacher?: boolean; old?: MOld[] };
export type MoodleData = { user: string; at: string; courses: MCourse[] };
export async function loadMoodle(token: string, current: Current[]): Promise<MoodleData> {
  const site = await ws<Any>(token, 'core_webservice_get_site_info');
  const enrolled = ((await ws<Any[]>(token, 'core_enrol_get_users_courses', { userid: site.userid })) || []).map(c => ref(c, true));
  if (enrolled.length) {
    try {
      const info = await ws<Any>(token, 'core_course_get_courses_by_field', { field: 'ids', value: enrolled.map(e => e.id).join(',') });
      for (const c of (Array.isArray(info?.courses) ? info.courses : []) as Any[]) {
        const t = ref(c, true).teachers; const e = enrolled.find(x => x.id === Number(c.id));
        if (e && t.length) e.teachers = t; if (e && !e.startdate) e.startdate = Number(c.startdate) || 0;
      }
    } catch (e) { if (e instanceof MoodleError && e.code === 'expired') throw e; /* teacher names are optional */ }
  }
  const picks = await pool(current, 3, async c => {
    let list = [...enrolled];
    for (const q of [...new Set([c.code, c.title].map(x => (x || '').trim()).filter(x => x.length >= 3))]) {
      try {
        const s = await ws<Any>(token, 'core_course_search_courses', { criterianame: 'search', criteriavalue: q, perpage: 40 });
        for (const x of (Array.isArray(s?.courses) ? s.courses : []) as Any[]) {
          const e = enrolled.find(y => y.id === Number(x.id)); const r = ref(x, !!e);
          if (e) { if (!e.teachers.length) e.teachers = r.teachers; } else if (!list.some(y => y.id === r.id)) list = list.concat(r);
        }
      } catch (e) { if (e instanceof MoodleError && e.code === 'expired') throw e; }
    }
    return pickCopies(c, list);
  });
  const ids = [...new Set(picks.map(p => p.main).filter((r): r is MCourseRef => !!r && r.enrolled).map(r => r.id))];
  const oldIds = [...new Set(picks.flatMap(p => p.old.map(r => r.id)))].filter(id => !ids.includes(id));
  const contents = new Map<number, MItem[]>(); const failed = new Set<number>();
  await pool([...ids, ...oldIds], 3, async id => {
    try { contents.set(id, itemsFrom(await ws(token, 'core_course_get_contents', { courseid: id }))); }
    catch (e) { if (e instanceof MoodleError && e.code === 'expired') throw e; contents.set(id, []); failed.add(id); }
  });
  const all = ids.flatMap(id => contents.get(id) ?? []);
  if (ids.length) {
    const a = await ws<Any>(token, 'mod_assign_get_assignments', { courseids: ids }).catch(() => null);
    for (const c of (Array.isArray(a?.courses) ? a.courses : []) as Any[]) for (const x of (Array.isArray(c.assignments) ? c.assignments : []) as Any[]) {
      const it = all.find(i => i.cmid === Number(x.cmid)); if (!it) continue;
      it.due = pos(x.duedate) ?? it.due; it.open = pos(x.allowsubmissionsfromdate) ?? it.open; it.instance = pos(x.id) ?? it.instance;
    }
    const q = await ws<Any>(token, 'mod_quiz_get_quizzes_by_courses', { courseids: ids }).catch(() => null);
    for (const x of (Array.isArray(q?.quizzes) ? q.quizzes : []) as Any[]) {
      const it = all.find(i => i.cmid === Number(x.coursemodule)); if (!it) continue;
      it.due = pos(x.timeclose) ?? it.due; it.open = pos(x.timeopen) ?? it.open;
    }
    const now = Date.now() / 1000;
    const check = all.filter(i => i.kind === 'assign' && i.instance && (!i.due || i.due > now - 14 * 86400)).slice(0, 15);
    await pool(check, 4, async i => {
      try { const s = await ws<Any>(token, 'mod_assign_get_submission_status', { assignid: i.instance });
        const st = s?.lastattempt?.submission?.status ?? s?.lastattempt?.teamsubmission?.status; i.submitted = st ? st === 'submitted' : null; } catch { /* optional */ }
    });
  }
  return { user: String(site.fullname ?? ''), at: new Date().toISOString(),
    courses: current.map((c, i) => {
      const p = picks[i];
      return { code: c.code, title: c.title, ref: p.main, items: p.main?.enrolled ? contents.get(p.main.id) ?? [] : [], teachers: c.teachers ?? [], byTeacher: p.byTeacher,
        old: p.old.map(r => ({ ref: r, items: contents.get(r.id) ?? [], ok: !failed.has(r.id) })) };
    }) };
}
/** Self-enrol in a course copy that allows it (same as the Moodle app's "Enrol me"). */
export async function selfEnrol(token: string, courseid: number) {
  const methods = await ws<Any[]>(token, 'core_enrol_get_course_enrolment_methods', { courseid });
  const self = (methods || []).find(m => m?.type === 'self' && (m.status === true || m.status === 1 || m.status === '1' || m.status === 'true'));
  if (!self) throw new MoodleError('noself', 'Self enrolment is not enabled for this course');
  const r = await ws<Any>(token, 'enrol_self_enrol_user', { courseid, instanceid: self.id });
  if (!r?.status) throw new MoodleError('enrolfailed', String(r?.warnings?.[0]?.message ?? ''));
}