// Ongoing "focus running" notification. Android uses the bundled SuFocus native module (live countdown in
// the notification shade, removed automatically when the time is up). Elsewhere, or if the module is
// missing from a build, a sticky local notification shows the end time instead.
import { Platform } from 'react-native';
import type { Focus } from './focus';

type NativeFocus = { show(endAt: number, title: string, body: string): boolean; hide(): boolean };
const ID = 'su-focus-live';

function nativeFocus(): NativeFocus | null {
  if (Platform.OS !== 'android') return null;
  try {
    const core = require('expo-modules-core') as { requireOptionalNativeModule?: (name: string) => unknown };
    return (core.requireOptionalNativeModule?.('SuFocus') as NativeFocus | null) ?? null;
  } catch { return null; }
}

const clock = (t: number) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export async function syncFocusLive(f: Focus, ar: boolean, showTitle: boolean) {
  const running = f.endAt !== null && f.endAt > Date.now() + 1000;
  const name = showTitle && f.title ? f.title : (ar ? 'مذاكرة' : 'Study');
  const title = ar ? `⏳ جلسة تركيز شغالة · ${name}` : `⏳ Focus running · ${name}`;
  const body = running ? (ar ? `بتخلص الساعة ${clock(f.endAt!)} — كمّل، إنت ماشي كويس 💪` : `Ends at ${clock(f.endAt!)} — keep going 💪`) : '';
  const native = nativeFocus();
  if (native) {
    try { if (running) native.show(f.endAt!, title, body); else native.hide(); return; } catch { /* fall back below */ }
  }
  if (Platform.OS === 'web') return;
  const n = await import('expo-notifications');
  await n.dismissNotificationAsync(ID).catch(() => {});
  if (!running) return;
  const p = await n.getPermissionsAsync();
  if (!(p.granted || p.ios?.status === n.IosAuthorizationStatus.PROVISIONAL)) return;
  if (Platform.OS === 'android') await n.setNotificationChannelAsync('focus-live', { name: ar ? 'تايمر التركيز' : 'Focus timer', importance: n.AndroidImportance.LOW, sound: null, lockscreenVisibility: n.AndroidNotificationVisibility.PRIVATE });
  await n.scheduleNotificationAsync({ identifier: ID,
    content: { title, body, sticky: true, autoDismiss: false, data: { route: '/study' } },
    trigger: Platform.OS === 'android' ? { channelId: 'focus-live' } : null });
}

export async function hideFocusLive() {
  try { nativeFocus()?.hide(); } catch { /* ignore */ }
  if (Platform.OS === 'web') return;
  try { const n = await import('expo-notifications'); await n.dismissNotificationAsync(ID); } catch { /* ignore */ }
}