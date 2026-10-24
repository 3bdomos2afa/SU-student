import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { GOOGLE_TEST_USER_AGENT, googleTestAvailable, googleTestURL } from '@/lib/google-webview-test';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ProgressBar, Txt } from './ui';
import { useApp } from '@/context/app-context';
import { navigationPolicy } from '@/lib/navigation-policy';
import { isPortalURL, parseSession, PORTAL_LOGIN, PORTAL_ORIGIN } from '@/lib/portal';
import { ssoConfigured, universityGoogleSignIn } from '@/lib/university-sso';

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
  const handled = useRef(false);
  const externalBusy = useRef(false);
  const sso = ssoConfigured();
  const testAvailable = !browse && googleTestAvailable(Platform.OS, Constants.expoConfig?.extra);
  const [testEnabled, setTestEnabled] = useState(false);
  function toggleTest() {
    if (testEnabled) { setTestEnabled(false); setKey(k => k + 1); setError(''); return; }
    Alert.alert(
      tr('تجربة جوجل — مش تسجيل رسمي', 'Google experiment — not official sign-in'),
      tr('التجربة بتغيّر تعريف المتصفح وممكن جوجل يرفضها. صفحة جوجل هتفتح جوه التطبيق؛ التطبيق موثوق عندك فقط. مابنقراش الباسورد. الأفضل حساب اختبار، وماتشاركش أي كود أو جلسة دخول. تكمّل؟',
        'This changes the browser user agent and Google may reject it. Google opens inside this app: only proceed if you trust it. We do not read passwords. Prefer a test account; never share sign-in codes or sessions. Continue?'),
      [{ text: tr('إلغاء', 'Cancel'), style: 'cancel' },
       { text: tr('أجرّب', 'Try'), onPress: () => { setTestEnabled(true); setError(''); setKey(k => k + 1); } }]
    );
  }
  const close = () => { setTestEnabled(false); setError(''); handled.current = false; onClose(); };
  useEffect(() => { if (visible) { setTestEnabled(false); handled.current = false; setError(''); setBusy(''); setKey(k => k + 1); } }, [visible]);

  async function google() {
    if (busy) return;
    if (!sso) { setError(tr('الدخول الرسمي بجوجل مش متوصل في النسخة دي. في النسخة التجريبية استخدم زر التجربة.', 'Official Google sign-in is not connected in this build. In the trial build, use the experiment button.')); return; }
    setBusy('google'); setError('');
    try { const s = await universityGoogleSignIn(); if (s) { await signIn(s); close(); } }
    catch { setError(tr('الدخول بجوجل مكملش. اتأكد إنك داخل بإيميل الجامعة وجرّب تاني.', 'Google sign-in did not finish. Use your university email and try again.')); }
    finally { setBusy(''); }
  }
  async function openExternal(url: string) {
    if (isGoogle(url)) { void google(); return; }
    if (externalBusy.current) return;
    if (navigationPolicy(url) === 'blocked') { setError(tr('الرابط ده مش آمن نفتحه.', 'This link cannot be opened safely.')); return; }
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
            {testAvailable ? (
              <Button icon="flask-outline" variant="glass"
                title={testEnabled ? tr('اقفل تجربة جوجل', 'Disable Google experiment') : tr('جرّب دخول جوجل — تجريبي', 'Try Google sign-in — experimental')}
                onPress={toggleTest} />
            ) : null}
            {!testEnabled ? <Button icon="logo-google" variant={sso ? 'primary' : 'glass'} loading={busy === 'google'} title={tr('الدخول بحساب جوجل', 'Continue with Google')} onPress={() => { void google(); }} /> : null}
            <Txt variant="caption" center>
              {testEnabled
                ? tr('تجربة أندرويد: اضغط زر جوجل الأصلي جوه صفحة الجامعة تحت. ممكن تظهر رسالة رفض من جوجل؛ لو ظهرت، اقفل التجربة.', 'Android experiment: tap the original Google button on the university page below. Google may reject it; disable the experiment if it does.')
                : sso
                ? tr('أو سجّل باسم المستخدم وكلمة السر في الصفحة تحت', 'Or sign in with your username and password below')
                : tr('سجّل في صفحة الجامعة تحت. دخول جوجل الرسمي مش متوصل؛ التجربة المنفصلة مش مضمونة.', 'Sign in on the university page below. Official Google sign-in is not connected; the separate experiment is not guaranteed.')}
            </Txt>
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
          <View style={{ padding: 24 }}><Txt>{tr('تسجيل الدخول شغال في أبلكيشن أندرويد وآيفون بس.', 'Sign-in works in the Android and iPhone app only.')}</Txt></View>
        ) : (
          <View style={{ flex: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', backgroundColor: '#fff' }}>
            <WebView<{}> key={key} source={{ uri: PORTAL_LOGIN }} style={{ flex: 1 }}
              originWhitelist={['*']}
              userAgent={testEnabled ? GOOGLE_TEST_USER_AGENT : undefined}
              setSupportMultipleWindows
              webviewDebuggingEnabled={false}
              onLoadProgress={e => setProgress(e.nativeEvent.progress)}
              onShouldStartLoadWithRequest={r => {
                if (r.isTopFrame === false) return true;
                if (testEnabled && googleTestURL(r.url)) return true;
                const policy = navigationPolicy(r.url);
                if (policy === 'portal') return true;
                if (policy === 'external') void openExternal(r.url);
                else setError(tr('الرابط ده مش آمن نفتحه.', 'This link cannot be opened safely.'));
                return false;
              }}
              onOpenWindow={testEnabled ? undefined : e => { void openExternal(e.nativeEvent.targetUrl); }}
              injectedJavaScript={browse ? 'true;' : bridge}
              injectedJavaScriptForMainFrameOnly
              onMessage={async e => {
                if (browse || handled.current || !isPortalURL(e.nativeEvent.url) || e.nativeEvent.data.length > 22000) return;
                try {
                  const msg = JSON.parse(e.nativeEvent.data);
                  if (msg.type !== 'su-login' || msg.origin !== PORTAL_ORIGIN) return;
                  const s = parseSession(msg.user);
                  if (!s) { setError(tr('الحساب ده مش حساب طالب. ادخل بحساب الطالب.', 'This is not a student account. Use your student account.')); return; }
                  handled.current = true; setBusy('saving');
                  await signIn(s); close();
                } catch { handled.current = false; setError(tr('مقدرناش نحفظ الدخول. جرّب تاني.', 'Could not save the sign-in. Please try again.')); }
                finally { setBusy(''); }
              }}
              incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={testEnabled}
              allowFileAccess={false} allowUniversalAccessFromFileURLs={false}
              saveFormDataDisabled
              javaScriptCanOpenWindowsAutomatically mixedContentMode="never"
              startInLoadingState renderLoading={() => <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center', top: 40 }} color={palette.primary} />}
              onError={() => setError(tr('صفحة الجامعة مش بتفتح. اتأكد من النت وجرّب تاني.', 'The university page is not loading. Check your connection and try again.'))}
              onHttpError={e => { if (e.nativeEvent.statusCode >= 500) setError(tr('موقع الجامعة واقع دلوقتي. جرّب بعد شوية.', 'The university site is down right now. Try again later.')); }}
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