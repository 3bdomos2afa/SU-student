const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { withDangerousMod } = require('expo/config-plugins');
const policy = require('../src/lib/google-webview-policy.json');
const anchor = '    @Override\n    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {';
const hostAnchor = '    public void onHostDestroy() { }';
function patchText(source, helper) {
  if (source.includes('SU_GOOGLE_TEST_POPUP_V1')) return source;
  if (!source.includes(anchor) || !source.includes(hostAnchor)) {
    throw new Error('Google trial: WebView source changed; stop rather than applying an unsafe patch.');
  }
  const guard = `
        if (view.getSettings().getUserAgentString() != null
            && view.getSettings().getUserAgentString().startsWith(${JSON.stringify(policy.userAgent)})
            && view.getUrl() != null
            && suAllowedGoogleTestUrl(view.getUrl())
            && "unicodesis.su.edu.eg".equals(android.net.Uri.parse(view.getUrl()).getHost())) {
            return suOpenGoogleTestPopup(view, resultMsg);
        }
`;
  return source.replace(anchor, helper + '\n' + anchor + guard)
    .replace(hostAnchor, '    public void onHostDestroy() { if (suGoogleDialog != null) suGoogleDialog.dismiss(); }');
}
function syncPatch(projectRoot, enabled) {
  const target = path.join(projectRoot, 'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java');
  const backup = target + '.su-original';
  const digest = backup + '.sha256';
  let source = fs.readFileSync(target, 'utf8');
  if (enabled) {
    if (!source.includes('SU_GOOGLE_TEST_POPUP_V1')) {
      // Refuse to overwrite an unknown backup.
      if (fs.existsSync(backup) && fs.readFileSync(backup, 'utf8') !== source) throw new Error('Google trial: unexpected original source.');
      const helper = fs.readFileSync(path.join(__dirname, 'google-test-popup.java.txt'), 'utf8');
      const updated = patchText(source, helper);
      fs.writeFileSync(backup, source);
      fs.writeFileSync(digest, crypto.createHash('sha256').update(source).digest('hex'));
      fs.writeFileSync(target, updated);
    }
  } else if (source.includes('SU_GOOGLE_TEST_POPUP_V1')) {
    if (!fs.existsSync(backup) || !fs.existsSync(digest)) throw new Error('Run npm ci to restore the standard WebView before a normal build.');
    const original = fs.readFileSync(backup, 'utf8');
    if (crypto.createHash('sha256').update(original).digest('hex') !== fs.readFileSync(digest, 'utf8')) {
      throw new Error('WebView original checksum mismatch. Run npm ci.');
    }
    fs.writeFileSync(target, original);
  }
}
module.exports = (config, props = {}) => withDangerousMod(config, ['android', async c => {
  syncPatch(c.modRequest.projectRoot, props.enabled === true);
  return c;
}]);
module.exports.patchText = patchText;
module.exports.syncPatch = syncPatch;