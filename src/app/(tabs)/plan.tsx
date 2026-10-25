import { useMemo, useState } from 'react';
import { PixelRatio, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { academic, canonical, graphLayout } from '@/lib/academic';
import { courseStatus, earnedCredits } from '@/data/curriculum-helpers';
import { Button, Chip, Field, Glass, Header, PressScale, Screen, Txt } from '@/components/ui';
import { MapCanvas } from '@/components/map-canvas';
import { edgeStrips } from '@/lib/map-geometry';
const layout=graphLayout(),byCode=new Map(layout.map(n=>[n.course.code,n]));
const edges=layout.flatMap(n=>n.course.prerequisites.filter(p=>byCode.has(p)).map(p=>({from:byCode.get(p)!,to:n})));
const width=Math.max(...layout.map(n=>n.x))+300,height=Math.max(...layout.map(n=>n.y))+210;
const STRIP=edgeStrips(width,height,PixelRatio.get()),strips=Array.from({length:STRIP.count},(_,i)=>i);
export default function Plan(){
 const a=useApp();const {tr,row,palette,completed,courseNotes,cache}=a;const data=useMemo(()=>academic(cache),[cache]);
 const [gesturing,setGesturing]=useState(false);
 const [query,setQuery]=useState(''),[selected,setSelected]=useState('');
 const [target,setTarget]=useState<{x:number;y:number;key:number}|null>(null);
 const combined=new Set([...completed,...layout.filter(n=>data.passed.has(canonical(n.course.code))).map(n=>n.course.code)]);
 const credits=data.earned??earnedCredits(combined);
 const locate=(code:string)=>{const n=byCode.get(code);if(n){setTarget({x:n.x,y:n.y,key:Date.now()});setSelected(code);}};
 return <Screen scrollEnabled={!gesturing}>
  <Header title={tr('رحلتك، مادة بمادة','Your learning journey')} subtitle={tr('قرّب بصباعين • اسحب في أي اتجاه • اضغط مطوّل عشان تظهر الروابط','Pinch to zoom • Drag to explore • Hold a card to highlight its links')}/>
  <Field icon="search" value={query} onChangeText={setQuery} placeholder={tr('اسم المادة أو جزء منه','Find a course by name')}/>
  {!!query&&<Glass><View style={{gap:8}}>{layout.filter(n=>`${n.course.title} ${n.course.code}`.toLowerCase().includes(query.toLowerCase())).slice(0,6).map(n=><Button key={n.course.code} small variant="glass" title={n.course.title} onPress={()=>locate(n.course.code)}/>)}</View></Glass>}
  <View style={{flexDirection:row,flexWrap:'wrap',gap:6}}>
   <Chip label={tr('ناجح','Passed')} color="#1CA780"/><Chip label={tr('مسجل','Registered')} color="#BD850C"/>
   <Chip label={tr('رسوب متسجّل','Recorded failures')} color="#D43A64"/>
   <Chip label={tr('بداية الخريطة','Map start')} onPress={()=>setTarget({x:0,y:0,key:Date.now()})}/>
  </View>
  <View style={{borderRadius:28,borderWidth:1,borderColor:palette.glassBorder,overflow:'hidden',backgroundColor:palette.inputBg}}>
   <MapCanvas onGestureActive={setGesturing} width={width} height={height} target={target}>
    {strips.map(s=><View key={`strip${s}`} pointerEvents="none" style={{position:'absolute',left:s*STRIP.size,top:0,width:STRIP.size,height,overflow:'hidden'}}><View style={{width:STRIP.size*STRIP.res,height:height*STRIP.res,transformOrigin:'top left',transform:[{scale:1/STRIP.res}]}}><Svg width={STRIP.size*STRIP.res} height={height*STRIP.res} viewBox={`${s*STRIP.size} 0 ${STRIP.size} ${height}`}>
     {edges.map(({from,to},i)=>{
      const active=selected===from.course.code||selected===to.course.code;
      const x1=from.x+260,y1=from.y+82,x2=to.x,y2=to.y+82;
      const lane=36+(i%5)*12;
      return <Path key={`${from.course.code}:${to.course.code}`} d={`M${x1} ${y1} C${x1+lane} ${y1},${x2-lane} ${y2},${x2} ${y2}`} fill="none" stroke={active?palette.primary:palette.accent} strokeWidth={active?3:1.3} strokeOpacity={selected&&!active ? .08 : active ? .9 : .22}/>;
     })}
    </Svg></View></View>)}
    {Array.from({length:8},(_,i)=><View key={i} style={{position:'absolute',left:i*400+24,top:14,width:260,gap:4}}>
      <Txt variant="h2">{tr(`السنة ${Math.floor(i/2)+1}`,`YEAR ${Math.floor(i/2)+1}`)}</Txt><Txt variant="caption">{tr(`الفصل ${i%2+1}`,`Semester ${i%2+1}`)}</Txt>
    </View>)}
    {layout.map(({course:c,x,y})=>{
     const key=canonical(c.code),note=courseNotes[c.code];
     const passed=data.passed.has(key)||completed.has(c.code);
     const registered=!passed&&(data.registered.has(key)||note?.registered);
     const failed=data.failures[key]??note?.failures??0;
     const manual=(!data.passed.has(key)&&completed.has(c.code))||(!data.registered.has(key)&&note?.registered)||(!data.failures[key]&&!!note?.failures);
     const locked=courseStatus(c,combined,credits).status==='locked';
     const color=passed?'#1CA780':registered?'#BD850C':locked?palette.faint:palette.primary;
     const selectedNode=selected===c.code;
     return <View key={c.code} style={{position:'absolute',left:x,top:y,width:260,height:164}}>
      <PressScale label={c.title} onPress={()=>router.push(`/course/${encodeURIComponent(c.code)}`)} onLongPress={()=>setSelected(c.code)}>
       <View style={{height:164,padding:18,borderRadius:22,borderWidth:selectedNode?2.5:1.4,borderColor:color,backgroundColor:palette.card,gap:8}}>
        <View style={{flexDirection:row,justifyContent:'space-between',gap:8}}><Txt variant="caption" color={color}>{c.code}</Txt>{failed>0&&<View style={{backgroundColor:'#D43A64',borderRadius:20,minWidth:26,paddingHorizontal:6}}><Txt center color="#fff">{failed}</Txt></View>}</View>
        <Txt variant="h3" numberOfLines={2} style={{minHeight:48}}>{c.title}</Txt>
        <Txt variant="caption">{c.credits} {tr('ساعات','credits')} · {passed?tr('ناجح','Passed'):registered?tr('مسجل','Registered'):locked?tr('متطلبات ناقصة','Prerequisites needed'):tr('متاح في الخطة','Plan eligible')}{manual?tr(' · يدوي',' · manual'):''}</Txt>
        {c.code==='INT 471'&&<Txt variant="caption" color={color}>{tr('مطلوب 95 ساعة نجاح','95 passed credits required')}</Txt>}
       </View>
      </PressScale>
     </View>;
    })}
   </MapCanvas>
  </View>
  <Glass><View style={{gap:8}}>
   <Txt variant="h3">IT Project (1)</Txt>
   <Txt>{tr(`يتطلب 95 ساعة ناجحة. الرصيد ${data.earned===null?'المحسوب من الخطة':'الرسمي المحمّل'}: ${credits} ساعة.`, `Requires 95 passed credits. ${data.earned===null?'Plan-based':'Loaded official'} total: ${credits}.`)}</Txt>
   <Txt variant="caption">{tr('المواد المسجّلة واللي بتدرسها دلوقتي مش بتتحسب ساعات ناجحة. والمسودة مش تسجيل رسمي.','Registered or in-progress credits do not count as passed. The draft is not official registration.')}</Txt>
   <Button small variant="glass" title={tr('اعرض مادة المشروع','Locate the project')} onPress={()=>locate('INT 471')}/>
  </View></Glass>
  <Txt variant="caption">{tr('النجاح والرسوب حسب السجل اللي اتحمّل، واللي دخلته بإيدك عليه علامة. الخطة المرجعية لتخصص IT بس.','Passes and failures reflect loaded records; manual entries are labeled. Reference curriculum: IT only.')}</Txt>
 </Screen>;
}