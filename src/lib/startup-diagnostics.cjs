/** Deliberately return only a fixed code. Never display/log raw messages, stacks or student data. */
function startupCode(error) {
  let message = '';
  try { message = typeof error?.message === 'string' ? error.message : ''; } catch {}
  if (/ExpoBackgroundTask|ExpoTaskManager|expo-background-task|expo-task-manager/.test(message)) return 'SU-START-BACKGROUND';
  if (/WebView|RNCWebView/.test(message)) return 'SU-START-WEBVIEW';
  if (/worklet|reanimated/i.test(message)) return 'SU-START-ANIMATION';
  if (/font|typeface/i.test(message)) return 'SU-START-FONT';
  return 'SU-START-JS';
}
module.exports = { startupCode };