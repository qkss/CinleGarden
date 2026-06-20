const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:(s?String(s).length:0)*7})};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*74+33;
const ORDER=["sunflower","peashooter","snowpea","repeater","threepeater","campfire","wallnut","potatoshield","jalapeno","cherrybomb","potatomine"];
const key={}; ORDER.forEach((k,i)=>key[k]=i);
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const dt=1000/60; let err=[];
for(let f=0;f<400*60;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push('to:'+e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 if(f%4===0)keydown(' ');
 const sec=t/1000;
 if(f%18===0){
   for(let r=0;r<5;r++){plant('sunflower',0,r);}
   if(sec>10)for(let r=0;r<5;r++)plant('threepeater',2,r);
   if(sec>30){plant('jalapeno',5,Math.floor(Math.random()*5)); for(let r=0;r<5;r++)plant('potatoshield',6,r);}
 }
 // upgrade potato shields after wave5
 if(sec>1 && f%40===0){ A.setSun(A.getSun()+3000); for(const p of A.plants){ if(p.type==='potatoshield'||p.type==='sunflower'){ const cc=cell(p.c,p.r); click(cc.x,cc.y); } } if(global.__API) {} }
 if(ov.includes('游戏结束')) break;
}
const psUps=A.plants.filter(p=>p.type==='potatoshield').map(p=>p.up);
console.log('errors:', err.length?err.slice(0,5):'none');
console.log('potatoshield levels on field:', Array.from(new Set(psUps)).sort((a,b)=>a-b));
