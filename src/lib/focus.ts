export type Focus = {duration:number;remaining:number;endAt:number|null;title:string};
export const freshFocus=(minutes=25,title=''):Focus=>({duration:minutes*60,remaining:minutes*60,endAt:null,title});
export function focusLeft(f:Focus,now=Date.now()){return Math.max(0,f.endAt===null?f.remaining:Math.ceil((f.endAt-now)/1000));}
export function normalizeFocus(value:unknown):Focus{
 const v=value as Partial<Focus>|null;
 if(!v||typeof v.duration!=='number'||!Number.isFinite(v.duration)||v.duration<60||v.duration>28800)return freshFocus();
 return {duration:v.duration,remaining:typeof v.remaining==='number'&&Number.isFinite(v.remaining)?Math.max(0,Math.min(v.duration,v.remaining)):v.duration,
 endAt:typeof v.endAt==='number'&&Number.isFinite(v.endAt)&&v.endAt>0?v.endAt:null,title:typeof v.title==='string'?v.title.slice(0,180):''};
}
export function startFocus(f:Focus,now=Date.now()):Focus{return {...f,remaining:focusLeft(f,now)||f.duration,endAt:now+(focusLeft(f,now)||f.duration)*1000};}
export function pauseFocus(f:Focus,now=Date.now()):Focus{return {...f,remaining:focusLeft(f,now),endAt:null};}