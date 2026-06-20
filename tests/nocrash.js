const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1120,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={};global.localStorage={getItem:k=>_ls[k]||null,setItem:(k,v)=>{_ls[k]=v;}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>128+i*67+30;
const ORDER=["sunflower","peashooter","snowpea","repeater","threepeater","cactus","bigcactus","campfire","wallnut","potatoshield","jalapeno","cherrybomb","potatomine"];
function plant(tp,c,r){click(CARDX(ORDER.indexOf(tp)),50);const p=cell(c,r);click(p.x,p.y);}
const dt=1000/60;
for(let f=0;f<360*60;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn()}catch(e){err.push('to:'+e.message)}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}
 if(f%4===0)keydown(' ');
 if(f%30===0){ keydown('+'); // cheat? no; just collect
   for(let r=0;r<5;r++){plant('sunflower',0,r);plant('cactus',1,r);plant('repeater',2,r);plant('potatoshield',6,r);}
   for(const p of A.plants){ if(p.type==='potatoshield'||p.type==='snowpea'){ const cc=cell(p.c,p.r); click(cc.x,cc.y); } }
 }
 if(ov.includes('游戏结束'))break;
}
console.log('errors:', err.length?err.slice(0,5):'none','| mashes spawned ever sample:', A.mashes.length);
