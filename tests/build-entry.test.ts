import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
test('direct build uses the local folder, preview and no Git for each platform',()=>{
  for(const platform of ['android','ios','all']){
    const r=spawnSync(process.execPath,['scripts/build-preview.cjs',platform,'--dry-run'],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    const j=JSON.parse(r.stdout);
    assert.equal(j.projectRoot,path.resolve('.'));
    assert.equal(j.noGitRequired,true);
    assert.deepEqual(j.args,['--yes','eas-cli@latest','build','--platform',platform,'--profile','preview','--clear-cache']);
  }
});
test('build script rejects unsupported platforms and arguments',()=>{
  for(const args of [['windows'],['android','--unexpected']]){
    const r=spawnSync(process.execPath,['scripts/build-preview.cjs',...args],{encoding:'utf8'});
    assert.equal(r.status,2);
  }
});
