import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Path, Defs, Marker, Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { useApp } from '@/context/app-context';
import { academic, canonical, graphLayout } from '@/lib/academic';
import { courseStatus, earnedCredits } from '@/data/curriculum-helpers';
import { Button, Chip, Field, Glass, Header, PressScale, Screen, Txt } from '@/components/ui';
const layout=graphLayout();const byCode=new Map(layout.map(n=>[n.course.code,n]));
const edges=layout.flatMap(n=>n.course.prerequisites.filter(p=>byCode.has(p)).map(p=>({from:byCode.get(p)!,to:n})));
export default function Plan(){
 const a=useApp();const {tr,row,palette,completed,courseNotes,cache}=a;const data=useMemo(()=>academic(cache),[cache]);
 const [zoom,setZoom]=useState(0.8);const [query,setQuery]=useState('');const [selected,setSelected]=useState('');
 const completedCombined=new Set([...completed,...layout.filter(n=>data.passed.has(canonical(n.course.code))).map(n=>n.course.code)]);
 const width=Math.max(...layout.map(n=>n.x))+240,height=Math.max(...layout.map(n=>n.y))+160;
 return <Screen>
  <Header title={tr('خريطة رحلتك','Your journey map')} subtitle={tr('خطة IT • اسحب أفقيًا ورأسيًا • اضغط المادة لتفاصيلها','IT curriculum • Scroll both ways • Tap a course for details')}/>
  <Field icon="search" value={query} onChangeText={setQuery} placeholder={tr('ابحث باسم أو كود المادة','Search by name or code')}/>
  <View style={{flexDirection:row,flexWrap:'wrap',gap:6}}>
   <Chip label={tr('ناجح','Passed')} color="#1CA780"/><Chip label={tr('مسجّل','Registered')} color="#C79016"/>
   <Chip label={tr('رسوب مرصود','Recorded failures')} color="#E54C6F"/>
   <Chip label={tr('يدوي ≠ رسمي','Manual ≠ official')}/>
  </View>
  <View style={{flexDirection:row,alignItems:'center',gap:8}}>
   <Button small variant="glass" title="−" onPress={()=>setZoom(z=>Math.max(0.45,Math.round((z-0.15)*100)/100))}/>
   <Txt variant="caption">{Math.round(zoom*100)}%</Txt>
   <Button small variant="glass" title="+" onPress={()=>setZoom(z=>Math.min(1.25,Math.round((z+0.15)*100)/100))}/>
   <Button small variant="glass" title={tr('إعادة','Reset')} onPress={()=>{setZoom(0.8);setSelected('');setQuery('');}}/>
  </View>
  <View style={{height:600,borderRadius:28,borderWidth:1,borderColor:palette.glassBorder,overflow:'hidden',backgroundColor:palette.inputBg}}>
   <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
    <ScrollView nestedScrollEnabled style={{width:width*zoom}} contentContainerStyle={{height:height*zoom}}>
     <View style={{width:width*zoom,height:height*zoom}}>
      <Svg width={width*zoom} height={height*zoom} viewBox={`0 0 ${width} ${height}`} style={{position:'absolute'}}>
       <Defs><Marker id="arrow" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto"><Polygon points="0,0 8,4 0,8" fill={palette.accent}/></Marker></Defs>
       {edges.map(({from,to})=>{
        const active=selected===from.course.code||selected===to.course.code;
        const x1=from.x+212,y1=from.y+64,x2=to.x-4,y2=to.y+64;
        return <Path key={`${from.course.code}:${to.course.code}`} d={`M${x1},${y1} C${x1+28},${y1} ${x2-28},${y2} ${x2},${y2}`} fill="none" stroke={active?palette.primary:palette.accent} strokeWidth={active?3:1.4} strokeOpacity={selected&&!active?0.1:active?1:0.32} markerEnd="url(#arrow)"/>;
       })}
      </Svg>
      {Array.from({length:8},(_,i)=><View key={i} style={{position:'absolute',left:(i*250+18)*zoom,top:16*zoom,width:212*zoom}}><Txt center variant="label" style={{fontSize:14*zoom}}>{tr(`سنة ${Math.floor(i/2)+1} · ترم ${i%2+1}`,`Year ${Math.floor(i/2)+1} · Term ${i%2+1}`)}</Txt></View>)}
      {layout.map(({course:c,x,y})=>{
       const key=canonical(c.code);const note=courseNotes[c.code];
       const passed=data.passed.has(key)||completed.has(c.code);
       const registered=!passed&&(data.registered.has(key)||note?.registered===true);
       const failures=data.failures[key]??note?.failures??0;
       const manual=(!data.passed.has(key)&&completed.has(c.code))||(!data.registered.has(key)&&note?.registered===true)||(!data.failures[key]&&!!note?.failures);
       const locked=courseStatus(c,completedCombined,earnedCredits(completedCombined)).status==='locked';
       const color=passed?'#1CA780':registered?'#C79016':palette.primary;
       const match=!query||`${c.code} ${c.title}`.toLowerCase().includes(query.toLowerCase());
       return <View key={c.code} style={{position:'absolute',left:x*zoom,top:y*zoom,width:212*zoom,height:130*zoom,opacity:match?1:0.18}}>
        <PressScale onPress={()=>{setSelected(c.code);router.push(`/course/${encodeURIComponent(c.code)}`);}} onLongPress={()=>setSelected(c.code)} label={`${c.code} ${c.title}`}>
         <View style={{height:130*zoom,padding:12*zoom,borderRadius:16*zoom,borderWidth:1.5,borderColor:color,backgroundColor:palette.card,gap:4*zoom}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Txt variant="label" style={{fontSize:14*zoom}} color={color}>{c.code}</Txt>{failures>0?<View style={{borderRadius:20,backgroundColor:'#E54C6F',minWidth:22*zoom,padding:2*zoom}}><Txt center color="#fff" style={{fontSize:12*zoom}}>{failures}</Txt></View>:null}</View>
          <Txt numberOfLines={2} style={{fontSize:12*zoom,lineHeight:17*zoom,minHeight:34*zoom}}>{c.title}</Txt>
          <Txt variant="caption" style={{fontSize:11*zoom,lineHeight:15*zoom}}>{c.credits} {tr('ساعات','credits')} · {passed?tr('ناجح','Passed'):registered?tr('مسجّل','Registered'):locked?tr('متطلبات','Prereqs'):tr('متاحة بالخطة','Plan eligible')}{manual?tr(' · يدوي',' · manual'):''}</Txt>
         </View>
        </PressScale>
       </View>;
      })}
     </View>
    </ScrollView>
   </ScrollView>
  </View>
  {query?<Glass><View style={{gap:8}}>{layout.filter(n=>`${n.course.code} ${n.course.title}`.toLowerCase().includes(query.toLowerCase())).slice(0,12).map(n=><Button small variant="glass" key={n.course.code} title={`${n.course.code} · ${n.course.title}`} onPress={()=>router.push(`/course/${encodeURIComponent(n.course.code)}`)}/>)}</View></Glass>:null}
  <Txt variant="caption">{tr('الرسوب محسوب من المحاولات المحمّلة فقط، وليس تاريخًا كاملًا مضمونًا. شروط الساعات تظهر في التفاصيل؛ الخطوط تربط متطلبات المواد المباشرة. الأهلية النهائية من الجامعة.','Failure counts reflect loaded attempts, not a guaranteed complete history. Credit-hour conditions appear in course details; lines represent direct prerequisites. University rules determine eligibility.')}</Txt>
 </Screen>;
}