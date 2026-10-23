import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { BRAND_GRADIENT, Button, Chip, Field, Glass, Screen, Txt } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { success, warning } from '@/lib/haptics';

export default function Login() {
  const { tr, signIn, settings, updateSettings, palette, row, scheme, session, isAr } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [url, setUrl] = useState(settings.workflowUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const cleanUrl = url.trim();
    if (cleanUrl !== settings.workflowUrl) updateSettings({ workflowUrl: cleanUrl });
    const err = await signIn(email, name, remember, cleanUrl);
    setBusy(false);
    if (err) {
      warning();
      setError(err);
    } else {
      success();
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen padBottom={false}>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
          <Chip label={isAr ? 'English' : 'العربية'} icon="language" onPress={() => updateSettings({ lang: isAr ? 'en' : 'ar' })} />
          <Chip icon={scheme === 'dark' ? 'sunny' : 'moon'} onPress={() => updateSettings({ theme: scheme === 'dark' ? 'light' : 'dark' })} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 6, gap: 10 }}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 92, height: 92, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school" size={46} color="#fff" />
          </LinearGradient>
          <Txt variant="h1" center>
            UnicodeSIS
          </Txt>
          <Txt variant="sub" center>
            {tr('بوابتك الجامعية في جيبك — بياناتك وخطتك وجدولك في مكان واحد', 'Your university portal in your pocket — records, plan and timetable in one place')}
          </Txt>
          <View style={{ flexDirection: row, flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <Chip label={tr('دخول مرة واحدة', 'Sign in once')} icon="key" />
            <Chip label={tr('يشتغل أوفلاين', 'Works offline')} icon="cloud-offline" />
            <Chip label={tr('بصمة / Face ID', 'Face ID')} icon="finger-print" />
          </View>
        </View>

        <Glass padding={18}>
          <View style={{ gap: 12 }}>
            <Txt variant="h3">{tr('تسجيل الدخول', 'Sign in')}</Txt>
            <Field icon="person" placeholder={tr('اسمك', 'Your name')} value={name} onChangeText={setName} autoComplete="name" textContentType="name" returnKeyType="next" />
            <Field
              icon="mail"
              placeholder={tr('إيميل الجامعة', 'University email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => setRemember(!remember)} style={{ flexDirection: row, alignItems: 'center', gap: 10 }} accessibilityRole="checkbox" accessibilityState={{ checked: remember }}>
              <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={22} color={remember ? palette.primary : palette.sub} />
              <Txt variant="sub" style={{ flex: 1 }}>
                {tr('افتكرني على الجهاز ده — مش هتحتاج تسجّل دخول تاني', 'Remember me on this device — no need to sign in again')}
              </Txt>
            </Pressable>
            {showAdvanced ? (
              <Field icon="link" placeholder="https://your-n8n.com/webhook/unicodesis" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            ) : null}
            {error ? (
              <Txt variant="caption" color={palette.danger}>
                {error}
              </Txt>
            ) : null}
            <Button title={tr('دخول', 'Sign in')} icon={isAr ? 'arrow-back' : 'arrow-forward'} onPress={submit} loading={busy} />
            <Pressable onPress={() => setShowAdvanced(!showAdvanced)} hitSlop={8}>
              <Txt variant="caption" center color={palette.primary} weight="700">
                {showAdvanced ? tr('إخفاء إعدادات الربط', 'Hide connection settings') : tr('ربط n8n Workflow (اختياري)', 'Link n8n workflow (optional)')}
              </Txt>
            </Pressable>
          </View>
        </Glass>

        <Txt variant="caption" center>
          {url.trim()
            ? tr('هيتم التحقق من حسابك عن طريق الـ Workflow بتاعك.', 'Your account will be verified through your workflow.')
            : tr('من غير رابط Workflow التطبيق هيشتغل في الوضع التجريبي.', 'Without a workflow URL the app runs in demo mode.')}
        </Txt>
      </Screen>
    </KeyboardAvoidingView>
  );
}