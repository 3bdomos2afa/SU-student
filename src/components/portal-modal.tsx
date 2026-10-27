import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { GOOGLE_TEST_USER_AGENT, googleTestAvailable, googleTestURL } from '@/lib/google-webview-test';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Modal, Platform, Pressable, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ProgressBar, Txt } from './ui';
import { getJSON, setJSON } from '@/lib/storage';
import { useApp } from '@/context/app-context';
import { navigationPolicy } from '@/lib/navigation-policy';
import { isPortalURL, parseSession, PORTAL_LOGIN, PORTAL_ORIGIN } from '@/lib/portal';
import { ssoConfigured, universityGoogleSignIn } from '@/lib/university-sso';
import { googleTapAgain } from '@/lib/google-tap';

// Reads the session the official page stores after a successful login. Never reads passwords.
const bridge = `
(function(){
  if(window.top!==window || location.origin!==${JSON.stringify(PORTAL_ORIGIN)} || window.__suBridge) return;
  window.__suBridge=true;
  var timer=setInterval(function(){
    try {
      var raw=sessionStorage.getItem('user');
      if(!raw||raw.length>20000)return;
      var u=JSON.parse(raw);
      if(!(u.Token||u.token)||!u.StudentID)return;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'su-login',origin:location.origin,
        user:{Token:u.Token||u.token,StudentID:u.StudentID,FirstNameEN:u.FirstNameEN,LastNameEN:u.LastNameEN}
      }));
      clearInterval(timer);
    }catch(e){}
  },500);
  setTimeout(function(){clearInterval(timer);},900000);
})();true;
`;


const isGoogle = (url: string) => { try { return /(^|\.)accounts\.google\.com$/.test(new URL(url).hostname); } catch { return false; } };

export function PortalModal({ visible, onClose, browse = false }: { visible: boolean; onClose: () => void; browse?: boolean }) {
  const { tr, palette, signIn, row } = useApp();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'' | 'saving' | 'google'>('');
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState(0);
  // Cookies persist so Google remembers the account; only after a sign-out does the next login start clean.
  const [forget, setForget] = useState(false);
  const handled = useRef(false);
  const web = useRef<WebView>(null);
  const autoTap = useRef(false);
  // true after a Google sign-in on this phone (until sign-out): the Google button is tapped for the student.
  const [remembered, setRemembered] = useState(false);
  const externalBusy = useRef(false);
  const sso = ssoConfigured();
  const testAvailable = !browse && googleTestAvailable(Platform.OS, Constants.expoConfig?.extra);
  // Android: the page runs with a Chrome user agent so its own Google button opens a real popup. Google may still refuse.
  const [googleMode, setGoogleMode] = useState(testAvailable);
  const close = () => { setError(''); handled.current = false; onClose(); };
  useEffect(() => { if (visible) { void Promise.all([getJSON<boolean>('su:v2:forget-web', false), getJSON<boolean>('su:v2:google-used', false)]).then(([f, g]) => { setForget(f === true); setRemembered(g === true && f !== true); }).catch(() => {}); autoTap.current = false; setGoogleMode(testAvailable); handled.current = false; setError(''); setBusy(''); setKey(k => k + 1); } }, [visible]);

  async function google() {
    if (busy) return;
    if (!sso) { setError(tr('الدخول الرسمي بجوجل مش متاح في النسخة دي.', 'Official Google sign-in is not connected in this build.')); return; }
    setBusy('google'); setError('');
    try { const s = await universityGoogleSignIn(); if (s) { await signIn(s); void setJSON('su:v2:forget-web', false).catch(() => {}); close(); } }
    catch { setError(tr('الدخول بجوجل مكملش. اتأكد إنك داخل بإيميل الجامعة وجرّب تاني.', 'Google sign-in did not finish. Use your university email and try again.')); }
    finally { setBusy(''); }
  }
  const tapGoogle = () => { web.current?.injectJavaScript(googleTapAgain()); };
  async function openExternal(url: string) {
    if (isGoogle(url)) { void google(); return; }
    if (externalBusy.current) return;
    if (navigationPolicy(url) === 'blocked') { setError(tr('الرابط ده مش آمن، فمش هنفتحه.', 'This link cannot be opened safely.')); return; }
    externalBusy.current = true;
    try { await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }); }
    catch { setError(tr('مقدرناش نفتح الرابط.', 'Could not open the link.')); }
    finally { externalBusy.current = false; }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: palette.bg[0] }}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: palette.glassBorder }} />
        </View>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{tr('بوابة يونيكود', 'UnicodeSIS portal')}</Txt>
            <Txt variant="caption">unicodesis.su.edu.eg</Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('قفل', 'Close')} onPress={close} hitSlop={12}
            style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.glassBorder }}>
            <Ionicons name="close" size={20} color={palette.text} />
          </Pressable>
        </View>

        {!browse && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 10, gap: 8 }}>
            {googleMode ? (
              <View style={{ padding: 12, borderRadius: 14, backgroundColor: palette.card, gap: 6 }}>
                <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
                  <Ionicons name="logo-google" size={18} color={palette.text} />
                  <Txt variant="h3">{tr('سجّل بحساب جوجل', 'Sign in with Google')}</Txt>
                </View>
                <Txt variant="caption">{remembered
                  ? tr('حساب جوجل بتاعك محفوظ، وبنضغط زر Google لوحدنا. لو ظهرتلك قايمة الإيميلات اختار إيميل الجامعة.', 'Your Google account is remembered and we tap the Google button for you. If the account list shows, pick your university email.')
                  : tr('دوس "دخول سريع بجوجل" واختار إيميل الجامعة. الحساب هيفضل محفوظ على الموبايل لحد ما تعمل تسجيل خروج.', 'Tap "Quick Google sign-in" and pick your university email. It stays remembered until you sign out.')}</Txt>
                <Button small icon="logo-google" title={tr('دخول سريع بجوجل', 'Quick Google sign-in')} onPress={tapGoogle} />
              </View>
            ) : sso ? (
              <Button icon="logo-google" variant="primary" loading={busy === 'google'} title={tr('الدخول بحساب جوجل', 'Continue with Google')} onPress={() => { void google(); }} />
            ) : (
              <Txt variant="caption" center>{tr('سجّل في صفحة الجامعة تحت.', 'Sign in on the university page below.')}</Txt>
            )}
          </View>
        )}

        {progress > 0 && progress < 1 ? <ProgressBar value={progress} /> : <View style={{ height: 4 }} />}
        {error ? (
          <View style={{ marginHorizontal: 18, marginVertical: 8, padding: 12, borderRadius: 14, backgroundColor: palette.card, gap: 8 }}>
            <Txt color={palette.warn}>{error}</Txt>
            <Button small variant="glass" title={tr('جرّب تاني', 'Try again')} onPress={() => { setError(''); handled.current = false; setKey(k => k + 1); }} />
          </View>
        ) : null}

        {Platform.OS === 'web' ? (
          <View style={{ padding: 24 }}><Txt>{tr('تسجيل الدخول شغال على أبلكيشن أندرويد وآيفون بس.', 'Sign-in works in the Android and iPhone app only.')}</Txt></View>
        ) : (
          <View style={{ flex: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', backgroundColor: '#fff' }}>
            <WebView<{}> key={key} ref={web} source={{ uri: PORTAL_LOGIN }} style={{ flex: 1 }}
              onLoadEnd={() => { if (!browse && googleMode && remembered && !autoTap.current) { autoTap.current = true; tapGoogle(); } }}
              originWhitelist={['*']}
              userAgent={googleMode ? GOOGLE_TEST_USER_AGENT : undefined}
              setSupportMultipleWindows
              webviewDebuggingEnabled={false}
              onLoadProgress={e => setProgress(e.nativeEvent.progress)}
              onShouldStartLoadWithRequest={r => {
                if (r.isTopFrame === false) return true;
                if (googleMode && googleTestURL(r.url)) return true;
                const policy = navigationPolicy(r.url);
                if (policy === 'portal') return true;
                if (policy === 'external') void openExternal(r.url);
                else setError(tr('الرابط ده مش آمن، فمش هنفتحه.', 'This link cannot be opened safely.'));
                return false;
              }}
              onOpenWindow={googleMode ? undefined : e => { void openExternal(e.nativeEvent.targetUrl); }}
              injectedJavaScript={browse ? 'true;' : bridge}
              injectedJavaScriptForMainFrameOnly
              onMessage={async e => {
                if (browse || handled.current || !isPortalURL(e.nativeEvent.url) || e.nativeEvent.data.length > 22000) return;
                try {
                  const msg = JSON.parse(e.nativeEvent.data);
                  if (msg.type !== 'su-login' || msg.origin !== PORTAL_ORIGIN) return;
                  const s = parseSession(msg.user);
                  if (!s) { setError(tr('الحساب ده مش حساب طالب. ادخل بحساب الطالب بتاعك.', 'This is not a student account. Use your student account.')); return; }
                  handled.current = true; setBusy('saving');
                  await signIn(s);
                  if (googleMode) void setJSON('su:v2:google-used', true).catch(() => {});
                  close();
                } catch { handled.current = false; setError(tr('مقدرناش نحفظ الدخول. جرّب تاني.', 'Could not save the sign-in. Please try again.')); }
                finally { setBusy(''); }
              }}
              incognito={forget} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={googleMode}
              allowFileAccess={false} allowUniversalAccessFromFileURLs={false}
              saveFormDataDisabled
              javaScriptCanOpenWindowsAutomatically mixedContentMode="never"
              startInLoadingState renderLoading={() => <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center', top: 40 }} color={palette.primary} />}
              onError={() => setError(tr('صفحة الجامعة مش بتفتح. اتأكد من النت وجرّب تاني.', 'The university page is not loading. Check your connection and try again.'))}
              onHttpError={e => { if (e.nativeEvent.statusCode >= 500) setError(tr('موقع الجامعة مش شغال دلوقتي. جرّب بعد شوية.', 'The university site is down right now. Try again later.')); }}
              onContentProcessDidTerminate={() => setKey(k => k + 1)}
              onRenderProcessGone={() => setKey(k => k + 1)}
            />
            {busy === 'saving' ? (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: palette.bg[0] }}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Txt variant="h3">{tr('تمام! بنجيب بياناتك…', 'Done! Loading your data…')}</Txt>
              </View>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}