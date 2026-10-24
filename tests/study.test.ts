import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStudy, emptyStudy } from '../src/lib/study-state';
import { courseStatus, earnedCredits, creditCondition } from '../src/data/curriculum-helpers';
import { curriculumCourses } from '../src/data/curriculum';
test('missing or malformed persisted study data cannot crash the planner',()=>{
  assert.deepEqual(normalizeStudy(null),emptyStudy());
  assert.deepEqual(normalizeStudy({completed:42,draft:'x',tasks:[null,{}, {id:'1',title:'Read',done:'yes'}]}),{...emptyStudy(),tasks:[{id:'1',title:'Read',done:false}]});
});
test('course codes dedupe and tasks remain bounded',()=>{
  const v=normalizeStudy({completed:['X','X',null],tasks:Array.from({length:600},(_,i)=>({id:String(i),title:'x',done:false}))});
  assert.deepEqual(v.completed,['X']);assert.equal(v.tasks.length,500);
});
test('manual progress never counts unknown course codes',()=>{
  assert.equal(earnedCredits(new Set(['UNKNOWN'])),0);
  const c=curriculumCourses.find(c=>c.credits>0)!;
  assert.equal(earnedCredits(new Set([c.code])),c.credits);
});
test('prerequisites and credit-hour conditions gate course eligibility',()=>{
  assert.equal(creditCondition('Passing 95 credit hours'),95);
  const c=curriculumCourses.find(c=>c.prerequisites.length>0)!;
  assert.equal(courseStatus(c,new Set(),0).status,'locked');
  assert.equal(courseStatus(c,new Set([c.code]),0).status,'completed');
});
