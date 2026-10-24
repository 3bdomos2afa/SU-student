import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Txt } from './ui';
import { useApp } from '@/context/app-context';
import { isPortalURL, parseSession, PORTAL_LOGIN, PORTAL_ORIGIN } from '@/lib/portal';

const bridge = `
(function(){
  if(window.top!==window || location.origin!==${JSON.stringify(PORTAL_ORIGIN)} || window.__suBridge) return;
  window.__suBridge=true;
  var timer=setInterval(function(){
    try {
      var raw=sessionStorage.getItem('user');
      if(!raw||raw.length>20000)return;
      var u=JSON.parse(raw);
      if(!(u.Token||u.token)||!u.StudentID)return;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'su-login',origin:location.origin,
        user:{Token:u.Token||u.token,StudentID:u.StudentID,FirstNameEN:u.FirstNameEN,LastNameEN:u.LastNameEN}
      }));
      clearInterval(timer);
    }catch(e){}
  },800);
  setTimeout(function(){clearInterval(timer);},900000);
})();true;
`;

export function PortalModal({visible,onClose,browse=false}:{visible:boolean;onClose:()=>void;browse?:boolean}) {
  const {tr,palette,signIn}=useApp();
  const [accepted,setAccepted]=useState(false);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const [key,setKey]=useState(0);
  const handled=useRef(false);
  const web=useRef<WebView<{}>>(null);
  const close=()=>{setAccepted(false);setError('');handled.current=false;onClose();};
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={{flex:1,backgroundColor:palette.bg[0]}}>
      <View style={{padding:16,gap:8}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Button small variant="glass" title={tr('إغلاق','Close')} onPress={close}/>
          <Txt variant="h3">{tr('بوابة الجامعة','University portal')}</Txt>
        </View>
        <Txt variant="caption" center>unicodesis.su.edu.eg · HTTP</Txt>
      </View>
      {!accepted ? <View style={{padding:24,gap:18,flex:1,justifyContent:'center'}}>
        <Txt variant="h2">{tr('قبل تسجيل الدخول','Before you sign in')}</Txt>
        <Txt>{tr('بوابة الجامعة تستخدم HTTP غير مشفّر. بيانات الدخول والجلسة قد تكون مكشوفة على الشبكة. تجنّب الشبكات العامة. لا يمكن للتطبيق إصلاح حماية موقع الجامعة.','The university portal uses unencrypted HTTP. Login credentials and session data may be exposed on the network. Avoid public Wi-Fi. This app cannot secure the university website.')}</Txt>
        <Txt variant="sub">{tr('تكتب كلمة السر داخل موقع الجامعة فقط. التطبيق لا يقرأها ولا يخزّنها. بعد الدخول، يحتفظ بالجلسة على جهازك ويسحب البيانات الأكاديمية المدعومة للقراءة فقط.','Enter your password only inside the university site. The app never reads or stores it. After login, it stores the session on your device and reads supported academic records.')}</Txt>
        <Button title={tr('أفهم المخاطرة — افتح الموقع','I understand — open website')} onPress={()=>{setAccepted(true);handled.current=false;}}/>
        <Button variant="glass" title={tr('رجوع بدون تسجيل','Go back without signing in')} onPress={close}/>
      </View> : Platform.OS==='web' ? <View style={{padding:24}}><Txt>{tr('تسجيل الدخول متاح في نسخة Android وiOS فقط.','Portal login is available in the Android/iOS app only.')}</Txt></View> :
      <>
        {error ? <View style={{padding:16,gap:8}}><Txt color={palette.warn}>{error}</Txt><Button small title={tr('إعادة المحاولة','Retry')} onPress={()=>{setError('');handled.current=false;setKey(k=>k+1);}}/></View> : null}
        {saving?<ActivityIndicator color={palette.primary}/>:null}
        <WebView<{}> ref={web} key={key} source={{uri:PORTAL_LOGIN}} style={{flex:1}}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={r=>{
            if(isPortalURL(r.url))return true;
            if(r.isTopFrame!==false)setError(tr('تم إيقاف رابط خارج نطاق بوابة الجامعة.','Blocked navigation outside the university portal.'));
            return false;
          }}
          onOpenWindow={()=>setError(tr('الروابط الخارجية معطّلة لحماية الجلسة','External windows are disabled to protect the session'))}
          injectedJavaScript={browse?'true;':bridge}
          injectedJavaScriptForMainFrameOnly
          onMessage={async e=>{
            if(browse||handled.current||!isPortalURL(e.nativeEvent.url)||e.nativeEvent.data.length>22000)return;
            try {
              const msg=JSON.parse(e.nativeEvent.data);
              if(msg.type!=='su-login'||msg.origin!==PORTAL_ORIGIN)return;
              const s=parseSession(msg.user);
              if(!s){setError(tr('تعذر التعرّف على جلسة طالب. جرّب حساب الطالب.','Could not identify a student session. Use your student account.'));return;}
              handled.current=true;setSaving(true);
              await signIn(s);close();
            } catch { handled.current=false;setError(tr('تعذر حفظ الجلسة بشكل آمن. حاول مرة أخرى.','Could not securely save the session. Please retry.')); }
            finally {setSaving(false);}
          }}
          incognito sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false}
          allowFileAccess={false} allowUniversalAccessFromFileURLs={false}
          javaScriptCanOpenWindowsAutomatically={false} mixedContentMode="never"
          startInLoadingState renderLoading={()=><ActivityIndicator style={{position:'absolute',alignSelf:'center',top:30}} color={palette.primary}/>}
          onError={()=>setError(tr('تعذر تحميل البوابة؛ افحص الاتصال أو جرّب لاحقًا.','Portal unavailable. Check connection or retry later.'))}
          onHttpError={e=>{if(e.nativeEvent.statusCode>=400)setError(tr('بوابة الجامعة أعادت خطأ. جرّب لاحقًا.','The university portal returned an error. Try later.'));}}
          onContentProcessDidTerminate={()=>{setError(tr('توقفت صفحة الجامعة؛ أعد المحاولة.','Portal page stopped; please retry.'));}}
          onRenderProcessGone={()=>{setError(tr('توقفت صفحة الجامعة؛ أعد المحاولة.','Portal page stopped; please retry.'));}}
        />
      </>}
    </SafeAreaView>
  </Modal>;
}