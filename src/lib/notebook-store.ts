import { useEffect, useSyncExternalStore } from 'react';
import { loadPrivate, removePrivate, savePrivate } from './vault';
import { emptyNotebook, normalizeBody, normalizeIndex, type NotebookIndex, type PageBody } from './notebook';
// Encrypted per account. Each page body is stored separately so big drawings never hit storage row limits.
const idxKey = (o: string) => `su:v2:notebook:${o}`;
const pageKey = (o: string, id: string) => `su:v2:notebook:${o}:p:${id}`;
type State = { owner: string; nb: NotebookIndex; ready: boolean; broken: boolean };
let state: State = { owner: '', nb: emptyNotebook(), ready: false, broken: false };
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
let timer: ReturnType<typeof setTimeout> | null = null;
function ensure(owner: string) {
  if (state.owner === owner) return;
  state = { owner, nb: emptyNotebook(), ready: false, broken: false }; emit();
  loadPrivate<unknown>(idxKey(owner), null)
    .then(v => { if (state.owner === owner) { state = { owner, nb: normalizeIndex(v), ready: true, broken: false }; emit(); } })
    .catch(() => { if (state.owner === owner) { state = { ...state, ready: true, broken: true }; emit(); } });
}
export function updateNotebook(fn: (nb: NotebookIndex) => NotebookIndex) {
  if (!state.ready || state.broken) return;
  const next = fn(state.nb); if (next === state.nb) return;
  state = { ...state, nb: next }; emit();
  if (timer) clearTimeout(timer);
  const { owner, nb } = state;
  timer = setTimeout(() => { timer = null; savePrivate(idxKey(owner), nb).catch(() => {}); }, 250);
}
export async function loadPage(owner: string, id: string): Promise<PageBody> { return normalizeBody(await loadPrivate<unknown>(pageKey(owner, id), null)); }
export const savePage = (owner: string, id: string, body: PageBody) => savePrivate(pageKey(owner, id), body);
export const deletePage = (owner: string, id: string) => removePrivate(pageKey(owner, id)).catch(() => {});
export function useNotebook(owner: string): State {
  useEffect(() => ensure(owner), [owner]);
  const s = useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state, () => state);
  return s.owner === owner ? s : { owner, nb: emptyNotebook(), ready: false, broken: false };
}