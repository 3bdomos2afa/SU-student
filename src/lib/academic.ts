import { curriculumCourses } from '../data/curriculum';
export type Row=Record<string,unknown>;
export type Cache=Record<string,{data:unknown;at:string}>;
export function rowsDeep(value:unknown,depth=0):Row[]{
 if(depth>8||!value||typeof value!=='object')return [];
 if(Array.isArray(value))return value.flatMap(v=>rowsDeep(v,depth+1));
 const r=value as Row;
 return [r,...Object.values(r).filter(v=>v&&typeof v==='object').flatMap(v=>rowsDeep(v,depth+1))];
}
export function text(v:unknown):string{return typeof v==='string'||typeof v==='number'?String(v):'';}
export function number(v:unknown):number|null{
 if((typeof v!=='string'&&typeof v!=='number')||String(v).trim()==='')return null;
 const n=Number(v);return Number.isFinite(n)?n:null;
}
export const canonical=(v:unknown)=>text(v).toUpperCase().replace(/\s+/g,'').trim();
export function sameCourse(row:Row,code:string){return !!row.CourseCode&&canonical(row.CourseCode)===canonical(code);}
const unique=(rows:Row[])=>[...new Map(rows.map(r=>[JSON.stringify(r),r])).values()];
export function courseRows(cache:Cache,action:string,code?:string){
 return unique(rowsDeep(cache[action]?.data).filter(r=>r.CourseCode&&(code?sameCourse(r,code):true)));
}
export function transcriptStatus(grade:unknown):'passed'|'failed'|'unknown'{
 const g=text(grade).trim().toUpperCase();
 if(['F','FAIL','FAILED','راسب'].includes(g))return 'failed';
 if(/^[ABCD][+-]?$/.test(g)||['PASS','PASSED','P','S','ناجح'].includes(g))return 'passed';
 return 'unknown';
}
const days=[['sunday','sun','الأحد','الاحد'],['monday','mon','الاثنين','الإثنين'],['tuesday','tue','الثلاثاء'],['wednesday','wed','الأربعاء','الاربعاء'],['thursday','thu','الخميس'],['friday','fri','الجمعة'],['saturday','sat','السبت']];
export function weekday(v:unknown):number|null{
 const s=text(v).trim().toLowerCase();
 const i=days.findIndex(ds=>ds.includes(s));return i<0?null:i;
}
export type Slot={code:string;title:string;day:number|null;dayLabel:string;start:string;end:string;room:string;kind:string;type:'lecture'|'section'|'other';building:string;teachers:string};
const hhmm=(v:unknown)=>{const t=text(v).trim();const m=/^(\d{1,2}):(\d{2})/.exec(t);return m?`${m[1].padStart(2,'0')}:${m[2]}`:t;};
/** University codes: LCTR / SubTypeID 3 = lecture, LCLB (lab) / LCTU (tutorial) / SubTypeID 4 = section. */
export function slotType(kind:string,sub?:unknown):Slot['type']{
 const n=number(sub);
 if(/^lctr$|lecture|محاضرة/i.test(kind)||(!kind&&n===3))return 'lecture';
 if(/^(lclb|lctu)$|section|tutorial|lab|سكشن|سيكشن|عملي/i.test(kind)||(!kind&&n===4))return 'section';
 return 'other';
}
const weekOrder=(d:number|null)=>d===null?9:(d+1)%7; // Egyptian week starts Saturday
export function timetable(cache:Cache):Slot[]{
 const rows=courseRows(cache,'SEC_TIMETABLE');
 return rows.filter(r=>r.StartTime!==undefined||r.WeekDay!==undefined).map((r):Slot=>{
 const kind=text(r.TypeNameEN)||text(r.TypeNameAR);
 const profs=Array.isArray(r.ProfessorLst)?r.ProfessorLst.map(p=>text((p as Row)?.Name)).filter(Boolean).join(' · '):'';
 return {code:text(r.CourseCode),title:text(r.CourseNameEN)||text(r.CourseName),
  day:weekday(r.WeekDay),dayLabel:text(r.WeekDay),start:hhmm(r.StartTime),end:hhmm(r.EndTime),
  room:[text(r.RoomName),text(r.FloorName)].filter(Boolean).join(' · ')||(r.IsOnline===true||r.IsOnline===1?'Online':''),kind,
  type:slotType(kind,r.SubTypeID??r.CourseSubtype),building:text(r.BuildingName),teachers:profs||text(r.InstructorName)};
 }).sort((a,b)=>weekOrder(a.day)-weekOrder(b.day)||a.start.localeCompare(b.start));
}
export type Term={serial:number;year:string;en:string;ar:string;current:boolean;courses:Row[];summary:Row|null};
/** Every term from the full history sync, oldest first. */
export function terms(cache:Cache):Term[]{
 const d=cache.SEC_HISTORY?.data;if(!Array.isArray(d))return [];
 return d.filter((t):t is Row=>!!t&&typeof t==='object'&&!Array.isArray(t)).map((t):Term=>({serial:number(t.SemesterYearserial)??0,year:text(t.Year),en:text(t.SemesterNameEN),ar:text(t.SemesterNameAR),current:t.IsCurrent===true,
  courses:Array.isArray(t.Courses)?(t.Courses as Row[]).filter(c=>!!c&&typeof c==='object'&&!!c.CourseCode):[],
  summary:t.Summary&&typeof t.Summary==='object'&&!Array.isArray(t.Summary)?t.Summary as Row:null}))
  .filter(t=>t.courses.length>0).sort((a,b)=>a.serial-b.serial);
}
export function academic(cache:Cache){
 const profile=rowsDeep(cache.SEC_PROFILE?.data).find(r=>r.FirstNameEN)||{};
 const name=[profile.FirstNameEN,profile.SecondNameEN,profile.ThirdNameEN,profile.LastNameEN].map(text).filter(Boolean).join(' ');
 const allTerms=terms(cache);
 const isSummary=(r:Row|null|undefined):r is Row=>!!r&&(r.CGPA!==undefined||r.CumEarnedCredits!==undefined);
 const fromHistory=[...allTerms].reverse().map(t=>t.summary).find(isSummary);
 const latest=rowsDeep(cache.SEC_SUMMARY?.data).find(isSummary);
 const summary=[fromHistory,latest].filter(isSummary).sort((x,y)=>(number(y.Semester_year)??0)-(number(x.Semester_year)??0))[0];
 const history=allTerms.length?allTerms.flatMap(t=>t.courses):courseRows(cache,'SEC_TRANSCRIPT');
 const passed=new Set(history.filter(r=>transcriptStatus(r.GradeName)==='passed').map(r=>canonical(r.CourseCode)));
 const registered=new Set([...courseRows(cache,'SEC_SCHEDULE'),...courseRows(cache,'SEC_CURRENT')].map(r=>canonical(r.CourseCode)));
 const failures:Record<string,number>={};
 for(const r of history)if(transcriptStatus(r.GradeName)==='failed'){const c=canonical(r.CourseCode);failures[c]=(failures[c]??0)+1;}
 return {name,faculty:text(profile.FacultyName_EN),gpa:number(summary?.CGPA),earned:number(summary?.CumEarnedCredits),
  attempted:number(summary?.CumAttemptCredits),terms:allTerms,
  history,passed,registered,failures,hasTranscript:!!(cache.SEC_TRANSCRIPT||cache.SEC_HISTORY),slots:timetable(cache)};
}
export function courseEvidence(cache:Cache,code:string){
 const a=academic(cache);const c=canonical(code);
 return {passed:a.passed.has(c),registered:a.registered.has(c),failures:a.failures[c]??null,
 history:a.history.filter(r=>sameCourse(r,code)),slots:a.slots.filter(s=>canonical(s.code)===c),
 attendance:courseRows(cache,'SEC_ATTENDANCE',code)};
}
export function graphLayout(){
 const columns=Array.from({length:8},(_,i)=>curriculumCourses.filter(c=>(c.level-1)*2+c.semester-1===i));
 return columns.flatMap((courses,col)=>courses.map((course,index)=>({course,x:col*400+24,y:index*230+100})));
}
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(new Date(`${value}T12:00:00`).getTime())&&localDate(new Date(`${value}T12:00:00`))===value;}
export function validTime(value:string){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);}