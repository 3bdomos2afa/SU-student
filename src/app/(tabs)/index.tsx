import { useState } from 'react';
import { Ionicons } from '@/components/icon';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AbsenceCards, DaySchedule, StudyDay } from '@/components/academic-cards';
import { shortName, studentCode } from '@/lib/student';
import { Entrance } from '@/components/entrance';
import { FocusCard } from '@/components/focus-card';
import { PortalModal } from '@/components/portal-entry';
import { StreakCard } from '@/components/streak-card';
import { Button, Glass, IconBadge, PressScale, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { earnedCredits, courseByCode, PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import type { IconName } from '@/data/services';
import { academic, localDate } from '@/lib/academic';
import { timeAgo } from '@/lib/format';
import { TOXIC, hard } from '@/lib/theme';

const toMin = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export default function Home() {
  const a = useApp();
  const { tr, lang, row, palette, session, cache, isAr } = a;
  const [relogin, setRelogin] = useState(false);
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
  const quick: { ar: string; en: string; icon: IconName; path: string; color: 'lil' | 'lim' | 'yel' | 'pnk' }[] = [
    { ar: 'جدول المذاكرة', en: 'Study planner', icon: 'checkbox-outline', path: '/study', color: 'lil' },
    { ar: 'الجدول', en: 'Timetable', icon: 'calendar-outline', path: '/timetable', color: 'lim' },
    { ar: 'الدرجات', en: 'Grades', icon: 'ribbon-outline', path: '/grades', color: 'yel' },
    { ar: 'كشكولك', en: 'Notebook', icon: 'book-outline', path: '/notebook', color: 'pnk' },
  ];

  return (
    <Screen refreshing={a.refreshing} onRefresh={a.refreshAll}>
      {/* Hero */}
      <Entrance>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption">{dateLabel}</Txt>
              <Txt variant="h2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{greet}، {name} 👋</Txt>
              <Txt variant="caption">{session ? (code ? `ID · ${code}` : tr('الرقم الجامعي بيتحمّل…', 'Loading student code…')) : tr('حساب الجامعة مش مربوط', 'University account not linked')}</Txt>
            </View>
            <PressScale label="Language" onPress={() => a.updateSettings({ lang: lang === 'ar' ? 'en' : 'ar' })}>
              <View style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: palette.card, borderWidth: 2, borderColor: 'transparent', flexDirection: row, alignItems: 'center', gap: 6 }}>
                <Ionicons name="language" size={14} color={palette.text} />
                <Txt variant="label" style={{ fontSize: 12, lineHeight: 16 }}>{lang === 'ar' ? 'EN' : 'عربي'}</Txt>
              </View>
            </PressScale>
          </View>
          <View style={{ backgroundColor: TOXIC.purple, borderRadius: 28, borderWidth: 2.5, borderColor: 'transparent', padding: 20, overflow: 'hidden', boxShadow: hard(palette.ink, 5) }}>
            <Ionicons name="sparkles" size={64} color="rgba(214,247,126,0.45)" style={{ position: 'absolute', top: -6, [isAr ? 'left' : 'right']: -6 }} />
            <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="caption" color="rgba(255,255,255,0.82)">{tr('تقدّمك في البرنامج', 'Program progress')}</Txt>
                <Txt variant="display" color="#FFFFFF" style={{ fontSize: 40, lineHeight: 50 }}>{earned == null ? '—' : `${Math.min(100, Math.round((earned / PROGRAM_TOTAL_CREDITS) * 100))}%`}</Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.82)">{tr('من الساعات المعتمدة', 'of required credits')}</Txt>
              </View>
              <ProgressRing value={(earned ?? 0) / PROGRAM_TOTAL_CREDITS} size={98} stroke={10} track="rgba(255,255,255,0.22)" colors={[TOXIC.lime, TOXIC.lime]}>
                <Txt variant="h2" color="#FFFFFF" center>{earned ?? '—'}</Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.85)" center style={{ fontSize: 10.5, lineHeight: 14 }}>{tr(`من ${PROGRAM_TOTAL_CREDITS} ساعة`, `of ${PROGRAM_TOTAL_CREDITS} cr`)}</Txt>
              </ProgressRing>
            </View>
            <View style={{ flexDirection: row, gap: 8, marginTop: 16 }}>
              {[
                { k: 'CGPA', v: data.gpa === null ? '—' : data.gpa.toFixed(2) },
                { k: tr('مهام النهاردة', 'Tasks today'), v: String(pendingToday.length) },
                { k: tr('محاضرات النهاردة', 'Classes today'), v: cache.SEC_TIMETABLE ? String(todaySlots.length) : '—' },
              ].map((m) => (
                <View key={m.k} style={{ flex: 1, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: 'transparent' }}>
                  <Txt variant="h3" color="#FFFFFF" center>{m.v}</Txt>
                  <Txt variant="caption" color="rgba(255,255,255,0.85)" center numberOfLines={1} style={{ fontSize: 11 }}>{m.k}</Txt>
                </View>
              ))}
            </View>
            {!session ? <Button icon="log-in-outline" title={tr('اربط حساب الجامعة', 'Connect university account')} onPress={() => router.push('/login')} style={{ marginTop: 16 }} /> : null}
          </View>
        </View>
      </Entrance>

      {a.authExpired ? <Button variant="danger" icon="logo-google" title={tr('الجلسة خلصت — دوس هنا وادخل بجوجل تاني', 'Session expired — tap to sign in with Google')} onPress={() => setRelogin(true)} /> : null}
      <PortalModal visible={relogin} onClose={() => setRelogin(false)} />
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
                <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: palette[q.color], borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', boxShadow: hard(palette.ink, 3) }}>
                  <Ionicons name={q.icon} size={26} color={palette.text} />
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

      {/* Streak (focus timer while running) */}
      <Entrance delay={240}>
        {a.focus.endAt !== null ? <FocusCard compact /> : <StreakCard />}
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