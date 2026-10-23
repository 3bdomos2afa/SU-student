import { Alert, Platform } from 'react-native';

import type { Lang } from './i18n';

export function timeAgo(iso: string | null | undefined, lang: Lang) {
  if (!iso) return lang === 'ar' ? 'لسه' : 'never';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return lang === 'ar' ? 'دلوقتي' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return lang === 'ar' ? `من ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'ar' ? `من ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return lang === 'ar' ? `من ${d} يوم` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

export function confirmAction(
  title: string,
  message: string,
  ok: string,
  cancel: string,
  onOk: () => void,
  destructive = false,
) {
  if (Platform.OS === 'web') {
    const c = (globalThis as { confirm?: (m: string) => boolean }).confirm;
    if (!c || c(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    { text: ok, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '')).toUpperCase();
}