// Shared flag: true while the hidden Google re-login is trying, so the home banner stays hidden until it really fails.
import { useSyncExternalStore } from 'react';

let running = false;
const subs = new Set<() => void>();
export function setReloginRunning(v: boolean) {
  if (running === v) return;
  running = v;
  subs.forEach((f) => f());
}
export const reloginRunning = () => running;
export function useReloginState() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => running, () => running);
}