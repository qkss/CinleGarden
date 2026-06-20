const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; let err=[];
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
for(let f=0;f<400*60;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 if(f%4===0)keydown(' ');
 const sec=t/1000;
 if(f%18===0){
   for(let r=0;r<5;r++){plant('sunflower',0,r);plant('sunflower',1,r);}
   if(sec>10)for(let r=0;r<5;r++)plant('repeater',2,r);
   if(sec>30)for(let r=0;r<5;r++){plant('campfire',3,r);plant('repeater',4,r);}
 }
 // after wave15 upgrade sunflowers by clicking them (sun permitting)
 if(A.state()==='playing'){ A.setSun(A.getSun()); }
 if(sec>1 && f%30===0){ A.setSun(A.getSun()+5000); // give sun to allow upgrades
   for(const p of A.plants){ if(p.type==='sunflower'){ const cc=cell(p.c,p.r); click(cc.x,cc.y); } }
 }
 if(ov.includes('游戏结束')) break;
}
const ups=A.plants.filter(p=>p.type==='sunflower').map(p=>p.up);
console.log('errors:', err.length?err.slice(0,4):'none');
console.log('sunflower levels present (sample):', Array.from(new Set(ups)).sort());
