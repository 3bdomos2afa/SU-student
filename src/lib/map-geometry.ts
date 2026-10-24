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