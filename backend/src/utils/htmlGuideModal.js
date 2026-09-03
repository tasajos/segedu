import { CHAKUY_LOGO_DATA_URI } from '../assets/chakuyLogo.js';

const buildInjection = () => `
<style id="__chakuy_alert_style">
.__chakuy_alert_overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;
 background:rgba(8,20,40,.62);backdrop-filter:blur(2px);padding:20px;box-sizing:border-box;
 font-family:Arial,Helvetica,sans-serif;animation:__chakuy_fade .15s ease}
@keyframes __chakuy_fade{from{opacity:0}to{opacity:1}}
.__chakuy_alert_card{position:relative;width:100%;max-width:380px;background:#fff;border-radius:16px;
 box-shadow:0 24px 60px rgba(8,20,40,.35);padding:28px 26px 24px;text-align:center;
 border-top:5px solid #1d4ed8;animation:__chakuy_pop .18s cubic-bezier(.34,1.56,.64,1)}
@keyframes __chakuy_pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.__chakuy_alert_logo{width:52px;height:52px;object-fit:contain;margin-bottom:12px}
.__chakuy_alert_msg{color:#0f2044;font-size:15px;line-height:1.55;white-space:pre-wrap;word-break:break-word;margin-bottom:20px}
.__chakuy_alert_actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.__chakuy_alert_btn{display:inline-flex;align-items:center;justify-content:center;min-width:110px;
 padding:.65rem 1.3rem;color:#fff;font:700 14px Arial,Helvetica,sans-serif;background:#1d4ed8;border:0;
 border-radius:9px;cursor:pointer;transition:background .15s}
.__chakuy_alert_btn:hover,.__chakuy_alert_btn:focus{background:#1a3fb0;outline:none}
.__chakuy_alert_btn--secondary{background:#e2e8f0;color:#0f2044}
.__chakuy_alert_btn--secondary:hover,.__chakuy_alert_btn--secondary:focus{background:#cbd5e1}
</style>
<script id="__chakuy_alert_script">
(function(){
 var LOGO="${CHAKUY_LOGO_DATA_URI}";
 var queue=[],busy=false;
 function process(){
  if(busy||!queue.length)return;
  busy=true;
  var job=queue.shift();
  var overlay=document.createElement('div');
  overlay.className='__chakuy_alert_overlay';
  var card=document.createElement('div');
  card.className='__chakuy_alert_card';
  var img=document.createElement('img');
  img.className='__chakuy_alert_logo';img.src=LOGO;img.alt='Chakuy';
  var msgEl=document.createElement('div');
  msgEl.className='__chakuy_alert_msg';msgEl.textContent=job.msg;
  var actions=document.createElement('div');
  actions.className='__chakuy_alert_actions';
  card.appendChild(img);card.appendChild(msgEl);card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  var prevActive=document.activeElement;
  function done(value){
   if(overlay.parentNode)overlay.parentNode.removeChild(overlay);
   busy=false;
   if(prevActive&&prevActive.focus)try{prevActive.focus();}catch(e){}
   job.resolve(value);
   process();
  }
  var btns=[];
  job.buttons.forEach(function(b){
   var btn=document.createElement('button');
   btn.type='button';
   btn.className='__chakuy_alert_btn'+(b.secondary?' __chakuy_alert_btn--secondary':'');
   btn.textContent=b.label;
   btn.addEventListener('click',function(){done(b.value);});
   actions.appendChild(btn);
   btns.push(btn);
  });
  btns[0].focus();
  overlay.addEventListener('keydown',function(e){
   if(e.key==='Tab'){
    e.preventDefault();
    var idx=btns.indexOf(document.activeElement);
    btns[(idx+1+btns.length)%btns.length].focus();
   }else if(e.key==='Escape'){
    e.preventDefault();
   }
  });
 }
 function enqueue(msg,buttons){
  return new Promise(function(resolve){
   queue.push({msg:msg===undefined?'':String(msg),buttons:buttons,resolve:resolve});
   if(document.body)process();
   else document.addEventListener('DOMContentLoaded',process,{once:true});
  });
 }
 window.alert=function(msg){
  enqueue(msg,[{label:'Aceptar',value:undefined}]);
 };
 window.confirm=function(msg){
  return enqueue(msg,[
   {label:'Aceptar',value:true},
   {label:'Cancelar',value:false,secondary:true}
  ]);
 };
})();
</script>
`;

export function injectChakuyAlertModal(html) {
  const injection = buildInjection();
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${injection}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (match) => `${match}${injection}`);
  }
  return injection + html;
}
