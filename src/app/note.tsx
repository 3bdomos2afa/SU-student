import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert, PanResponder, TextInput, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useApp } from '@/context/app-context';
import { INK_COLORS, previewFrom, titleFrom, type PageBody } from '@/lib/notebook';
import { loadPage, savePage, updateNotebook, useNotebook } from '@/lib/notebook-store';
import { PageTop } from '@/components/page';
import { Button, Glass, PressScale, Screen, Segmented, Txt } from '@/components/ui';
import { stamp } from './notebook';

const LINE = 34, TOP = 20, PAPER = '#FFFDF5', RULE = '#C7D7EE', MARGIN = '#F2A7A7';
type Mode = 'write' | 'draw';

export default function Note() {
  const a = useApp(); const { tr, row, palette, lang, isAr } = a; const owner = a.session?.studentId ?? 'local';
  const { topic: tid = '', id = '' } = useLocalSearchParams<{ topic?: string; id?: string }>();
  const { nb } = useNotebook(owner); const topic = nb.topics.find(t => t.id === tid); const meta = topic?.pages.find(p => p.id === id);
  const [body, setBody] = useState<PageBody | null>(null); const bodyRef = useRef(body); bodyRef.current = body;
  const [mode, setMode] = useState<Mode>('write'); const modeRef = useRef(mode); modeRef.current = mode;
  const [ink, setInk] = useState(INK_COLORS[1]); const inkRef = useRef(ink); inkRef.current = ink;
  const [pen, setPen] = useState(3); const penRef = useRef(pen); penRef.current = pen;
  const [live, setLive] = useState(''); const cur = useRef({ d: '', y: 0 });
  const [w, setW] = useState(0); const [textH, setTextH] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const pending = useRef<PageBody | null>(null);
  const ids = useRef({ owner, id, tid }); ids.current = { owner, id, tid };

  useEffect(() => { let on = true; loadPage(owner, id).then(b => { if (on) setBody(b); }).catch(() => { if (on) setBody({ text: '', strokes: [] }); }); return () => { on = false; }; }, [owner, id]);
  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const b = pending.current; if (!b) return; pending.current = null;
    const { owner: o, id: pid, tid: t } = ids.current; const now = new Date().toISOString();
    void savePage(o, pid, b).catch(() => {});
    updateNotebook(n => ({ ...n, topics: n.topics.map(x => x.id !== t ? x : { ...x, pages: x.pages.map(p => p.id !== pid ? p : { ...p, title: titleFrom(b.text), preview: previewFrom(b.text), updated: now, drawn: b.strokes.length > 0 }) }) }));
  };
  useEffect(() => () => flush(), []);
  const change = (b: PageBody) => { setBody(b); pending.current = b; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 700); };
  const changeRef = useRef(change); changeRef.current = change;

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => modeRef.current === 'draw',
    onMoveShouldSetPanResponder: () => modeRef.current === 'draw',
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { const { locationX: x, locationY: y } = e.nativeEvent; cur.current = { d: `M${x.toFixed(1)} ${y.toFixed(1)}`, y }; setLive(cur.current.d); },
    onPanResponderMove: e => { const { locationX: x, locationY: y } = e.nativeEvent; cur.current.d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; cur.current.y = Math.max(cur.current.y, y); setLive(cur.current.d); },
    onPanResponderRelease: () => {
      const { d, y } = cur.current; cur.current = { d: '', y: 0 }; setLive('');
      const b = bodyRef.current; if (!b || !d) return;
      changeRef.current({ ...b, strokes: [...b.strokes, { c: inkRef.current, w: penRef.current, d: d.includes('L') ? d : `${d} l0.1 0.1`, y }] });
    },
  }), []);

  if (!body) return <Screen padBottom={false}><Txt variant="sub" center>{tr('بيفتح الصفحة…', 'Opening page…')}</Txt></Screen>;
  const maxY = body.strokes.reduce((m, s) => Math.max(m, s.y || 0), 0);
  const height = Math.max(LINE * 24, textH + TOP + LINE * 6, maxY + LINE * 6);
  const rules = Math.ceil(height / LINE);
  const marginX = isAr ? w - 34 : 34;
  return <Screen padBottom={false} scrollEnabled={mode === 'write'}>
    <PageTop title={topic?.name ?? tr('كشكولك', 'Notebook')} subtitle={[meta?.created ? tr(`اتعملت ${stamp(meta.created, lang)}`, `Created ${stamp(meta.created, lang)}`) : '', meta?.updated && meta.updated !== meta.created ? tr(`آخر تعديل ${stamp(meta.updated, lang)}`, `Edited ${stamp(meta.updated, lang)}`) : ''].filter(Boolean).join('\n')} />
    <Glass padding={12}><View style={{ gap: 10 }}>
      <Segmented<Mode> value={mode} onChange={setMode} options={[{ value: 'write', label: tr('كتابة', 'Write'), icon: 'create-outline' }, { value: 'draw', label: tr('رسم', 'Draw'), icon: 'brush-outline' }]} />
      {mode === 'draw' ? <View style={{ gap: 10 }}>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {INK_COLORS.map(c => <PressScale key={c} label={c} onPress={() => setInk(c)}><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: ink === c ? 3 : 0, borderColor: '#fff', boxShadow: ink === c ? `0 0 0 2px ${c}` : undefined }} /></PressScale>)}
          {[2, 4, 8].map(p => <PressScale key={p} label={`pen ${p}`} onPress={() => setPen(p)}><View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: pen === p ? palette.primary : palette.inputBg }}><View style={{ width: p + 4, height: p + 4, borderRadius: (p + 4) / 2, backgroundColor: pen === p ? '#fff' : palette.sub }} /></View></PressScale>)}
        </View>
        <View style={{ flexDirection: row, gap: 8 }}>
          <Button small variant="glass" icon="arrow-undo-outline" title={tr('رجوع خطوة', 'Undo')} disabled={!body.strokes.length} onPress={() => change({ ...body, strokes: body.strokes.slice(0, -1) })} />
          <Button small variant="glass" icon="trash-outline" title={tr('امسح الرسم', 'Clear drawing')} disabled={!body.strokes.length} onPress={() => Alert.alert(tr('تمسح الرسم كله؟', 'Clear the drawing?'), '', [{ text: tr('لأ', 'No'), style: 'cancel' }, { text: tr('امسح', 'Clear'), style: 'destructive', onPress: () => change({ ...body, strokes: [] }) }])} />
        </View>
        <Txt variant="caption">{tr('وانت بترسم الصفحة مش بتتحرك. ارجع لـ"كتابة" عشان تنزل لتحت.', 'Scrolling is paused while drawing. Switch to Write to scroll.')}</Txt>
      </View> : null}
    </View></Glass>
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ height, borderRadius: 18, overflow: 'hidden', backgroundColor: PAPER, borderWidth: 1, borderColor: '#E8E1C8' }}>
      {w ? <Svg width={w} height={height} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        {Array.from({ length: rules }, (_, k) => <Line key={k} x1={0} x2={w} y1={TOP + LINE * (k + 1)} y2={TOP + LINE * (k + 1)} stroke={RULE} strokeWidth={1} />)}
        <Line x1={marginX} x2={marginX} y1={0} y2={height} stroke={MARGIN} strokeWidth={1.5} />
      </Svg> : null}
      <TextInput multiline scrollEnabled={false} editable={mode === 'write'} value={body.text} onChangeText={text => change({ ...body, text })}
        onContentSizeChange={e => setTextH(e.nativeEvent.contentSize.height)}
        placeholder={tr('أول سطر هو عنوان الصفحة…', 'The first line is the page title…')} placeholderTextColor="#A8A08A"
        style={{ position: 'absolute', top: TOP + 6, left: 0, right: 0, minHeight: height - TOP, paddingTop: 0, paddingBottom: 0, paddingLeft: isAr ? 14 : 44, paddingRight: isAr ? 44 : 14,
          fontSize: 18, lineHeight: LINE, color: '#1F2937', textAlignVertical: 'top', textAlign: isAr ? 'right' : 'left', writingDirection: isAr ? 'rtl' : 'ltr' }} />
      <View {...pan.panHandlers} pointerEvents={mode === 'draw' ? 'box-only' : 'none'} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {w ? <Svg width={w} height={height}>
          {body.strokes.map((s, i) => <Path key={i} d={s.d} stroke={s.c} strokeWidth={s.w} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          {live ? <Path d={live} stroke={ink} strokeWidth={pen} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg> : null}
      </View>
    </View>
    <Txt variant="caption" center color={palette.faint}>{tr('بتتحفظ لوحدها بالتاريخ والساعة.', 'Saved automatically with date and time.')}</Txt>
  </Screen>;
}