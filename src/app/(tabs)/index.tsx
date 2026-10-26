import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AbsenceCards, DaySchedule, StudyDay } from '@/components/academic-cards';
import { shortName, studentCode } from '@/lib/student';
import { Entrance } from '@/components/entrance';
import { FocusCard } from '@/components/focus-card';
import { Button, Glass, IconBadge, PressScale, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { earnedCredits, courseByCode, PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import type { IconName } from '@/data/services';
import { academic, localDate } from '@/lib/academic';
import { timeAgo } from '@/lib/format';

const toMin = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export default function Home() {
  const a = useApp();
  const { tr, lang, row, palette, session, cache, isAr } = a;
  const data = academic(cache);
  const name = shortName(data.name || session?.name || '') || tr('طالب سيناء', 'SU student');
  const code = studentCode(cache);
  const hour = new Date().getHours();
  const greet = hour < 12 ? tr('صباح الخير', 'Good morning') : hour < 18 ? tr('مساء النور', 'Good afternoon') : tr('مساء الخير', 'Good evening');
  const dateLabel = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const today = localDate();
  const pendingToday = a.tasks.filter((t) => !t.done && (!t.date || t.date === today));
  const doneToday = a.tasks.filter((t) => t.done && t.date === today).length;
  const nowMin = hour * 60 + new Date().getMinutes();
  const todaySlots = data.slots
    .filter((s) => s.day === new Date().getDay())
    .sort((x, y) => (toMin(x.start) ?? 9999) - (toMin(y.start) ?? 9999));

  const earned = data.earned;
  const quick: { ar: string; en: string; icon: IconName; path: string; color: string }[] = [
    { ar: 'المذاكرة', en: 'Study', icon: 'checkbox-outline', path: '/study', color: '#4F46E5' },
    { ar: 'الجدول', en: 'Timetable', icon: 'calendar-outline', path: '/timetable', color: '#0891B2' },
    { ar: 'الدرجات', en: 'Grades', icon: 'ribbon-outline', path: '/grades', color: '#9333EA' },
    { ar: 'كشكولك', en: 'Notebook', icon: 'book-outline', path: '/notebook', color: '#DB2777' },
  ];

  return (
    <Screen refreshing={a.refreshing} onRefresh={a.refreshAll}>
      {/* Hero */}
      <Entrance>
        <LinearGradient colors={palette.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 32, padding: 22, overflow: 'hidden', boxShadow: '0 18px 40px rgba(79,70,229,0.35)' }}>
          <View pointerEvents="none" style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.10)', top: -80, [isAr ? 'left' : 'right']: -60 }} />
          <View pointerEvents="none" style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)', bottom: -50, [isAr ? 'right' : 'left']: -30 }} />
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="caption" color="rgba(255,255,255,0.8)">{dateLabel}</Txt>
            <PressScale label="Language" onPress={() => a.updateSettings({ lang: lang === 'ar' ? 'en' : 'ar' })}>
              <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', flexDirection: row, alignItems: 'center', gap: 6 }}>
                <Ionicons name="language" size={14} color="#fff" />
                <Txt variant="label" color="#fff" style={{ fontSize: 12, lineHeight: 16 }}>{lang === 'ar' ? 'EN' : 'عربي'}</Txt>
              </View>
            </PressScale>
          </View>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 16, marginTop: 14 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="sub" color="rgba(255,255,255,0.85)">{greet} 👋</Txt>
              <Txt variant="h2" color="#fff" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{name}</Txt>
              <Txt variant="caption" color="rgba(255,255,255,0.75)">
                {session ? (code ? `ID · ${code}` : tr('الرقم الجامعي بيتحمّل…', 'Loading student code…')) : tr('حساب الجامعة مش مربوط', 'University account not linked')}
              </Txt>
            </View>
            <ProgressRing value={(earned ?? 0) / PROGRAM_TOTAL_CREDITS} size={104} stroke={10} track="rgba(255,255,255,0.18)" colors={['#67E8F9', '#F0ABFC']}>
              <Txt variant="h2" color="#fff" center>{earned ?? '—'}</Txt>
              <Txt variant="caption" color="rgba(255,255,255,0.8)" center style={{ fontSize: 10.5, lineHeight: 14 }}>{tr(`من ${PROGRAM_TOTAL_CREDITS} ساعة`, `of ${PROGRAM_TOTAL_CREDITS} cr`)}</Txt>
            </ProgressRing>
          </View>
          <View style={{ flexDirection: row, gap: 8, marginTop: 18 }}>
            {[
              { k: 'CGPA', v: data.gpa === null ? '—' : data.gpa.toFixed(2) },
              { k: tr('مهام النهاردة', 'Tasks today'), v: String(pendingToday.length) },
              { k: tr('محاضرات النهاردة', 'Classes today'), v: cache.SEC_TIMETABLE ? String(todaySlots.length) : '—' },
            ].map((m) => (
              <View key={m.k} style={{ flex: 1, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                <Txt variant="h3" color="#fff" center>{m.v}</Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.78)" center numberOfLines={1} style={{ fontSize: 11 }}>{m.k}</Txt>
              </View>
            ))}
          </View>
          {!session ? (
            <Button variant="light" icon="log-in-outline" title={tr('اربط حساب الجامعة', 'Connect university account')} onPress={() => router.push('/login')} style={{ marginTop: 16 }} />
          ) : null}
        </LinearGradient>
      </Entrance>

      {a.authExpired ? <Button variant="danger" icon="alert-circle-outline" title={tr('الجلسة خلصت، سجّل دخول تاني', 'Session expired — sign in again')} onPress={() => router.push('/settings')} /> : null}
      {a.syncErrors > 0 || a.storageError ? (
        <Glass padding={14} tint={palette.card}>
          <View style={{ flexDirection: row, gap: 10, alignItems: 'center' }}>
            <Ionicons name="warning-outline" size={20} color={palette.warn} />
            <Txt variant="sub" style={{ flex: 1 }} color={palette.warn}>
              {a.storageError ? tr('فيه تغييرات متحفظتش. اتأكد من مساحة الجهاز.', 'Some changes could not be saved. Check device space.') : tr('فيه خدمات متحدّثتش، فبنعرضلك آخر بيانات محفوظة.', 'Some services could not refresh; last saved data stays visible.')}
            </Txt>
          </View>
        </Glass>
      ) : null}

      {/* Quick actions */}
      <Entrance delay={80}>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
          {quick.map((q) => (
            <PressScale key={q.en} label={tr(q.ar, q.en)} onPress={() => router.push(q.path as never)} style={{ width: '23%' }}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.glassBorder, alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${palette.shadow}` }}>
                  <IconBadge icon={q.icon} color={q.color} size={42} solid />
                </View>
                <Txt variant="label" center style={{ fontSize: 12.5, lineHeight: 17 }}>{tr(q.ar, q.en)}</Txt>
              </View>
            </PressScale>
          ))}
        </View>
      </Entrance>

      {/* Classes of the day */}
      <Entrance delay={160}>
        <DaySchedule full />
      </Entrance>

      {/* Focus */}
      <Entrance delay={240}>
        {a.focus.endAt !== null ? (
          <FocusCard compact />
        ) : (
          <PressScale label={tr('يلا نركّز', 'Start focus')} onPress={() => router.push('/study')}>
            <LinearGradient colors={['#0891B2', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, flexDirection: row, alignItems: 'center', gap: 14 }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="timer-outline" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="h3" color="#fff">{tr('جلسة تركيز 25 دقيقة', '25-minute focus session')}</Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.82)">{tr('التايمر شغال حتى لو قفلت الأبلكيشن', 'Keeps counting even if you close the app')}</Txt>
              </View>
              <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={22} color="#fff" />
            </LinearGradient>
          </PressScale>
        )}
      </Entrance>

      {/* Study plan */}
      <Entrance delay={320}>
        <StudyDay />
      </Entrance>

      {/* Absence */}
      <Entrance delay={400}>
        <SectionTitle title={tr('الغياب', 'Absence')} action={tr('التفاصيل', 'Details')} onAction={() => router.push('/absence' as never)} />
        <AbsenceCards />
      </Entrance>

      {!session && a.completed.size > 0 ? (
        <Txt variant="caption" center>
          {tr(`خطتك اليدوية منفصلة: ${a.completed.size} مواد، ${earnedCredits(a.completed)} ساعة.`, `Separate manual plan: ${a.completed.size} courses, ${earnedCredits(a.completed)} credits.`)}
        </Txt>
      ) : null}
      <Txt variant="caption" center>
        {tr('آخر مزامنة', 'Last sync')} · {timeAgo(a.lastSync, lang)}
      </Txt>
    </Screen>
  );
}