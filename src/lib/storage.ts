import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const KEYS = {
  settings: 'usis:settings',
  completed: 'usis:completed',
  draft: 'usis:draft',
  cache: 'usis:cache',
  pending: 'usis:pending',
  grades: 'usis:grades',
  gpaBase: 'usis:gpa-base',
  lastSync: 'usis:last-sync',
  // SecureStore keys may only contain alphanumerics, ".", "-" and "_".
  session: 'usis_session',
} as const;

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working from memory.
  }
}

export async function removeKeys(keys: string[]) {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // ignore
  }
}

export async function deleteSecure(key:string) {
  try {
    if(Platform.OS!=='web') await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  } catch {}
}
