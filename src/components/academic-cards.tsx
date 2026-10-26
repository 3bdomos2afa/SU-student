import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { canonical, localDate, timetable, type Slot } from '@/lib/academic';
import { absenceByCourse, absenceScale, absenceTone, toneColor, EXCLUSION, NOTICE_AT } from '@/lib/absence';
import { currentCourses, toMinutes } from '@/lib/student';
import { Button, Glass, PressScale, Txt } from './ui';

export const LECTURE_COLOR = '#4F46E5', SECTION_COLOR = '#0D9488';
export function slotColor(type: Slot['type']) { return type === 'lecture' ? LECTURE_COLOR : type === 'section' ? SECTION_COLOR : '#7C3AED'; }

type MetaIcon = 'calendar-outline' | 'location-outline' | 'person-outline' | 'pricetag-outline';
function Meta({ icon, v }: { icon: MetaIcon; v: string }) {
  const { row, palette } = useApp();
  return <View style={{ flexDirection: row, alignItems: 'center', gap: 4, maxWidth: '100%' }}><Ionicons name={icon} size={13} color={palette.sub} /><Txt variant="caption" numberOfLines={1}>{v}</Txt></View>;
}

export function SlotCard({ slot, showDay }: { slot: Slot; showDay?: boolean }) {
  const { tr, row } = useApp(); const c = slotColor(slot.type);
  const kind = slot.type === 'lecture' ? tr('محاضرة', 'Lecture') : slot.type === 'section' ? tr('سكشن', 'Section') : slot.kind || tr('حصة', 'Class');
  return <PressScale label={slot.title || slot.code} onPress={() => router.push(`/course/${encodeURIComponent(slot.code)}` as never)}>
    <Glass padding={14}><View style={{ flexDirection: row, gap: 12 }}>
      <View style={{ width: 5, borderRadius: 3, backgroundColor: c }} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Txt variant="label" color={c}>{slot.start || '—'} – {slot.end || '—'}</Txt>
          <View style={{ backgroundColor: c, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}><Txt variant="caption" color="#fff">{kind}</Txt></View>
        </View>
        <Txt variant="h3" numberOfLines={2}>{slot.title || slot.code}</Txt>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
          {showDay && slot.dayLabel ? <Meta icon="calendar-outline" v={slot.dayLabel} /> : null}
          <Meta icon="location-outline" v={[slot.room, slot.building].filter(Boolean).join(' · ') || tr('القاعة مش منشورة', 'Room not published')} />
          {slot.teachers ? <Meta icon="person-outline" v={slot.teachers} /> : null}
          <Meta icon="pricetag-outline" v={slot.code} />
        </View>
      </View>
    </View></Glass>
  </PressScale>;
}

/** Prev / next day header used by the home screen sections. */
export function DayNav({ offset, setOffset, title }: { offset: number; setOffset: (f: (o: number) => number) => void; title: string }) {
  const { tr, row, palette, lang, isAr } = useApp();
  const d = new Date(); d.setDate(d.getDate() + offset);
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  const label = offset === 0 ? tr('النهارده', 'Today') : offset === 1 ? tr('بكرة', 'Tomorrow') : offset === -1 ? tr('امبارح', 'Yesterday') : d.toLocaleDateString(locale, { weekday: 'long' });
  const btn = (dir: -1 | 1) => <PressScale label={dir < 0 ? tr('اليوم اللي قبله', 'Previous day') : tr('اليوم اللي بعده', 'Next day')} onPress={() => setOffset(o => o + dir)}>
    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.glassBorder, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={(dir < 0) !== isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={palette.primary} />
    </View></PressScale>;
  return <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
    {btn(-1)}
    <PressScale label={title} onPress={() => setOffset(() => 0)} style={{ flex: 1 }}>
      <View style={{ alignItems: 'center' }}>
        <Txt variant="h3" center>{title}</Txt>
        <Txt variant="caption" center>{label} · {d.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</Txt>
      </View>
    </PressScale>
    {btn(1)}
  </View>;
}

/** Every lecture and section of one day. */
export function DaySchedule({ full = false }: { full?: boolean }) {
  const a = useApp(); const { tr, cache } = a; const [offset, setOffset] = useState(0);
  const slots = timetable(cache); const date = new Date(); date.setDate(date.getDate() + offset); const day = date.getDay();
  const list = slots.filter(s => s.day === day).sort((x, y) => toMinutes(x.start) - toMinutes(y.start));
  return <View style={{ gap: 10 }}>
    <DayNav offset={offset} setOffset={setOffset} title={tr(`محاضراتك (${list.length})`, `Your classes (${list.length})`)} />
    {!slots.length ? <Glass><Txt variant="sub">{tr('الجدول لسه متزامنش أو لسه متنشرش.', 'Timetable is not synced or not published yet.')}</Txt><Button small title={tr('تحديث', 'Refresh')} disabled={!a.session || a.refreshing} onPress={() => { void a.refreshAll(); }} /></Glass>
      : !list.length ? <Glass padding={16}><Txt variant="sub" center>{day === 5 ? tr('جمعة — أجازة 🎉', 'Friday — day off 🎉') : tr('مفيش محاضرات ولا سكاشن في اليوم ده.', 'No lectures or sections this day.')}</Txt></Glass>
        : list.map((s, i) => <SlotCard key={`${s.code}-${s.type}-${i}`} slot={s} />)}
    {full ? <Button variant="glass" title={tr('الجدول كله', 'Full timetable')} onPress={() => router.push('/timetable' as never)} /> : null}
  </View>;
}

/** Absence on the university's real scale: exclusion at 25%. */
export function AbsenceBar({ pct }: { pct: number | null }) {
  const { palette, isAr } = useApp(); const v = absenceScale(pct); const c = toneColor(absenceTone(pct));
  const side = isAr ? 'right' : 'left';
  return <View style={{ gap: 4 }}>
    <View style={{ height: 10, borderRadius: 5, backgroundColor: palette.inputBg }}>
      <View style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: `${v * 100}%`, borderRadius: 5, backgroundColor: c }} />
      {[10, NOTICE_AT].map(p => <View key={p} style={{ position: 'absolute', top: -3, bottom: -3, width: 2, borderRadius: 1, backgroundColor: palette.faint, [side]: `${(p / EXCLUSION) * 100}%` }} />)}
    </View>
    <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
      {['0%', '10%', '20%', '25%'].map(l => <Txt key={l} variant="caption" style={{ fontSize: 10, lineHeight: 13 }}>{l}</Txt>)}
    </View>
  </View>;
}

export function AbsenceCards() {
  const a = useApp(); const { tr, row, cache } = a; const by = absenceByCourse(cache);
  if (!by.size) return <Glass><Txt variant="sub">{tr('لسه مفيش بيانات غياب متزامنة.', 'No absence data synced.')}</Txt></Glass>;
  const list = currentCourses(cache).filter(c => by.has(canonical(c.code))).map(c => ({ ...c, pct: by.get(canonical(c.code)) ?? null })).sort((x, y) => (y.pct ?? 0) - (x.pct ?? 0));
  return <View style={{ gap: 10 }}>
    {list.map(c => <PressScale key={c.code} label={c.title} onPress={() => router.push(`/absence?code=${encodeURIComponent(c.code)}` as never)}>
      <Glass padding={14}><View style={{ gap: 8 }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', gap: 8 }}><Txt variant="label" style={{ flex: 1 }} numberOfLines={1}>{c.title}</Txt><Txt variant="label" color={toneColor(absenceTone(c.pct))}>{c.pct ?? 0}%</Txt></View>
        <AbsenceBar pct={c.pct} />
      </View></Glass></PressScale>)}
    <Txt variant="caption" center>{tr('الحرمان بيكون عند 25% غياب. هنبعتلك تنبيه لما توصل 20%، والإنذارات الرسمية بتيجي من الجامعة.', 'Exclusion at 25% absence. You get a heads-up at 20%; official warnings come from the university.')}</Txt>
  </View>;
}

/** The study plan (tasks) of one day with prev/next. */
export function StudyDay() {
  const a = useApp(); const { tr, row, palette } = a; const [offset, setOffset] = useState(0);
  const d = new Date(); d.setDate(d.getDate() + offset); const date = localDate(d); const today = localDate();
  const list = a.tasks.filter(t => (t.date || today) === date).sort((x, y) => toMinutes(x.time || '') - toMinutes(y.time || ''));
  const done = list.filter(t => t.done).length;
  return <View style={{ gap: 10 }}>
    <DayNav offset={offset} setOffset={setOffset} title={tr(`جدول المذاكرة${list.length ? ` (${done}/${list.length})` : ''}`, `Study plan${list.length ? ` (${done}/${list.length})` : ''}`)} />
    {!list.length ? <Glass padding={16}><View style={{ gap: 10 }}><Txt variant="sub" center>{tr('مفيش مذاكرة متسجلة في اليوم ده.', 'Nothing planned this day.')}</Txt><Button small title={tr('ضيف مذاكرة', 'Plan study')} icon="add" onPress={() => router.push('/study' as never)} /></View></Glass>
      : list.map(t => <PressScale key={t.id} label={t.title} onPress={() => a.toggleTask(t.id)}>
        <Glass padding={14}><View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
          <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={t.done ? palette.success : palette.primary} />
          <View style={{ flex: 1 }}>
            <Txt variant="label" style={t.done ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined} numberOfLines={2}>{t.title}</Txt>
            <Txt variant="caption">{[t.time, t.duration ? tr(`${t.duration} دقيقة`, `${t.duration} min`) : '', t.course].filter(Boolean).join(' · ') || tr('من غير ميعاد', 'Any time')}</Txt>
          </View>
        </View></Glass></PressScale>)}
    <Button small variant="glass" title={tr('جدول المذاكرة كله', 'Full study plan')} onPress={() => router.push('/study' as never)} />
  </View>;
}
/** Older imports. */
export const TodayTasks = StudyDay;