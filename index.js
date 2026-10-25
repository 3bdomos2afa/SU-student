// Keep Metro's web runtime first, as required by Expo Router custom entry points.
require('@expo/metro-runtime');

try {
  require('expo-router/entry');
} catch (error) {
  // A React ErrorBoundary cannot catch synchronous module-import failures.
  // This fallback covers JS import errors only, NOT native aborts/segfaults/OS process kills.
  const React = require('react');
  const { View, Text, Platform } = require('react-native');
  const { registerRootComponent } = require('expo');
  const { startupCode } = require('./src/lib/startup-diagnostics.cjs');
  const code = startupCode(error);
  function StartupRecovery() {
    React.useEffect(() => {
      try { Promise.resolve(require('expo-splash-screen').hideAsync()).catch(() => {}); } catch {}
    }, []);
    return React.createElement(View, {
      style: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#F5F4EE' },
    },
      React.createElement(Text, { style: { fontSize: 23, color: '#163B39', textAlign: 'center', marginBottom: 20 } },
        'تعذر بدء التطبيق'),
      React.createElement(Text, { selectable: true, style: { fontSize: 16, color: '#163B39', textAlign: 'center' } },
        `SU Student 1.6.3\n${code}\n${Platform.OS}\n\nبياناتك المحفوظة لم تُمسح.\nابعت كود العطل ونوع الموبايل للمطور.\nلا ترسل كلمة سر أو توكن. \n\nStartup could not finish. Saved data was not deleted.`));
  }
  registerRootComponent(StartupRecovery);
}