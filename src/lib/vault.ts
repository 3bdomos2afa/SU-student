import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';

// Encryption key stays in platform Keychain/Keystore; authenticated ciphertext only in AsyncStorage.
// Web preview is memory-only and never persists university credentials.
let keyPromise: Promise<Uint8Array> | null = null;
const memory = new Map<string, unknown>();
function getKey() {
  if (!keyPromise) keyPromise = (async () => {
    let key = await SecureStore.getItemAsync('su_v2_vault_key');
    if (!key) {
      key = bytesToHex(await Crypto.getRandomBytesAsync(32));
      await SecureStore.setItemAsync('su_v2_vault_key', key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    }
    return hexToBytes(key);
  })().catch(e => { keyPromise = null; throw e; });
  return keyPromise;
}
export async function savePrivate(key: string, value: unknown) {
  if (Platform.OS === 'web') { memory.set(key,value); return; }
  const secret = await getKey();
  const nonce = await Crypto.getRandomBytesAsync(12);
  const encrypted = gcm(secret, nonce, utf8ToBytes(key)).encrypt(utf8ToBytes(JSON.stringify(value)));
  await AsyncStorage.setItem(key, JSON.stringify([bytesToHex(nonce), bytesToHex(encrypted)]));
}
export async function loadPrivate<T>(key: string, fallback: T): Promise<T> {
  if (Platform.OS === 'web') return (memory.get(key) as T) ?? fallback;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const [nonce, ciphertext] = JSON.parse(raw);
    return JSON.parse(bytesToUtf8(gcm(await getKey(), hexToBytes(nonce), utf8ToBytes(key)).decrypt(hexToBytes(ciphertext))));
  } catch { return fallback; }
}
export async function removePrivate(key: string) {
  memory.delete(key); await AsyncStorage.removeItem(key);
}
/** Remove every stored key that matches (memory + AsyncStorage). */
export async function wipePrivate(match: (key: string) => boolean) {
  for (const k of [...memory.keys()]) if (match(k)) memory.delete(k);
  try { const keys = (await AsyncStorage.getAllKeys()).filter(match); if (keys.length) await AsyncStorage.multiRemove(keys); } catch {}
}
