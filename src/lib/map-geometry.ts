export type Camera={x:number;y:number;scale:number};
export const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export function boundedCamera(c:Camera,width:number,height:number,viewWidth:number,viewHeight:number):Camera{
 const scale=clamp(c.scale,.32,1.8);
 return {scale,x:clamp(c.x,Math.min(60,viewWidth-width*scale-40),60),y:clamp(c.y,Math.min(60,viewHeight-height*scale-40),60)};
}
export function pinchCamera(start:Camera,oldMid:{x:number;y:number},mid:{x:number;y:number},ratio:number):Camera{
 const scale=clamp(start.scale*ratio,.32,1.8),r=scale/start.scale;
 return {scale,x:mid.x-(oldMid.x-start.x)*r,y:mid.y-(oldMid.y-start.y)*r};
}
/** Android refuses to draw any single bitmap over ~100 MB. react-native-svg draws each <Svg> into one bitmap
 * of (layout size × density²), so the prerequisite lines are split into vertical strips rendered at a reduced
 * resolution and scaled back up. Each strip stays ≤ budget bytes on any screen density. */
export function edgeStrips(width:number,height:number,density:number,budget=6e6,size=400){
 const full=size*height*density*density*4;
 const res=clamp(Math.sqrt(budget/full),0.2,1);
 return {size,count:Math.ceil(width/size),res,bytes:Math.round(full*res*res)};
}
