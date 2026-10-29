import { Ionicons } from '@/components/icon';
import { Confetti } from '@/components/confetti';
import { View } from 'react-native';
import { useApp } from '@/context/app-context';
import { FocusCard } from '@/components/focus-card';
import { PageTop } from '@/components/page';
import { useTicker } from '@/components/streak-card';
import { Button, Chip, Glass, PressScale, ProgressRing, Screen, SectionTitle, Txt } from '@/components/ui';
import { freshFocus, startFocus } from '@/lib/focus';
import { computeStreak, dayTotals, hm, liveStreak, TARGETS } from '@/lib/streak';
import { LinearGradient } from 'expo-linear-gradient';
import { Fire } from '@/components/fire';

const ORANGE = '#FF2D17';
const INK = '#17161D';

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
  const totals = dayTotals(liveStreak(streak, focus, now));
  const weekTotal = v.week.reduce((m, d) => m + (totals[d.key]?.total ?? 0), 0);
  const barMax = Math.max(streak.target, ...v.week.map(d => totals[d.key]?.total ?? 0), 1);

  const kindLabel = (k: 'timer' | 'free' | 'task') => (k === 'timer' ? tr('تايمر', 'Timer') : k === 'free' ? tr('مذاكرة حرة', 'Free study') : tr('مهمة خلصت', 'Task done'));
  const kindIcon = (k: 'timer' | 'free' | 'task') => (k === 'timer' ? 'timer-outline' : k === 'free' ? 'stopwatch-outline' : 'checkmark-circle-outline') as 'timer-outline';

  return (
    <Screen>
      <PageTop title={tr('الستريك', 'Streak')} subtitle={tr('ذاكر هدفك كل يوم وماتكسرش السلسلة', 'Hit your daily goal and keep the chain')} />

      {v.met ? <Confetti /> : null}
      {/* Flame card (V14 peach) */}
      <LinearGradient colors={['#E50914', '#FF2D17', '#FF7A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 20, gap: 18, overflow: 'hidden' }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 16 }}>
          <Fire size={96} lit={v.current > 0 || v.met} />
          <View style={{ flex: 1 }}>
            <Txt variant="display" color="#FFFFFF" style={{ fontSize: 52, lineHeight: 62 }}>{v.current}</Txt>
            <Txt variant="label" color="#FFFFFF">{tr('يوم ورا بعض 🔥', 'days in a row 🔥')}</Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.85)">{tr(`أطول ستريك: ${v.best} يوم`, `Longest: ${v.best} days`)}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
          {v.week.map((d, i) => {
            const met = d.state === 'met'; const today = d.state === 'today'; const rest = d.state === 'rest'; const missed = d.state === 'missed';
            return (
              <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: met ? '#FFFFFF' : rest ? '#C9AEFF' : missed ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)',
                  borderWidth: today ? 2.5 : 0, borderColor: '#FFFFFF' }}>
                  {met ? <Ionicons name="flame" size={19} color={ORANGE} /> : rest ? <Ionicons name="snow" size={17} color={INK} /> : missed ? <Ionicons name="close" size={16} color="rgba(255,255,255,0.85)" /> : null}
                </View>
                <Txt variant="caption" color={today ? '#FFFFFF' : 'rgba(255,255,255,0.82)'} style={{ fontSize: 11, lineHeight: 15 }}>{(isAr ? DAYS_AR : DAYS_EN)[i]}</Txt>
              </View>
            );
          })}
        </View>
        <Txt variant="caption" color="rgba(255,255,255,0.85)">
          {v.restLeft ? tr('❄️ معاك يوم راحة واحد الأسبوع ده — لو فوّت يوم الستريك مش هيتكسر', '❄️ 1 rest day left this week — miss a day and the streak survives') : tr('❄️ استخدمت يوم الراحة بتاع الأسبوع ده', '❄️ This week’s rest day is used')}
        </Txt>
      </LinearGradient>

      {/* Weekly bars */}
      <Glass padding={16}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Txt variant="h3">{tr('مذاكرتك الأسبوع ده', 'This week')}</Txt>
          <Txt variant="caption">{tr(`${hm(weekTotal)} ساعة`, `${hm(weekTotal)} h`)}</Txt>
        </View>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'flex-end', height: 120 }}>
          {v.week.map((d, i) => {
            const m = totals[d.key]?.total ?? 0; const h = Math.max(6, Math.round((m / barMax) * 96));
            const hit = m >= streak.target; const today = d.state === 'today';
            return (
              <View key={d.key} style={{ alignItems: 'center', gap: 6, width: 34 }}>
                <View style={{ width: 22, height: h, borderRadius: 11, backgroundColor: hit ? ORANGE : today ? palette.ink : palette.soft }} />
                <Txt variant="caption" style={{ fontSize: 11, lineHeight: 15, color: today ? palette.text : palette.sub }}>{(isAr ? DAYS_AR : DAYS_EN)[i]}</Txt>
              </View>
            );
          })}
        </View>
      </Glass>

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
        <View style={{ gap: 10 }}>
          <PressScale label={tr('ابدأ تايمر', 'Start timer')} onPress={() => a.setFocus(startFocus(freshFocus(focus.duration / 60 || 25)))}>
            <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 27, backgroundColor: palette.ink }}>
              <Ionicons name="timer-outline" size={20} color={palette.onInk} />
              <Txt variant="label" style={{ color: palette.onInk, fontSize: 16 }}>{tr('ابدأ تايمر', 'Start timer')}</Txt>
            </View>
          </PressScale>
          <Button variant="glass" icon="stopwatch-outline" title={tr('ذاكر بحرية', 'Free study')} onPress={a.startFree} />
        </View>
      ) : null}
      <Txt variant="caption" center>{tr('المهمة اللي ركّزت عليها بالتايمر مش بتتحسب مرتين لما تعلّم عليها إنها خلصت.', 'A task you timed is not counted twice when you tick it done.')}</Txt>

      <Chip icon="notifications-outline" active={streak.remind} label={tr('فكّرني الساعة 9 بالليل لو لسه مخلّصتش', 'Remind me at 9 PM if not done')} onPress={() => a.setStreak({ remind: !streak.remind })} />
      {streak.remind && !a.reminders.enabled ? <Txt variant="caption">{tr('شغّل التذكيرات من الإعدادات عشان الإشعار يوصلك.', 'Turn on reminders in Settings to get it.')}</Txt> : null}
    </Screen>
  );
}