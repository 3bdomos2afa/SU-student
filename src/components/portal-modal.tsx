import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { navigationPolicy } from '@/lib/navigation-policy';
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
  const externalBusy=useRef(false);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const [key,setKey]=useState(0);
  const handled=useRef(false);
  const web=useRef<WebView<{}>>(null);
  const close=()=>{setError('');handled.current=false;onClose();};
  useEffect(()=>{if(visible){handled.current=false;setError('');setKey(k=>k+1);}},[visible]);
  async function openExternal(url:string){
    if(externalBusy.current)return;
    if(navigationPolicy(url)==='blocked'){setError(tr('الرابط يتضمن بيانات جلسة أو نوعًا غير مدعوم.','Link contains session data or an unsupported scheme.'));return;}
    externalBusy.current=true;
    try{
      setError(tr('المتصفح منفصل: دخول Google فيه لا يربط حسابك بالتطبيق تلقائيًا. يمكنك استخدام اسم المستخدم وكلمة السر داخل البوابة هنا.','Browser sessions are separate: Google login there does not automatically connect this app. Use your university username and password here to sync.'));
      await WebBrowser.openBrowserAsync(url);
    }catch{setError(tr('تعذر فتح المتصفح.','Could not open the browser.'));}
    finally{externalBusy.current=false;}
  }
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={{flex:1,backgroundColor:palette.bg[0]}}>
      <View style={{padding:16,gap:8}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Button small variant="glass" title={tr('إغلاق','Close')} onPress={close}/>
          <Txt variant="h3">{tr('بوابة الجامعة','University portal')}</Txt>
        </View>
        <Txt variant="caption" center>unicodesis.su.edu.eg · HTTP</Txt>
        <Button small variant="glass" title={tr('فتح في المتصفح / Google','Open in browser / Google')} onPress={()=>{void openExternal(PORTAL_LOGIN);}}/>
      </View>
      {Platform.OS==='web' ? <View style={{padding:24}}><Txt>{tr('تسجيل الدخول متاح في نسخة Android وiOS فقط.','Portal login is available in the Android/iOS app only.')}</Txt></View> :
      <>
        {error ? <View style={{padding:16,gap:8}}><Txt color={palette.warn}>{error}</Txt><Button small title={tr('إعادة المحاولة','Retry')} onPress={()=>{setError('');handled.current=false;setKey(k=>k+1);}}/></View> : null}
        {saving?<ActivityIndicator color={palette.primary}/>:null}
        <WebView<{}> ref={web} key={key} source={{uri:PORTAL_LOGIN}} style={{flex:1}}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={r=>{
            if(r.isTopFrame===false)return true;
            const policy=navigationPolicy(r.url);
            if(policy==='portal')return true;
            if(policy==='external')void openExternal(r.url);
            else setError(tr('تعذر فتح هذا الرابط بأمان.','This link cannot be opened safely.'));
            return false;
          }}
          onOpenWindow={e=>{void openExternal(e.nativeEvent.targetUrl);}}
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
          javaScriptCanOpenWindowsAutomatically={true} mixedContentMode="never"
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