import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp } from '@/context/app-context';
import { cleanStroke, INK_COLORS, previewFrom, titleFrom, type PageBody, type Stroke } from '@/lib/notebook';
import { bodyHtml, buildNoteHtml, HIGHLIGHTS, printNoteHtml, sanitizeNoteHtml, type NoteLabels } from '@/lib/note-html';
import { loadPage, savePage, updateNotebook, useNotebook } from '@/lib/notebook-store';
import { PageTop } from '@/components/page';
import { Toast } from '@/components/dropdown';
import { Button, Glass, GlassBackground, PressScale, Segmented, Txt } from '@/components/ui';
import { stamp } from './notebook';

type Mode = 'write' | 'draw';
type Tool = 'pen' | 'hl' | 'erase';
type Want = 'save' | 'share' | 'pdf';
type Dump = { html: string; text: string; strokes: unknown[] };
const ZOOMS = [1, 1.5, 2, 3, 4];
type BeforeRemoveNav = {
  addListener: (name: 'beforeRemove', cb: (e: { preventDefault: () => void; data: { action: unknown } }) => void) => () => void;
  dispatch: (action: never) => void;
};

export default function Note() {
  const a = useApp(); const { tr, row, palette, lang, isAr } = a; const owner = a.session?.studentId ?? 'local';
  const insets = useSafeAreaInsets(); const navigation = useNavigation();
  const { topic: tid = '', id = '', new: isNewParam } = useLocalSearchParams<{ topic?: string; id?: string; new?: string }>();
  const { nb, ready } = useNotebook(owner); const topic = nb.topics.find(t => t.id === tid); const meta = topic?.pages.find(p => p.id === id);
  const [fresh, setFresh] = useState(isNewParam === '1' && !meta);
  const [base, setBase] = useState<PageBody | null>(null);
  const [rev, setRev] = useState(0); const [w, setW] = useState(0);
  const [mode, setMode] = useState<Mode>('write'); const [tool, setTool] = useState<Tool>('pen');
  const [ink, setInk] = useState(INK_COLORS[1]); const [pen, setPen] = useState(3); const [zoom, setZoom] = useState(1);
  const [dirty, setDirty] = useState(false); const dirtyRef = useRef(false); dirtyRef.current = dirty;
  const freshRef = useRef(fresh); freshRef.current = fresh;
  const [busy, setBusy] = useState(false); const [toast, setToast] = useState('');
  const web = useRef<WebView<{}>>(null); const want = useRef<Want | null>(null); const leaving = useRef(false);

  useEffect(() => {
    let on = true;
    if (isNewParam === '1' && !meta) { setBase({ text: '', strokes: [] }); return; }
    loadPage(owner, id).then(b => { if (on) setBase(b); }).catch(() => { if (on) setBase({ text: '', strokes: [] }); });
    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, id]);

  // Leaving with unsaved work asks first (back button, swipe, Android back).
  useEffect(() => (navigation as unknown as BeforeRemoveNav).addListener('beforeRemove', e => {
    if (leaving.current || (!dirtyRef.current && !freshRef.current)) return;
    if (freshRef.current && !dirtyRef.current) return;
    e.preventDefault();
    Alert.alert(tr('في تعديلات متحفظتش', 'Unsaved changes'), tr('تحفظها قبل ما تخرج؟', 'Save them before leaving?'), [
      { text: tr('كمّل كتابة', 'Keep editing'), style: 'cancel' },
      { text: tr('تجاهل واخرج', 'Discard'), style: 'destructive', onPress: () => { leaving.current = true; (navigation as unknown as BeforeRemoveNav).dispatch(e.data.action as never); } },
      { text: tr('احفظ', 'Save'), onPress: () => { leaving.current = true; ask('save'); } },
    ]);
  }), [navigation, tr]);

  const labels: NoteLabels = {
    placeholder: tr('اكتب هنا… أول سطر هو عنوان الصفحة', 'Write here… the first line is the title'),
    color: tr('لون', 'Color'), highlight: tr('هايلايت', 'Highlight'), size: tr('حجم', 'Size'), list: tr('قايمة', 'List'), align: tr('محاذاة', 'Align'),
    big: tr('عنوان كبير', 'Title'), heading: tr('عنوان فرعي', 'Heading'), normal: tr('عادي', 'Normal'), noList: tr('من غير قايمة', 'No list'), none: tr('شيل', 'None'),
    clearFormat: tr('شيل التنسيق', 'Clear'), right: tr('يمين', 'Right'), center: tr('نص', 'Center'), left: tr('شمال', 'Left'), indent: tr('لجوه', 'Indent'), outdent: tr('لبره', 'Outdent'),
  };
  const firstW = useRef(0); if (w && !firstW.current) firstW.current = w;
  const html = useMemo(() => (base && firstW.current ? buildNoteHtml({ body: base, width: firstW.current, isAr, labels, ink, pen }) : ''),
    // Rebuilt only when the page is reloaded (open / تجاهل), never while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, rev, w > 0, isAr]);

  const cmd = (o: Record<string, unknown>) => web.current?.injectJavaScript(`window.__cmd&&window.__cmd(${JSON.stringify(o)});true;`);
  const ask = (k: Want) => { want.current = k; cmd({ k: 'dump' }); };
  useEffect(() => { cmd({ k: 'mode', v: mode }); }, [mode]);
  useEffect(() => { cmd({ k: 'ink', v: ink }); }, [ink]);
  useEffect(() => { cmd({ k: 'pen', v: pen }); }, [pen]);
  useEffect(() => { cmd({ k: 'tool', v: tool }); }, [tool]);

  const clean = (d: Dump): PageBody => ({
    text: d.text.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
    html: sanitizeNoteHtml(d.html || ''),
    strokes: (Array.isArray(d.strokes) ? d.strokes : []).map(cleanStroke).filter((s): s is Stroke => !!s),
  });
  async function persist(b: PageBody) {
    const now = new Date().toISOString(); const title = titleFrom(b.text); const preview = previewFrom(b.text); const drawn = b.strokes.length > 0;
    setBusy(true);
    try { await savePage(owner, id, b); } catch { setBusy(false); leaving.current = false; Alert.alert(tr('محصلش حفظ', 'Not saved'), tr('جرّب تاني.', 'Please try again.')); return; }
    updateNotebook(n => ({ ...n, topics: n.topics.map(x => x.id !== tid ? x : {
      ...x, pages: x.pages.some(p => p.id === id)
        ? x.pages.map(p => p.id !== id ? p : { ...p, title, preview, updated: now, drawn })
        : [...x.pages, { id, title, preview, created: now, updated: now, drawn }],
    }) }));
    setBusy(false); setDirty(false); setFresh(false); cmd({ k: 'clean' });
    if (leaving.current) { router.back(); return; }
    setToast(fresh ? tr('اتحفظت الصفحة ✓', 'Page saved ✓') : tr('اتحفظ التعديل ✓', 'Changes saved ✓'));
  }
  async function exportPdf(b: PageBody) {
    setBusy(true);
    try {
      const doc = printNoteHtml({ title: titleFrom(b.text) || topic?.name || tr('كشكولك', 'Notebook'), subtitle: dates.join('\n'), html: b.html ?? bodyHtml(b), strokes: b.strokes, width: firstW.current || 360, isAr });
      const { uri } = await Print.printToFileAsync({ html: doc });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: tr('شارك الـPDF', 'Share PDF') });
      else Alert.alert(tr('الـPDF جاهز', 'PDF ready'), uri);
    } catch { Alert.alert(tr('معرفناش نعمل PDF', 'PDF failed'), tr('جرّب تاني.', 'Please try again.')); }
    setBusy(false);
  }
  function onMessage(e: WebViewMessageEvent) {
    let m: { t?: string; z?: number } & Partial<Dump>;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.t === 'dirty') setDirty(true);
    else if (m.t === 'zoom' && typeof m.z === 'number') setZoom(m.z);
    else if (m.t === 'ready') { cmd({ k: 'mode', v: mode }); cmd({ k: 'tool', v: tool }); }
    else if (m.t === 'dump') {
      const k = want.current; want.current = null; if (!k) return;
      const b = clean({ html: String(m.html ?? ''), text: String(m.text ?? ''), strokes: (m.strokes as unknown[]) ?? [] });
      if (k === 'save') void persist(b);
      else if (k === 'share') void Share.share({ message: [topic?.name, b.text].filter(Boolean).join('\n\n') || ' ' }).catch(() => {});
      else void exportPdf(b);
    }
  }
  function discard() {
    if (fresh) { leaving.current = true; router.back(); return; }
    Alert.alert(tr('تتجاهل التعديلات؟', 'Discard changes?'), tr('الصفحة هترجع زي ما كانت آخر حفظ.', 'The page goes back to its last save.'), [
      { text: tr('لأ', 'No'), style: 'cancel' },
      { text: tr('تجاهل', 'Discard'), style: 'destructive', onPress: () => { setDirty(false); setZoom(1); setMode('write'); setRev(r => r + 1); } },
    ]);
  }

  const created = meta?.created; const updated = meta?.updated;
  const dates = [
    `${tr('تاريخ الإنشاء', 'Created')}: ${created ? stamp(created, lang) : tr('هيتسجل أول ما تحفظ', 'set when you save')}`,
    `${tr('تاريخ آخر تعديل', 'Last edited')}: ${updated && updated !== created ? stamp(updated, lang) : tr('لسه متعدلتش', 'not edited yet')}`,
  ];
  const shell = (child: React.ReactNode) => <View style={{ flex: 1, backgroundColor: palette.bg[0] }}><GlassBackground />
    <View style={{ flex: 1, paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 8), gap: 8 }}>{child}</View></View>;
  if (!ready || !base) return shell(<Txt variant="sub" center>{tr('بيفتح الصفحة…', 'Opening page…')}</Txt>);
  if (!topic) return shell(<><PageTop title={tr('كشكولك', 'Notebook')} /><Glass><Txt variant="sub">{tr('الموضوع ده مش موجود.', 'Topic not found.')}</Txt></Glass></>);

  const chip = (on: boolean, label: string, onPress: () => void, inner: React.ReactNode) => <PressScale key={label} label={label} onPress={onPress}>
    <View style={{ height: 34, minWidth: 34, paddingHorizontal: 9, borderRadius: 17, flexDirection: row, gap: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.primary : palette.inputBg }}>{inner}</View>
  </PressScale>;
  const icon = (n: React.ComponentProps<typeof Ionicons>['name'], on: boolean) => <Ionicons name={n} size={17} color={on ? '#fff' : palette.text} />;
  const shareBtns = <View style={{ flexDirection: row, gap: 6 }}>
    {chip(false, tr('شارك', 'Share'), () => ask('share'), icon('share-social-outline', false))}
    {chip(false, 'PDF', () => ask('pdf'), <><Ionicons name="document-outline" size={16} color={palette.text} /><Txt variant="caption">PDF</Txt></>)}
  </View>;
  const nextZoom = ZOOMS.find(z => z > zoom + 0.05) ?? 1;
  const colors = tool === 'hl' ? HIGHLIGHTS : INK_COLORS;

  return shell(<>
    <PageTop title={topic.name} subtitle={dates.join('\n')} right={shareBtns} />
    <View style={{ flexDirection: row, gap: 8, alignItems: 'center' }}>
      <View style={{ flex: 1 }}><Segmented<Mode> value={mode} onChange={setMode} options={[{ value: 'write', label: tr('كتابة', 'Write'), icon: 'create-outline' }, { value: 'draw', label: tr('رسم', 'Draw'), icon: 'brush-outline' }]} /></View>
      {chip(zoom > 1.01, tr('زوم', 'Zoom'), () => cmd({ k: 'zoom', v: nextZoom }), <><Ionicons name="search" size={15} color={zoom > 1.01 ? '#fff' : palette.text} /><Txt variant="caption" color={zoom > 1.01 ? '#fff' : palette.text}>{`${Math.round(zoom * 100)}%`}</Txt></>)}
    </View>
    {mode === 'draw' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center', flexDirection: row }}>
      {chip(tool === 'pen', tr('قلم', 'Pen'), () => { setTool('pen'); if (!INK_COLORS.includes(ink)) setInk(INK_COLORS[1]); }, icon('pencil', tool === 'pen'))}
      {chip(tool === 'hl', tr('هايلايتر', 'Highlighter'), () => { setTool('hl'); if (!HIGHLIGHTS.includes(ink)) setInk(HIGHLIGHTS[0]); }, icon('color-fill-outline', tool === 'hl'))}
      {chip(tool === 'erase', tr('أستيكة', 'Eraser'), () => setTool('erase'), icon('remove-circle-outline', tool === 'erase'))}
      {tool !== 'erase' ? colors.map(c => <PressScale key={c} label={c} onPress={() => setInk(c)}><View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: ink === c ? 3 : 1, borderColor: ink === c ? palette.primary : '#D6D0BD' }} /></PressScale>) : null}
      {tool !== 'erase' ? [2, 4, 8].map(p => chip(pen === p, `pen ${p}`, () => setPen(p), <View style={{ width: p + 4, height: p + 4, borderRadius: (p + 4) / 2, backgroundColor: pen === p ? '#fff' : palette.sub }} />)) : null}
      {chip(false, tr('رجوع خطوة', 'Undo'), () => cmd({ k: 'undo' }), icon('arrow-undo-outline', false))}
      {chip(false, tr('امسح الرسم', 'Clear'), () => Alert.alert(tr('تمسح الرسم كله؟', 'Clear the drawing?'), '', [{ text: tr('لأ', 'No'), style: 'cancel' }, { text: tr('امسح', 'Clear'), style: 'destructive', onPress: () => cmd({ k: 'clear' }) }]), icon('trash-outline', false))}
    </ScrollView> : null}
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E8E1C8', backgroundColor: '#FFFDF5' }}>
      {html ? <WebView<{}> key={rev} ref={web} source={{ html }} originWhitelist={['about:*']} onMessage={onMessage}
        onShouldStartLoadWithRequest={r => r.url.startsWith('about:') || r.url.startsWith('data:')}
        javaScriptEnabled domStorageEnabled={false} allowFileAccess={false} mixedContentMode="never" setSupportMultipleWindows={false}
        textZoom={100} setBuiltInZoomControls={false} overScrollMode="never" keyboardDisplayRequiresUserAction={false} hideKeyboardAccessoryView
        style={{ flex: 1, backgroundColor: '#FFFDF5' }} /> : null}
    </View>
    {fresh || dirty ? <View style={{ flexDirection: row, gap: 8 }}>
      <View style={{ flex: 2 }}><Button icon="checkmark" loading={busy} title={fresh ? tr('حفظ', 'Save') : tr('حفظ التعديل', 'Save changes')} onPress={() => ask('save')} /></View>
      <View style={{ flex: 1 }}><Button variant="glass" icon="close" title={fresh ? tr('إلغاء', 'Cancel') : tr('تجاهل', 'Discard')} onPress={discard} /></View>
    </View> : <Txt variant="caption" center color={palette.faint}>{mode === 'draw'
      ? tr('صباع واحد بيرسم، صباعين للزوم والتحريك.', 'One finger draws; two fingers zoom and move.')
      : tr('صباعين للزوم. التعديل بيتحفظ لما تدوس "حفظ التعديل".', 'Pinch to zoom. Edits save when you tap Save.')}</Txt>}
    {toast ? <Toast message={toast} onHide={() => setToast('')} /> : null}
  </>);
}