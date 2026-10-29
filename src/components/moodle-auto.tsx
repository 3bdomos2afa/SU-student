// After the student's Google sign-in, KMoodle signs in by itself in a hidden WebView (same Google account,
// via the official mobile launch) and syncs the files — no Moodle login screen. Visible login stays as fallback.
import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '@/context/app-context';
import { getJSON } from '@/lib/storage';
import { GOOGLE_TEST_USER_AGENT, googleTestAvailable } from '@/lib/google-webview-test';
import { launchUrl, parseLaunch } from '@/lib/moodle';
import { moodleCheck, moodleCurrent } from '@/lib/moodle-alerts';
import { newId } from '@/lib/notebook';
import { loadPrivate, savePrivate } from '@/lib/vault';

const COOLDOWN = 30 * 60000, TIMEOUT = 50000;
// Presses KMoodle's Google button; on Google's chooser it picks the account only when there is exactly one.
const PICK = `(function(){var n=0,t=setInterval(function(){n++;if(n>40){clearInterval(t);return;}try{
var h=location.host;
if(/kmoodle/.test(h)){var b=document.querySelector('a[href*="oauth2/login.php"],a.login-identityprovider-btn');if(b){clearInterval(t);b.click();}}
else if(/accounts\\.google\\./.test(h)){var l=document.querySelectorAll('[data-identifier]');if(l.length===1){clearInterval(t);l[0].click();}}
}catch(e){}},500);})();true;`;

export function MoodleAuto() {
  const a = useApp();
  const owner = a.session?.studentId;
  const capable = Platform.OS === 'android' && googleTestAvailable(Platform.OS, Constants.expoConfig?.extra);
  const hasCourses = moodleCurrent(a.cache).length > 0;
  const want = capable && a.ready && !!owner && a.online && !a.locked && !a.authExpired && hasCourses;
  const [run, setRun] = useState<string | null>(null);
  const last = useRef(0), done = useRef(false);
  const cacheRef = useRef(a.cache); cacheRef.current = a.cache;
  useEffect(() => {
    if (!want || run || Date.now() - last.current < COOLDOWN) return;
    let alive = true;
    void Promise.all([getJSON<boolean>('su:v2:google-used', false), getJSON<boolean>('su:v2:forget-web', false), loadPrivate<string | null>(`su:v2:moodle:${owner}`, null)])
      .then(([g, f, t]) => {
        if (!alive || g !== true || f === true || typeof t === 'string') return;
        last.current = Date.now(); done.current = false; setRun(newId() + newId());
      }).catch(() => {});
    return () => { alive = false; };
  }, [want, run, owner]);
  useEffect(() => { if (!run) return; const t = setTimeout(() => setRun(null), TIMEOUT); return () => clearTimeout(t); }, [run]);
  async function got(token: string) {
    if (done.current || !owner) return;
    done.current = true; setRun(null);
    await savePrivate(`su:v2:moodle:${owner}`, token);
    void moodleCheck(owner, cacheRef.current, a.lang !== 'en').catch(() => 0);
  }
  if (!run) return null;
  return <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 }}>
    <WebView source={{ uri: launchUrl(run) }} userAgent={GOOGLE_TEST_USER_AGENT || undefined}
      sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled domStorageEnabled
      originWhitelist={['http://*', 'https://*', 'moodlemobile://*', 'intent://*']}
      injectedJavaScript={PICK} injectedJavaScriptForMainFrameOnly
      onShouldStartLoadWithRequest={r => { if (/^https?:/i.test(r.url)) return true; const p = parseLaunch(r.url); if (p) void got(p.token); return false; }} />
  </View>;
}