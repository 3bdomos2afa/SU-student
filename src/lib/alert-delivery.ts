import { Platform } from 'react-native';
import { loadPrivate, savePrivate } from './vault';
import type { ChangeAlert } from './change-alerts';

export type DeliverableAlert = Pick<ChangeAlert, 'id' | 'title' | 'body' | 'route'>;
let chain: Promise<number> = Promise.resolve(0);

/** Shows each change once per account (foreground and background share the same seen-list). */
export function deliverAlerts(owner: string, alerts: DeliverableAlert[], isAr: boolean) {
  if (!alerts.length) return Promise.resolve(0);
  chain = chain.catch(() => 0).then(() => deliver(owner, alerts, isAr));
  return chain;
}

async function deliver(owner: string, alerts: DeliverableAlert[], isAr: boolean) {
  const key = `su:v2:alerts:${owner}`;
  const list = await loadPrivate<string[]>(key, []);
  const seen = new Set(Array.isArray(list) ? list : []);
  const fresh = alerts.filter(a => !seen.has(a.id));
  if (!fresh.length) return 0;
  // Mark as seen even if notifications are off, so enabling them later does not replay old changes.
  for (const a of fresh) seen.add(a.id);
  await savePrivate(key, [...seen].slice(-400));
  if (Platform.OS === 'web') return 0;
  const n = await import('expo-notifications');
  const p = await n.getPermissionsAsync();
  if (!(p.granted || p.ios?.status === n.IosAuthorizationStatus.PROVISIONAL)) return 0;
  if (Platform.OS === 'android') await n.setNotificationChannelAsync('alerts', {
    name: isAr ? 'غياب وإنذارات ودرجات' : 'Absence, warnings & grades',
    importance: n.AndroidImportance.HIGH, lockscreenVisibility: n.AndroidNotificationVisibility.PRIVATE });
  n.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  const shown: DeliverableAlert[] = fresh.length > 5 ? [...fresh.slice(0, 4), {
    id: 'summary', route: '/(tabs)',
    title: isAr ? `و${fresh.length - 4} تحديثات تانية من الجامعة` : `${fresh.length - 4} more university updates`,
    body: isAr ? 'افتح الأبلكيشن وشوف كل التفاصيل.' : 'Open the app for all details.' }] : fresh;
  for (const a of shown) await n.scheduleNotificationAsync({
    content: { title: a.title, body: a.body, sound: 'default', data: { route: a.route } },
    trigger: Platform.OS === 'android' ? { channelId: 'alerts' } : null });
  return shown.length;
}