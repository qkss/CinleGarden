const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1050,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*74+33;
const ORDER=["sunflower","peashooter","snowpea","repeater","threepeater","campfire","wallnut","potatoshield","jalapeno","cherrybomb","potatomine"];
function plant(tp,c,r){click(CARDX(ORDER.indexOf(tp)),50);const p=cell(c,r);click(p.x,p.y);}
const dt=1000/60;
// reasonable NO-snowpea strategy: front sunflowers, mid repeaters/threepeater+campfire, wallnut/potatoshield up front-right, jalapeno/cherry emergencies
for(let f=0;f<360*60;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn()}catch(e){err.push('to:'+e.message)}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}
 if(f%4===0)keydown(' ');
 const sec=t/1000;
 if(f%15===0){
   for(let r=0;r<5;r++){plant('sunflower',0,r);plant('sunflower',1,r);}
   if(sec>14)for(let r=0;r<5;r++)plant('peashooter',2,r);
   if(sec>34)for(let r=0;r<5;r++){plant('campfire',3,r);plant('repeater',2,r);}
   if(sec>60)for(let r=0;r<5;r++){plant('repeater',4,r);plant('wallnut',7,r);}
   if(sec>95)for(let r=0;r<5;r++){plant('threepeater',5,r);plant('potatoshield',7,r);}
   if(sec>140)for(let r=0;r<5;r++)plant('repeater',6,r);
   // emergency jalapeno on a random row periodically
   if(sec>120 && f%600===0)plant('jalapeno',6,Math.floor(Math.random()*5));
 }
 if(ov.includes('游戏结束'))break;
}
console.log('errors:', err.length?err.slice(0,4):'none');
console.log('NO-snowpea bot reached wave:', A.wave(), '| time:', (t/1000).toFixed(0)+'s', '| ended:', ov.includes('游戏结束'));
