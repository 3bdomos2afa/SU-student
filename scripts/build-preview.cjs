const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const [platform, ...extra] = process.argv.slice(2);
if (!['android', 'ios', 'all'].includes(platform) || extra.some(x=>x!=='--dry-run')) {
  console.error('Usage: node scripts/build-preview.cjs android|ios|all [--dry-run]');
  process.exit(2);
}
const problems = require('./build-preflight.cjs').checkRelease(root);
if (problems.length) {
  console.error('Build blocked: extract the complete ZIP into a new folder.\n' + problems.join('\n'));
  process.exit(1);
}
if (!fs.existsSync(path.join(root,'node_modules','expo','package.json'))) {
  console.error('Run npm ci in this folder first.');
  process.exit(1);
}
const args=['--yes','eas-cli@latest','build','--platform',platform,'--profile','preview','--clear-cache'];
const env={...process.env,EAS_NO_VCS:'1',EAS_PROJECT_ROOT:root};
if (extra.includes('--dry-run')) {
  console.log(JSON.stringify({command:'npx',args,projectRoot:root,noGitRequired:true}));
  process.exit(0);
}
console.log('Building this complete local folder, not the old GitHub commit.');
console.log('EAS may ask you to log in and configure signing. No credentials are included.');
const isWindows=process.platform==='win32';
// Only fixed allowlisted arguments reach the Windows command shell.
const result=spawnSync(isWindows?'npx.cmd':'npx',args,{cwd:root,env,stdio:'inherit',shell:isWindows});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status??1);
