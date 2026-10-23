import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Localization from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { quickActions } from '@/data/services';
import { setHapticsEnabled, success, warning } from '@/lib/haptics';
import type { Lang } from '@/lib/i18n';
import { KEYS, deleteSecure, getJSON, getSecure, setJSON, setSecure } from '@/lib/storage';
import { palettes, type Palette, type Scheme } from '@/lib/theme';
import { callWorkflow, cleanReply, randomId, resolveWorkflowUrl } from '@/lib/workflow';

export type ThemePref = 'system' | 'light' | 'dark';
export type Settings = { lang: Lang; theme: ThemePref; workflowUrl: string; biometric: boolean; haptics: boolean };
export type Session = { email: string; name: string; transportId: string; signedInAt: string };
export type CacheEntry = { reply: string; at: string; mode: 'demo' | 'live' };
export type FetchResult = { entry?: CacheEntry; error?: string; fromCache: boolean };
export type GpaBase = { cgpa: string; hours: string; target: string };
export type Banner = 'offline' | 'back' | null;

type AppCtx = {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  lang: Lang;
  isAr: boolean;
  tr: (ar: string, en: string) => string;
  row: 'row' | 'row-reverse';
  align: 'left' | 'right';
  scheme: Scheme;
  palette: Palette;
  isLive: boolean;
  session: Session | null;
  signIn: (email: string, name: string, remember: boolean, url?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  locked: boolean;
  unlock: () => Promise<void>;
  setBiometric: (on: boolean) => Promise<string | null>;
  online: boolean;
  banner: Banner;
  dismissBanner: () => void;
  cache: Record<string, CacheEntry>;
  fetchService: (action: string, force?: boolean) => Promise<FetchResult>;
  refreshAll: () => Promise<boolean>;
  refreshing: boolean;
  lastSync: string | null;
  clearCache: () => void;
  completed: Set<string>;
  toggleCompleted: (code: string) => void;
  draft: string[];
  toggleDraft: (code: string) => void;
  setDraft: (codes: string[]) => void;
  grades: Record<string, string>;
  setGrade: (code: string, grade: string) => void;
  gpaBase: GpaBase;
  setGpaBase: (value: GpaBase) => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useApp must be used inside <AppProvider>');
  return value;
}

const deviceLang: Lang = Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'ar';
const defaults: Settings = { lang: deviceLang, theme: 'system', workflowUrl: '', biometric: false, haptics: true };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AppProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [session, setSession] = useState<Session | null>(null);
  const [locked, setLocked] = useState(false);
  const [online, setOnline] = useState(true);
  const [banner, setBanner] = useState<Banner>(null);
  const [cache, setCache] = useState<Record<string, CacheEntry>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [draft, setDraftState] = useState<string[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [gpaBase, setGpaBaseState] = useState<GpaBase>({ cgpa: '', hours: '', target: '' });

  const wasOffline = useRef(false);
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  // Restore everything saved on the device.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, sess, comp, dr, gr, gb, ca, ls] = await Promise.all([
        getJSON<Partial<Settings>>(KEYS.settings, {}),
        getSecure<Session>(KEYS.session),
        getJSON<string[]>(KEYS.completed, []),
        getJSON<string[]>(KEYS.draft, []),
        getJSON<Record<string, string>>(KEYS.grades, {}),
        getJSON<Partial<GpaBase>>(KEYS.gpaBase, {}),
        getJSON<Record<string, CacheEntry>>(KEYS.cache, {}),
        getJSON<string | null>(KEYS.lastSync, null),
      ]);
      if (!alive) return;
      const merged = { ...defaults, ...s };
      setSettings(merged);
      setHapticsEnabled(merged.haptics);
      setSession(sess);
      setLocked(!!sess && merged.biometric);
      setCompletedList(comp);
      setDraftState(dr);
      setGrades(gr);
      setGpaBaseState({ cgpa: '', hours: '', target: '', ...gb });
      setCache(ca);
      setLastSync(ls);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Connectivity: stay on cached data while offline, announce when the connection is back.
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const on = state.isConnected !== false && state.isInternetReachable !== false;
        setOnline(on);
        if (!on) {
          wasOffline.current = true;
          setBanner('offline');
        } else if (wasOffline.current) {
          setBanner('back');
        }
      }),
    [],
  );

  useEffect(() => { if (ready) setJSON(KEYS.completed, completedList); }, [ready, completedList]);
  useEffect(() => { if (ready) setJSON(KEYS.draft, draft); }, [ready, draft]);
  useEffect(() => { if (ready) setJSON(KEYS.grades, grades); }, [ready, grades]);
  useEffect(() => { if (ready) setJSON(KEYS.gpaBase, gpaBase); }, [ready, gpaBase]);
  useEffect(() => { if (ready) setJSON(KEYS.cache, cache); }, [ready, cache]);
  useEffect(() => { if (ready) setJSON(KEYS.lastSync, lastSync); }, [ready, lastSync]);

  const lang = settings.lang;
  const isAr = lang === 'ar';
  const tr = useCallback((ar: string, en: string) => (lang === 'ar' ? ar : en), [lang]);
  const scheme: Scheme = settings.theme === 'system' ? (system === 'light' ? 'light' : 'dark') : settings.theme;
  const isLive = !!resolveWorkflowUrl(settings.workflowUrl);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      setJSON(KEYS.settings, next);
      setHapticsEnabled(next.haptics);
      return next;
    });
  }, []);

  const signIn = useCallback(
    async (email: string, name: string, remember: boolean, url?: string) => {
      const clean = email.trim().toLowerCase();
      if (!emailPattern.test(clean)) return tr('اكتب إيميل صحيح', 'Enter a valid email');
      const workflowUrl = url ?? settings.workflowUrl;
      if (resolveWorkflowUrl(workflowUrl) && !online) {
        return tr('محتاج إنترنت لأول تسجيل دخول بس', 'You need internet for the first sign-in');
      }
      const transportId = `app:${randomId()}`;
      const displayName = name.trim() || clean.split('@')[0];
      const base = { url: workflowUrl, transportId, name: displayName, lang };
      const start = await callWorkflow({ ...base, action: 'LOGIN' });
      if (!start.ok) return start.error;
      const res = await callWorkflow({ ...base, action: 'MESSAGE', text: clean });
      if (!res.ok) return res.error;

      const s: Session = { email: clean, name: displayName, transportId, signedInAt: new Date().toISOString() };
      if (remember) await setSecure(KEYS.session, s);
      else await deleteSecure(KEYS.session);
      setSession(s);
      setCache((c) => ({ ...c, LOGIN: { reply: cleanReply(res.reply), at: s.signedInAt, mode: res.mode } }));
      setLastSync(s.signedInAt);
      return null;
    },
    [lang, online, settings.workflowUrl, tr],
  );

  const signOut = useCallback(async () => {
    const s = session;
    if (s && online && isLive) {
      callWorkflow({ url: settings.workflowUrl, transportId: s.transportId, name: s.name, lang, action: 'LOGOUT' }).catch(() => {});
    }
    await deleteSecure(KEYS.session);
    setSession(null);
    setCache({});
    setLastSync(null);
    setLocked(false);
  }, [isLive, lang, online, session, settings.workflowUrl]);

  const unlock = useCallback(async () => {
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      if (!has) {
        setLocked(false);
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: tr('افتح UnicodeSIS', 'Unlock UnicodeSIS'),
        cancelLabel: tr('إلغاء', 'Cancel'),
      });
      if (r.success) {
        setLocked(false);
        success();
      }
    } catch {
      setLocked(false);
    }
  }, [tr]);

  const setBiometric = useCallback(
    async (on: boolean) => {
      if (!on) {
        updateSettings({ biometric: false });
        return null;
      }
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = has && (await LocalAuthentication.isEnrolledAsync());
      if (!enrolled) return tr('جهازك مفيهوش بصمة أو Face ID متفعّل', 'No Face ID / fingerprint is set up on this device');
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: tr('أكّد إنك إنت', 'Confirm it’s you') });
      if (!r.success) return tr('تم الإلغاء', 'Verification cancelled');
      updateSettings({ biometric: true });
      return null;
    },
    [tr, updateSettings],
  );

  const fetchService = useCallback(
    async (action: string, force = false): Promise<FetchResult> => {
      const cached = cacheRef.current[action];
      if (cached && !force) return { entry: cached, fromCache: true };
      if (!online) {
        return {
          entry: cached,
          fromCache: !!cached,
          error: cached
            ? tr('أنت أوفلاين — دي آخر نسخة محفوظة', 'You are offline — showing the last saved copy')
            : tr('أنت أوفلاين ومفيش نسخة محفوظة لسه. اتصل بالنت وحدّث.', 'You are offline and nothing is saved yet. Connect and refresh.'),
        };
      }
      if (!session) return { fromCache: false, error: tr('سجّل دخول الأول', 'Please sign in first') };
      const res = await callWorkflow({
        url: settings.workflowUrl,
        transportId: session.transportId,
        name: session.name,
        lang,
        action,
      });
      if (!res.ok) return { entry: cached, fromCache: !!cached, error: res.error };
      const entry: CacheEntry = { reply: cleanReply(res.reply), at: new Date().toISOString(), mode: res.mode };
      setCache((c) => ({ ...c, [action]: entry }));
      return { entry, fromCache: false };
    },
    [lang, online, session, settings.workflowUrl, tr],
  );

  const refreshAll = useCallback(async () => {
    if (!online) {
      warning();
      return false;
    }
    setRefreshing(true);
    const saved = Object.keys(cacheRef.current).filter((a) => a !== 'LOGIN' && a !== 'INFO');
    const actions = Array.from(new Set([...saved, 'SEC_PROFILE', ...quickActions]));
    let failed = 0;
    for (let i = 0; i < actions.length; i += 3) {
      const results = await Promise.all(actions.slice(i, i + 3).map((a) => fetchService(a, true)));
      failed += results.filter((r) => r.error).length;
    }
    setLastSync(new Date().toISOString());
    setBanner(null);
    wasOffline.current = false;
    setRefreshing(false);
    if (failed) warning();
    else success();
    return failed === 0;
  }, [fetchService, online]);

  const dismissBanner = useCallback(() => {
    setBanner((b) => {
      if (b === 'back') wasOffline.current = false;
      return null;
    });
  }, []);

  const completed = useMemo(() => new Set(completedList), [completedList]);

  const toggleCompleted = useCallback((code: string) => {
    setCompletedList((list) => {
      if (list.includes(code)) return list.filter((c) => c !== code);
      setDraftState((d) => d.filter((c) => c !== code));
      return [...list, code];
    });
  }, []);

  const toggleDraft = useCallback((code: string) => {
    setDraftState((d) => (d.includes(code) ? d.filter((c) => c !== code) : [...d, code]));
  }, []);

  const value: AppCtx = {
    ready,
    settings,
    updateSettings,
    lang,
    isAr,
    tr,
    row: isAr ? 'row-reverse' : 'row',
    align: isAr ? 'right' : 'left',
    scheme,
    palette: palettes[scheme],
    isLive,
    session,
    signIn,
    signOut,
    locked,
    unlock,
    setBiometric,
    online,
    banner,
    dismissBanner,
    cache,
    fetchService,
    refreshAll,
    refreshing,
    lastSync,
    clearCache: () => {
      setCache({});
      setLastSync(null);
    },
    completed,
    toggleCompleted,
    draft,
    toggleDraft,
    setDraft: setDraftState,
    grades,
    setGrade: (code, grade) => setGrades((g) => ({ ...g, [code]: grade })),
    gpaBase,
    setGpaBase: setGpaBaseState,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}