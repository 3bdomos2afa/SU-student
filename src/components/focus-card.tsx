import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { focusLeft, freshFocus, pauseFocus, startFocus } from '@/lib/focus';
import { Button, Chip, Glass, ProgressBar, ProgressRing, Txt } from './ui';

export function FocusCard({ compact = false }: { compact?: boolean }) {
  const a = useApp();
  const { tr, row, palette, focus } = a;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  const remaining = focusLeft(focus, now),
    running = focus.endAt !== null && remaining > 0,
    finished = remaining === 0;
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const progress = focus.duration ? 1 - remaining / focus.duration : 0;
  const status = (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: running ? palette.success : finished ? palette.primary : palette.faint }} />
      <Txt variant="caption">{running ? tr('شغال · هيكمل لو خرجت', 'Running · continues when away') : finished ? tr('خلصت الجلسة 🎉', 'Session finished 🎉') : tr('متوقف', 'Paused')}</Txt>
    </View>
  );
  const controls = (
    <View style={{ flexDirection: row, gap: 10 }}>
      <Button
        style={{ flex: 1 }}
        icon={running ? 'pause' : 'play'}
        title={running ? tr('وقّف شوية', 'Pause') : tr('يلا نبدأ', 'Start')}
        onPress={() => {
          a.setFocus(running ? pauseFocus(focus) : startFocus(focus));
          setNow(Date.now());
        }}
      />
      <Button
        variant="glass"
        icon="refresh"
        title={tr('من الأول', 'Reset')}
        onPress={() => {
          a.setFocus(freshFocus(focus.duration / 60, focus.title));
          setNow(Date.now());
        }}
      />
    </View>
  );

  if (compact)
    return (
      <Glass padding={18}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
            <ProgressRing value={progress} size={78} stroke={8}>
              <Txt variant="label" style={{ fontVariant: ['tabular-nums'] }}>{time}</Txt>
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="label" color={palette.primary}>{tr('جلسة التركيز', 'Focus session')}</Txt>
              <Txt variant="h3" numberOfLines={2}>{focus.title || tr('مذاكرة حرة', 'Free study')}</Txt>
              {status}
            </View>
          </View>
          {controls}
        </View>
      </Glass>
    );

  return (
    <Glass padding={24}>
      <View style={{ gap: 18, alignItems: 'stretch' }}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="label" color={palette.primary}>{tr('مساحة التركيز', 'FOCUS SPACE')}</Txt>
          {status}
        </View>
        <View style={{ alignItems: 'center' }}>
          <ProgressRing value={progress} size={220} stroke={16}>
            <Txt variant="display" center style={{ fontSize: 50, lineHeight: 62, fontVariant: ['tabular-nums'] }}>{time}</Txt>
            <Txt variant="caption" center numberOfLines={1} style={{ maxWidth: 160 }}>{focus.title || tr('مذاكرة حرة', 'Free study')}</Txt>
          </ProgressRing>
        </View>
        <View style={{ flexDirection: row, gap: 8, justifyContent: 'center' }}>
          {[25, 50, 5].map((m) => (
            <Chip
              key={m}
              active={focus.duration === m * 60}
              label={`${m} ${tr('د', 'min')}`}
              onPress={() => {
                a.setFocus(freshFocus(m, focus.title));
                setNow(Date.now());
              }}
            />
          ))}
        </View>
        {controls}
        <ProgressBar value={progress} height={4} />
        <Txt variant="caption" center>
          {tr('وقت النهاية متسجّل، فالعداد هيكمل حتى لو خرجت أو قفلت التطبيق. فعّل التذكيرات عشان يجيلك إشعار أول ما يخلص.', 'The end time is saved, so the timer keeps going if you leave or close the app. Turn on reminders to get a notification when it ends.')}
        </Txt>
      </View>
    </Glass>
  );
}