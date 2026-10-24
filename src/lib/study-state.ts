export type GpaBase = { cgpa: string; hours: string; target: string };
export type Task = { id: string; title: string; done: boolean };
export type Study = { completed: string[]; draft: string[]; grades: Record<string,string>; gpaBase: GpaBase; tasks: Task[] };
export const emptyStudy = (): Study => ({ completed: [], draft: [], grades: {}, gpaBase: {cgpa:'',hours:'',target:''}, tasks: [] });
export function normalizeStudy(value: unknown): Study {
  const v=value && typeof value==='object'?value as Partial<Study>:{};
  const codes=(a:unknown)=>Array.isArray(a)?[...new Set(a.filter((s):s is string=>typeof s==='string'&&s.length<40))].slice(0,300):[];
  return {
    completed:codes(v.completed), draft:codes(v.draft),
    grades:v.grades&&typeof v.grades==='object'?Object.fromEntries(Object.entries(v.grades).filter(([k,x])=>k.length<40&&typeof x==='string'&&x.length<20)):{},
    gpaBase: Object.fromEntries(['cgpa','hours','target'].map(k=>[k,typeof v.gpaBase?.[k as keyof GpaBase]==='string'?v.gpaBase[k as keyof GpaBase].slice(0,20):''])) as GpaBase,
    tasks:Array.isArray(v.tasks)?v.tasks.filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string').slice(0,500).map(t=>({id:t.id.slice(0,100),title:t.title.slice(0,180),done:t.done===true})):[],
  };
}