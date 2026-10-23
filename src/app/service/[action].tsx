import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, View } from 'react-native';

import { Button, Chip, Glass, IconBadge, Screen, Txt } from '@/components/ui';
import { useApp, type CacheEntry } from '@/context/app-context';
import { serviceByAction } from '@/data/services';
import { timeAgo } from '@/lib/format';
import { success, warning } from '@/lib/haptics';

export default function ServiceScreen() {
  const { action = '' } = useLocalSearchParams<{ action: string }>();
  const { tr, lang, palette, row, fetchService, cache, online } = useApp();
  const service = serviceByAction(action);
  const [entry, setEntry] = useState<CacheEntry | undefined>(cache[action]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);
      const r = await fetchService(action, force);
      setLoading(false);
      if (r.entry) setEntry(r.entry);
      if (r.error) {
        setError(r.error);
        warning();
      } else if (force) success();
    },
    [action, fetchService],
  );

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const color = service ? palette[service.color] : palette.primary;
  const title = service?.title[lang] ?? action;

  return (
    <Screen padBottom={false}>
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12} accessibilityLabel={tr('رجوع', 'Close')}>
          <Ionicons name="close-circle" size={32} color={palette.sub} />
        </Pressable>
        <Chip label={online ? tr('متصل', 'Online') : tr('أوفلاين', 'Offline')} icon={online ? 'wifi' : 'cloud-offline'} color={online ? palette.success : palette.warn} active />
      </View>

      <View style={{ alignItems: 'center', gap: 8, marginVertical: 6 }}>
        <IconBadge icon={service?.icon ?? 'apps'} color={color} size={68} />
        <Txt variant="h2" center>{title}</Txt>
        {service ? <Txt variant="sub" center>{service.desc[lang]}</Txt> : null}
      </View>

      <Glass padding={18}>
        {loading && !entry ? (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
            <ActivityIndicator color={palette.primary} />
            <Txt variant="sub" center>{tr('بنجيب بياناتك من UnicodeSIS…', 'Fetching from UnicodeSIS…')}</Txt>
          </View>
        ) : entry ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap' }}>
              <Chip label={entry.mode === 'live' ? 'Live' : tr('تجريبي', 'Demo')} icon={entry.mode === 'live' ? 'cloud-done' : 'flask'} color={entry.mode === 'live' ? palette.accent : palette.warn} active />
              <Chip label={timeAgo(entry.at, lang)} icon="time" />
              {loading ? <ActivityIndicator color={palette.primary} /> : null}
            </View>
            <Txt variant="body" selectable>
              {entry.reply}
            </Txt>
          </View>
        ) : (
          <Txt variant="sub" center style={{ paddingVertical: 20 }}>
            {tr('مفيش بيانات لسه', 'No data yet')}
          </Txt>
        )}
        {error ? (
          <Txt variant="caption" color={palette.warn} style={{ marginTop: 10 }}>
            {error}
          </Txt>
        ) : null}
      </Glass>

      <View style={{ flexDirection: row, gap: 10 }}>
        <Button title={tr('تحديث', 'Refresh')} icon="refresh" loading={loading} disabled={!online} onPress={() => load(true)} style={{ flex: 1 }} />
        <Button
          title={tr('مشاركة', 'Share')}
          icon="share-social"
          variant="glass"
          disabled={!entry}
          onPress={() => entry && Share.share({ message: `${title}\n\n${entry.reply}` }).catch(() => {})}
          style={{ flex: 1 }}
        />
      </View>
      <Txt variant="caption" center>
        {tr('النتيجة بتتحفظ على جهازك وتفتح من غير نت.', 'Results are saved on your device and open without internet.')}
      </Txt>
    </Screen>
  );
}