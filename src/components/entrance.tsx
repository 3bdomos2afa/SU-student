import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
export function Entrance({children}:{children:ReactNode}){
 const opacity=useRef(new Animated.Value(1)).current;
 useEffect(()=>{
  let alive=true;let animation:Animated.CompositeAnimation|undefined;
  void AccessibilityInfo.isReduceMotionEnabled().then(reduce=>{
   if(!alive||reduce)return;
   opacity.setValue(.4);animation=Animated.timing(opacity,{toValue:1,duration:350,useNativeDriver:true});animation.start();
  }).catch(()=>{});
  return()=>{alive=false;animation?.stop();};
 },[opacity]);
 return <Animated.View style={{opacity,gap:14}}>{children}</Animated.View>;
}