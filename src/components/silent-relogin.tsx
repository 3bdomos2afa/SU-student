// Silent portal re-login: when the university session drops while online, the remembered Google account signs
// the student back in inside a hidden WebView, then the app resyncs by itself (signIn → new signedInAt → refreshAll).
import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '@/context/app-context';
import { getJSON } from '@/lib/storage';
import { GOOGLE_TEST_USER_AGENT, googleTestAvailable, googleTestURL } from '@/lib/google-webview-test';
import { googleTapAgain } from '@/lib/google-tap';
import { isPortalURL, parseSession, PORTAL_LOGIN, PORTAL_ORIGIN } from '@/lib/portal';
import { navigationPolicy } from '@/lib/navigation-policy';
import { PORTAL_BRIDGE } from './portal-modal';

const COOLDOWN = 10 * 60000, TIMEOUT = 45000;

export function SilentRelogin() {
  const a = useApp();
  const [run, setRun] = useState(0);
  const last = useRef(0), done = useRef(false), taps = useRef(0);
  const web = useRef<WebView>(null);
  const capable = Platform.OS === 'android' && googleTestAvailable(Platform.OS, Constants.expoConfig?.extra);
  const want = capable && a.ready && !!a.session && a.authExpired && a.online && !a.locked;
  useEffect(() => {
    if (!want || run || Date.now() - last.current < COOLDOWN) return;
    let alive = true;
    void Promise.all([getJSON<boolean>('su:v2:google-used', false), getJSON<boolean>('su:v2:forget-web', false)]).then(([g, f]) => {
      if (!alive || g !== true || f === true) return;
      last.current = Date.now(); done.current = false; taps.current = 0; setRun(Date.now());
    }).catch(() => {});
    return () => { alive = false; };
  }, [want, run]);
  useEffect(() => { if (!run) return; const t = setTimeout(() => setRun(0), TIMEOUT); return () => clearTimeout(t); }, [run]);
  useEffect(() => { if (!want && run) setRun(0); }, [want, run]);
  if (!run) return null;
  return <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 }}>
    <WebView<{}> key={run} ref={web} source={{ uri: PORTAL_LOGIN }} userAgent={GOOGLE_TEST_USER_AGENT}
      originWhitelist={['*']} setSupportMultipleWindows javaScriptCanOpenWindowsAutomatically thirdPartyCookiesEnabled sharedCookiesEnabled={false}
      javaScriptEnabled domStorageEnabled mixedContentMode="never" allowFileAccess={false} saveFormDataDisabled webviewDebuggingEnabled={false}
      injectedJavaScript={PORTAL_BRIDGE} injectedJavaScriptForMainFrameOnly
      onLoadEnd={e => { if (done.current || !/\/login/i.test(e.nativeEvent.url || '') || taps.current >= 3) return; taps.current++; web.current?.injectJavaScript(googleTapAgain()); }}
      onShouldStartLoadWithRequest={r => r.isTopFrame === false || googleTestURL(r.url) || navigationPolicy(r.url) === 'portal'}
      onMessage={async e => {
        if (done.current || !isPortalURL(e.nativeEvent.url) || e.nativeEvent.data.length > 22000) return;
        try {
          const msg = JSON.parse(e.nativeEvent.data);
          if (msg.type !== 'su-login' || msg.origin !== PORTAL_ORIGIN) return;
          const s = parseSession(msg.user);
          // Only the same student: a different account never replaces the signed-in one silently.
          if (!s || s.studentId !== a.session?.studentId) { setRun(0); return; }
          done.current = true; await a.signIn(s);
        } catch { /* stays expired; the visible button still works */ }
        finally { if (done.current) setRun(0); }
      }} />
  </View>;
}