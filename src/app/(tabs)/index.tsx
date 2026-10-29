import { useState } from 'react';
import { Ionicons } from '@/components/icon';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AbsenceCards, DaySchedule, StudyDay } from '@/components/academic-cards';
import { shortName, studentCode } from '@/lib/student';
import { Entrance } from '@/components/entrance';
import { FocusCard } from '@/components/focus-card';
import { PortalModal } from '@/components/portal-entry';
import { StreakBadge } from '@/components/streak-badge';
import { Button, Glass, PressScale, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { earnedCredits, PROGRAM_TOTAL_CREDITS } from '@/data/curriculum-helpers';
import type { IconName } from '@/data/services';
import { academic } from '@/lib/academic';
import { timeAgo } from '@/lib/format';
import { useReloginState } from '@/lib/relogin-state';

/** SU+ home, in the order students asked for: progress → who you are → services → today → absence → the rest. */
export default function Home() {
  const a = useApp();
  const { tr, lang, row, palette, session, cache } = a;
  const [relogin, setRelogin] = useState(false);
  const silent = useReloginState();
  const data = academic(cache);
  const fullName = (data.name || session?.name || '').trim();
  const name = shortName(fullName) || tr('طالب سيناء', 'SU student');
  const code = studentCode(cache);
  const earned = data.earned;
  const total = PROGRAM_TOTAL_CREDITS;
  const left = earned == null ? null : Math.max(0, total - earned);
  const pct = earned == null ? 0 : Math.min(1, earned / total);

  const services: { ar: string; en: string; icon: IconName; path: string }[] = [
    { ar: 'الجدول', en: 'Timetable', icon: 'calendar-outline', path: '/timetable' },
    { ar: 'الدرجات', en: 'Grades', icon: 'ribbon-outline', path: '/grades' },
    { ar: 'المذاكرة', en: 'Study', icon: 'checkbox-outline', path: '/study' },
    { ar: 'كشكولك', en: 'Notebook', icon: 'book-outline', path: '/notebook' },
  ];
  return (
    <Screen refreshing={a.refreshing} onRefresh={a.refreshAll}>
      {/* Header: name, ID, streak, language */}
      <Entrance>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="h3" color="#FFFFFF">{name.slice(0, 1)}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="h3" numberOfLines={2} style={{ fontSize: 16, lineHeight: 21 }}>{name}</Txt>
            {session ? (
              <View style={{ flexDirection: row, alignItems: 'center', gap: 5 }}>
                <Ionicons name="id-card-outline" size={13} color={palette.sub} />
                <Txt variant="caption" numberOfLines={1}>{code || tr('الرقم الجامعي بيتحمّل…', 'Loading ID…')}</Txt>
              </View>
            ) : null}
          </View>
          <StreakBadge />
          <PressScale label="Language" onPress={() => a.updateSettings({ lang: lang === 'ar' ? 'en' : 'ar' })}>
            <View style={{ height: 40, paddingHorizontal: 10, borderRadius: 20, backgroundColor: palette.card, flexDirection: row, alignItems: 'center', gap: 6 }}>
              <Ionicons name="language" size={15} color={palette.text} />
              <Txt variant="label" style={{ fontSize: 12.5, lineHeight: 16 }}>{lang === 'ar' ? 'EN' : 'عربي'}</Txt>
            </View>
          </PressScale>
        </View>
      </Entrance>

      {/* (a) Progress hero */}
      <Entrance delay={40}>
        <Glass padding={18} radius={26}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="caption">{tr('مشوارك في الكلية', 'Your degree')}</Txt>
              <Txt variant="h2" style={{ fontSize: 21, lineHeight: 29 }}>
                {earned == null ? tr('لسه بنحمّل ساعاتك…', 'Loading your credits…') : tr(`ناجح في ${earned} ساعة`, `Passed ${earned} credits`)}
              </Txt>
              {earned != null ? <Txt variant="sub">{tr(`من ${total} ساعة في البرنامج`, `of ${total} in the programme`)}</Txt> : null}
              <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flexDirection: row, alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#9ED93A' }} />
                  <Txt variant="caption">{left == null ? '—' : tr(`فاضلك ${left} ساعة`, `${left} to go`)}</Txt>
                </View>
                <View style={{ flexDirection: row, alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: palette.purple }} />
                  <Txt variant="caption">CGPA {data.gpa === null ? '—' : data.gpa.toFixed(2)}</Txt>
                </View>
              </View>
            </View>
            <ProgressRing value={pct} size={86} stroke={10} track={palette.soft} colors={['#9ED93A', '#9ED93A']}>
              <Txt variant="h2" center>{earned == null ? '—' : `${Math.round(pct * 100)}%`}</Txt>
              <Txt variant="caption" center style={{ fontSize: 10.5, lineHeight: 14 }}>{tr('خلّصت', 'done')}</Txt>
            </ProgressRing>
          </View>
          {!session ? <Button icon="log-in-outline" title={tr('اربط حساب الجامعة', 'Connect university account')} onPress={() => router.push('/login')} style={{ marginTop: 14 }} /> : null}
        </Glass>
      </Entrance>

      {a.authExpired && !silent ? (
        <PressScale label="relogin" onPress={() => setRelogin(true)}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: palette.pnk }}>
            <Ionicons name="logo-google" size={18} color={palette.text} />
            <Txt variant="label" style={{ flex: 1 }}>{tr('محتاجين ندخل تاني — دوس هنا', 'Sign in again — tap here')}</Txt>
          </View>
        </PressScale>
      ) : null}
      <PortalModal visible={relogin} onClose={() => setRelogin(false)} />
      {a.syncErrors > 0 || a.storageError ? (
        <Glass padding={14}>
          <View style={{ flexDirection: row, gap: 10, alignItems: 'center' }}>
            <Ionicons name="warning-outline" size={20} color={palette.warn} />
            <Txt variant="sub" style={{ flex: 1 }} color={palette.warn}>
              {a.storageError ? tr('في حاجات متحفظتش. شوف مساحة الموبايل.', 'Some changes could not be saved. Check device space.') : tr('في بيانات متحدّثتش، بنعرضلك آخر نسخة محفوظة.', 'Some data could not refresh; showing the last saved copy.')}
            </Txt>
          </View>
        </Glass>
      ) : null}

      {/* (c) Services */}
      <Entrance delay={120}>
        <SectionTitle title={tr('خدماتك', 'Services')} action={tr('الكل', 'All')} onAction={() => router.push('/services' as never)} />
        <View style={{ flexDirection: row, gap: 10 }}>
          {services.map((q, i) => (
            <PressScale key={q.en} label={tr(q.ar, q.en)} onPress={() => router.push(q.path as never)} style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 22, backgroundColor: i === 0 ? palette.lil : palette.card }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: i === 0 ? palette.card : palette.soft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={q.icon} size={20} color={palette.text} />
                </View>
                <Txt variant="label" center  style={{ fontSize: 12.5, lineHeight: 17 }}>{tr(q.ar, q.en)}</Txt>
              </View>
            </PressScale>
          ))}
        </View>
      </Entrance>

      {/* (d) Today's classes */}
      <Entrance delay={160}>
        <DaySchedule full />
      </Entrance>

      {/* (e) Absence */}
      <Entrance delay={200}>
        <SectionTitle title={tr('غيابك', 'Absence')} action={tr('التفاصيل', 'Details')} onAction={() => router.push('/absence' as never)} />
        <AbsenceCards />
      </Entrance>

      <Entrance delay={240}>
        {a.focus.endAt !== null ? <FocusCard compact /> : null}
      </Entrance>
      <Entrance delay={280}>
        <StudyDay />
      </Entrance>

      {!session && a.completed.size > 0 ? (
        <Txt variant="caption" center>
          {tr(`خطتك اليدوية لوحدها: ${a.completed.size} مادة، ${earnedCredits(a.completed)} ساعة.`, `Separate manual plan: ${a.completed.size} courses, ${earnedCredits(a.completed)} credits.`)}
        </Txt>
      ) : null}
      <Txt variant="caption" center>
        {tr('آخر تحديث', 'Last sync')} · {timeAgo(a.lastSync, lang)}
      </Txt>
    </Screen>
  );
}