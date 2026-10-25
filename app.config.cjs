// Google button inside the university page (Android): on by default.
// Set SU_GOOGLE_WEBVIEW=0 to build without it. Google may still refuse an in-app browser.
module.exports = ({ config }) => {
  const enabled = process.env.SU_GOOGLE_WEBVIEW !== '0';
  return {
    ...config,
    extra: { ...config.extra, googleWebViewTest: enabled },
    plugins: [
      ...(config.plugins || []),
      ['./plugins/with-google-webview-test.cjs', { enabled }],
    ],
  };
};
