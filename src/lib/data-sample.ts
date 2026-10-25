// Builds a shareable sample of the cached university data so the display can be built from the real shapes.
// Secrets and personal identifiers are masked; long lists are cut. Nothing is sent anywhere automatically.
export const PRIVATE_KEY=/password|token|secret|authorization|national|\bnid\b|ssn|phone|mobile|tel|e?mail|address|passport|birth|mother|father|guardian|religion|photo|image|pic|studentid|student.?name|full.?name|arabic.?name|english.?name|^name$/i;
export function sampleValue(v:unknown,limit=25,depth=0,key=''):unknown{
 if(key&&PRIVATE_KEY.test(key))return v===null||v===undefined||v===''?v:'•••';
 if(depth>8)return '…';
 if(Array.isArray(v)){const out:unknown[]=v.slice(0,limit).map(x=>sampleValue(x,limit,depth+1));if(v.length>limit)out.push(`… +${v.length-limit} more`);return out;}
 if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v as Record<string,unknown>).map(([k,x])=>[k,sampleValue(x,limit,depth+1,k)]));
 if(typeof v==='string'&&v.length>200)return v.slice(0,200)+'…';
 return v;
}
export function buildDataSample(cache:Record<string,{data:unknown;at:string}>,version:string,maxChars=150000){
 let text='';
 for(const limit of [25,10,5,2,1]){
  const services=Object.fromEntries(Object.keys(cache).sort().map(k=>[k,{at:cache[k]?.at,data:sampleValue(cache[k]?.data,limit)}]));
  text=JSON.stringify({app:'SU Student',version,generated:new Date().toISOString(),masked:'secrets and personal identifiers replaced with •••',services});
  if(text.length<=maxChars)return text;
 }
 return text.slice(0,maxChars);
}
