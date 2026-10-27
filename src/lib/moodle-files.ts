// Pure helpers for the Moodle "folders" page: one folder per current course, flat file rows, search, sizes.
import type { MCourse, MItem } from './moodle';

export type FileRow = {
  key: string; // same key the "read" marks always used (`cm12:file.pdf` or `cm12`)
  course: string;
  courseTitle: string;
  name: string; // real file name (used for the extension and the saved file)
  title: string; // what the student sees
  url: string;
  time: number | null;
  size: number | null;
  section: string;
  /** true = a real pluginfile download; false = only a Moodle page (opened in the browser). */
  direct: boolean;
};

export const isFileItem = (i: MItem) => i.kind === 'file' || (i.files.length > 0 && i.kind !== 'assign');

export function courseRows(c: MCourse): FileRow[] {
  return c.items.filter(isFileItem).flatMap((i): FileRow[] =>
    i.files.length
      ? i.files.map((f) => ({
          key: `${i.key}:${f.name}`, course: c.code, courseTitle: c.title, name: f.name || i.name,
          title: i.files.length > 1 ? `${i.name} — ${f.name}` : i.name, url: f.url, time: f.time ?? i.time,
          size: typeof f.size === 'number' && f.size > 0 ? f.size : null, section: i.section, direct: true,
        }))
      : [{ key: i.key, course: c.code, courseTitle: c.title, name: i.name, title: i.name, url: i.url, time: i.time, size: null, section: i.section, direct: false }],
  );
}

export const allRows = (courses: MCourse[]) => courses.flatMap(courseRows);

/** Newest first; rows without a date go last. */
export function latest(rows: FileRow[], n = 6) {
  return [...rows].sort((a, b) => (b.time ?? 0) - (a.time ?? 0)).slice(0, n);
}

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s_\-.]+/g, ' ')
    .trim();

/** Every word of the query must appear in the file, its course code or the course title. */
export function searchRows(rows: FileRow[], q: string) {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return [];
  return rows.filter((r) => {
    const hay = norm([r.title, r.name, r.course, r.course.replace(/\s+/g, ''), r.courseTitle, r.section].join(' '));
    return words.every((w) => hay.includes(w));
  });
}

/** Grouped by Moodle section, keeping the order the doctor uploaded them in. */
export function bySection(rows: FileRow[]) {
  const out: { section: string; rows: FileRow[] }[] = [];
  for (const r of rows) {
    const g = out.find((x) => x.section === r.section);
    if (g) g.rows.push(r);
    else out.push({ section: r.section, rows: [r] });
  }
  return out;
}

export function safeName(s: string) {
  const v = (s || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
  return v || 'file';
}

export function extOf(name: string) {
  const m = /\.([a-z0-9]{1,6})$/i.exec((name || '').trim());
  return m ? m[1].toLowerCase() : '';
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip', rar: 'application/vnd.rar', txt: 'text/plain', csv: 'text/csv',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp4: 'video/mp4', mp3: 'audio/mpeg',
};
export const mimeOf = (name: string) => MIME[extOf(name)] ?? 'application/octet-stream';

export type FileKind = 'pdf' | 'slides' | 'doc' | 'sheet' | 'archive' | 'image' | 'media' | 'other';
export function kindOf(name: string): FileKind {
  const e = extOf(name);
  if (e === 'pdf') return 'pdf';
  if (['ppt', 'pptx', 'key', 'odp'].includes(e)) return 'slides';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(e)) return 'doc';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'sheet';
  if (['zip', 'rar', '7z'].includes(e)) return 'archive';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return 'image';
  if (['mp4', 'mp3', 'm4a', 'mov', 'wav'].includes(e)) return 'media';
  return 'other';
}

export function fmtSize(bytes: number | null | undefined, ar = true) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB${ar ? '' : ''}`;
}

/** Egyptian Arabic count of files: ملف واحد، ملفين، 3 ملفات، 11 ملف. */
export function filesLabel(n: number, ar = true) {
  if (!ar) return n === 1 ? '1 file' : `${n} files`;
  if (n === 0) return 'مفيش ملفات';
  if (n === 1) return 'ملف واحد';
  if (n === 2) return 'ملفين';
  if (n <= 10) return `${n} ملفات`;
  return `${n} ملف`;
}

/** "النهارده" / "امبارح" / "من 3 أيام" / a date. `now` is injectable for tests. */
export function ago(sec: number | null | undefined, ar = true, now = Date.now()) {
  if (!sec) return '';
  const day = (t: number) => {
    const d = new Date(t);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  };
  const diff = Math.round(day(now) - day(sec * 1000));
  if (diff <= 0) return ar ? 'النهارده' : 'Today';
  if (diff === 1) return ar ? 'امبارح' : 'Yesterday';
  if (diff === 2) return ar ? 'من يومين' : '2 days ago';
  if (diff <= 10) return ar ? `من ${diff} أيام` : `${diff} days ago`;
  return new Date(sec * 1000).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
}