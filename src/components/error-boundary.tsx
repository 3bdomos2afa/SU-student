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
  // No raw error message, stack, student data or credentials are persisted or sent remotely.
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={{ flex: 1, backgroundColor: '#F5F4EE', padding: 28, justifyContent: 'center', gap: 18 }}>
      <Text style={{ fontSize: 25, color: '#163B39', textAlign: 'center' }}>تعذر عرض الصفحة · Something went wrong</Text>
      <Text selectable style={{ fontSize: 16, textAlign: 'center', color: '#163B39' }}>
        {`SU Student 1.9.1\n${this.state.code}\nبياناتك المحفوظة لم تُمسح. ابعت الكود ونوع الموبايل للمطور.\nYour saved data was not deleted. Share only this code and device model.`}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false, code: '' })}
        style={{ padding: 18, backgroundColor: '#216B61', borderRadius: 18 }}>
        <Text style={{ textAlign: 'center', color: 'white' }}>إعادة المحاولة / Retry</Text>
      </Pressable>
    </View>;
  }
}