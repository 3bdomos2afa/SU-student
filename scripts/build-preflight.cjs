const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function checkRelease(root, fullManifest = true) {
  const problems = [];
  const read = file => {
    try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
    catch { problems.push(`Missing or invalid JSON: ${file}`); return null; }
  };
  const pkg = read('package.json');
  const lock = read('package-lock.json');
  const locked = lock?.packages?.[''];
  if (pkg && lock) {
    if (!locked) problems.push('package-lock.json must contain packages[""]. Regenerate it with npm install.');
    else {
      for (const field of ['name', 'version']) {
        if (pkg[field] !== locked[field] || pkg[field] !== lock[field])
          problems.push(`package-lock.json has a different ${field} from package.json.`);
      }
      for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
        const expected = pkg[group] || {}, actual = locked[group] || {};
        for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
          if (expected[key] !== actual[key]) problems.push(`Lock mismatch: ${group}.${key}.`);
        }
      }
    }
  }
  // EAS intentionally excludes server/, native folders and generated font mappings.
  const required = ['index.js', 'src/lib/background-guard.ts', 'src/components/portal-entry.tsx', 'src/lib/startup-diagnostics.cjs', 'src/lib/font-ready.tsx', 'app.json', 'app.config.cjs', 'eas.json',
    'scripts/prepare-fonts.cjs', 'plugins/with-portal-network.cjs',
    'plugins/with-google-webview-test.cjs', 'plugins/google-test-popup.java.txt',
    'src/lib/google-webview-policy.json', 'src/lib/background-sync.ts',
    'assets/fonts/Froople.ttf', 'assets/fonts/ThmanyahSans-Regular.otf', 'assets/fonts/ThmanyahSans-Bold.otf'];
  if (fullManifest) required.push('.easignore');
  for (const file of required)
    if (!fs.existsSync(path.join(root, file))) problems.push(`Missing required build file: ${file}`);
  if (fullManifest) {
    const manifest = read('SOURCE-MANIFEST.json');
    if (manifest && !Array.isArray(manifest)) problems.push('SOURCE-MANIFEST.json must be an array.');
    else if (manifest) for (const entry of manifest) {
      const file = path.join(root, entry.path);
      if (!fs.existsSync(file)) { problems.push(`Release file missing: ${entry.path}`); continue; }
      const sha = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      if (sha !== entry.sha256) problems.push(`Release file changed: ${entry.path}`);
    }
  }
  return problems;
}

module.exports = { checkRelease };
if (require.main === module) {
  const flags = process.argv.slice(2);
  if (flags.some(x => x !== '--eas') || flags.length > 1) {
    console.error('Usage: node scripts/build-preflight.cjs [--eas]'); process.exit(2);
  }
  const problems = checkRelease(path.resolve(__dirname, '..'), !flags.includes('--eas'));
  if (problems.length) {
    console.error('Build stopped before upload/install:\n' + problems.join('\n'));
    console.error('Extract the COMPLETE ZIP into a NEW folder. Do not combine it with older files.');
    process.exit(1);
  }
  console.log('Build preflight passed: matching package/lock and required source files.');
}