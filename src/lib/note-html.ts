// كشكولك page editor: rich text (contenteditable) + an SVG ink layer, rendered inside a WebView.
// Pure string building only, so it can be unit-tested in Node.
import type { PageBody, Stroke } from './notebook';

export const NOTE_LINE = 34;
export const NOTE_TOP = 20;
/** 4× the old 24-line page; it still grows when the text or drawing goes further. */
export const NOTE_LINES = 96;
export const NOTE_PAPER = '#FFFDF5';
export const TEXT_COLORS = ['#1F2937', '#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C', '#DB2777', '#0891B2'];
export const HIGHLIGHTS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FED7AA', '#DDD6FE'];
export const LIST_STYLES: { kind: 'ul' | 'ol'; style: string; label: string }[] = [
  { kind: 'ul', style: 'disc', label: '•' },
  { kind: 'ul', style: 'circle', label: '◦' },
  { kind: 'ul', style: 'square', label: '▪' },
  { kind: 'ul', style: '"– "', label: '–' },
  { kind: 'ul', style: '"✓ "', label: '✓' },
  { kind: 'ul', style: '"★ "', label: '★' },
  { kind: 'ol', style: 'decimal', label: '1.' },
  { kind: 'ol', style: 'arabic-indic', label: '١.' },
  { kind: 'ol', style: 'lower-alpha', label: 'a.' },
  { kind: 'ol', style: 'upper-alpha', label: 'A.' },
  { kind: 'ol', style: 'lower-roman', label: 'i.' },
];

export type NoteLabels = {
  placeholder: string; color: string; highlight: string; size: string; list: string; align: string;
  big: string; heading: string; normal: string; noList: string; none: string; clearFormat: string;
  right: string; center: string; left: string; indent: string; outdent: string;
};

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/** Old pages were plain text; turn each line into a block. */
export function textToHtml(text: string) {
  return text ? text.split('\n').map(l => `<div>${l ? escapeHtml(l) : '<br>'}</div>`).join('') : '';
}
const DROP_BLOCK = /<(script|style|iframe|object|embed|template|svg|math|noscript|textarea|select)\b[\s\S]*?<\/\1\s*>/gi;
const DROP_TAG = /<\/?(script|style|iframe|object|embed|template|svg|math|noscript|link|meta|base|form|input|button|textarea|select|option|img|picture|video|audio|source|track|frame|frameset)\b[^>]*>/gi;
/** Keeps formatting tags/styles only: no scripts, embeds, event handlers or links. */
export function sanitizeNoteHtml(html: string): string {
  return html.slice(0, 400_000)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(DROP_BLOCK, '')
    .replace(DROP_TAG, '')
    .replace(/<[a-z][^>]*>/gi, tag => tag.replace(/\s(on[a-z]+|href|src|srcset|action|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ''));
}
export const bodyHtml = (b: PageBody) => (b.html ? sanitizeNoteHtml(b.html) : textToHtml(b.text));
/** JSON that is safe to drop inside a <script> tag. */
export function safeJson(v: unknown) {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export const maxStrokeY = (strokes: Stroke[]) => strokes.reduce((m, s) => Math.max(m, s.y || 0), 0);

// Runs inside the WebView. No backticks / template placeholders in here on purpose.
const SCRIPT = String.raw`(function(){
var C=window.CFG,NS='http://www.w3.org/2000/svg';
var bar=document.getElementById('bar'),stage=document.getElementById('stage'),page=document.getElementById('page'),ed=document.getElementById('ed'),svg=document.getElementById('ink');
var strokes=C.strokes.slice(),z=1,mode='write',ink=C.ink,pen=C.pen,tool='pen',H=C.H0,dirty=false,saved=null,live=null,multi=null;
function post(o){try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(o));}catch(e){}}
function markDirty(){if(!dirty){dirty=true;post({t:'dirty'});}}
function pathEl(s){var p=document.createElementNS(NS,'path');p.setAttribute('d',s.d);p.setAttribute('stroke',s.c);p.setAttribute('stroke-width',String(s.w));p.setAttribute('fill','none');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');if(s.o)p.setAttribute('stroke-opacity',String(s.o));return p;}
function redraw(){while(svg.firstChild)svg.removeChild(svg.firstChild);for(var i=0;i<strokes.length;i++)svg.appendChild(pathEl(strokes[i]));}
function maxY(){var m=0;for(var i=0;i<strokes.length;i++)m=Math.max(m,strokes[i].y||0);return m;}
function layout(){H=Math.max(C.H0,ed.offsetHeight+C.LINE*2,maxY()+C.LINE*6);page.style.height=H+'px';svg.setAttribute('width',String(C.W));svg.setAttribute('height',String(H));svg.setAttribute('viewBox','0 0 '+C.W+' '+H);stage.style.width=(C.W*z)+'px';stage.style.height=(H*z)+'px';page.style.transform='scale('+z+')';}
function setEmpty(){ed.classList.toggle('empty',!ed.innerText.trim()&&!ed.querySelector('li'));}
function changed(){markDirty();setEmpty();layout();}
function closest(n,sel){while(n&&n!==ed){if(n.nodeType===1&&n.matches(sel))return n;n=n.parentNode;}return null;}
function refresh(){var bs=bar.querySelectorAll('[data-c]');for(var i=0;i<bs.length;i++){var c=bs[i].getAttribute('data-c');if(c==='bold'||c==='italic'||c==='underline'||c==='strikeThrough'){var on=false;try{on=document.queryCommandState(c);}catch(e){}bs[i].classList.toggle('on',on);}}}
document.addEventListener('selectionchange',function(){var s=getSelection();if(s&&s.rangeCount&&ed.contains(s.anchorNode)){saved=s.getRangeAt(0).cloneRange();refresh();}});
function restore(){if(mode!=='write')return;if(document.activeElement!==ed)ed.focus();if(saved){var s=getSelection();s.removeAllRanges();s.addRange(saved);}}
function openPanel(p){var ps=document.querySelectorAll('.panel');for(var i=0;i<ps.length;i++){var me=ps[i].id==='p-'+p;ps[i].classList.toggle('open',me&&!ps[i].classList.contains('open'));}var ts=bar.querySelectorAll('[data-p]');for(var j=0;j<ts.length;j++){var el=document.getElementById('p-'+ts[j].getAttribute('data-p'));ts[j].classList.toggle('on',!!el&&el.classList.contains('open'));}}
function applyList(kind,style){var s=getSelection();var cur=s.anchorNode?closest(s.anchorNode,'ul,ol'):null;
 if(kind==='off'){if(cur)document.execCommand(cur.nodeName==='OL'?'insertOrderedList':'insertUnorderedList');return;}
 if(!cur||cur.nodeName.toLowerCase()!==kind)document.execCommand(kind==='ol'?'insertOrderedList':'insertUnorderedList');
 s=getSelection();cur=s.anchorNode?closest(s.anchorNode,'ul,ol'):null;if(cur)cur.style.listStyleType=style;}
bar.addEventListener('mousedown',function(e){if(e.target.closest('button'))e.preventDefault();});
bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var p=b.getAttribute('data-p');if(p){openPanel(p);return;}
 restore();var c=b.getAttribute('data-c'),a=b.getAttribute('data-a'),v=b.getAttribute('data-v');
 try{if(c)document.execCommand(c,false,null);
  else if(a==='fore')document.execCommand('foreColor',false,v);
  else if(a==='hl')document.execCommand('hiliteColor',false,v);
  else if(a==='block')document.execCommand('formatBlock',false,'<'+v+'>');
  else if(a==='list')applyList(b.getAttribute('data-kind'),v);
 }catch(err){}
 changed();refresh();});
ed.addEventListener('input',changed);
ed.addEventListener('paste',function(e){e.preventDefault();var t=(e.clipboardData&&e.clipboardData.getData('text/plain'))||'';document.execCommand('insertText',false,t);});
ed.addEventListener('drop',function(e){e.preventDefault();});
page.addEventListener('click',function(e){if(mode!=='write'||ed.contains(e.target))return;ed.focus();var r=document.createRange();r.selectNodeContents(ed);r.collapse(false);var s=getSelection();s.removeAllRanges();s.addRange(r);});
function pt(t){var r=page.getBoundingClientRect();var x=(t.clientX-r.left)/z,y=(t.clientY-r.top)/z;return [Math.max(1,Math.min(C.W-1,x)),Math.max(1,Math.min(H-1,y))];}
function gap(a,b){return Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY));}
function cancelLive(){if(live&&live.el&&live.el.parentNode)live.el.parentNode.removeChild(live.el);live=null;}
function curW(){return tool==='hl'?Math.max(14,pen*4):pen;}
function erase(p){var r=Math.max(8,12/z),keep=[],hit=false;for(var i=0;i<strokes.length;i++){var s=strokes[i],n=s.d.match(/-?\d+(?:\.\d+)?/g)||[],near=false,pad=r+s.w/2;for(var k=0;k+1<n.length;k+=2){if(Math.abs(+n[k]-p[0])<pad&&Math.abs(+n[k+1]-p[1])<pad){near=true;break;}}if(near)hit=true;else keep.push(s);}if(hit){strokes=keep;redraw();changed();}}
document.addEventListener('touchstart',function(e){
 if(e.touches.length>=2){e.preventDefault();cancelLive();var a=e.touches[0],b=e.touches[1];multi={d:gap(a,b),z:z,cx:(a.clientX+b.clientX)/2,cy:(a.clientY+b.clientY)/2,sx:window.scrollX,sy:window.scrollY,top:stage.offsetTop,left:stage.offsetLeft};return;}
 if(mode!=='draw'||multi)return;
 e.preventDefault();var p=pt(e.touches[0]);
 if(tool==='erase'){live={erase:true};erase(p);return;}
 live={d:'M'+p[0].toFixed(1)+' '+p[1].toFixed(1),y:p[1],x0:p[0],y0:p[1],n:1,c:ink,w:curW(),o:tool==='hl'?0.35:0};
 live.el=pathEl({d:live.d+' l0.1 0.1',c:live.c,w:live.w,o:live.o});svg.appendChild(live.el);
},{passive:false});
document.addEventListener('touchmove',function(e){
 if(multi){e.preventDefault();if(e.touches.length<2||multi.done)return;var a=e.touches[0],b=e.touches[1];var nz=Math.max(1,Math.min(4,multi.z*gap(a,b)/multi.d));var cx=(a.clientX+b.clientX)/2,cy=(a.clientY+b.clientY)/2;var ux=(multi.sx+multi.cx-multi.left)/multi.z,uy=(multi.sy+multi.cy-multi.top)/multi.z;z=nz;layout();window.scrollTo(multi.left+ux*z-cx,multi.top+uy*z-cy);return;}
 if(mode!=='draw'||!live)return;e.preventDefault();var p=pt(e.touches[0]);
 if(live.erase){erase(p);return;}
 if(Math.abs(p[0]-live.x0)+Math.abs(p[1]-live.y0)<1.2)return;
 live.x0=p[0];live.y0=p[1];live.n++;live.d+=' L'+p[0].toFixed(1)+' '+p[1].toFixed(1);live.y=Math.max(live.y,p[1]);live.el.setAttribute('d',live.d);
},{passive:false});
function end(e){
 if(multi){if(e.touches.length===0){multi=null;post({t:'zoom',z:z});}else multi.done=true;return;}
 if(!live)return;var l=live;live=null;if(l.erase)return;
 var s={c:l.c,w:l.w,d:l.n>1?l.d:l.d+' l0.1 0.1',y:l.y};if(l.o)s.o=l.o;strokes.push(s);
 changed();
}
document.addEventListener('touchend',end);
document.addEventListener('touchcancel',function(e){if(live&&!live.erase)cancelLive();end(e);});
function setMode(m){mode=m;document.body.classList.toggle('draw',m==='draw');ed.contentEditable=m==='write'?'true':'false';document.documentElement.style.touchAction=m==='draw'?'none':'pan-x pan-y';if(m==='draw'&&document.activeElement&&document.activeElement.blur)document.activeElement.blur();cancelLive();layout();}
function zoomTo(v){var cx=window.innerWidth/2,cy=window.innerHeight/2,top=stage.offsetTop,left=stage.offsetLeft,ux=(window.scrollX+cx-left)/z,uy=(window.scrollY+cy-top)/z;z=Math.max(1,Math.min(4,v));layout();window.scrollTo(left+ux*z-cx,top+uy*z-cy);post({t:'zoom',z:z});}
window.__cmd=function(o){switch(o.k){
 case 'mode':setMode(o.v);break;
 case 'ink':ink=o.v;break;
 case 'pen':pen=o.v;break;
 case 'tool':tool=o.v;break;
 case 'undo':if(strokes.length){strokes.pop();redraw();changed();}break;
 case 'clear':if(strokes.length){strokes=[];redraw();changed();}break;
 case 'zoom':zoomTo(o.v);break;
 case 'clean':dirty=false;break;
 case 'dump':post({t:'dump',html:ed.innerHTML,text:ed.innerText,strokes:strokes});break;
}};
ed.innerHTML=C.html;ed.setAttribute('data-ph',C.ph);
try{document.execCommand('styleWithCSS',false,true);}catch(e){}
if(window.ResizeObserver)new ResizeObserver(function(){layout();}).observe(ed);
setEmpty();redraw();layout();post({t:'ready'});
})();`;

export function buildNoteHtml(o: { body: PageBody; width: number; isAr: boolean; labels: NoteLabels; ink: string; pen: number }): string {
  const W = Math.max(280, Math.round(o.width)); const H0 = NOTE_LINE * NOTE_LINES;
  const dir = o.isAr ? 'rtl' : 'ltr'; const L = o.labels; const e = escapeHtml;
  const cfg = { W, H0, LINE: NOTE_LINE, html: bodyHtml(o.body), strokes: o.body.strokes, ink: o.ink, pen: o.pen, ph: L.placeholder };
  const b = (attrs: string, label: string) => `<button type="button" class="b" ${attrs}>${label}</button>`;
  const sw = (a: string, c: string) => `<button type="button" class="b sw" data-a="${a}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`;
  const bar = `<div id="bar" dir="${dir}"><div class="row">`
    + b('data-c="bold"', '<b>B</b>') + b('data-c="italic"', '<i>I</i>') + b('data-c="underline"', '<u>U</u>') + b('data-c="strikeThrough"', '<s>S</s>')
    + b('data-p="color"', `<span style="border-bottom:3px solid #DC2626">A</span> ${e(L.color)}`)
    + b('data-p="hl"', `<span style="background:#FEF08A;padding:0 3px">ab</span> ${e(L.highlight)}`)
    + b('data-p="size"', `Aa ${e(L.size)}`) + b('data-p="list"', `☰ ${e(L.list)}`) + b('data-p="align"', `≡ ${e(L.align)}`)
    + b('data-c="removeFormat"', `⌫ ${e(L.clearFormat)}`) + b('data-c="undo"', '↶') + b('data-c="redo"', '↷')
    + `</div><div class="row panel" id="p-color">${TEXT_COLORS.map(c => sw('fore', c)).join('')}</div>`
    + `<div class="row panel" id="p-hl">${HIGHLIGHTS.map(c => sw('hl', c)).join('')}${b('data-a="hl" data-v="transparent"', `⌀ ${e(L.none)}`)}</div>`
    + `<div class="row panel" id="p-size">${b('data-a="block" data-v="h2"', `<b style="font-size:19px">${e(L.big)}</b>`)}${b('data-a="block" data-v="h3"', `<b>${e(L.heading)}</b>`)}${b('data-a="block" data-v="div"', e(L.normal))}</div>`
    + `<div class="row panel" id="p-list">${LIST_STYLES.map(s => b(`data-a="list" data-kind="${s.kind}" data-v="${e(s.style)}"`, e(s.label))).join('')}${b('data-a="list" data-kind="off" data-v=""', e(L.noList))}</div>`
    + `<div class="row panel" id="p-align">${b('data-c="justifyRight"', e(L.right))}${b('data-c="justifyCenter"', e(L.center))}${b('data-c="justifyLeft"', e(L.left))}${b('data-c="indent"', e(L.indent))}${b('data-c="outdent"', e(L.outdent))}</div></div>`;
  const css = `*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{touch-action:pan-x pan-y}html,body{margin:0;padding:0;background:${NOTE_PAPER}}
body{font-family:system-ui,-apple-system,Roboto,'Noto Sans Arabic',sans-serif;color:#1F2937;overscroll-behavior:none}
#bar{position:sticky;top:0;z-index:5;background:rgba(255,253,245,.97);border-bottom:1px solid #E8E1C8}
.row{display:flex;gap:6px;overflow-x:auto;padding:6px 8px;scrollbar-width:none}.row::-webkit-scrollbar{display:none}
.b{flex:0 0 auto;min-width:36px;height:34px;padding:0 10px;border:0;border-radius:10px;background:#F1ECDC;color:#1F2937;font-size:15px;font-family:inherit;white-space:nowrap}
.b.on{background:#4338CA;color:#fff}.b.on span{background:transparent!important}
.sw{width:32px;min-width:32px;padding:0;border-radius:16px;border:2px solid #fff;box-shadow:0 0 0 1px #D6D0BD}
.panel{display:none}.panel.open{display:flex}.draw #bar{display:none}
#stage{position:relative;width:${W}px}
#page{position:absolute;top:0;left:0;width:${W}px;height:${H0}px;transform-origin:0 0;background-color:${NOTE_PAPER};background-image:linear-gradient(to bottom,transparent 33px,#C7D7EE 33px,#C7D7EE 34px);background-size:100% 34px;background-position:0 ${NOTE_TOP}px}
#margin{position:absolute;top:0;bottom:0;width:1.5px;background:#F2A7A7;${o.isAr ? 'right' : 'left'}:34px}
#ed{position:relative;z-index:1;min-height:${H0}px;padding:26px ${o.isAr ? 44 : 14}px 40px ${o.isAr ? 14 : 44}px;font-size:18px;line-height:34px;outline:none;color:#1F2937;overflow-wrap:anywhere;caret-color:#4338CA}
#ed div,#ed p,#ed li,#ed h2,#ed h3{unicode-bidi:plaintext}#ed p{margin:0}
#ed h2{font-size:26px;line-height:68px;margin:0}#ed h3{font-size:21px;line-height:34px;margin:0}
#ed ul,#ed ol{margin:0;padding-inline-start:28px}
#ed.empty::before{content:attr(data-ph);color:#A8A08A;position:absolute;top:26px;${o.isAr ? 'right' : 'left'}:44px;pointer-events:none}
.draw #ed{-webkit-user-select:none;user-select:none}
#ink{position:absolute;top:0;left:0;z-index:2;pointer-events:none}`;
  return `<!doctype html><html dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>${css}</style></head><body>${bar}<div id="stage"><div id="page"><div id="margin"></div><div id="ed" contenteditable="true" dir="${dir}" spellcheck="false"></div><svg id="ink" xmlns="http://www.w3.org/2000/svg"></svg></div></div><script>window.CFG=${safeJson(cfg)};</script><script>${SCRIPT}</script></body></html>`;
}

/** A printable A4 document for expo-print (PDF export). */
export function printNoteHtml(o: { title: string; subtitle: string; html: string; strokes: Stroke[]; width: number; isAr: boolean }): string {
  const W = Math.max(280, Math.round(o.width)); const H = Math.max(120, Math.ceil(maxStrokeY(o.strokes) + NOTE_LINE));
  const dir = o.isAr ? 'rtl' : 'ltr'; const zoom = (680 / W).toFixed(3);
  const paths = o.strokes.map(s => `<path d="${escapeHtml(s.d)}" stroke="${escapeHtml(s.c)}" stroke-width="${s.w}" ${s.o ? `stroke-opacity="${s.o}" ` : ''}fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const css = `@page{size:A4;margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{margin:0;font-family:system-ui,Roboto,'Noto Sans Arabic',sans-serif;color:#1F2937}
h1{font-size:22px;margin:0 0 4px}.meta{color:#6B7280;font-size:12px;white-space:pre-line;margin:0 0 12px}.wrap{zoom:${zoom}}
.pg{position:relative;width:${W}px;min-height:${H}px;background-color:${NOTE_PAPER};background-image:linear-gradient(to bottom,transparent 33px,#C7D7EE 33px,#C7D7EE 34px);background-size:100% 34px;background-position:0 ${NOTE_TOP}px}
.ed{position:relative;padding:26px ${o.isAr ? 44 : 14}px 20px ${o.isAr ? 14 : 44}px;font-size:18px;line-height:34px;overflow-wrap:anywhere}
.ed div,.ed p,.ed li,.ed h2,.ed h3{unicode-bidi:plaintext}.ed p{margin:0}.ed h2{font-size:26px;line-height:68px;margin:0}.ed h3{font-size:21px;margin:0}
.ed ul,.ed ol{margin:0;padding-inline-start:28px}svg{position:absolute;top:0;left:0;overflow:visible}`;
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><style>${css}</style></head><body><h1 dir="auto">${escapeHtml(o.title)}</h1><div class="meta" dir="auto">${escapeHtml(o.subtitle)}</div><div class="wrap"><div class="pg"><div class="ed" dir="${dir}">${o.html}</div><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paths}</svg></div></div></body></html>`;
}