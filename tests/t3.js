const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:(s?String(s).length:0)*7})};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[]; (0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){try{sch[j].fn();}catch(e){err.push(e.message)}sch.splice(j,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}};
A.addPlant('threepeater',2,1);   // row2 col1
A.addZombie('basic',2);           // far-right zombie row2 (target, won't be hit immediately)
// run ~0.7s to first shot, then small window to capture the burst
step(60);                          // ~0.8s -> first shot + delayed peas
const inRow2=A.peas.filter(p=>p.r===2).length;
const otherRows=A.peas.filter(p=>p.r!==2).length;
console.log('errors:', err.length?err.slice(0,3):'none');
console.log('peas in threepeater row(2):', inRow2, '| peas in other rows:', otherRows);
console.log('PASS burst=3 single-lane:', inRow2===3 && otherRows===0);
