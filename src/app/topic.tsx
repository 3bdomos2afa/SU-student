import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { newId } from '@/lib/notebook';
import { deletePage, updateNotebook, useNotebook } from '@/lib/notebook-store';
import { PageTop } from '@/components/page';
import { Button, Glass, PressScale, Screen, Txt } from '@/components/ui';
import { stamp } from './notebook';

export default function Topic() {
  const a = useApp(); const { tr, row, palette, lang } = a; const owner = a.session?.studentId ?? 'local';
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const { nb, ready } = useNotebook(owner); const t = nb.topics.find(x => x.id === id);
  if (!ready) return <Screen padBottom={false}><Txt variant="sub" center>{tr('بيفتح…', 'Opening…')}</Txt></Screen>;
  if (!t) return <Screen padBottom={false}><PageTop title={tr('كشكولك', 'Notebook')} /><Glass><Txt variant="sub">{tr('الموضوع ده مش موجود.', 'Topic not found.')}</Txt></Glass></Screen>;
  const pages = [...t.pages].sort((x, y) => (y.updated || y.created).localeCompare(x.updated || x.created));
  function newPage() {
    // The page only joins the topic after the student taps "حفظ" on it.
    router.push(`/note?topic=${encodeURIComponent(id)}&id=${newId()}&new=1` as never);
  }
  function removePage(pid: string) {
    Alert.alert(tr('تمسح الصفحة؟', 'Delete page?'), tr('مش هتقدر ترجّعها.', 'This cannot be undone.'), [{ text: tr('لأ', 'No'), style: 'cancel' }, { text: tr('امسح', 'Delete'), style: 'destructive', onPress: () => {
      void deletePage(owner, pid); updateNotebook(n => ({ ...n, topics: n.topics.map(x => x.id === id ? { ...x, pages: x.pages.filter(p => p.id !== pid) } : x) }));
    } }]);
  }
  function removeTopic() {
    Alert.alert(tr('تمسح الموضوع؟', 'Delete topic?'), tr('كل صفحاته هتتمسح.', 'All its pages will be deleted.'), [{ text: tr('لأ', 'No'), style: 'cancel' }, { text: tr('امسح', 'Delete'), style: 'destructive', onPress: () => {
      t!.pages.forEach(p => { void deletePage(owner, p.id); });
      updateNotebook(n => ({ ...n, topics: n.topics.filter(x => x.id !== id), hidden: t!.course ? [...new Set([...n.hidden, id])] : n.hidden }));
      router.back();
    } }]);
  }
  return <Screen padBottom={false}>
    <PageTop title={t.name} subtitle={[t.course, tr(`${t.pages.length} صفحة`, `${t.pages.length} pages`)].filter(Boolean).join(' · ')} />
    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.color }} />
    <Button icon="add" title={tr('صفحة جديدة', 'New page')} onPress={newPage} />
    {!pages.length ? <Glass><Txt variant="sub" center>{tr('لسه مفيش صفحات. يلا افتح صفحة جديدة واكتب أو ارسم.', 'No pages yet. Start one to write or draw.')}</Txt></Glass> : null}
    {pages.map(p => <PressScale key={p.id} label={p.title || 'page'} onPress={() => router.push(`/note?topic=${encodeURIComponent(id)}&id=${p.id}` as never)} onLongPress={() => removePage(p.id)}>
      <Glass padding={14}><View style={{ flexDirection: row, gap: 12, alignItems: 'center' }}>
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: t.color }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="label" numberOfLines={1}>{p.title || (p.drawn ? tr('رسمة', 'Drawing') : tr('صفحة من غير عنوان', 'Untitled page'))}</Txt>
          {p.preview ? <Txt variant="caption" numberOfLines={2}>{p.preview}</Txt> : null}
          <Txt variant="caption" color={palette.faint}>{stamp(p.updated || p.created, lang)}</Txt>
        </View>
        {p.drawn ? <Ionicons name="brush-outline" size={18} color={palette.sub} /> : null}
      </View></Glass>
    </PressScale>)}
    {pages.length ? <Txt variant="caption" center color={palette.faint}>{tr('دوس دوسة طويلة على الصفحة عشان تمسحها.', 'Long-press a page to delete it.')}</Txt> : null}
    <Button small variant="glass" icon="trash-outline" title={tr('امسح الموضوع', 'Delete topic')} onPress={removeTopic} />
  </Screen>;
}