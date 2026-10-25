// Best-effort background sync. Android (WorkManager) and iOS (BGTaskScheduler) decide the exact
// timing; the minimum interval is a request, not a guarantee. Nothing runs after sign-out.
import { Platform } from 'react-native';
import { setupBackground } from './background-guard';
import { loadPrivate, savePrivate } from './vault';
import { getJSON } from './storage';
import { requestPortal, SYNC_ORDER, PortalError, type Session } from './portal';
import type { Cache } from './academic';
import { diffAlerts, gradeActions } from './change-alerts';
import { deliverAlerts } from './alert-delivery';

export const SYNC_TASK = 'su-student-university-sync';

async function pool(actions: string[], session: Session, next: Cache, state: { expired: boolean }, size = 3) {
  const queue = [...actions];
  const worker = async () => {
    while (queue.length && !state.expired) {
      const action = queue.shift()!;
      try { next[action] = { data: await requestPortal(action, session), at: new Date().toISOString() }; }
      catch (e) { if (e instanceof PortalError && e.code === 'expired') state.expired = true; }
    }
  };
  await Promise.all(Array.from({ length: size }, worker));
}

export async function runBackgroundSync() {
  const settings = await getJSON<{ lang?: string; alerts?: boolean }>('su:v2:settings', {});
  if (settings?.alerts === false) return;
  const isAr = settings?.lang !== 'en';
  const session = await loadPrivate<Session | null>('su:v2:session', null);
  if (!session || typeof session.token !== 'string' || typeof session.studentId !== 'string') return;
  const key = `su:v2:cache:${session.studentId}`;
  const prev = await loadPrivate<Cache>(key, {});
  const next: Cache = { ...prev };
  const state = { expired: false };
  await pool(SYNC_ORDER, session, next, state);
  if (!state.expired) await pool(gradeActions(next), session, next, state);
  // Re-check the session so a sign-out during the run never writes data back.
  const still = await loadPrivate<Session | null>('su:v2:session', null);
  if (still?.studentId !== session.studentId) return;
  await savePrivate(key, next);
  await deliverAlerts(session.studentId, diffAlerts(prev, next, isAr), isAr);
  if (state.expired) await deliverAlerts(session.studentId, [{
    id: `expired:${session.signedInAt}`, route: '/(tabs)/settings',
    title: isAr ? 'سجّل دخولك تاني' : 'Sign in again',
    body: isAr ? 'جلسة الجامعة خلصت، فالتحديث التلقائي واقف لحد ما تدخل تاني.' : 'Your university session expired, so automatic updates are paused.' }], isAr);
}

// Synchronous task definition remains at module scope for headless startup.
// require() stays inside the guarded loader so optional native JS errors do not abort startup.
const backgroundRuntime = setupBackground(Platform.OS, SYNC_TASK, () => ({
  manager: require('expo-task-manager') as typeof import('expo-task-manager'),
  background: require('expo-background-task') as typeof import('expo-background-task'),
}), runBackgroundSync);
export const backgroundSyncAvailable = backgroundRuntime.available;
export async function setBackgroundSync(on: boolean) {
  return backgroundRuntime.setEnabled(on);
}
