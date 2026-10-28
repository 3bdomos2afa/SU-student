import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@/components/icon';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { currentCourses } from '@/lib/student';
import { lastUpdate, newId, TOPIC_COLORS, withCourseTopics } from '@/lib/notebook';
import { updateNotebook, useNotebook } from '@/lib/notebook-store';
import { PageTop } from '@/components/page';
import { Button, Field, Glass, PressScale, Screen, Txt } from '@/components/ui';

export function stamp(iso: string, lang: string) {
  if (!iso) return '';
  const d = new Date(iso); if (isNaN(d.getTime())) return '';
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function Notebook() {
  const a = useApp(); const { tr, row, palette, cache, lang } = a; const owner = a.session?.studentId ?? 'local';
  const { nb, ready, broken } = useNotebook(owner);
  const courses = currentCourses(cache); const key = courses.map(c => c.code).join(',');
  useEffect(() => { if (ready && courses.length) updateNotebook(n => withCourseTopics(n, courses)); }, [ready, owner, key]);
  const [adding, setAdding] = useState(false); const [name, setName] = useState(''); const [color, setColor] = useState(TOPIC_COLORS[5]);
  function add() {
    const n = name.trim(); if (!n) return;
    updateNotebook(x => ({ ...x, topics: [...x.topics, { id: `t-${newId()}`, name: n.slice(0, 60), color, created: new Date().toISOString(), pages: [] }] }));
    setName(''); setAdding(false);
  }
  return <Screen padBottom={false}>
    <PageTop title={tr('كشكولك', 'Notebook')} subtitle={tr('كشكول لكل مادة، وتقدر تعمل مواضيعك بنفسك', 'One notebook per course, plus your own topics')} />
    {broken ? <Glass><Txt color={palette.warn}>{tr('مقدرناش نفتح الكشكول على الجهاز ده.', 'Could not open the notebook on this device.')}</Txt></Glass> : null}
    {!ready ? <Txt variant="sub" center>{tr('بيفتح…', 'Opening…')}</Txt> : null}
    {ready && !nb.topics.length ? <Glass><Txt variant="sub">{tr('أول ما موادك تتزامن هيتعمل كشكول لكل مادة. وتقدر تضيف موضوع من دلوقتي.', 'A notebook per course appears once your courses sync. You can add a topic now.')}</Txt></Glass> : null}
    {nb.topics.map(t => <PressScale key={t.id} label={t.name} onPress={() => router.push(`/topic?id=${encodeURIComponent(t.id)}` as never)}>
      <Glass padding={0}><View style={{ flexDirection: row, alignItems: 'stretch' }}>
        <View style={{ width: 16, borderTopLeftRadius: 26, borderBottomLeftRadius: 26, backgroundColor: t.color }} />
        <View style={{ flex: 1, padding: 14, gap: 4, flexDirection: row, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${t.color}22`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={t.course ? 'school-outline' : 'bookmark-outline'} size={22} color={t.color} />
          </View>
          <View style={{ flex: 1, gap: 2, paddingHorizontal: 10 }}>
            <Txt variant="label" numberOfLines={2}>{t.name}</Txt>
            <Txt variant="caption">{[t.course, tr(`${t.pages.length} صفحة`, `${t.pages.length} pages`), lastUpdate(t) ? stamp(lastUpdate(t), lang) : ''].filter(Boolean).join(' · ')}</Txt>
          </View>
          <Ionicons name={a.isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={palette.sub} />
        </View>
      </View></Glass>
    </PressScale>)}
    {adding ? <Glass><View style={{ gap: 12 }}>
      <Txt variant="h3">{tr('موضوع جديد', 'New topic')}</Txt>
      <Field icon="bookmark-outline" placeholder={tr('اسم الموضوع', 'Topic name')} value={name} onChangeText={setName} maxLength={60} />
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
        {TOPIC_COLORS.map(c => <PressScale key={c} label={c} onPress={() => setColor(c)}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff', boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }} />
        </PressScale>)}
      </View>
      <View style={{ flexDirection: row, gap: 8 }}>
        <Button small title={tr('ضيف', 'Add')} icon="add" disabled={!name.trim()} onPress={add} />
        <Button small variant="glass" title={tr('إلغاء', 'Cancel')} onPress={() => setAdding(false)} />
      </View>
    </View></Glass> : <Button icon="add" title={tr('موضوع جديد', 'New topic')} disabled={!ready || broken} onPress={() => setAdding(true)} />}
    <Txt variant="caption" center color={palette.faint}>{tr('كل حاجة متشفّرة ومحفوظة على موبايلك بس.', 'Everything is encrypted and stays on your phone.')}</Txt>
  </Screen>;
}