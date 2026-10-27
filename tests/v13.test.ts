import test from 'node:test';
import assert from 'node:assert/strict';
import { freshFocus, focusLeft, normalizeFocus, pauseFocus, startFocus } from '../src/lib/focus';
import { defaultReminders, reminderPlan } from '../src/lib/reminder-plan';
import { normalizeStudy } from '../src/lib/study-state';
import { boundedCamera, pinchCamera } from '../src/lib/map-geometry';
import { courseByCode, courseStatus } from '../src/data/curriculum-helpers';
import { validSsoConfig } from '../src/lib/sso-policy';
import { graphLayout } from '../src/lib/academic';
test('focus countdown survives serialized restore, navigation and wall-clock delay',()=>{
 const f=startFocus(freshFocus(25,'Physics review'),1000000);
 const restored=normalizeStudy(JSON.parse(JSON.stringify({focus:f}))).focus!;
 assert.equal(focusLeft(restored,1060000),1440);
 assert.equal(focusLeft(restored,1000000+2000000),0);
 assert.equal(restored.title,'Physics review');
});
test('pause and resume preserve remaining time without running a background interval',()=>{
 const f=startFocus(freshFocus(5),100000);
 const paused=pauseFocus(f,160000);
 assert.equal(focusLeft(paused,800000),240);
 assert.equal(startFocus(paused,800000).endAt,1040000);
});
test('invalid persisted timer cannot create infinite countdowns',()=>{
 assert.deepEqual(normalizeFocus({duration:Infinity}),freshFocus());
 assert.equal(normalizeFocus({duration:60,remaining:-9,endAt:NaN}).remaining,0);
});
const now=new Date('2026-10-24T06:00:00').getTime();
const enabled={...defaultReminders,enabled:true};
test('reminders are opt-in and completed/deleted tasks do not remain in the plan',()=>{
 const t={id:'1',title:'private course name',done:false,date:'2026-10-24',time:'09:00'};
 assert.equal(reminderPlan([t],[],freshFocus(),defaultReminders,false,now).length,0);
 const p=reminderPlan([t],[],freshFocus(),enabled,false,now);
 // Default: 5 minutes before (loud) and at start; no title on the lock screen unless opted in.
 assert.equal(p.length,2);assert.ok(p.every(x=>!x.body.includes(t.title)&&!x.title.includes(t.title)&&x.loud));
 assert.equal(p[0].at,new Date('2026-10-24T08:55:00').getTime());
 assert.equal(reminderPlan([{...t,remind:-1}],[],freshFocus(),enabled,false,now).length,0);
 assert.ok(reminderPlan([t],[],freshFocus(),{...enabled,details:true},false,now)[0].title.includes(t.title));
 assert.equal(reminderPlan([{...t,done:true}],[],freshFocus(),enabled,false,now).length,0);
 assert.equal(reminderPlan([],[],freshFocus(),enabled,false,now).length,0);
});
test('focus reminder is retained within 48 item platform limit',()=>{
 const tasks=Array.from({length:100},(_,i)=>({id:String(i),title:'Task',done:false,date:'2026-10-24',time:'09:00'}));
 const p=reminderPlan(tasks,[],startFocus(freshFocus(),now),enabled,true,now);
 assert.equal(p.length,48);assert.equal(p[0].id,'su13-focus');
 assert.ok(p.every(x=>x.at>now));
});
test('class reminders are ten minutes early and never guess weekday or ambiguous time',()=>{
 const slot={code:'X',title:'Subject',day:6,dayLabel:'Saturday',start:'09:00',end:'10:00',room:'1',kind:'Lecture',type:'lecture' as const,building:'',teachers:''};
 const p=reminderPlan([], [slot,{...slot,day:null},{...slot,start:'9 AM'}],freshFocus(),enabled,false,now);
 assert.equal(p.filter(x=>x.id.startsWith('su13-class')).length,1);
 assert.equal(new Date(p.find(x=>x.id.startsWith('su13-class'))!.at).getHours(),8);
 assert.equal(new Date(p.find(x=>x.id.startsWith('su13-class'))!.at).getMinutes(),50);
});
test('IT Project 1 requires 95 passed credits, not in-progress registration',()=>{
 const c=courseByCode.get('INT 498')!;
 assert.equal(courseStatus(c,new Set(),94).status,'locked');
 assert.equal(courseStatus(c,new Set(),95).status,'available');
 assert.equal(courseStatus(c,new Set(),0).status,'locked');
});
test('map cards have clear lanes and non-overlapping 260 by164 bounds',()=>{
 const ns=graphLayout();
 for(const a of ns)for(const b of ns)if(a!==b)assert.ok(Math.abs(a.x-b.x)>=260||Math.abs(a.y-b.y)>=164);
});
test('pinch preserves the anchor and camera remains bounded',()=>{
 const c=pinchCamera({x:0,y:0,scale:1},{x:100,y:100},{x:100,y:100},1.5);
 assert.equal(c.x,-50);assert.equal(c.y,-50);assert.equal(c.scale,1.5);
 const b=boundedCamera({x:10000,y:-10000,scale:50},3000,2000,390,570);
 assert.equal(b.scale,1.8);assert.equal(b.x,60);assert.ok(b.y>=570-2000*1.8-40);
});
test('SSO remains disabled without real HTTPS university broker configuration',()=>{
 const empty={authorizationEndpoint:'',tokenEndpoint:'',iosClientId:'',androidClientId:''};
 assert.equal(validSsoConfig(empty,'ios'),false);
 const conf={authorizationEndpoint:'https://sso.example.edu/authorize',tokenEndpoint:'https://sso.example.edu/token',iosClientId:'mobile-ios',androidClientId:'mobile-android'};
 assert.equal(validSsoConfig(conf,'ios'),true);assert.equal(validSsoConfig(conf,'android'),true);
 assert.equal(validSsoConfig({...conf,tokenEndpoint:'http://sso.example.edu/token'},'ios'),false);
 assert.equal(validSsoConfig({...conf,tokenEndpoint:'https://other.example/token'},'ios'),false);
 assert.equal(validSsoConfig(conf,'web'),false);
});