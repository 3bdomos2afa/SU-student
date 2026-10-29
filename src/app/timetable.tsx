import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { timetable } from '@/lib/academic';
import { WEEK, toMinutes } from '@/lib/student';
import { LECTURE_COLOR, SECTION_COLOR, SlotCard } from '@/components/academic-cards';
import { PageTop } from '@/components/page';
import { Button, Glass, PressScale, Screen, Txt } from '@/components/ui';

const DAY_AR: Record<number, string> = { 6: 'السبت', 0: 'الأحد', 1: 'الاتنين', 2: 'التلات', 3: 'الأربع', 4: 'الخميس', 5: 'الجمعة' };
const DAY_EN: Record<number, string> = { 6: 'Sat', 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' };

/** V14 design: black day chips on top, the chosen day's classes as pastel cards with a time column. */
export default function Timetable() {
  const a = useApp(); const { tr, row, palette, cache, isAr } = a;
  const slots = timetable(cache); const today = new Date().getDay();
  const days = [...WEEK, 5].filter(d => d !== 5 || slots.some(s => s.day === 5));
  const listOf = (d: number) => slots.filter(s => s.day === d).sort((x, y) => toMinutes(x.start) - toMinutes(y.start));
  const first = days.includes(today) && listOf(today).length ? today : days.find(d => listOf(d).length) ?? today;
  const [day, setDay] = useState<number>(first);
  const list = listOf(day);
  const undated = slots.filter(s => s.day === null);
  const lec = list.filter(s => s.type === 'lecture').length, sec = list.filter(s => s.type === 'section').length;
  const legend: [string, string][] = [[LECTURE_COLOR, tr('محاضرة', 'Lecture')], [SECTION_COLOR, tr('سكشن', 'Section')]];
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={tr('جدولي', 'My timetable')} subtitle={`${isAr ? DAY_AR[day] : DAY_EN[day]}${day === today ? tr(' · النهارده', ' · today') : ''} · ${[lec ? tr(`${lec} محاضرة`, `${lec} lectures`) : '', sec ? tr(`${sec} سكشن`, `${sec} sections`) : ''].filter(Boolean).join(' · ') || tr('مفيش محاضرات', 'No classes')}`} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: row, gap: 8, paddingVertical: 2 }}>
      {days.map(d => {
        const on = d === day; const n = listOf(d).length;
        return <PressScale key={d} label={DAY_EN[d]} onPress={() => setDay(d)}>
          <View style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: row, gap: 6,
            backgroundColor: on ? palette.ink : palette.card, borderWidth: 1, borderColor: on ? palette.ink : palette.glassBorder, opacity: n || on ? 1 : 0.55 }}>
            <Txt variant="label" style={{ color: on ? palette.onInk : palette.text, fontSize: 13, lineHeight: 18 }}>{isAr ? DAY_AR[d] : DAY_EN[d]}</Txt>
            {n ? <View style={{ minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.lime : palette.soft }}>
              <Txt variant="caption" style={{ color: on ? palette.onLime : palette.sub, fontSize: 11, lineHeight: 14 }}>{n}</Txt></View> : null}
          </View>
        </PressScale>;
      })}
    </ScrollView>
    {!slots.length ? <Glass><Txt variant="sub">{tr('الجدول لسه متزامنش أو لسه متنشرش.', 'Timetable not synced or not published yet.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    {slots.length && !list.length ? <Glass><Txt variant="sub" center>{tr('اليوم ده فاضي، استمتع بيه 🎉', 'Free day, enjoy it 🎉')}</Txt></Glass> : null}
    {list.map((s, i) => <View key={`${s.code}-${s.type}-${i}`} style={{ flexDirection: row, gap: 10 }}>
      <View style={{ width: 46, paddingTop: 14, alignItems: 'center' }}>
        <Txt variant="label" style={{ fontSize: 13, lineHeight: 18 }}>{s.start || '—'}</Txt>
        <Txt variant="caption" color={palette.faint}>{s.end || ''}</Txt>
      </View>
      <View style={{ flex: 1 }}><SlotCard slot={s} /></View>
    </View>)}
    {undated.length ? <Glass><View style={{ gap: 8 }}><Txt variant="h3">{tr('من غير يوم محدد', 'No day set')}</Txt>{undated.map((s, i) => <SlotCard key={i} slot={s} />)}</View></Glass> : null}
    <View style={{ flexDirection: row, gap: 14, justifyContent: 'center' }}>
      {legend.map(([c, l]) => <View key={l} style={{ flexDirection: row, alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} /><Txt variant="caption">{l}</Txt></View>)}
    </View>
  </Screen>;
}