import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/app-context';
import { timetable } from '@/lib/academic';
import { DAY_COLORS, WEEK, toMinutes } from '@/lib/student';
import { LECTURE_COLOR, SECTION_COLOR, SlotCard } from '@/components/academic-cards';
import { PageTop } from '@/components/page';
import { Button, Glass, PressScale, Screen, Txt } from '@/components/ui';

const DAY_AR: Record<number, string> = { 6: 'السبت', 0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس', 5: 'الجمعة' };
const DAY_EN: Record<number, string> = { 6: 'Saturday', 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };

export default function Timetable() {
  const a = useApp(); const { tr, row, palette, cache, isAr } = a;
  const slots = timetable(cache); const today = new Date().getDay();
  const [open, setOpen] = useState<number | null>(today);
  const days = [...WEEK, 5].map(d => ({ d, list: slots.filter(s => s.day === d).sort((x, y) => toMinutes(x.start) - toMinutes(y.start)) })).filter(x => x.list.length);
  const undated = slots.filter(s => s.day === null);
  const legend: [string, string][] = [[LECTURE_COLOR, tr('محاضرة', 'Lecture')], [SECTION_COLOR, tr('سكشن', 'Section')]];
  return <Screen padBottom={false} refreshing={a.refreshing} onRefresh={a.refreshAll}>
    <PageTop title={tr('الجدول الدراسي', 'Timetable')} subtitle={tr('من السبت للخميس — دوس على اليوم عشان يفتح', 'Saturday to Thursday — tap a day to open it')} />
    <View style={{ flexDirection: row, gap: 14, justifyContent: 'center' }}>
      {legend.map(([c, l]) => <View key={l} style={{ flexDirection: row, alignItems: 'center', gap: 6 }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} /><Txt variant="caption">{l}</Txt></View>)}
    </View>
    {!slots.length ? <Glass><Txt variant="sub">{tr('الجدول لسه متزامنش أو لسه متنشرش.', 'Timetable not synced or not published yet.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass> : null}
    {days.map(({ d, list }) => {
      const c = DAY_COLORS[d]; const isOpen = open === d;
      const lec = list.filter(s => s.type === 'lecture').length, sec = list.filter(s => s.type === 'section').length;
      const end = list.map(s => s.end || s.start).sort().pop();
      return <View key={d} style={{ gap: 10 }}>
        <PressScale label={DAY_EN[d]} onPress={() => setOpen(isOpen ? null : d)}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: c, boxShadow: `0 8px 20px ${c}55` }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}><Txt variant="h3" color="#fff">{list.length}</Txt></View>
            <View style={{ flex: 1 }}>
              <Txt variant="h3" color="#fff">{isAr ? DAY_AR[d] : DAY_EN[d]}{d === today ? tr(' · النهارده', ' · today') : ''}</Txt>
              <Txt variant="caption" color="rgba(255,255,255,0.88)">{[lec ? tr(`${lec} محاضرة`, `${lec} lectures`) : '', sec ? tr(`${sec} سكشن`, `${sec} sections`) : '', `${list[0].start} – ${end ?? ''}`].filter(Boolean).join(' · ')}</Txt>
            </View>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#fff" />
          </View>
        </PressScale>
        {isOpen ? <View style={{ gap: 8, paddingHorizontal: 4 }}>{list.map((s, i) => <SlotCard key={`${s.code}-${s.type}-${i}`} slot={s} />)}</View> : null}
      </View>;
    })}
    {undated.length ? <Glass><View style={{ gap: 8 }}><Txt variant="h3">{tr('من غير يوم محدد', 'No day set')}</Txt>{undated.map((s, i) => <SlotCard key={i} slot={s} />)}</View></Glass> : null}
    <Txt variant="caption" center color={palette.faint}>{tr('الأيام الفاضية مستخبية. دوس على أي مادة عشان تشوف تفاصيلها.', 'Days without classes are hidden. Tap a class for course details.')}</Txt>
  </Screen>;
}