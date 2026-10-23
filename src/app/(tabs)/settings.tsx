import Constants from 'expo-constants';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Avatar, Button, Divider, Field, Glass, Header, Screen, Segmented, Txt } from '@/components/ui';
import { useApp, type ThemePref } from '@/context/app-context';
import { confirmAction, timeAgo } from '@/lib/format';
import type { Lang } from '@/lib/i18n';
import { resolveWorkflowUrl } from '@/lib/workflow';

function RowSwitch({ title, sub, value, onChange }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { row, palette } = useApp();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <View style={{ flex: 1 }}>
        <Txt variant="label">{title}</Txt>
        {sub ? <Txt variant="caption">{sub}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: palette.primary, false: palette.inputBg }} thumbColor="#fff" />
    </View>
  );
}

export default function SettingsScreen() {
  const app = useApp();
  const { tr, settings, updateSettings, session, palette, row, lang, setBiometric, signOut, refreshAll, refreshing, online, lastSync, cache, clearCache, setDraft } = app;
  const [url, setUrl] = useState(settings.workflowUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const urlValid = !url.trim() || !!resolveWorkflowUrl(url);

  return (
    <Screen>
      <Header title={tr('الإعدادات', 'Settings')} />

      <Glass padding={16}>
        <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
          <Avatar name={session?.name ?? 'U'} size={58} />
          <View style={{ flex: 1 }}>
            <Txt variant="h3">{session?.name}</Txt>
            <Txt variant="caption">{session?.email}</Txt>
            <Txt variant="caption">
              {tr('داخل من', 'Signed in')} {timeAgo(session?.signedInAt, lang)}
            </Txt>
          </View>
        </View>
      </Glass>

      <Glass padding={16}>
        <View style={{ gap: 12 }}>
          <Txt variant="label">{tr('اللغة', 'Language')}</Txt>
          <Segmented<Lang> value={settings.lang} onChange={(v) => updateSettings({ lang: v })} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
          <Txt variant="label">{tr('المظهر', 'Appearance')}</Txt>
          <Segmented<ThemePref>
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v })}
            options={[
              { value: 'system', label: tr('تلقائي', 'Auto'), icon: 'phone-portrait' },
              { value: 'light', label: tr('فاتح', 'Light'), icon: 'sunny' },
              { value: 'dark', label: tr('داكن', 'Dark'), icon: 'moon' },
            ]}
          />
        </View>
      </Glass>

      <Glass padding={12}>
        <RowSwitch
          title={tr('قفل بالبصمة / Face ID', 'Face ID / fingerprint lock')}
          sub={tr('يطلب البصمة كل ما تفتح التطبيق', 'Ask for biometrics each time the app opens')}
          value={settings.biometric}
          onChange={async (v) => setMsg(await setBiometric(v))}
        />
        <Divider />
        <RowSwitch title={tr('اهتزاز خفيف', 'Haptic feedback')} value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        {msg ? (
          <Txt variant="caption" color={palette.warn}>
            {msg}
          </Txt>
        ) : null}
      </Glass>

      <Glass padding={16}>
        <View style={{ gap: 10 }}>
          <Txt variant="label">{tr('ربط n8n Workflow', 'n8n workflow link')}</Txt>
          <Txt variant="caption">
            {tr('رابط الـ Webhook اللي بيرد بـ reply_text. لو فاضي التطبيق يشتغل تجريبي.', 'Webhook URL that returns reply_text. Empty = demo mode.')}
          </Txt>
          <Field icon="link" value={url} onChangeText={setUrl} placeholder="https://…/webhook/unicodesis" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          {!urlValid ? (
            <Txt variant="caption" color={palette.danger}>
              {tr('الرابط لازم يبدأ بـ https://', 'URL must start with https://')}
            </Txt>
          ) : null}
          <Button
            small
            title={tr('حفظ الرابط', 'Save link')}
            icon="save"
            disabled={!urlValid || url.trim() === settings.workflowUrl}
            onPress={() => updateSettings({ workflowUrl: url.trim() })}
          />
        </View>
      </Glass>

      <Glass padding={16}>
        <View style={{ gap: 10 }}>
          <Txt variant="label">{tr('البيانات الأوفلاين', 'Offline data')}</Txt>
          <Txt variant="caption">
            {Object.keys(cache).length} {tr('خدمة محفوظة', 'services saved')} · {tr('آخر تحديث', 'last sync')} {timeAgo(lastSync, lang)}
          </Txt>
          <Button small title={tr('حدّث كل حاجة', 'Refresh everything')} icon="refresh" loading={refreshing} disabled={!online} onPress={refreshAll} />
          <View style={{ flexDirection: row, gap: 10 }}>
            <Button
              small
              variant="glass"
              title={tr('مسح الكاش', 'Clear cache')}
              icon="trash-bin"
              style={{ flex: 1 }}
              onPress={() => confirmAction(tr('مسح الكاش؟', 'Clear cache?'), tr('هتحتاج نت عشان البيانات ترجع.', 'You will need internet to reload data.'), tr('مسح', 'Clear'), tr('إلغاء', 'Cancel'), clearCache, true)}
            />
            <Button
              small
              variant="glass"
              title={tr('مسح المسودة', 'Clear draft')}
              icon="clipboard"
              style={{ flex: 1 }}
              onPress={() => setDraft([])}
            />
          </View>
        </View>
      </Glass>

      <Button
        variant="danger"
        icon="log-out"
        title={tr('تسجيل الخروج', 'Sign out')}
        onPress={() =>
          confirmAction(
            tr('تسجيل الخروج؟', 'Sign out?'),
            tr('هيتمسح تسجيل الدخول والبيانات المحفوظة من الجهاز. خطتك ومسودتك هيفضلوا.', 'Your session and cached data will be removed. Your plan and draft stay.'),
            tr('خروج', 'Sign out'),
            tr('إلغاء', 'Cancel'),
            () => {
              signOut();
            },
            true,
          )
        }
      />
      <Txt variant="caption" center>
        UnicodeSIS · v{Constants.expoConfig?.version ?? '1.0.0'}
      </Txt>
    </Screen>
  );
}