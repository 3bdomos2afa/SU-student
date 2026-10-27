import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { FocusCard } from '@/components/focus-card';
import { PageTop } from '@/components/page';
import { useTicker } from '@/components/streak-card';
import { Button, Chip, Glass, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { freshFocus, startFocus } from '@/lib/focus';
import { computeStreak, hm, TARGETS, type DotState } from '@/lib/streak';
import { TOXIC, hard } from '@/lib/theme';

const DAYS_AR = ['سبت', 'حد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة'];
const DAYS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function StreakScreen() {
  const a = useApp();
  const { tr, row, palette, isAr, streak, focus } = a;
  const timerOn = focus.endAt !== null;
  const freeOn = streak.free !== null;
  const now = useTicker(timerOn || freeOn);
  const v = computeStreak(streak, focus, now);
  const freeSecs = freeOn ? Math.max(0, Math.floor((now - streak.free!) / 1000)) : 0;
  const clock = `${Math.floor(freeSecs / 3600)}:${String(Math.floor((freeSecs % 3600) / 60)).padStart(2, '0')}:${String(freeSecs % 60).padStart(2, '0')}`;
  const left = Math.max(0, streak.target - v.today);

  const dot = (s: DotState) =>
    s === 'met' ? { bg: TOXIC.lime, fg: '#0B0D14', icon: 'flame' as const }
      : s === 'rest' ? { bg: '#C9AEFF', fg: '#0B0D14', icon: 'snow' as const }
        : s === 'today' ? { bg: 'transparent', fg: '#F2F2F2', icon: 'ellipse-outline' as const }
          : s === 'missed' ? { bg: '#2B3245', fg: '#6B7385', icon: 'close' as const }
            : { bg: 'transparent', fg: '#4A5266', icon: null };

  const kindLabel = (k: 'timer' | 'free' | 'task') => (k === 'timer' ? tr('تايمر', 'Timer') : k === 'free' ? tr('مذاكرة حرة', 'Free study') : tr('مهمة خلصت', 'Task done'));
  const kindIcon = (k: 'timer' | 'free' | 'task') => (k === 'timer' ? 'timer-outline' : k === 'free' ? 'stopwatch-outline' : 'checkmark-circle-outline') as 'timer-outline';

  return (
    <Screen>
      <PageTop title={tr('الستريك', 'Streak')} subtitle={tr('ذاكر هدفك كل يوم وماتكسرش السلسلة', 'Hit your daily goal and keep the chain')} />

      {/* Flame card */}
      <View style={{ backgroundColor: TOXIC.navy, borderRadius: 24, borderWidth: 2.5, borderColor: '#0B0D14', padding: 20, gap: 18, boxShadow: hard('#0B0D14', 5) }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 16 }}>
          <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: TOXIC.lime, borderWidth: 2.5, borderColor: '#0B0D14', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
            <Ionicons name="flame" size={44} color="#0B0D14" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="display" color="#F2F2F2" style={{ fontSize: 46, lineHeight: 56 }}>{v.current}</Txt>
            <Txt variant="label" color="#F2F2F2">{tr('يوم ورا بعض', 'days in a row')}</Txt>
            <Txt variant="caption" color="#9AA3B5">{tr(`أطول ستريك: ${v.best} يوم`, `Longest: ${v.best} days`)}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
          {v.week.map((d, i) => {
            const s = dot(d.state);
            return (
              <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.bg, borderWidth: 2, borderColor: d.state === 'future' ? '#2B3245' : d.state === 'today' ? TOXIC.lime : '#0B0D14', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon ? <Ionicons name={s.icon} size={17} color={s.fg} /> : null}
                </View>
                <Txt variant="caption" color={d.state === 'today' ? TOXIC.lime : '#9AA3B5'} style={{ fontSize: 11, lineHeight: 15 }}>{(isAr ? DAYS_AR : DAYS_EN)[i]}</Txt>
              </View>
            );
          })}
        </View>
        <Txt variant="caption" color="#9AA3B5">
          {v.restLeft ? tr('❄️ معاك يوم راحة واحد الأسبوع ده — لو فوّت يوم الستريك مش هيتكسر', '❄️ 1 rest day left this week — miss a day and the streak survives') : tr('❄️ استخدمت يوم الراحة بتاع الأسبوع ده', '❄️ This week’s rest day is used')}
        </Txt>
      </View>

      {/* Daily target */}
      <SectionTitle title={tr('هدفك اليومي', 'Daily goal')} />
      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8 }}>
        {TARGETS.map((m) => (
          <Chip key={m} active={streak.target === m} label={tr(`${m / 60} ساعة`, `${m / 60} h`)} onPress={() => a.setStreak({ target: m })} />
        ))}
      </View>

      {/* Today */}
      <Glass tint={palette.lil}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 16 }}>
          <ProgressRing value={v.pct} size={112} stroke={11}>
            <Txt variant="h2" style={{ fontVariant: ['tabular-nums'] }}>{hm(v.today)}</Txt>
            <Txt variant="caption">{tr(`من ${hm(streak.target)}`, `of ${hm(streak.target)}`)}</Txt>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="h3">{tr('اتحسب النهارده', 'Counted today')}</Txt>
            <Txt variant="sub">{v.met ? tr('خلّصت هدف النهارده 🔥 اليوم اتحسب', 'Goal reached 🔥 today counts') : tr(`فاضلك ${hm(left)} ساعة وتقفل اليوم`, `${hm(left)} h to go`)}</Txt>
          </View>
        </View>
        {v.items.length ? (
          <View style={{ gap: 8, marginTop: 14 }}>
            {v.items.map((it, i) => (
              <View key={i} style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
                <Ionicons name={kindIcon(it.kind)} size={18} color={palette.text} />
                <Txt style={{ flex: 1 }} numberOfLines={1}>{it.title || kindLabel(it.kind)}</Txt>
                <Txt variant="label">{tr(`${Math.round(it.m)} د`, `${Math.round(it.m)} min`)}</Txt>
              </View>
            ))}
          </View>
        ) : (
          <Txt variant="caption" style={{ marginTop: 12 }}>{tr('لسه مفيش حاجة النهارده. التايمر والمذاكرة الحرة والمهام اللي بتخلّصها كلها بتتحسب.', 'Nothing yet. Timer minutes, free study and finished tasks all count.')}</Txt>
        )}
      </Glass>

      {/* Actions */}
      {timerOn ? <FocusCard compact /> : null}
      {freeOn ? (
        <Glass tint={palette.lim}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Txt variant="label">{tr('مذاكرة حرة شغالة', 'Free study running')}</Txt>
            <Txt variant="display" style={{ fontSize: 44, lineHeight: 54, fontVariant: ['tabular-nums'] }}>{clock}</Txt>
            <Button style={{ alignSelf: 'stretch' }} icon="stop" title={tr('خلّصت، احسبها', 'Done, count it')} onPress={a.stopFree} />
          </View>
        </Glass>
      ) : null}
      {!timerOn && !freeOn ? (
        <View style={{ flexDirection: row, gap: 10 }}>
          <Button style={{ flex: 1 }} icon="timer-outline" title={tr('ابدأ تايمر', 'Start timer')} onPress={() => a.setFocus(startFocus(freshFocus(focus.duration / 60 || 25)))} />
          <Button style={{ flex: 1 }} variant="glass" icon="stopwatch-outline" title={tr('ذاكر بحرية', 'Free study')} onPress={a.startFree} />
        </View>
      ) : null}
      <Txt variant="caption" center>{tr('المهمة اللي ركّزت عليها بالتايمر مش بتتحسب مرتين لما تعلّم عليها إنها خلصت.', 'A task you timed is not counted twice when you tick it done.')}</Txt>

      <Chip icon="notifications-outline" active={streak.remind} label={tr('فكّرني الساعة 9 بالليل لو لسه مخلّصتش', 'Remind me at 9 PM if not done')} onPress={() => a.setStreak({ remind: !streak.remind })} />
      {streak.remind && !a.reminders.enabled ? <Txt variant="caption">{tr('شغّل التذكيرات من الإعدادات عشان الإشعار يوصلك.', 'Turn on reminders in Settings to get it.')}</Txt> : null}
    </Screen>
  );
}