const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'SOURCE-MANIFEST.json'),'utf8'));
let failed=false;
for(const e of entries){
  const p=path.join(root,e.path);
  if(!fs.existsSync(p)){console.error('MISSING: '+e.path);failed=true;continue;}
  const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if(hash!==e.sha256){console.error('CHANGED: '+e.path);failed=true;}
}
if(failed){console.error('Source differs from the tested archive. Review changes or extract the complete ZIP again.');process.exit(1);}
console.log(`Complete source verified: ${entries.length} files match the release manifest.`);
