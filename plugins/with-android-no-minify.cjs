// Android release builds: turn OFF R8 code shrinking/obfuscation and resource shrinking.
// Reason (found by inspecting the crashing 1.6.3 APK): it was built with R8 full mode, which removed
// classes that Expo/React Native load by reflection or from C++ (e.g. expo.modules.ExpoModulesPackageList,
// SplashScreenManager), and the app died in under a second, before the splash screen.
const { withGradleProperties } = require('expo/config-plugins');

const PROPS = {
  'android.enableMinifyInReleaseBuilds': 'false',
  'android.enableShrinkResourcesInReleaseBuilds': 'false',
};

function applyProperties(items) {
  for (const [key, value] of Object.entries(PROPS)) {
    const existing = items.find(i => i.type === 'property' && i.key === key);
    if (existing) existing.value = value;
    else items.push({ type: 'property', key, value });
  }
  return items;
}

module.exports = function withAndroidNoMinify(config) {
  return withGradleProperties(config, c => { c.modResults = applyProperties(c.modResults); return c; });
};
module.exports.applyProperties = applyProperties;
module.exports.PROPS = PROPS;