import test from 'node:test';
import assert from 'node:assert/strict';
import { academic, courseEvidence, graphLayout, timetable, validDate, validTime, weekday, number, type Cache } from '../src/lib/academic';
import { normalizeStudy } from '../src/lib/study-state';
import { navigationPolicy } from '../src/lib/navigation-policy';
import { requestPortal, PortalError } from '../src/lib/portal';
import { curriculumCourses } from '../src/data/curriculum';

const pack=(data:unknown)=>({data,at:'2026-10-24T00:00:00Z'});
test('missing official metrics stay unknown, not fake zeroes',()=>{
 const a=academic({});
 assert.equal(a.gpa,null);assert.equal(a.earned,null);assert.equal(a.hasTranscript,false);
 assert.equal(number(''),null);assert.equal(number('0'),0);assert.equal(number('not available'),null);
});
test('nested own-account data yields name, official metrics and course evidence',()=>{
 const cache:Cache={
  SEC_PROFILE:pack({StudentData:[{FirstNameEN:'Test',SecondNameEN:'Student',FacultyName_EN:'IT'}]}),
  SEC_SUMMARY:pack([{CGPA:'3.2',CumEarnedCredits:60}]),
  SEC_TRANSCRIPT:pack([{TranscriptDetails:[{CourseCode:'INT 101',GradeName:'F',SemesterNameEN:'Fall'},{CourseCode:'INT 101',GradeName:'B',SemesterNameEN:'Spring'}]}]),
  SEC_SCHEDULE:pack([{CourseCode:'INT 102'}])
 };
 const a=academic(cache);
 assert.equal(a.name,'Test Student');assert.equal(a.gpa,3.2);assert.equal(a.earned,60);
 assert.equal(a.passed.size,1);assert.equal(a.failures.INT101,1);assert.equal(a.registered.has('INT102'),true);
 assert.equal(courseEvidence(cache,'INT 101').history.length,2);
 assert.equal(courseEvidence(cache,'INT 999').failures,null);
});
test('withdrawn and unknown grades are not counted as failures or passes',()=>{
 const a=academic({SEC_TRANSCRIPT:pack([{CourseCode:'A',GradeName:'W'},{CourseCode:'B',GradeName:'I'},{CourseCode:'C',GradeName:'N/A'}])});
 assert.equal(a.passed.size,0);assert.deepEqual(a.failures,{});
});
test('timetable colors session types, preserves rooms, never guesses numeric weekdays',()=>{
 const slots=timetable({SEC_TIMETABLE:pack([
  {CourseCode:'INT 101',WeekDay:'Saturday',StartTime:'09:00',EndTime:'10:30',RoomName:'A101',TypeNameEN:'Lecture'},
  {CourseCode:'INT 102',WeekDay:'الأحد',StartTime:'10:00',TypeNameEN:'Lab'},
  {CourseCode:'INT 103',WeekDay:1,StartTime:'11:00',TypeNameEN:'Other'}
 ])});
 assert.equal(slots[0].day,6);assert.equal(slots[0].room,'A101');assert.equal(slots[0].type,'lecture');
 assert.equal(slots[1].day,0);assert.equal(slots[1].type,'section');assert.equal(slots[2].day,null);
 assert.equal(weekday('not a day'),null);
});
test('map includes all 49 courses with non-overlapping coordinates',()=>{
 const nodes=graphLayout();assert.equal(nodes.length,curriculumCourses.length);assert.equal(nodes.length,49);
 assert.equal(new Set(nodes.map(n=>`${n.x}:${n.y}`)).size,nodes.length);
 assert.equal(nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)),true);
});
test('study input validates real calendar dates and 24-hour times',()=>{
 assert.ok(validDate('2028-02-29'));assert.ok(!validDate('2026-02-29'));assert.ok(!validDate('2026-13-01'));
 assert.ok(validTime('23:59'));assert.ok(!validTime('25:00'));assert.ok(!validTime('2:5'));
});
test('saved study upgrades preserve timing, completion and bounded manual notes',()=>{
 const s=normalizeStudy({tasks:[{id:'1',title:'Review',done:true,date:'2026-10-24',time:'18:00',duration:45,course:'INT 101',notes:'Chapter 1'}],courseNotes:{'INT 101':{registered:true,failures:500}}});
 assert.equal(s.tasks[0].time,'18:00');assert.equal(s.tasks[0].duration,45);assert.equal(s.tasks[0].done,true);assert.equal(s.courseNotes?.['INT 101'].failures,99);
});
test('external links open in browser, session bridges remain exact-origin',()=>{
 assert.equal(navigationPolicy('http://unicodesis.su.edu.eg/login'),'portal');
 assert.equal(navigationPolicy('https://accounts.google.com/o/oauth2/auth?client_id=example'),'external');
 assert.equal(navigationPolicy('https://example.org/calendar'),'external');
 for(const url of ['javascript:alert(1)','file:///tmp/a','intent://foo','https://example.org/?access_token=secret','https://user:pass@example.org/'])
  assert.equal(navigationPolicy(url),'blocked');
});
const session={studentId:'42',token:'test-token-placeholder',name:'Test',signedInAt:'2026-10-24T00:00:00Z'};
test('summary IDs come from returned transcript, never caller-supplied IDs',async()=>{
 const old=globalThis.fetch;const calls:string[]=[];
 try{
  globalThis.fetch=(async(input,init)=>{
   const url=new URL(String(input));calls.push(url.pathname);
   assert.equal(init?.redirect,'error');
   if(url.pathname.endsWith('SelectStudentTranscriptBySemester')){
    assert.equal(url.searchParams.get('StudentID'),'42');
    return new Response(JSON.stringify([{EnrollmentStudentID:9,StudentTransferID:0}]));
   }
   assert.equal(url.searchParams.get('EnrollmentStudentId'),'9');
   assert.equal(url.searchParams.get('StudentTransferDetails'),'0');
   assert.equal(init?.method,'POST');return new Response('[{"CGPA":3.2}]');
  }) as typeof fetch;
  assert.deepEqual(await requestPortal('SEC_SUMMARY',session),[{CGPA:3.2}]);assert.equal(calls.length,2);
 }finally{globalThis.fetch=old;}
});
test('grade endpoint requires a course returned for this student and also reads quizzes',async()=>{
 const old=globalThis.fetch;const roles:string[]=[];
 try{
  globalThis.fetch=(async(input)=>{
   const url=new URL(String(input));assert.equal(url.searchParams.get('StudentID')??url.searchParams.get('StudentId'),'42');
   if(url.pathname.endsWith('StudentBasicCourses'))return new Response('[{"CourseCode":"INT 101","CourseID":7}]');
   if(url.pathname.endsWith('StudentSchedule'))return new Response('[]');
   assert.equal(url.searchParams.get('CourseID'),'7');roles.push(String(url.searchParams.get('RoleReviewID')));
   if(url.pathname.endsWith('GetStudentQUICKQUIZEZ'))return new Response('',{status:404});
   return new Response('[{"TemplateDetails":"Midterm","StudentDegree":0,"MaxDegree":20}]');
  }) as typeof fetch;
  const marks=await requestPortal('GRADES:INT101',session);
  assert.deepEqual(marks,[{_part:'activity',data:[{TemplateDetails:'Midterm',StudentDegree:0,MaxDegree:20}]},{_part:'quiz',data:[]}]);
  await assert.rejects(requestPortal('GRADES:UNOWNED',session),(e:unknown)=>e instanceof PortalError&&e.code==='unsupported');
  assert.deepEqual(roles.sort(),['1','2']);
 }finally{globalThis.fetch=old;}
});
