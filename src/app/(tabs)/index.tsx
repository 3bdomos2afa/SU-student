import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { CourseRow } from '@/components/course-row';
import { Avatar, Button, Chip, Divider, Glass, IconBadge, PressScale, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { curriculumCourses } from '@/data/curriculum';
import { PROGRAM_TOTAL_CREDITS, courseByCode, courseStatus, earnedCredits, unlocksOf } from '@/data/curriculum-helpers';
import { quickActions, serviceByAction, type IconName } from '@/data/services';
import { timeAgo } from '@/lib/format';

function Stat({ icon, color, label, value }: { icon: IconName; color: string; label: string; value: string }) {
  const { row } = useApp();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Txt variant="caption" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="label">{value}</Txt>
    </View>
  );
}

export default function Home() {
  const { session, tr, palette, row, completed, refreshAll, refreshing, lastSync, online, lang, cache, draft, isLive } = useApp();
  const earned = earnedCredits(completed);
  const available = curriculumCourses
    .filter((c) => courseStatus(c, completed, earned).status === 'available')
    .sort((a, b) => a.level - b.level || unlocksOf(b.code).length - unlocksOf(a.code).length);
  const pct = Math.min(1, earned / PROGRAM_TOTAL_CREDITS);
  const draftHours = draft.reduce((s, c) => s + (courseByCode.get(c)?.credits ?? 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? tr('صباح الخير', 'Good morning') : hour < 18 ? tr('أهلًا بيك', 'Good afternoon') : tr('مساء الخير', 'Good evening');
  const firstName = (session?.name ?? '').split(' ')[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refreshAll}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
        <Avatar name={session?.name ?? 'U'} />
        <View style={{ flex: 1 }}>
          <Txt variant="sub">{greet} 👋</Txt>
          <Txt variant="h2" numberOfLines={1}>
            {firstName}
          </Txt>
        </View>
        <Chip label={online ? tr('متصل', 'Online') : tr('أوفلاين', 'Offline')} icon={online ? 'radio-button-on' : 'cloud-offline'} color={online ? palette.success : palette.warn} active />
      </View>

      <Glass padding={18}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 18 }}>
          <ProgressRing value={pct} size={122}>
            <Txt variant="h2" center>
              {Math.round(pct * 100)}%
            </Txt>
            <Txt variant="caption" center>
              {earned}/{PROGRAM_TOTAL_CREDITS} {tr('ساعة', 'cr')}
            </Txt>
          </ProgressRing>
          <View style={{ flex: 1, gap: 10 }}>
            <Txt variant="h3">{tr('تقدّمك في الخطة', 'Plan progress')}</Txt>
            <Stat icon="checkmark-circle" color={palette.success} label={tr('مواد خلصتها', 'Completed')} value={`${completed.size}/${curriculumCourses.length}`} />
            <Stat icon="lock-open" color={palette.accent} label={tr('متاحة دلوقتي', 'Available now')} value={`${available.length}`} />
            <Stat icon="hourglass" color={palette.pink} label={tr('ساعات متبقية', 'Hours left')} value={`${Math.max(0, PROGRAM_TOTAL_CREDITS - earned)}`} />
          </View>
        </View>
        {completed.size === 0 ? (
          <Button small variant="glass" icon="git-network" title={tr('علّم المواد اللي خلصتها', 'Mark your completed courses')} onPress={() => router.push('/plan')} style={{ marginTop: 14 }} />
        ) : null}
      </Glass>

      <Glass padding={14}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
          <IconBadge icon={isLive ? 'cloud-done' : 'flask'} color={isLive ? palette.accent : palette.warn} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="label">{isLive ? tr('متصل بـ UnicodeSIS', 'Linked to UnicodeSIS') : tr('وضع تجريبي', 'Demo mode')}</Txt>
            <Txt variant="caption">
              {tr('آخر تحديث', 'Last sync')}: {timeAgo(lastSync, lang)} · {Object.keys(cache).length} {tr('محفوظ أوفلاين', 'saved offline')}
            </Txt>
          </View>
          <Button small icon="refresh" title={tr('تحديث', 'Sync')} loading={refreshing} disabled={!online} onPress={refreshAll} />
        </View>
      </Glass>

      <SectionTitle title={tr('وصول سريع', 'Quick access')} action={tr('كل الخدمات', 'All services')} onAction={() => router.push('/services')} />
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 12 }}>
        {quickActions.map((a) => {
          const s = serviceByAction(a);
          if (!s) return null;
          const c = cache[a];
          return (
            <PressScale key={a} onPress={() => router.push(`/service/${a}`)} style={{ width: '47%', flexGrow: 1 }} label={s.title[lang]}>
              <Glass padding={14}>
                <View style={{ flexDirection: row }}>
                  <IconBadge icon={s.icon} color={palette[s.color]} />
                </View>
                <Txt variant="label" style={{ marginTop: 10 }} numberOfLines={1}>
                  {s.title[lang]}
                </Txt>
                <Txt variant="caption" numberOfLines={1}>
                  {c ? `${tr('محفوظ', 'Saved')} · ${timeAgo(c.at, lang)}` : s.desc[lang]}
                </Txt>
              </Glass>
            </PressScale>
          );
        })}
      </View>

      <SectionTitle title={tr('تقدر تاخدها دلوقتي', 'You can take now')} action={tr('الخطة كاملة', 'Full plan')} onAction={() => router.push('/plan')} />
      <Glass padding={4}>
        {available.slice(0, 4).map((c, i) => (
          <View key={c.code}>
            {i > 0 ? <Divider /> : null}
            <CourseRow course={c} status="available" onPress={() => router.push(`/course/${encodeURIComponent(c.code)}`)} />
          </View>
        ))}
        {available.length === 0 ? (
          <Txt variant="sub" center style={{ padding: 14 }}>
            {tr('مفيش مواد متاحة حسب اللي معلّمه — راجع خطتك.', 'Nothing available based on your marks — review your plan.')}
          </Txt>
        ) : null}
      </Glass>

      <PressScale onPress={() => router.push('/tools')}>
        <Glass padding={14}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
            <IconBadge icon="clipboard" color={palette.pink} size={40} />
            <View style={{ flex: 1 }}>
              <Txt variant="label">{tr('مسودة التسجيل', 'Registration draft')}</Txt>
              <Txt variant="caption">
                {draft.length
                  ? tr(`${draft.length} مواد · ${draftHours} ساعة`, `${draft.length} courses · ${draftHours} credits`)
                  : tr('خلّي التطبيق يقترحلك جدول ذكي', 'Let the app suggest a smart draft')}
              </Txt>
            </View>
            <Ionicons name={row === 'row' ? 'chevron-forward' : 'chevron-back'} size={20} color={palette.sub} />
          </View>
        </Glass>
      </PressScale>

      {!isLive ? (
        <Glass padding={14} tint={undefined}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
            <Ionicons name="information-circle" size={22} color={palette.warn} />
            <Txt variant="caption" style={{ flex: 1 }}>
              {tr('الخدمات شغالة تجريبي. ضيف رابط n8n Webhook من الإعدادات عشان بياناتك الحقيقية من UnicodeSIS تظهر.', 'Services run in demo mode. Add your n8n webhook URL in Settings to load real UnicodeSIS data.')}
            </Txt>
          </View>
        </Glass>
      ) : null}
    </Screen>
  );
}