import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';
let enabled = supported;

export function setHapticsEnabled(value: boolean) {
  enabled = supported && value;
}

export function tap() {
  try { if (enabled) void Haptics.selectionAsync().catch(() => {}); } catch {}
}

export function impact() {
  try { if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
}

export function success() {
  try { if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch {}
}

export function warning() {
  try { if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); } catch {}
}