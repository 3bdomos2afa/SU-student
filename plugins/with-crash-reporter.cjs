// Native startup crash reporter (Android). Catches Java/Kotlin exceptions from the very start of the
// process (attachBaseContext, before Expo/React Native boot) and shows them on a plain Android screen
// in a separate ":crash" process so the student can copy/share the report. Also notices two
// consecutive starts that died before any screen appeared (native crashes leave no Java trace).
const { withAndroidManifest, withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('fs'), path = require('path');

const ATTACH = `  override fun attachBaseContext(base: android.content.Context) {
    super.attachBaseContext(base)
    CrashReporter.install(this)
  }

`;
const GUARD = `    if (CrashReporter.isCrashProcess(this)) { super.onCreate(); return }\n`;

function patchMainApplication(text) {
  if (text.includes('CrashReporter.install(this)')) return text;
  const onCreate = '  override fun onCreate() {\n    super.onCreate()\n';
  if (!text.includes(onCreate)) throw new Error('with-crash-reporter: unknown MainApplication.onCreate layout');
  return text.replace(onCreate, ATTACH + '  override fun onCreate() {\n' + GUARD + '    super.onCreate()\n');
}

function kotlinSources(pkg) {
  const dir = __dirname;
  const read = n => fs.readFileSync(path.join(dir, n), 'utf8').replace(/__PACKAGE__/g, pkg);
  return { 'CrashReporter.kt': read('crash-reporter.kt.txt'), 'CrashActivity.kt': read('crash-activity.kt.txt') };
}

function patchManifest(manifest) {
  const app = manifest.application[0];
  app.activity = app.activity || [];
  if (!app.activity.some(a => a.$['android:name'] === '.CrashActivity')) {
    app.activity.push({ $: {
      'android:name': '.CrashActivity', 'android:exported': 'false', 'android:process': ':crash',
      'android:excludeFromRecents': 'true', 'android:launchMode': 'singleTask',
      'android:theme': '@android:style/Theme.Material.Light.NoActionBar' } });
  }
  return manifest;
}

module.exports = function withCrashReporter(config) {
  config = withMainApplication(config, c => { c.modResults.contents = patchMainApplication(c.modResults.contents); return c; });
  config = withAndroidManifest(config, c => { patchManifest(c.modResults.manifest); return c; });
  return withDangerousMod(config, ['android', async c => {
    const pkg = c.android && c.android.package;
    if (!pkg) throw new Error('with-crash-reporter: android.package missing');
    const dir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/java', ...pkg.split('.'));
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, source] of Object.entries(kotlinSources(pkg))) fs.writeFileSync(path.join(dir, name), source);
    return c;
  }]);
};
module.exports.patchMainApplication = patchMainApplication;
module.exports.patchManifest = patchManifest;
module.exports.kotlinSources = kotlinSources;