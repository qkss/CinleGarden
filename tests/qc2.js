const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
// ultimate sunflowers of both branches + freeze a zombie, measure freeze duration
function mkSun(r,c,b,up){A.addPlant('sunflower',r,c);const p=A.plants[A.plants.length-1];p.branch=b;p.up=up;}
mkSun(0,0,'atk',7); mkSun(1,0,'hp',7); mk(2,0,'atk',6); mk(3,0,'hp',6);
const dt=1000/60; for(let f=0;f<300;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn()}catch(e){err.push(e.message)}sch.splice(i,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}
console.log('errors:', err.length?err.slice(0,4):'none');
