import { useEffect, useMemo, useRef, type ReactNode, type ComponentRef } from 'react';
import { Animated, PanResponder, View, Platform, type GestureResponderEvent } from 'react-native';
import { boundedCamera, pinchCamera, type Camera } from '@/lib/map-geometry';
export function MapCanvas({width,height,children,target,onGestureActive}:{width:number;height:number;children:ReactNode;target:{x:number;y:number;key:number}|null;onGestureActive?:(active:boolean)=>void}){
 const view=useRef<ComponentRef<typeof View>>(null),size=useRef({w:350,h:570}),origin=useRef({x:0,y:0});
 const camera=useRef<Camera>({x:16,y:10,scale:.85});
 const x=useRef(new Animated.Value(16)).current,y=useRef(new Animated.Value(10)).current,scale=useRef(new Animated.Value(.85)).current;
 const gesture=useRef<{camera:Camera;mid:{x:number;y:number};distance:number;count:number}|null>(null);
 const apply=(c:Camera)=>{const b=boundedCamera(c,width,height,size.current.w,size.current.h);camera.current=b;x.setValue(b.x);y.setValue(b.y);scale.setValue(b.scale);};
 const points=(e:GestureResponderEvent)=>{
  const ts=e.nativeEvent.touches;
  const a=ts[0],b=ts[1]??a;
  if(!a)return null;
  return {mid:{x:(a.pageX+b.pageX)/2-origin.current.x,y:(a.pageY+b.pageY)/2-origin.current.y},distance:Math.max(1,Math.hypot(a.pageX-b.pageX,a.pageY-b.pageY)),count:ts.length};
 };
 const responder=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:e=>e.nativeEvent.touches.length>=2,
  onStartShouldSetPanResponderCapture:e=>e.nativeEvent.touches.length>=2,
  onMoveShouldSetPanResponder:(_,g)=>g.numberActiveTouches>=2||Math.abs(g.dx)>6||Math.abs(g.dy)>6,
  onMoveShouldSetPanResponderCapture:(_,g)=>g.numberActiveTouches>=2||Math.abs(g.dx)>6||Math.abs(g.dy)>6,
  onPanResponderGrant:e=>{
   onGestureActive?.(true);
   view.current?.measureInWindow((ox,oy)=>{origin.current={x:ox,y:oy};gesture.current=null;});
   const p=points(e);gesture.current=p?{...p,camera:{...camera.current}}:null;
  },
  onPanResponderMove:e=>{
   const p=points(e);if(!p)return;
   const g=gesture.current;
   if(!g||g.count!==p.count){gesture.current={...p,camera:{...camera.current}};return;}
   apply(p.count>=2?pinchCamera(g.camera,g.mid,p.mid,p.distance/g.distance):{...g.camera,x:g.camera.x+p.mid.x-g.mid.x,y:g.camera.y+p.mid.y-g.mid.y});
  },
  onPanResponderRelease:()=>{gesture.current=null;onGestureActive?.(false);},
  onPanResponderTerminate:()=>{gesture.current=null;onGestureActive?.(false);},
  onPanResponderTerminationRequest:()=>false,
 }),[width,height]);
 useEffect(()=>{if(target)apply({scale:.95,x:24-target.x*.95,y:60-target.y*.95});},[target?.key]);
 return <View ref={view} accessibilityLabel="Course map: pinch to zoom, drag to move" onLayout={e=>{size.current={w:e.nativeEvent.layout.width,h:e.nativeEvent.layout.height};view.current?.measureInWindow((ox,oy)=>{origin.current={x:ox,y:oy};});}}
  style={[{height:570,overflow:'hidden',direction:'ltr'},Platform.OS==='web'?{touchAction:'none'} as never:null]} {...responder.panHandlers}>
  <Animated.View style={{position:'absolute',left:0,top:0,width,height,transformOrigin:'top left',transform:[{translateX:x},{translateY:y},{scale}]}}>
   {children}
  </Animated.View>
 </View>;
}