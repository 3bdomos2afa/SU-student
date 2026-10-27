// Taps the university page's own Google button so a remembered Google account signs in with one tap.
// It only finds and clicks the button: it never reads fields, passwords, cookies or storage, and sends nothing back.
export const GOOGLE_TAP_SCRIPT = `
(function(){
  if(window.top!==window||window.__suGoogleTap)return;
  var n=0,t=setInterval(function(){
    n++;if(n>25){clearInterval(t);return;}
    try{
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