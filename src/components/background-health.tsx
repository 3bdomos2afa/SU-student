// Settings → "Background notifications": tells the student whether Android lets SU+ check the university
// in the background, and fixes it with the official system dialog (+ the manufacturer auto-start page).
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { useApp } from '@/context/app-context';
import { getJSON, setJSON } from '@/lib/storage';
import { unrestricted, vendorOf, vendorSteps, VENDOR_NAME, type BatteryState } from '@/lib/battery-vendor';
import { Button, Glass, Txt } from './ui';

type Native = {
  batteryStatus(): BatteryState & { sdk?: number };
  requestUnrestricted(): boolean; openAutostart(): boolean; openAppSettings(): boolean;
};
function native(): Native | null {
  if (Platform.OS !== 'android') return null;
  try {
    const core = require('expo-modules-core') as { requireOptionalNativeModule?: (name: string) => unknown };
    const m = core.requireOptionalNativeModule?.('SuFocus') as Partial<Native> | null;
    return m && typeof m.batteryStatus === 'function' ? (m as Native) : null;
  } catch { return null; }
}
function read(): BatteryState {
  const n = native();
  if (!n) return { supported: false, ignoring: true, restricted: false, brand: '' };
  try { const s = n.batteryStatus(); return { supported: true, ignoring: !!s.ignoring, restricted: !!s.restricted, brand: String(s.brand || '') }; }
  catch { return { supported: false, ignoring: true, restricted: false, brand: '' }; }
}
const DONE_KEY = 'su:v2:autostart-done';

export function BackgroundHealth() {
  const { tr, palette, lang } = useApp();
  const ar = lang !== 'en';
  const [h, setH] = useState<BatteryState>(read);
  const [vendorDone, setVendorDone] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<string | null>(null);
  const [bgRun, setBgRun] = useState<string | null>(null);
  const refresh = useCallback(() => setH(read()), []);
  useEffect(() => {
    void getJSON<boolean>(DONE_KEY, false).then(setVendorDone);
    void getJSON<string | null>('su:v2:bg-last', null).then(setLast);
    void getJSON<string | null>('su:v2:bg-status', null).then(setBgStatus);
    void getJSON<string | null>('su:v2:bg-run', null).then(setBgRun);
    // Re-check when the student comes back from the system dialog / settings page.
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  if (Platform.OS === 'ios') {
    return <Glass><View style={{ gap: 10 }}>
      <Txt variant="h3">{tr('الإشعارات في الخلفية', 'Background notifications')}</Txt>
      <Txt variant="caption">{tr('عشان الدرجات توصلك والأبلكيشن مقفول: الإعدادات ← عام ← تحديث التطبيقات في الخلفية ← شغّله لـ SU+. آيفون هو اللي بيحدد الميعاد، فممكن تتأخر شوية.',
        'To get marks while the app is closed: Settings → General → Background App Refresh → turn on SU+. iOS decides the timing.')}</Txt>
      <Button small variant="glass" title={tr('افتح إعدادات الأبلكيشن', 'Open app settings')} onPress={() => { void Linking.openSettings(); }} />
    </View></Glass>;
  }
  if (Platform.OS !== 'android') return null;

  const n = native();
  const ok = unrestricted(h);
  const v = vendorOf(h.brand);
  const allGood = ok && (!v || vendorDone);
  return <Glass><View style={{ gap: 12 }}>
    <Txt variant="h3">{tr('الإشعارات في الخلفية', 'Background notifications')}</Txt>
    <Txt variant="caption">{tr('عشان الدرجات والغياب والإنذارات وملفات KMoodle توصلك أول بأول حتى والأبلكيشن مقفول، لازم الموبايل يسيب SU+ يشيّك في الخلفية. من غير كده الإشعار ممكن يتأخر ساعات.',
      'For marks, absences, warnings and KMoodle files to reach you while the app is closed, your phone must let SU+ check in the background. Otherwise alerts can be hours late.')}</Txt>
    {!h.supported ? <Txt variant="caption" color={palette.warn}>{tr('الخاصية دي محتاجة النسخة الجديدة من الأبلكيشن (1.14.0) متثبتة.', 'This needs the installed 1.14.0 build.')}</Txt> : null}
    {h.supported ? <Txt weight="700" color={ok ? palette.primary : palette.warn}>
      {ok ? tr('✓ أندرويد سايب SU+ يشتغل في الخلفية', '✓ Android lets SU+ run in the background')
        : h.restricted ? tr('⚠ الأبلكيشن متقيّد في الخلفية — الإشعارات هتتأخر', '⚠ Background use is restricted — alerts will be late')
          : tr('⚠ توفير البطارية شغّال على SU+ — الإشعارات ممكن تتأخر', '⚠ Battery optimisation is on for SU+ — alerts may be late')}
    </Txt> : null}
    {h.supported && !ok ? <Button title={tr('اسمح لـ SU+ يشتغل في الخلفية', 'Allow SU+ in the background')}
      onPress={() => { const done = h.restricted ? n?.openAppSettings() : n?.requestUnrestricted(); if (!done) void Linking.openSettings(); }} /> : null}
    {h.supported && h.restricted ? <Txt variant="caption">{tr('في الصفحة اللي هتفتح: البطارية ← "بلا قيود" أو "غير مقيّد".', 'On that page: Battery → "Unrestricted".')}</Txt> : null}
    {h.supported && v ? <View style={{ gap: 8 }}>
      <Txt weight="700">{tr(`خطوة زيادة لموبايلات ${VENDOR_NAME[v]}`, 'One extra step for your phone brand')}</Txt>
      {vendorSteps(v, ar).map((s, i) => <Txt key={i} variant="caption">{`${i + 1}. ${s}`}</Txt>)}
      <Button small variant="glass" title={tr('افتح الصفحة دي', 'Open that page')} onPress={() => { if (!n?.openAutostart()) void Linking.openSettings(); }} />
      <Button small variant={vendorDone ? 'glass' : 'primary'} title={vendorDone ? tr('✓ عملتها', '✓ Done') : tr('عملتها', 'I did it')}
        onPress={() => { const d = !vendorDone; setVendorDone(d); void setJSON(DONE_KEY, d); }} />
    </View> : null}
    <Txt variant="caption">{last
      ? tr(`آخر مرة شيّك على الجامعة والأبلكيشن مقفول: ${new Date(last).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}`, `Last background check: ${new Date(last).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
      : tr('لسه مشيّكش في الخلفية. سيب الأبلكيشن مقفول ربع ساعة وارجع شوف.', 'No background check yet. Close the app for 15 minutes and look again.')}</Txt>
    {bgRun ? <Txt variant="caption">{tr(`آخر مرة أندرويد شغّل المزامنة: ${new Date(bgRun).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}`, `Android last ran the sync: ${new Date(bgRun).toLocaleString('en-GB')}`)}</Txt> : null}
    {bgStatus === 'expired' ? <Txt variant="caption">{tr('⚠️ جلسة الجامعة خلصت والأبلكيشن مقفول. افتح الأبلكيشن مرة علشان يسجّل دخولك تاني.', '⚠️ University session ended in the background. Open the app once to sign in again.')}</Txt> : null}
    {bgStatus === 'error' ? <Txt variant="caption">{tr('⚠️ آخر مزامنة في الخلفية وقعت. هتتجرّب تاني لوحدها.', '⚠️ The last background sync failed. It will retry.')}</Txt> : null}
    {allGood && h.supported ? <Txt variant="caption">{tr('كده تمام. الأبلكيشن هيشيّك على الجامعة كل ربع ساعة تقريباً حتى وهو مقفول.', 'All set. SU+ checks roughly every 15 minutes even when closed.')}</Txt> : null}
  </View></Glass>;
}