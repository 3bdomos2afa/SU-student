// Saves Moodle files inside the app's private documents folder so they open later without internet.
import { Platform } from 'react-native';
import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MoodleError } from './moodle';
import { mimeOf, safeName, type FileRow } from './moodle-files';

export type Saved = { uri: string; size: number | null; at: number };

export const canDownload = Platform.OS !== 'web' && !!FS.documentDirectory;

const root = (owner: string) => `${FS.documentDirectory}moodle/${safeName(owner)}/`;
export const localUri = (owner: string, f: FileRow) => `${root(owner)}${safeName(f.course)}/${safeName(f.key.replace(/:.*/, ''))}-${safeName(f.name)}`;

/** Downloads to a `.part` file first, so a cut connection never leaves a broken file that looks finished. */
export async function downloadFile(owner: string, f: FileRow, url: string, onProgress: (x: number) => void): Promise<Saved> {
  if (!canDownload) throw new MoodleError('unsupported', 'Downloads need the phone app');
  const uri = localUri(owner, f);
  const dir = uri.slice(0, uri.lastIndexOf('/') + 1);
  await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const tmp = `${uri}.part`;
  let last = -1;
  const task = FS.createDownloadResumable(url, tmp, {}, (p) => {
    const total = p.totalBytesExpectedToWrite;
    if (total > 0) {
      const pct = Math.floor((p.totalBytesWritten / total) * 100);
      if (pct !== last) { last = pct; onProgress(pct / 100); }
    }
  });
  let r: FS.FileSystemDownloadResult | undefined;
  try { r = await task.downloadAsync(); } catch { await FS.deleteAsync(tmp, { idempotent: true }).catch(() => {}); throw new MoodleError('network', 'network'); }
  const fail = async (code: string) => { await FS.deleteAsync(tmp, { idempotent: true }).catch(() => {}); throw new MoodleError(code, code); };
  if (!r) return fail('network');
  if (r.status === 401 || r.status === 403) return fail('expired');
  if (r.status < 200 || r.status >= 300) return fail('network');
  // An expired token makes Moodle answer 200 with a small JSON error instead of the file.
  const ct = String(r.headers?.['Content-Type'] ?? r.headers?.['content-type'] ?? '').toLowerCase();
  if (ct.includes('application/json') && !/\.json$/i.test(f.name)) return fail('expired');
  await FS.deleteAsync(uri, { idempotent: true }).catch(() => {});
  await FS.moveAsync({ from: tmp, to: uri });
  const info = await FS.getInfoAsync(uri);
  return { uri, size: info.exists ? (info.size ?? null) : null, at: Date.now() };
}

export async function fileExists(uri: string) {
  if (!canDownload) return false;
  try { return (await FS.getInfoAsync(uri)).exists; } catch { return false; }
}

/** Opens the saved copy through the system sheet (PDF viewer, PowerPoint, Drive, WhatsApp…). Works offline. */
export async function openLocal(uri: string, name: string) {
  if (!(await fileExists(uri))) throw new MoodleError('missing', 'missing');
  if (!(await Sharing.isAvailableAsync())) throw new MoodleError('unsupported', 'unsupported');
  await Sharing.shareAsync(uri, { mimeType: mimeOf(name), dialogTitle: name });
}

export async function removeLocal(uri: string) {
  if (canDownload) await FS.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
/** Used by "امسح كل بيانات الأبلكيشن": removes every downloaded Moodle file of every account. */
export async function wipeDownloads() {
  if (canDownload) await FS.deleteAsync(`${FS.documentDirectory}moodle/`, { idempotent: true }).catch(() => {});
}
