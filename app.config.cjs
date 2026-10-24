// Capability exists ONLY in the isolated Android test profile.
module.exports = ({ config }) => {
  const enabled = process.env.SU_GOOGLE_WEBVIEW_TEST === '1'
    && process.env.EAS_BUILD_PROFILE === 'google-test';
  return {
    ...config,
    ...(enabled ? {
      name: 'SU Student Test',
      scheme: 'unicodesis-trial',
      android: { ...config.android, package: 'com.unicodesis.student.googletrial' },
    } : {}),
    extra: { ...config.extra, googleWebViewTest: enabled },
    plugins: [
      ...(config.plugins || []),
      ['./plugins/with-google-webview-test.cjs', { enabled }],
    ],
  };
};
