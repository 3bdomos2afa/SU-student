// Signs a remembered Google account back in on the university page.
// 1) Google One Tap with auto_select: Google signs the last account in by itself (no account chooser).
// 2) Fallback: taps the page's own Google button.
// It never reads fields, passwords, cookies or storage, and sends nothing back.
const PORTAL_GOOGLE_CLIENT = '796131519518-i1bsa6n92gb91crb1it5otoj650m2tah.apps.googleusercontent.com';
export const GOOGLE_TAP_SCRIPT = `
(function(){
  if(window.top!==window||window.__suGoogleTap)return;
  var n=0,auto=0,t=setInterval(function(){
    n++;if(n>30){clearInterval(t);return;}
    try{
      var g=window.google&&window.google.accounts&&window.google.accounts.id;
      if(!auto&&g&&typeof window.handleCredentialResponse==='function'){
        auto=n;
        g.initialize({client_id:'${PORTAL_GOOGLE_CLIENT}',callback:window.handleCredentialResponse,auto_select:true,cancel_on_tap_outside:false,itp_support:true});
        g.prompt();
        return;
      }
      if(auto&&n-auto<8)return;
      var els=[].slice.call(document.querySelectorAll('button,a,[role=button],img,span,div'));
      for(var i=0;i<els.length;i++){
        var e=els[i];if(e.children.length>3)continue;
        var c=typeof e.className==='string'?e.className:'';
        var s=((e.innerText||'')+' '+(e.getAttribute('aria-label')||'')+' '+(e.getAttribute('title')||'')+' '+(e.getAttribute('alt')||'')+' '+(e.getAttribute('src')||'')+' '+c).toLowerCase();
        if(s.indexOf('google')>=0&&e.offsetParent!==null){
          window.__suGoogleTap=true;clearInterval(t);
          var b=(e.closest&&e.closest('button,a,[role=button]'))||e;b.click();return;
        }
      }
    }catch(x){}
  },400);
})();true;
`;
/** Re-arms the tap (used by the "Quick Google sign-in" button). */
export const googleTapAgain = () => 'window.__suGoogleTap=false;' + GOOGLE_TAP_SCRIPT;