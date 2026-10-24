export type GpaBase = { cgpa: string; hours: string; target: string };
export type Task = { id: string; title: string; done: boolean; date?:string; time?:string; duration?:number; course?:string; notes?:string };
export type CourseNote={registered?:boolean;failures?:number};
export type Study = { completed: string[]; draft: string[]; grades: Record<string,string>; gpaBase: GpaBase; tasks: Task[]; courseNotes?:Record<string,CourseNote> };
export const emptyStudy = (): Study => ({ completed: [], draft: [], grades: {}, gpaBase: {cgpa:'',hours:'',target:''}, tasks: [] });
export function normalizeTask(t:Task):Task{
 const base:Task={id:t.id.slice(0,100),title:t.title.slice(0,180),done:t.done===true};
 if(typeof t.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.date))base.date=t.date;
 if(typeof t.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))base.time=t.time;
 if(typeof t.duration==='number'&&Number.isFinite(t.duration)&&t.duration>0)base.duration=Math.min(480,Math.round(t.duration));
 if(typeof t.course==='string')base.course=t.course.slice(0,40);
 if(typeof t.notes==='string')base.notes=t.notes.slice(0,1000);
 return base;
}
export function normalizeStudy(value: unknown): Study {
 const v=value&&typeof value==='object'?value as Partial<Study>:{};
 const codes=(a:unknown)=>Array.isArray(a)?[...new Set(a.filter((s):s is string=>typeof s==='string'&&s.length<40))].slice(0,300):[];
 const result:Study={
 completed:codes(v.completed),draft:codes(v.draft),
 grades:v.grades&&typeof v.grades==='object'?Object.fromEntries(Object.entries(v.grades).filter(([k,x])=>k.length<40&&typeof x==='string'&&x.length<20)):{},
 gpaBase:Object.fromEntries(['cgpa','hours','target'].map(k=>[k,typeof v.gpaBase?.[k as keyof GpaBase]==='string'?v.gpaBase[k as keyof GpaBase].slice(0,20):''])) as GpaBase,
 tasks:Array.isArray(v.tasks)?v.tasks.filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string').slice(0,500).map(normalizeTask):[]};
 if(v.courseNotes&&typeof v.courseNotes==='object'){
 result.courseNotes=Object.fromEntries(Object.entries(v.courseNotes).filter(([k,n])=>k.length<40&&n&&typeof n==='object').slice(0,300).map(([k,n])=>[k,{
 ...(typeof n.registered==='boolean'?{registered:n.registered}:{}),
 ...(typeof n.failures==='number'&&Number.isFinite(n.failures)?{failures:Math.max(0,Math.min(99,Math.floor(n.failures)))}:{})
 }]));
 }return result;
}