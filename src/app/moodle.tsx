import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@/components/icon';
import { Alert, BackHandler, Linking, Modal, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/app-context';
import type { IconName } from '@/data/services';
import { GOOGLE_TEST_USER_AGENT } from '@/lib/google-webview-test';
import { launchUrl, loadMoodle, MOODLE, MoodleError, parseLaunch, selfEnrol, withToken, type MCourse, type MItem, type MOld, type MoodleData } from '@/lib/moodle';
import { ago, allRows, bySection, courseRows, filesLabel, fmtSize, isFileItem, kindOf, latest, searchRows, type FileKind, type FileRow } from '@/lib/moodle-files';
import { canDownload, downloadFile, openLocal, removeLocal, type Saved } from '@/lib/moodle-download';
import { newId } from '@/lib/notebook';
import { currentCourses } from '@/lib/student';
import { timetable } from '@/lib/academic';
import { teachersFor, termLabel, termOf } from '@/lib/moodle-match';
import { hard, readableOn } from '@/lib/theme';
import { loadPrivate, removePrivate, savePrivate } from '@/lib/vault';
import { PageTop } from '@/components/page';
import { Button, Field, Glass, PressScale, Screen, Txt } from '@/components/ui';

const FOLD = [
  { tab: '#8EFF01', box: '#8EFF01' },
  { tab: '#8B53FE', box: '#C9AEFF' },
  { tab: '#FFD23F', box: '#FFE58A' },
  { tab: '#FF5C8A', box: '#FFB3C7' },
] as const;
const FILE_ICON: Record<FileKind, IconName> = {
  pdf: 'document-text', slides: 'easel', doc: 'document', sheet: 'grid', archive: 'archive', image: 'image', media: 'play-circle', other: 'document-attach',
};
const ITEM_ICON: Record<MItem['kind'], IconName> = {
  file: 'document-text-outline', assign: 'clipboard-outline', quiz: 'help-circle-outline', link: 'link-outline', page: 'reader-outline', forum: 'chatbubbles-outline', other: 'cube-outline',
};

function Folder({ c, color, count, offline, onPress }: { c: MCourse; color: (typeof FOLD)[number]; count: number; offline: number; onPress: () => void }) {
  const { palette, row, tr, isAr } = useApp();
  const off = !c.ref?.enrolled;
  const meta = !c.ref ? tr('مش على Moodle', 'Not on Moodle') : off ? tr('مش مسجّل فيها', 'Not enrolled') : filesLabel(count, isAr);
  return (
    <PressScale style={{ width: '48%' }} label={c.title} onPress={onPress}>
      <View style={{ opacity: off ? 0.62 : 1 }}>
        <View style={{ width: '48%', height: 15, marginStart: 14, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: color.tab, borderWidth: 2.5, borderBottomWidth: 0, borderColor: 'transparent' }} />
        <View style={{ marginTop: -2, minHeight: 132, padding: 13, gap: 10, borderRadius: 18, backgroundColor: palette.card, borderWidth: 2.5, borderColor: 'transparent', boxShadow: hard(palette.ink, 4) }}>
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: color.box, borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={off ? 'folder-outline' : 'folder-open'} size={22} color={readableOn(color.box)} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Txt variant="caption" color={palette.sub}>{meta}</Txt>
              {offline ? <Txt variant="caption" color={palette.sub} style={{ fontSize: 11, lineHeight: 15 }}>{tr(`${offline} على الموبايل`, `${offline} offline`)}</Txt> : null}
            </View>
          </View>
          <View style={{ gap: 1 }}>
            <Txt variant="h3" numberOfLines={1}>{c.code}</Txt>
            <Txt variant="caption" numberOfLines={2}>{c.title}</Txt>
            {c.ref ? <Txt variant="caption" color={palette.sub} style={{ fontSize: 11, lineHeight: 15 }}>{termLabel(termOf(c.ref), isAr)}</Txt> : null}
          </View>
        </View>
      </View>
    </PressScale>
  );
}

function FileCard({ f, saved, pct, read, showCourse, onAction, onRead, onLong }: {
  f: FileRow; saved?: Saved; pct?: number; read: boolean; showCourse?: boolean; onAction: () => void; onRead?: () => void; onLong?: () => void;
}) {
  const { palette, row, tr, isAr } = useApp();
  const box = read ? palette.lim : palette.lil;
  const meta = [showCourse ? f.course : f.section, fmtSize(saved?.size ?? f.size, isAr), ago(f.time, isAr)].filter(Boolean).join(' · ');
  const busy = pct !== undefined;
  const btn = busy
    ? { bg: palette.soft, fg: palette.text, icon: null, label: `${Math.round(pct! * 100)}%` }
    : saved
      ? { bg: palette.soft, fg: palette.text, icon: 'checkmark-done' as IconName, label: tr('افتح', 'Open') }
      : f.direct && canDownload
        ? { bg: palette.lime, fg: palette.onLime, icon: 'download-outline' as IconName, label: tr('نزّل', 'Get') }
        : { bg: palette.soft, fg: palette.text, icon: 'open-outline' as IconName, label: tr('افتح', 'Open') };
  return (
    <PressScale label={f.title} onPress={onAction} onLongPress={onLong}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 11, padding: 11, borderRadius: 16, backgroundColor: palette.card, borderWidth: 2.5, borderColor: 'transparent', boxShadow: hard(palette.ink, 3) }}>
        <PressScale label={tr('قريته', 'Read')} onPress={onRead} disabled={!onRead}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: box, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={read ? 'checkmark' : FILE_ICON[f.direct ? kindOf(f.name) : 'other']} size={21} color={palette.text} />
          </View>
        </PressScale>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="label" numberOfLines={2} style={read ? { opacity: 0.65 } : undefined}>{f.title}</Txt>
          {meta ? <Txt variant="caption" numberOfLines={1}>{meta}</Txt> : null}
        </View>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: btn.bg, borderWidth: 2, borderColor: 'transparent' }}>
          {btn.icon ? <Ionicons name={btn.icon} size={15} color={btn.fg} /> : null}
          <Txt variant="label" style={{ color: btn.fg, fontSize: 13, lineHeight: 18 }}>{btn.label}</Txt>
        </View>
      </View>
    </PressScale>
  );
}

export default function Moodle() {
  const a = useApp(); const { tr, row, palette, cache, lang, isAr } = a; const owner = a.session?.studentId ?? 'local';
  const insets = useSafeAreaInsets();
  const K = { token: `su:v2:moodle:${owner}`, data: `su:v2:moodle-data:${owner}`, read: `su:v2:moodle-read:${owner}`, saved: `su:v2:moodle-saved:${owner}` };
  const [token, setToken] = useState<string | null>(null); const [data, setData] = useState<MoodleData | null>(null);
  const [read, setRead] = useState<string[]>([]); const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Record<string, Saved>>({}); const [progress, setProgress] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [login, setLogin] = useState<string | null>(null);
  const [q, setQ] = useState(''); const [sel, setSel] = useState<string | null>(null); const [oldOpen, setOldOpen] = useState<number | null>(null);
  const slots = useMemo(() => timetable(cache), [cache]);
  const courses = currentCourses(cache).map(c => ({ code: c.code, title: c.title, teachers: teachersFor(slots, c.code, c.row?.InstructorName) }));
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';

  useEffect(() => {
    let on = true;
    void Promise.all([loadPrivate<string | null>(K.token, null), loadPrivate<MoodleData | null>(K.data, null), loadPrivate<string[]>(K.read, []), loadPrivate<Record<string, Saved>>(K.saved, {})])
      .then(([t, d, r, s]) => {
        if (!on) return;
        setToken(typeof t === 'string' ? t : null); setData(d && Array.isArray(d.courses) ? d : null); setRead(Array.isArray(r) ? r : []);
        setSaved(s && typeof s === 'object' && !Array.isArray(s) ? s : {}); setReady(true);
      }).catch(() => on && setReady(true));
    return () => { on = false; };
  }, [owner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sel) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setSel(null); return true; });
    return () => sub.remove();
  }, [sel]);

  const rows = useMemo(() => (data ? allRows(data.courses) : []), [data]);
  const found = useMemo(() => searchRows(rows, q), [rows, q]);

  async function refresh(t = token) {
    if (!t) return; if (!courses.length) { setError(tr('موادك الحالية لسه متحمّلتش من بوابة الجامعة.', 'Your current courses are not loaded from the portal yet.')); return; }
    setBusy(true); setError('');
    try { const d = await loadMoodle(t, courses); setData(d); await savePrivate(K.data, d); }
    catch (e) {
      if (e instanceof MoodleError && (e.code === 'expired' || e.code === 'invalidtoken')) await expired();
      else setError(tr('مش قادرين نوصل لـ Moodle دلوقتي. جرّب تاني كمان شوية.', 'Could not reach Moodle. Try again.'));
    } finally { setBusy(false); }
  }
  async function expired() { setToken(null); await removePrivate(K.token); setError(tr('جلسة Moodle انتهت. سجّل دخول تاني.', 'Moodle session ended. Sign in again.')); }
  async function gotToken(t: string) { setLogin(null); setToken(t); await savePrivate(K.token, t); void refresh(t); }
  /** Downloaded files stay on the phone after signing out; they are the student's own copies. */
  async function signOut() { setToken(null); setData(null); setSel(null); await Promise.all([removePrivate(K.token), removePrivate(K.data)]); }
  function toggleRead(k: string) { const next = read.includes(k) ? read.filter(x => x !== k) : [...read, k].slice(-3000); setRead(next); void savePrivate(K.read, next); }
  function keep(next: Record<string, Saved>) { setSaved(next); void savePrivate(K.saved, next); }
  function forget(k: string) { setSaved(prev => { const n = { ...prev }; delete n[k]; void savePrivate(K.saved, n); return n; }); }
  async function enrol(id: number) {
    if (!token) return; setBusy(true);
    try { await selfEnrol(token, id); await refresh(); }
    catch { setError(tr('النسخة دي مش بتسمح إنك تسجّل نفسك. كلّم الدكتور أو IT.', 'Self-enrolment is not allowed for this copy.')); }
    finally { setBusy(false); }
  }
  const open = (url: string) => { if (url) void Linking.openURL(url); };

  async function act(f: FileRow) {
    setError('');
    const s = saved[f.key];
    if (s) {
      try { await openLocal(s.uri, f.name); }
      catch (e) {
        if (e instanceof MoodleError && e.code === 'missing') { forget(f.key); setError(tr('الملف اتمسح من الموبايل، نزّله تاني.', 'The saved copy is gone. Download it again.')); }
        else setError(tr('مفيش أبلكيشن على موبايلك يفتح الملف ده.', 'No app on this phone can open this file.'));
      }
      return;
    }
    if (!f.direct || !canDownload) { open(f.direct && token ? withToken(f.url, token) : f.url); return; }
    if (!token) { setError(tr('سجّل دخول Moodle الأول عشان تنزّل الملف.', 'Sign in to Moodle first to download.')); return; }
    if (progress[f.key] !== undefined) return;
    setProgress(p => ({ ...p, [f.key]: 0 }));
    try {
      const r = await downloadFile(owner, f, withToken(f.url, token), x => setProgress(p => (f.key in p ? { ...p, [f.key]: x } : p)));
      setSaved(prev => { const n = { ...prev, [f.key]: r }; void savePrivate(K.saved, n); return n; });
    } catch (e) {
      if (e instanceof MoodleError && e.code === 'expired') await expired();
      else setError(tr('التنزيل وقف. اتأكد من النت وجرّب تاني.', 'Download stopped. Check your connection and retry.'));
    } finally { setProgress(p => { const n = { ...p }; delete n[f.key]; return n; }); }
  }
  function askRemove(f: FileRow) {
    const s = saved[f.key]; if (!s) return;
    Alert.alert(tr('تمسح النسخة اللي على الموبايل؟', 'Remove the saved copy?'), f.title, [
      { text: tr('لأ', 'No'), style: 'cancel' },
      { text: tr('امسح', 'Remove'), style: 'destructive', onPress: () => { void removeLocal(s.uri); forget(f.key); } },
    ]);
  }
  const card = (f: FileRow, showCourse = false) => <FileCard key={f.key} f={f} saved={saved[f.key]} pct={progress[f.key]} read={read.includes(f.key)} showCourse={showCourse}
    onAction={() => { void act(f); }} onRead={() => toggleRead(f.key)} onLong={saved[f.key] ? () => askRemove(f) : undefined} />;

  const when = (s: number) => new Date(s * 1000).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const left = (s: number) => { const d = (s * 1000 - Date.now()) / 86400000; return d < 0 ? tr('خلص ميعاده', 'Closed') : d < 1 ? tr('النهارده', 'Due today') : tr(`فاضل ${Math.ceil(d)} يوم`, `${Math.ceil(d)} days left`); };

  const course = sel ? data?.courses.find(c => c.code === sel) ?? null : null;
  const ci = course && data ? data.courses.indexOf(course) : 0;

  function oldFolder(c: MCourse, o: MOld) {
    const files = courseRows({ ...c, items: o.items }); const on = oldOpen === o.ref.id;
    const term = termLabel(termOf(o.ref), isAr);
    return <View key={o.ref.id} style={{ gap: 8 }}>
      <PressScale label={term} onPress={() => setOldOpen(on ? null : o.ref.id)}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: palette.card, borderWidth: 2, borderColor: 'transparent' }}>
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: palette.yel, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={on ? 'folder-open' : 'folder'} size={19} color={palette.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: row }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 2, borderRadius: 10, backgroundColor: palette.purple, borderWidth: 1.5, borderColor: 'transparent' }}>
                <Txt variant="caption" color="#FFFFFF" style={{ fontSize: 11.5, lineHeight: 16 }}>{term}</Txt>
              </View>
            </View>
            <Txt variant="caption" numberOfLines={1}>{[o.ref.fullname, o.ref.teachers.join('، '), o.items.length ? filesLabel(files.length, isAr) : ''].filter(Boolean).join(' · ')}</Txt>
          </View>
          <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={18} color={palette.sub} />
        </View>
      </PressScale>
      {on ? files.length ? files.map(f => card(f)) : <View style={{ gap: 8 }}>
        <Txt variant="caption">{o.ok && o.ref.enrolled ? tr('الفولدر ده فاضي.', 'This folder is empty.') : tr('الملفات دي بتظهر بس لو انت مسجّل في النسخة دي.', 'These files show only if you are enrolled in this copy.')}</Txt>
        <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
          {!o.ref.enrolled ? <Button small title={tr('سجّلني فيها', 'Enrol me')} disabled={busy || !token} onPress={() => { void enrol(o.ref.id); }} /> : null}
          <Button small variant="glass" icon="open-outline" title={tr('افتح على Moodle', 'Open in Moodle')} onPress={() => open(`${MOODLE}/course/view.php?id=${o.ref.id}`)} />
        </View>
      </View> : null}
    </View>;
  }

  function courseView(c: MCourse) {
    const color = FOLD[ci % FOLD.length];
    const tasks = c.items.filter(i => i.kind === 'assign' || i.kind === 'quiz').sort((x, y) => (x.due ?? 9e12) - (y.due ?? 9e12));
    const other = c.items.filter(i => !tasks.includes(i) && !isFileItem(i));
    const files = courseRows(c);
    return <>
      <View style={{ flexDirection: row }}>
        <Button small variant="glass" icon={isAr ? 'arrow-forward' : 'arrow-back'} title={tr('كل المواد', 'All courses')} onPress={() => setSel(null)} />
      </View>
      <Glass tint={color.box}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="folder-open" size={26} color="#0B0D14" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="h2" color="#0B0D14" numberOfLines={1}>{c.code}</Txt>
            <Txt variant="caption" color="#2A2E3A" numberOfLines={2}>{[c.title, c.ref ? termLabel(termOf(c.ref), isAr) : '', (c.ref?.teachers.length ? c.ref.teachers : c.teachers ?? []).join('، ')].filter(Boolean).join(' · ')}</Txt>
          </View>
        </View>
        <Txt variant="caption" color="#2A2E3A" style={{ marginTop: 10 }}>
          {[filesLabel(files.length, isAr), tr(`${files.filter(f => read.includes(f.key)).length} قريتهم`, `${files.filter(f => read.includes(f.key)).length} read`), tr(`${files.filter(f => saved[f.key]).length} على الموبايل`, `${files.filter(f => saved[f.key]).length} offline`)].join(' · ')}
        </Txt>
      </Glass>
      {c.ref && c.byTeacher === false && c.teachers?.length ? <Txt variant="caption">{tr(`مالقيناش فولدر باسم ${c.teachers[0]}، فده أحدث فولدر للمادة.`, `No folder with ${c.teachers[0]} found — showing the newest copy.`)}</Txt> : null}
      {!c.ref ? <Txt variant="sub">{tr('مش لاقيين المادة دي على Moodle. ممكن الدكتور لسه منزّلهاش.', 'This course is not on Moodle yet.')}</Txt> : null}
      {c.ref && !c.ref.enrolled ? <Glass><View style={{ gap: 10 }}>
        <Txt variant="label">{tr('لقينا نسخة من المادة بس انت مش مسجّل فيها', 'Found a copy, but you are not enrolled')}</Txt>
        <Button small title={tr('سجّلني في المادة', 'Enrol me')} disabled={busy || !token} onPress={() => { void enrol(c.ref!.id); }} />
      </View></Glass> : null}
      {tasks.length ? <Glass><View style={{ gap: 8 }}>
        <Txt variant="h3">{tr('التكليفات والكويزات', 'Assignments & quizzes')}</Txt>
        {tasks.map(i => <PressScale key={i.key} label={i.name} onPress={() => open(i.url)}>
          <View style={{ flexDirection: row, gap: 10, alignItems: 'center', paddingVertical: 4 }}>
            <Ionicons name={ITEM_ICON[i.kind]} size={20} color={i.due && i.due * 1000 < Date.now() ? palette.faint : palette.danger} />
            <View style={{ flex: 1 }}>
              <Txt variant="label" numberOfLines={2}>{i.name}</Txt>
              <Txt variant="caption">{[i.due ? `${tr('آخر ميعاد', 'Due')} ${when(i.due)} · ${left(i.due)}` : tr('من غير ميعاد', 'No due date'), i.submitted === true ? tr('✓ اتسلّم', '✓ Submitted') : i.submitted === false ? tr('لسه متسلّمش', 'Not submitted') : ''].filter(Boolean).join(' · ')}</Txt>
            </View>
          </View>
        </PressScale>)}
      </View></Glass> : null}
      {bySection(files).map(g => <View key={g.section || '-'} style={{ gap: 10 }}>
        <Txt variant="h3">{g.section || tr('ملفات المادة', 'Course files')}</Txt>
        {g.rows.map(f => card(f))}
      </View>)}
      {files.length ? <Txt variant="caption" center>{tr('دوس على أيقونة الملف عشان تعلّم إنك قريته · دوسة طويلة على ملف متنزّل تمسحه', 'Tap a file icon to mark it read · long-press a saved file to remove it')}</Txt> : null}
      {c.old?.length ? <Glass tint={palette.soft}><View style={{ gap: 10 }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <Ionicons name="time-outline" size={22} color={palette.text} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{tr('ملفات قديمة', 'Old files')}</Txt>
            <Txt variant="caption">{tr('فولدرات نفس المادة مع نفس الدكتور في الترمات اللي فاتت', 'Same course, same doctor, earlier terms')}</Txt>
          </View>
        </View>
        {c.old.map(o => oldFolder(c, o))}
      </View></Glass> : null}
      {other.length ? <Glass><View style={{ gap: 6 }}>
        <Txt variant="h3">{tr('حاجات تانية', 'Other')}</Txt>
        {other.map(i => <PressScale key={i.key} label={i.name} onPress={() => open(i.url)}>
          <View style={{ flexDirection: row, gap: 10, alignItems: 'center', paddingVertical: 3 }}>
            <Ionicons name={ITEM_ICON[i.kind]} size={18} color={palette.sub} /><Txt style={{ flex: 1 }} numberOfLines={2}>{i.name}</Txt>
          </View>
        </PressScale>)}
      </View></Glass> : null}
      {c.ref?.enrolled && !c.items.length ? <Txt variant="sub" center>{tr('المادة لسه فاضية على Moodle.', 'Nothing posted yet.')}</Txt> : null}
    </>;
  }

  return <Screen padBottom={false} refreshing={busy} onRefresh={token ? () => { void refresh(); } : undefined}>
    <PageTop title={tr('ملفات Moodle', 'Moodle files')} subtitle={tr('فولدر لكل مادة، والملف اللي تنزّله يفتح من غير نت', 'A folder per course; downloads open offline')} />
    {!ready ? <Txt variant="sub" center>{tr('بيفتح…', 'Opening…')}</Txt> : !token ? <Glass><View style={{ gap: 12 }}>
      <Txt variant="h3">{data ? tr('سجّل دخول تاني عشان تحدّث وتنزّل', 'Sign in again to refresh and download') : tr('ادخل بحساب Google الجامعي', 'Sign in with your university Google account')}</Txt>
      <Txt variant="sub">{tr('هتفتح صفحة Moodle الرسمية (kmoodle.su.edu.eg). التطبيق بياخد مفتاح الدخول بس، ومش بيشوف الباسورد خالص.', 'The official Moodle page opens. The app only receives an access key — never your password.')}</Txt>
      <Button icon="logo-google" title={tr('دخول Moodle', 'Sign in to Moodle')} onPress={() => setLogin(newId() + newId())} />
    </View></Glass> : null}
    {error ? <Txt color={palette.danger}>{error}</Txt> : null}
    {token && !data && !busy ? <Button icon="refresh" title={tr('حمّل موادي', 'Load my courses')} onPress={() => { void refresh(); }} /> : null}
    {busy && !data ? <Txt variant="sub" center>{tr('بندوّر على موادك في Moodle…', 'Finding your courses on Moodle…')}</Txt> : null}

    {data ? <Field icon="search" value={q} onChangeText={setQ} placeholder={tr('دوّر على ملف أو مادة', 'Search a file or course')} returnKeyType="search" clearButtonMode="while-editing" /> : null}

    {data && q.trim() ? <>
      <Txt variant="h3">{found.length ? tr(`لقينا ${filesLabel(found.length, true)}`, `${found.length} found`) : tr('مفيش ملف بالاسم ده', 'No matching file')}</Txt>
      {found.slice(0, 60).map(f => card(f, true))}
    </> : course ? courseView(course) : data ? <>
      <View style={{ flexDirection: row, flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
        {data.courses.map((c, i) => {
          const r = courseRows(c);
          return <Folder key={c.code} c={c} color={FOLD[i % FOLD.length]} count={r.length} offline={r.filter(f => saved[f.key]).length} onPress={() => setSel(c.code)} />;
        })}
      </View>
      {rows.length ? <>
        <Txt variant="h2" style={{ marginTop: 4 }}>{tr('آخر الملفات', 'Latest files')}</Txt>
        {latest(rows, 6).map(f => card(f, true))}
      </> : null}
      <Txt variant="caption" center>{canDownload ? tr('الملفات اللي بتنزّلها بتفتح من غير نت', 'Files you download open without internet') : tr('التنزيل شغال من أبلكيشن الموبايل بس', 'Downloads work in the phone app only')}</Txt>
    </> : null}

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
    <Txt variant="caption" center color={palette.faint}>{tr(`البيانات من ${MOODLE.replace('https://', '')} ومتشفّرة على موبايلك. الملفات المتنزّلة جوه الأبلكيشن بس.`, 'Data comes from the official Moodle and is encrypted on your phone. Downloads stay inside the app.')}</Txt>
  </Screen>;
}