import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { Ionicons } from '@/components/icon';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { canonical, localDate, timetable, type Slot } from '@/lib/academic';
import { absenceByCourse, absenceScale, absenceTone, toneColor, EXCLUSION, NOTICE_AT } from '@/lib/absence';
import { currentCourses, toMinutes } from '@/lib/student';
import { courseByCode } from '@/data/curriculum-helpers';
import { Button, Glass, PressScale, Txt } from './ui';

export const LECTURE_COLOR = '#4F46E5', SECTION_COLOR = '#0D9488';
export function slotColor(type: Slot['type']) { return type === 'lecture' ? LECTURE_COLOR : type === 'section' ? SECTION_COLOR : '#7C3AED'; }

type MetaIcon = 'calendar-outline' | 'location-outline' | 'person-outline';
function Meta({ icon, v }: { icon: MetaIcon; v: string }) {
  const { row, palette } = useApp();
  return <View style={{ flexDirection: row, alignItems: 'center', gap: 4, maxWidth: '100%' }}><Ionicons name={icon} size={13} color={palette.sub} /><Txt variant="caption" numberOfLines={1}>{v}</Txt></View>;
}

export function SlotCard({ slot, showDay, now }: { slot: Slot; showDay?: boolean; now?: boolean }) {
  const { tr, row, palette } = useApp(); const c = slotColor(slot.type);
  const dark = parseInt(palette.text.slice(1, 3), 16) > 200;
  const timeColor = dark ? (now ? '#C9F27A' : slot.type === 'section' ? '#FFD98A' : '#D7CCFF') : now ? '#3E7A05' : c;
  const tint = now ? palette.lim : slot.type === 'lecture' ? palette.lil : slot.type === 'section' ? palette.yel : undefined;
  const kind = slot.type === 'lecture' ? tr('محاضرة', 'Lecture') : slot.type === 'section' ? tr('سكشن', 'Section') : slot.kind || tr('حصة', 'Class');
  return <PressScale label={slot.title || slot.code} onPress={() => router.push(`/course/${encodeURIComponent(slot.code)}` as never)}>
    <Glass padding={14} tint={tint}><View style={{ flexDirection: row, gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Txt variant="label" color={timeColor}>{slot.start || '—'} – {slot.end || '—'}</Txt>
          <View style={{ flexDirection: row, gap: 6 }}>{now ? <View style={{ backgroundColor: '#5FA80A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}><Txt variant="caption" color="#fff">{tr('دلوقتي', 'Now')}</Txt></View> : null}<View style={{ backgroundColor: c, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}><Txt variant="caption" color="#fff">{kind}</Txt></View></View>
        </View>
        <Txt variant="h3" numberOfLines={2}>{slot.title || slot.code}</Txt>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
          {showDay && slot.dayLabel ? <Meta icon="calendar-outline" v={slot.dayLabel} /> : null}
          <Meta icon="location-outline" v={[slot.room, slot.building].filter(Boolean).join(' · ') || tr('القاعة مش منشورة', 'Room not published')} />
          {slot.teachers ? <Meta icon="person-outline" v={slot.teachers} /> : null}
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
        : list.map((s, i) => { const m = new Date().getHours() * 60 + new Date().getMinutes(); return <SlotCard key={`${s.code}-${s.type}-${i}`} slot={s} now={offset === 0 && toMinutes(s.start) <= m && m < toMinutes(s.end)} />; })}
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
const DAY_SHORT_AR = ['حد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'];
const DAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DONE_GREEN = '#7BC62D';

/** Half-circle progress gauge (V14 "إنجاز النهارده"). */
function Gauge({ done, total }: { done: number; total: number }) {
  const { palette } = useApp();
  const p = total ? Math.min(1, done / total) : 0; const len = Math.PI * 44;
  const arc = 'M 12 58 A 44 44 0 0 1 100 58';
  return <View style={{ width: 112, height: 70, alignItems: 'center', justifyContent: 'flex-end' }}>
    <Svg width={112} height={66} viewBox="0 0 112 66" style={{ position: 'absolute', top: 0, left: 0 }}>
      <Path d={arc} stroke={palette.soft} strokeWidth={12} fill="none" strokeLinecap="round" />
      {p > 0 ? <Path d={arc} stroke={DONE_GREEN} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={`${len * p} ${len}`} /> : null}
    </Svg>
    <Txt variant="h2" style={{ lineHeight: 30 }}>{`${done}/${total}`}</Txt>
  </View>;
}

/** Home study plan: week strip, today's progress gauge and the tasks list (V14 design). */
export function StudyDay() {
  const a = useApp(); const { tr, row, palette, isAr } = a;
  const today = localDate();
  const [date, setDate] = useState(today); const [week, setWeek] = useState(0);
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 1) % 7) + week * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const of = (k: string) => a.tasks.filter(t => (t.date || today) === k);
  const list = of(date).sort((x, y) => Number(x.done) - Number(y.done) || toMinutes(x.time || '') - toMinutes(y.time || ''));
  const done = list.filter(t => t.done).length;
  const minutes = list.filter(t => t.done).reduce((m, t) => m + (t.duration ?? 0), 0);
  const tints = [palette.lil, palette.yel, palette.pnk, palette.lim];
  const arrow = (dir: -1 | 1) => <PressScale label={dir < 0 ? tr('الأسبوع اللي فات', 'Previous week') : tr('الأسبوع الجاي', 'Next week')} onPress={() => setWeek(w => w + dir)}>
    <View style={{ width: 28, height: 52, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={(dir < 0) !== isAr ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.sub} />
    </View></PressScale>;
  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt variant="h3">{tr('جدول المذاكرة', 'Study plan')}</Txt>
      <PressScale label={tr('الكل', 'All')} onPress={() => router.push('/study' as never)}><Txt variant="label" color={palette.primary}>{tr('الكل', 'All')}</Txt></PressScale>
    </View>
    <View style={{ flexDirection: row, alignItems: 'center' }}>
      {arrow(-1)}
      <View style={{ flex: 1, flexDirection: row, justifyContent: 'space-between' }}>
        {days.map(d => {
          const k = localDate(d); const on = k === date; const has = of(k).length > 0;
          return <PressScale key={k} label={k} onPress={() => setDate(k)}>
            <View style={{ width: 40, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: on ? palette.ink : 'transparent' }}>
              <Txt variant="caption" style={{ color: on ? palette.onInk : palette.sub, fontSize: 11, lineHeight: 14 }}>{(isAr ? DAY_SHORT_AR : DAY_SHORT_EN)[d.getDay()]}</Txt>
              <Txt variant="label" style={{ color: on ? palette.onInk : k === today ? palette.primary : palette.text, fontSize: 16, lineHeight: 20 }}>{d.getDate()}</Txt>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: has ? (on ? palette.lime : palette.primary) : 'transparent' }} />
            </View>
          </PressScale>;
        })}
      </View>
      {arrow(1)}
    </View>
    <Glass padding={16}><View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt variant="h3">{date === today ? tr('إنجاز النهارده', "Today's progress") : tr('إنجاز اليوم ده', 'Progress this day')}</Txt>
        {[[DONE_GREEN, tr(`${done} خلصتهم`, `${done} done`)], [palette.primary, tr(`${list.length - done} فاضلين`, `${list.length - done} left`)], [palette.warn, tr(`${minutes} دقيقة مذاكرة`, `${minutes} min studied`)]].map(([c, l]) =>
          <View key={l} style={{ flexDirection: row, alignItems: 'center', gap: 6 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} /><Txt variant="caption">{l}</Txt></View>)}
      </View>
      <Gauge done={done} total={list.length} />
    </View></Glass>
    <Glass padding={16}><View style={{ gap: 2 }}>
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Txt variant="h3">{tr('مهامك', 'Your tasks')}</Txt>
        <Txt variant="caption">{list.length ? tr(`${done} من ${list.length}`, `${done} of ${list.length}`) : ''}</Txt>
      </View>
      {!list.length ? <Txt variant="sub" center style={{ paddingVertical: 10 }}>{tr('مفيش مهام في اليوم ده.', 'No tasks this day.')}</Txt> : null}
      {list.map((t, i) => <PressScale key={t.id} label={t.title} onPress={() => a.toggleTask(t.id)}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: palette.glassBorder }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tints[i % tints.length], alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={t.course ? 'book-outline' : 'create-outline'} size={19} color={palette.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="label" numberOfLines={2} style={t.done ? { textDecorationLine: 'line-through', opacity: 0.55 } : undefined}>{t.title}</Txt>
            <Txt variant="caption" numberOfLines={1}>{t.done ? tr('خلصت ✓', 'Done ✓') : [t.time, t.duration ? tr(`${t.duration} دقيقة`, `${t.duration} min`) : '', t.course ? (courseByCode.get(t.course)?.title ?? '') : ''].filter(Boolean).join(' · ') || tr('من غير ميعاد', 'Any time')}</Txt>
          </View>
          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.done ? DONE_GREEN : 'transparent', borderWidth: 2, borderColor: t.done ? DONE_GREEN : palette.faint }}>
            {t.done ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
          </View>
        </View>
      </PressScale>)}
      <PressScale label={tr('ضيف مهمة', 'Add task')} onPress={() => router.push('/study' as never)}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, marginTop: 8, borderRadius: 22, backgroundColor: palette.ink }}>
          <Ionicons name="add" size={18} color={palette.onInk} />
          <Txt variant="label" style={{ color: palette.onInk }}>{tr('ضيف مهمة', 'Add task')}</Txt>
        </View>
      </PressScale>
    </View></Glass>
  </View>;
}
/** Older imports. */
export const TodayTasks = StudyDay;