(function(){try{
var L=null;try{L=localStorage}catch(_){}
if(/[?&]notrack/.test(location.search)&&L)L.setItem('ts_no','1');
if((L&&L.getItem('ts_no'))||navigator.webdriver||/^(localhost|127\.|192\.168\.)/.test(location.hostname))return;
var U='/api/t',ref=document.referrer,first=1,cur='',t0=0,st=0;
function send(o){var b=JSON.stringify(o);try{if(navigator.sendBeacon&&navigator.sendBeacon(U,b))return}catch(_){}try{fetch(U,{method:'POST',body:b,keepalive:true})}catch(_){}}
function dur(){if(cur&&t0){var ms=Math.min(Date.now()-t0,1800000);if(ms>500)send({k:'d',p:cur,ms:ms})}t0=0}
function view(){dur();cur=location.pathname;t0=Date.now();var q=new URLSearchParams(location.search),o={k:'v',p:cur,w:innerWidth,l:navigator.language||'',s:q.get('utm_source')||''};try{o.z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(_){}if(window.__404)o.n=1;if(first){o.r=ref;first=0}send(o)}
function ev(n){send({k:'e',n:n,p:cur||location.pathname})}
var ps=history.pushState;history.pushState=function(){var r=ps.apply(this,arguments);view();return r};
addEventListener('popstate',view);
document.addEventListener('visibilitychange',function(){if(document.visibilityState=='hidden')dur();else if(cur)t0=Date.now()});
addEventListener('pagehide',dur);
document.addEventListener('click',function(e){var t=e.target,a=t&&t.closest&&t.closest('a'),f=t&&t.closest&&t.closest('#f');
if(f&&!st){st=1;ev('reserver_debut')}
if(!a)return;var h=a.getAttribute('href')||'',l=(a.getAttribute('aria-label')||'')+' '+h;
if(/^mailto:/i.test(h))ev('mail');else if(/^tel:/i.test(h))ev('tel');else if(/instagram/i.test(l))ev('instagram');else if(/facebook/i.test(l))ev('facebook');else if(/\.vcf$/i.test(h))ev('vcard');else if(location.pathname.indexOf('/carte')==0&&/^\//.test(h))ev('carte_lien')},true);
document.addEventListener('input',function(e){if(!st&&e.target.closest&&e.target.closest('#f')){st=1;ev('reserver_debut')}},true);
window.tsEv=ev;
view();
}catch(_){}})();
