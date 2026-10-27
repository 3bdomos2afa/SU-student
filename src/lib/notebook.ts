// "كشكولك": topics (one per registered course + custom ones), each with lined pages for writing and drawing.
import { canonical } from './academic';
export type Stroke = { c: string; w: number; d: string; y: number; o?: number };
export type PageMeta = { id: string; title: string; preview: string; created: string; updated: string; drawn?: boolean };
export type Topic = { id: string; name: string; color: string; course?: string; created: string; pages: PageMeta[] };
export type NotebookIndex = { v: 1; topics: Topic[]; hidden: string[] };
/** `text` is the plain text (titles, previews, sharing); `html` keeps the formatting. */
export type PageBody = { text: string; strokes: Stroke[]; html?: string };
export const TOPIC_COLORS = ['#4F46E5', '#0891B2', '#16A34A', '#F59E0B', '#EF4444', '#DB2777', '#9333EA', '#0D9488', '#64748B'];
export const INK_COLORS = ['#1F2937', '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#F59E0B'];
export const emptyNotebook = (): NotebookIndex => ({ v: 1, topics: [], hidden: [] });
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
export function normalizeIndex(v: unknown): NotebookIndex {
  if (!v || typeof v !== 'object') return emptyNotebook();
  const o = v as Record<string, unknown>;
  const topics = (Array.isArray(o.topics) ? o.topics : []).filter((t): t is Record<string, unknown> => !!t && typeof t === 'object' && typeof (t as Record<string, unknown>).id === 'string').map((t): Topic => ({
    id: str(t.id, 80), name: str(t.name, 80) || '—', color: /^#[0-9a-f]{6}$/i.test(str(t.color)) ? str(t.color) : TOPIC_COLORS[0], course: str(t.course, 40) || undefined, created: str(t.created, 40),
    pages: (Array.isArray(t.pages) ? t.pages : []).filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as Record<string, unknown>).id === 'string')
      .map(p => ({ id: str(p.id, 80), title: str(p.title, 120), preview: str(p.preview, 200), created: str(p.created, 40), updated: str(p.updated, 40), drawn: p.drawn === true })),
  }));
  return { v: 1, topics, hidden: (Array.isArray(o.hidden) ? o.hidden : []).filter((x): x is string => typeof x === 'string') };
}
export function normalizeBody(v: unknown): PageBody {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const body: PageBody = { text: typeof o.text === 'string' ? o.text : '', strokes: (Array.isArray(o.strokes) ? o.strokes : []).map(s => cleanStroke(s)).filter((s): s is Stroke => !!s) };
  if (typeof o.html === 'string') body.html = o.html.slice(0, 400_000);
  return body;
}
const COLOR_RE = /^#[0-9a-f]{3,8}$/i;
const PATH_RE = /^[MLml0-9.\s,-]+$/;
/** Validates one stroke (it ends up inside SVG/HTML, so only plain path commands and hex colours pass). */
export function cleanStroke(v: unknown): Stroke | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  if (typeof s.d !== 'string' || !s.d || s.d.length > 200_000 || !PATH_RE.test(s.d)) return null;
  const out: Stroke = {
    c: typeof s.c === 'string' && COLOR_RE.test(s.c) ? s.c : INK_COLORS[0],
    w: typeof s.w === 'number' && isFinite(s.w) ? Math.min(40, Math.max(1, s.w)) : 3,
    d: s.d,
    y: typeof s.y === 'number' && isFinite(s.y) ? Math.max(0, s.y) : 0,
  };
  if (typeof s.o === 'number' && s.o > 0 && s.o < 1) out.o = s.o;
  return out;
}
export const courseTopicId = (code: string) => `course-${canonical(code)}`;
/** Adds one topic per registered course (never re-adds a course topic the student deleted). */
export function withCourseTopics(nb: NotebookIndex, courses: { code: string; title: string }[], now = new Date()): NotebookIndex {
  const hidden = new Set(nb.hidden); const topics = [...nb.topics]; let changed = false;
  courses.forEach(c => {
    const id = courseTopicId(c.code);
    if (topics.some(t => t.id === id) || hidden.has(id)) return;
    topics.push({ id, name: c.title || c.code, color: TOPIC_COLORS[topics.length % TOPIC_COLORS.length], course: c.code, created: now.toISOString(), pages: [] });
    changed = true;
  });
  return changed ? { ...nb, topics } : nb;
}
export function titleFrom(text: string) { return (text.split('\n').map(l => l.trim()).find(Boolean) ?? '').slice(0, 60); }
export function previewFrom(text: string) { const lines = text.split('\n').map(l => l.trim()).filter(Boolean); return lines.slice(1).join(' · ').slice(0, 120); }
export function lastUpdate(t: Topic) { return t.pages.reduce((m, p) => (p.updated > m ? p.updated : m), ''); }