import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';
import { GOOGLE_TEST_USER_AGENT } from '@/lib/google-webview-test';
import { launchUrl, loadMoodle, MOODLE, MoodleError, parseLaunch, selfEnrol, withToken, type MItem, type MoodleData } from '@/lib/moodle';
import { newId } from '@/lib/notebook';
import { currentCourses } from '@/lib/student';
import { loadPrivate, removePrivate, savePrivate } from '@/lib/vault';
import { Expand, PageTop } from '@/components/page';
import { Button, Glass, PressScale, Screen, Txt } from '@/components/ui';

const ICON: Record<MItem['kind'], 'document-text-outline' | 'clipboard-outline' | 'help-circle-outline' | 'link-outline' | 'reader-outline' | 'chatbubbles-outline' | 'cube-outline'> =
  { file: 'document-text-outline', assign: 'clipboard-outline', quiz: 'help-circle-outline', link: 'link-outline', page: 'reader-outline', forum: 'chatbubbles-outline', other: 'cube-outline' };

export default function Moodle() {
  const a = useApp(); const { tr, row, palette, cache, lang } = a; const owner = a.session?.studentId ?? 'local';
  const insets = useSafeAreaInsets();
  const K = { token: `su:v2:moodle:${owner}`, data: `su:v2:moodle-data:${owner}`, read: `su:v2:moodle-read:${owner}` };
  const [token, setToken] = useState<string | null>(null); const [data, setData] = useState<MoodleData | null>(null);
  const [read, setRead] = useState<string[]>([]); const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [login, setLogin] = useState<string | null>(null);
  const courses = currentCourses(cache).map(c => ({ code: c.code, title: c.title }));
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  useEffect(() => { let on = true; void Promise.all([loadPrivate<string | null>(K.token, null), loadPrivate<MoodleData | null>(K.data, null), loadPrivate<string[]>(K.read, [])])
    .then(([t, d, r]) => { if (!on) return; setToken(typeof t === 'string' ? t : null); setData(d && Array.isArray(d.courses) ? d : null); setRead(Array.isArray(r) ? r : []); setReady(true); }).catch(() => on && setReady(true)); return () => { on = false; }; }, [owner]);

  async function refresh(t = token) {
    if (!t) return; if (!courses.length) { setError(tr('موادك الحالية لسه متحمّلتش من بوابة الجامعة.', 'Your current courses are not loaded from the portal yet.')); return; }
    setBusy(true); setError('');
    try { const d = await loadMoodle(t, courses); setData(d); await savePrivate(K.data, d); }
    catch (e) {
      if (e instanceof MoodleError && (e.code === 'expired' || e.code === 'invalidtoken')) { setToken(null); await removePrivate(K.token); setError(tr('جلسة Moodle انتهت. سجّل دخول تاني.', 'Moodle session ended. Sign in again.')); }
      else setError(tr('مش قادرين نوصل لـ Moodle دلوقتي. جرّب تاني كمان شوية.', 'Could not reach Moodle. Try again.'));
    } finally { setBusy(false); }
  }
  async function gotToken(t: string) { setLogin(null); setToken(t); await savePrivate(K.token, t); void refresh(t); }
  async function signOut() { setToken(null); setData(null); await Promise.all([removePrivate(K.token), removePrivate(K.data)]); }
  function toggleRead(k: string) { const next = read.includes(k) ? read.filter(x => x !== k) : [...read, k].slice(-3000); setRead(next); void savePrivate(K.read, next); }
  async function enrol(id: number) { if (!token) return; setBusy(true); try { await selfEnrol(token, id); } catch { setError(tr('النسخة دي مش بتسمح إنك تسجّل نفسك. كلّم الدكتور أو IT.', 'Self-enrolment is not allowed for this copy.')); } finally { setBusy(false); } void refresh(); }

  const when = (s: number) => new Date(s * 1000).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const left = (s: number) => { const d = (s * 1000 - Date.now()) / 86400000; return d < 0 ? tr('خلص ميعاده', 'Closed') : d < 1 ? tr('النهارده', 'Due today') : tr(`فاضل ${Math.ceil(d)} يوم`, `${Math.ceil(d)} days left`); };
  const open = (url: string) => { if (url) void Linking.openURL(url); };

  return <Screen padBottom={false} refreshing={busy} onRefresh={token ? () => { void refresh(); } : undefined}>
    <PageTop title="Moodle" subtitle={tr('محاضرات وملفات وتكليفات موادك الحالية', 'Lectures, files and assignments of your current courses')} />
    {!ready ? <Txt variant="sub" center>{tr('بيفتح…', 'Opening…')}</Txt> : !token ? <Glass><View style={{ gap: 12 }}>
      <Txt variant="h3">{tr('ادخل بحساب Google الجامعي', 'Sign in with your university Google account')}</Txt>
      <Txt variant="sub">{tr('هتفتح صفحة Moodle الرسمية (kmoodle.su.edu.eg). التطبيق بياخد مفتاح الدخول بس، ومش بيشوف الباسورد خالص.', 'The official Moodle page opens. The app only receives an access key — never your password.')}</Txt>
      <Button icon="logo-google" title={tr('دخول Moodle', 'Sign in to Moodle')} onPress={() => setLogin(newId() + newId())} />
    </View></Glass> : null}
    {error ? <Txt color={palette.warn}>{error}</Txt> : null}
    {token && !data && !busy ? <Button icon="refresh" title={tr('حمّل موادي', 'Load my courses')} onPress={() => { void refresh(); }} /> : null}
    {busy && !data ? <Txt variant="sub" center>{tr('بندوّر على موادك في Moodle…', 'Finding your courses on Moodle…')}</Txt> : null}
    {data?.courses.map(c => {
      const items = c.items; const tasks = items.filter(i => (i.kind === 'assign' || i.kind === 'quiz')).sort((x, y) => (x.due ?? 9e12) - (y.due ?? 9e12));
      const files = items.filter(i => i.kind === 'file' || i.files.length && i.kind !== 'assign');
      const other = items.filter(i => !tasks.includes(i) && !files.includes(i));
      const fileKeys = files.flatMap(i => i.files.length ? i.files.map(f => `${i.key}:${f.name}`) : [i.key]);
      const done = fileKeys.filter(k => read.includes(k)).length;
      return <Expand key={c.code} color={c.ref?.enrolled ? palette.primary : palette.faint}
        head={<View style={{ gap: 2 }}>
          <Txt variant="label" numberOfLines={2}>{c.title}</Txt>
          <Txt variant="caption">{!c.ref ? tr('مش لاقيينها على Moodle', 'Not found on Moodle') : !c.ref.enrolled ? tr('لقينا نسخة من المادة بس انت مش مسجّل فيها', 'Found, but you are not enrolled') : [c.code, tr(`${files.length} ملف`, `${files.length} files`), fileKeys.length ? tr(`قريت ${done}/${fileKeys.length}`, `read ${done}/${fileKeys.length}`) : '', tasks.length ? tr(`${tasks.length} تكليف`, `${tasks.length} tasks`) : ''].filter(Boolean).join(' · ')}</Txt>
        </View>}>
        {c.ref ? <Txt variant="caption">{[c.ref.fullname, c.ref.teachers.join('، ')].filter(Boolean).join(' · ')}</Txt> : <Txt variant="sub">{tr('ممكن الدكتور لسه منزّلش المادة على Moodle.', 'The course may not be on Moodle yet.')}</Txt>}
        {c.ref && !c.ref.enrolled ? <Button small title={tr('سجّلني في المادة', 'Enrol me')} disabled={busy} onPress={() => { void enrol(c.ref!.id); }} /> : null}
        {tasks.length ? <Txt variant="h3">{tr('التكليفات والكويزات', 'Assignments & quizzes')}</Txt> : null}
        {tasks.map(i => <PressScale key={i.key} label={i.name} onPress={() => open(i.url)}>
          <View style={{ flexDirection: row, gap: 10, alignItems: 'center', paddingVertical: 4 }}>
            <Ionicons name={ICON[i.kind]} size={20} color={i.due && i.due * 1000 < Date.now() ? palette.faint : palette.danger} />
            <View style={{ flex: 1 }}>
              <Txt variant="label" numberOfLines={2}>{i.name}</Txt>
              <Txt variant="caption">{[i.due ? `${tr('آخر ميعاد', 'Due')} ${when(i.due)} · ${left(i.due)}` : tr('من غير ميعاد', 'No due date'), i.submitted === true ? tr('✓ اتسلّم', '✓ Submitted') : i.submitted === false ? tr('لسه متسلّمش', 'Not submitted') : ''].filter(Boolean).join(' · ')}</Txt>
            </View>
          </View></PressScale>)}
        {files.length ? <Txt variant="h3">{tr('المحاضرات والملفات', 'Lectures & files')}</Txt> : null}
        {files.map(i => (i.files.length ? i.files.map(f => ({ k: `${i.key}:${f.name}`, name: i.files.length > 1 ? `${i.name} — ${f.name}` : i.name, url: withToken(f.url, token ?? ''), time: f.time ?? i.time })) : [{ k: i.key, name: i.name, url: i.url, time: i.time }]).map(f =>
          <View key={f.k} style={{ flexDirection: row, gap: 10, alignItems: 'center', paddingVertical: 4 }}>
            <PressScale label={tr('قريته', 'Read')} onPress={() => toggleRead(f.k)}><Ionicons name={read.includes(f.k) ? 'checkbox' : 'square-outline'} size={24} color={read.includes(f.k) ? palette.success : palette.sub} /></PressScale>
            <PressScale style={{ flex: 1 }} label={f.name} onPress={() => open(f.url)}>
              <Txt variant="label" numberOfLines={2} style={read.includes(f.k) ? { opacity: 0.6 } : undefined}>{f.name}</Txt>
              <Txt variant="caption">{[i.section, f.time ? when(f.time) : ''].filter(Boolean).join(' · ')}</Txt>
            </PressScale>
          </View>))}
        {other.length ? <Txt variant="h3">{tr('حاجات تانية', 'Other')}</Txt> : null}
        {other.map(i => <PressScale key={i.key} label={i.name} onPress={() => open(i.url)}><View style={{ flexDirection: row, gap: 10, alignItems: 'center', paddingVertical: 3 }}><Ionicons name={ICON[i.kind]} size={18} color={palette.sub} /><Txt style={{ flex: 1 }} numberOfLines={2}>{i.name}</Txt></View></PressScale>)}
        {c.ref?.enrolled && !items.length ? <Txt variant="sub">{tr('المادة لسه فاضية على Moodle.', 'Nothing posted yet.')}</Txt> : null}
      </Expand>;
    })}
    {data ? <Txt variant="caption" center>{tr(`آخر تحديث ${new Date(data.at).toLocaleString(locale)}`, `Updated ${new Date(data.at).toLocaleString(locale)}`)}{data.user ? ` · ${data.user}` : ''}</Txt> : null}
    {token ? <Button small variant="glass" icon="log-out-outline" title={tr('خروج من Moodle', 'Sign out of Moodle')} onPress={() => { void signOut(); }} /> : null}
    <Modal visible={!!login} animationType="slide" onRequestClose={() => setLogin(null)}>
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg[0] }}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
          <Txt variant="label">kmoodle.su.edu.eg</Txt>
          <Button small variant="glass" title={tr('قفل', 'Close')} onPress={() => setLogin(null)} />
        </View>
        {login ? <WebView source={{ uri: launchUrl(login) }} style={{ flex: 1 }} userAgent={GOOGLE_TEST_USER_AGENT || undefined}
          sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled domStorageEnabled
          originWhitelist={['http://*', 'https://*', 'moodlemobile://*', 'intent://*']}
          onShouldStartLoadWithRequest={r => {
            if (/^https?:/i.test(r.url)) return true;
            const p = parseLaunch(r.url); if (p) void gotToken(p.token);
            else setError(tr('الدخول ما كملش. جرّب تاني.', 'Sign-in did not finish. Try again.'));
            return false;
          }} /> : null}
      </View>
    </Modal>
    <Txt variant="caption" center color={palette.faint}>{tr(`البيانات من ${MOODLE.replace('https://', '')} ومتشفّرة على موبايلك. علامة "قريته" بتتحفظ عندك بس.`, 'Data comes from the official Moodle and is encrypted on your phone. "Read" marks stay on your device.')}</Txt>
  </Screen>;
}