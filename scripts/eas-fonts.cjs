/**
 * Opt-in only, after the developer checks permission for their build environment.
 * This creates a local EAS upload allowlist for user-owned fonts, never a Git exception.
 */
const fs=require('fs');
if(!process.argv.includes('--i-confirm-font-embedding-and-build-upload-rights')){
  console.error('Not changed. Review your font licenses first, then rerun with --i-confirm-font-embedding-and-build-upload-rights.');
  process.exit(1);
}
if(fs.existsSync('.easignore')){
  console.error('.easignore already exists; review it manually instead of overwriting.');
  process.exit(1);
}
const lines=fs.readFileSync('.gitignore','utf8').split('\n')
  .filter(x=>!['assets/fonts/*.otf','assets/fonts/Froople.ttf'].includes(x.trim()));
fs.writeFileSync('.easignore',lines.join('\n'));
console.log('Created local .easignore. Inspect the EAS archive before building. Raw fonts remain excluded from Git.');