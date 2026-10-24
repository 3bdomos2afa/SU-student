const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.some(x => x !== '--dry-run') || args.length > 1) {
  console.error('Usage: npm run build:google-test [-- --dry-run]');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'SOURCE-MANIFEST.json'), 'utf8'));
const missing = manifest.filter(e => !fs.existsSync(path.join(root, e.path))).map(e => e.path);
if (missing.length) { console.error('Extract the complete ZIP again. Missing:\n' + missing.join('\n')); process.exit(1); }
if (!fs.existsSync(path.join(root, 'node_modules/expo/package.json'))) {
  console.error('Run npm ci first.'); process.exit(1);
}
const buildArgs = ['--yes', 'eas-cli@latest', 'build', '--platform', 'android', '--profile', 'google-test', '--clear-cache'];
const env = { ...process.env, EAS_NO_VCS: '1', EAS_PROJECT_ROOT: root,
  EAS_BUILD_PROFILE: 'google-test', SU_GOOGLE_WEBVIEW_TEST: '1' };
if (args.includes('--dry-run')) {
  console.log(JSON.stringify({ command: 'npx', args: buildArgs, package: 'com.unicodesis.student.googletrial',
    testOnly: true, projectRoot: root })); process.exit(0);
}
console.log('TEST ONLY: separate Android app. Google may still reject the embedded browser. Read GOOGLE-TEST-AR.md.');
const win = process.platform === 'win32';
const result = spawnSync(win ? 'npx.cmd' : 'npx', buildArgs, { cwd: root, env, stdio: 'inherit', shell: win });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
