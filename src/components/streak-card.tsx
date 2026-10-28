import { useEffect, useState } from 'react';
import { Ionicons } from '@/components/icon';
import { router } from 'expo-router';
import { AppState, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { computeStreak, hm } from '@/lib/streak';
import { TOXIC, hard } from '@/lib/theme';
import { PressScale, Txt } from './ui';

/** Re-renders every `ms` while something is running (focus timer / free stopwatch), and on app resume. */
export function useTicker(running: boolean, ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = running ? setInterval(tick, ms) : null;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') tick(); });
    tick();
    return () => { if (t) clearInterval(t); sub.remove(); };
  }, [running, ms]);
  return now;
}

export function StreakCard() {
  const { tr, row, isAr, streak, focus } = useApp();
  const running = focus.endAt !== null || streak.free !== null;
  const now = useTicker(running, 15000);
  const v = computeStreak(streak, focus, now);
  const ink = '#F2F2F2';
  return (
    <PressScale label={tr('الستريك', 'Streak')} onPress={() => router.push('/streak' as never)}>
      <View style={{ backgroundColor: TOXIC.navy, borderRadius: 22, borderWidth: 2.5, borderColor: 'transparent', padding: 16, gap: 12, boxShadow: hard('#0B0D14', 5) }}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: TOXIC.lime, borderWidth: 2.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flame" size={28} color="#0B0D14" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="h2" color={ink}>{v.current ? tr(`${v.current} يوم ستريك`, `${v.current}-day streak`) : tr('ابدأ ستريك جديد', 'Start a streak')}</Txt>
            <Txt variant="caption" color="#9AA3B5">
              {v.met ? tr('هدف النهارده خلص ✓ برافو عليك', 'Today’s goal done ✓') : tr(`النهارده ${hm(v.today)} من ${hm(streak.target)} ساعة`, `Today ${hm(v.today)} of ${hm(streak.target)} h`)}
              {running ? tr(' · شغال دلوقتي', ' · running') : ''}
            </Txt>
          </View>
          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={22} color={ink} />
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: '#2B3245', overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(v.pct * 100)}%`, height: '100%', backgroundColor: TOXIC.lime, borderRadius: 5 }} />
        </View>
      </View>
    </PressScale>
  );
}