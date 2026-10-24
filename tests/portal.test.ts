import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';
import { parseSession, isPortalURL, stripSecrets, recordsOf, endpoints, requestPortal, PortalError } from '../src/lib/portal';

const session = {studentId:'42',token:'test-session-token',name:'Test',signedInAt:'2026-10-24T00:00:00Z'};
test('only the exact official origin is accepted',()=>{
  assert.ok(isPortalURL('http://unicodesis.su.edu.eg/login'));
  for(const u of ['https://evil.test','http://unicodesis.su.edu.eg.evil.test/','http://evil.test/?next=http://unicodesis.su.edu.eg','file:///tmp/session','javascript:alert(1)','http://unicodesis.su.edu.eg:150/','not a URL'])
    assert.equal(isPortalURL(u),false,u);
});
test('sessions require a token and safe student ID, and never carry passwords',()=>{
  assert.equal(parseSession(null),null);
  assert.equal(parseSession({StudentID:42,Token:'a'}),null);
  assert.equal(parseSession({StudentID:'../someone',Token:'long-enough-token'}),null);
  const s=parseSession({StudentID:42,Token:'long-enough-token',Password:'not retained',Role:'ignored'});
  assert.equal(s?.studentId,'42');
  assert.equal('Password' in s!,false);
  assert.equal('Role' in s!,false);
});
test('secret fields are removed recursively',()=>{
  assert.deepEqual(stripSecrets({Student:'A',password:'secret',data:[{Token:'secret',grade:91}]}),{Student:'A',data:[{grade:91}]});
});
test('data wrappers and empty records remain honest',()=>{
  assert.deepEqual(recordsOf({Data:[{Course:'A'}]}),[{Course:'A'}]);
  assert.deepEqual(recordsOf([]),[]);
  assert.deepEqual(recordsOf(null),[]);
  assert.deepEqual(recordsOf('login page'),[]);
});
test('GET requests use only the supplied authenticated session ID and strip tokens',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=(async(input,options)=>{
      const url=new URL(String(input));
      assert.equal(url.hostname,'unicodesis.su.edu.eg');
      assert.equal(url.searchParams.get('StudentID'),'42');
      assert.equal(options?.method,'GET');
      assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer test-session-token');
      return new Response(JSON.stringify([{GPA:3.5,Token:'never cache'}]),{status:200});
    }) as typeof fetch;
    assert.deepEqual(await requestPortal('SEC_PROFILE',session),[{GPA:3.5}]);
  }finally{globalThis.fetch=original;}
});
test('transcript matches the public client read-only POST and default semester 0',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=(async(input,options)=>{
      const url=new URL(String(input));
      assert.equal(url.pathname,'///api/Transcript/SelectStudentTranscriptBySemester');
      assert.equal(url.searchParams.get('SemesterYearId'),'0');
      assert.equal(options?.method,'POST');
      return new Response('[]');
    }) as typeof fetch;
    assert.deepEqual(await requestPortal('SEC_TRANSCRIPT',session),[]);
  }finally{globalThis.fetch=original;}
});
test('expired sessions, HTML pages, malformed JSON and unsupported services fail safely',async()=>{
  const original=globalThis.fetch;
  try{
    for(const status of [401,403]){
      globalThis.fetch=(async()=>new Response('',{status})) as typeof fetch;
      await assert.rejects(requestPortal('SEC_PROFILE',session),(e:unknown)=>e instanceof PortalError&&e.code==='expired');
    }
    for(const body of ['<html>login</html>','null','not-json','"unexpected"']){
      globalThis.fetch=(async()=>new Response(body)) as typeof fetch;
      await assert.rejects(requestPortal('SEC_PROFILE',session),PortalError);
    }
    await assert.rejects(requestPortal('PAY_TUITION',session),(e:unknown)=>e instanceof PortalError&&e.code==='unsupported');
  }finally{globalThis.fetch=original;}
});
test('adapter whitelist contains no registration or payment writes',()=>{
  for(const [id,e] of Object.entries(endpoints)) if(e.method==='POST') assert.equal(id,'SEC_TRANSCRIPT');
});
test('AES-GCM round-trip is authenticated and bound to the per-account storage key',()=>{
  const key=randomBytes(32),nonce=randomBytes(12);
  const aad=utf8ToBytes('su:v2:cache:42'),plain=utf8ToBytes('{"grade":91}');
  const encrypted=gcm(key,nonce,aad).encrypt(plain);
  assert.equal(bytesToUtf8(gcm(key,nonce,aad).decrypt(encrypted)),'{"grade":91}');
  assert.throws(()=>gcm(key,nonce,utf8ToBytes('su:v2:cache:99')).decrypt(encrypted));
  const corrupted=encrypted.slice();corrupted[0]^=1;
  assert.throws(()=>gcm(key,nonce,aad).decrypt(corrupted));
});