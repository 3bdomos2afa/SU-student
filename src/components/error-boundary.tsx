import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
const { startupCode } = require('../lib/startup-diagnostics.cjs');

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; code: string }> {
  state = { failed: false, code: '' };
  static getDerivedStateFromError(error: unknown) { return { failed: true, code: startupCode(error) }; }
  componentDidCatch() {
    // A failed render must not leave the native splash covering the recovery screen.
    try { Promise.resolve(require('expo-splash-screen').hideAsync()).catch(() => {}); } catch {}
  }
  // SU+ 1.14.0 — no raw error message, stack, student data or credentials are persisted or sent remotely.
  render() {
    if (!this.state.failed) return this.props.children;
    // Friendly recovery only: no error code or "send to developer" (the bug-report page is hidden in 1.14.0).
    return <View style={{ flex: 1, backgroundColor: '#F4F1FF', padding: 28, justifyContent: 'center', gap: 18 }}>
      <Text style={{ fontSize: 24, color: '#1E1446', textAlign: 'center', fontWeight: '700' }}>حصلت لخبطة صغيرة</Text>
      <Text style={{ fontSize: 16, textAlign: 'center', color: '#4B3F7A' }}>
        {`بياناتك زي ما هي ومتمسحتش. دوس "جرّب تاني" وهنفتح الصفحة من الأول.\nSomething went wrong. Your data is safe — tap retry.`}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false, code: '' })}
        style={{ padding: 18, backgroundColor: '#6A4BEF', borderRadius: 999 }}>
        <Text style={{ textAlign: 'center', color: 'white', fontSize: 16, fontWeight: '700' }}>جرّب تاني / Retry</Text>
      </Pressable>
    </View>;
  }
}