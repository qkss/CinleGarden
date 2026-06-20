const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={}; let againOnclick=null;
function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>{
  if(id==='game')return mk();
  if(id==='overlay')return {classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}};
  if(id==='startBtn')return {set onclick(f){sf=f;}};
  if(id==='againBtn')return {set onclick(f){againOnclick=f;}};
  return {set onclick(f){}};
}};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};
let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
global.__SCH=()=>sch.length;
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;
function strongPlay(sec){ if(sec>0&&Math.floor(sec)%1===0){} }
// Phase 1: play with defense until loss (reach high wave -> many pending spawns)
let lost=false;
for(let f=0;f<900*fps && !lost;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;c(t);}
 if(f%4===0)keydown(' ');
 const sec=t/1000;
 if(f%18===0){
   for(let r=0;r<5;r++){plant('sunflower',0,r);plant('sunflower',1,r);}
   if(sec>10)for(let r=0;r<5;r++)plant('peashooter',2,r);
   if(sec>28)for(let r=0;r<5;r++){plant('campfire',3,r);plant('repeater',2,r);}
   if(sec>55)for(let r=0;r<5;r++){plant('repeater',4,r);plant('potatoshield',6,r);}
   if(sec>90)for(let r=0;r<5;r++){plant('repeater',5,r);plant('potatomine',7,r);}
 }
 if(ov.includes('游戏结束')) lost=true;
}
const lostWave=global.__G.waveNum, pendingAtLoss=sch.length;
console.log('Phase1: lost at wave', lostWave, '| pending spawn timers at loss:', pendingAtLoss);
// Phase 2: RESTART via again button, then watch first 13s of new game for leaked heavies
againOnclick();   // = startGame
const newRun = global.__G ? global.__G.runId : '?';
let earlyTypes={};
const startT=t;
for(let f=0; f<14*fps; f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;c(t);}
 const G=global.__G; if(G) Object.keys(G.types).forEach(k=>earlyTypes[k]=true);
}
console.log('Phase2 (first ~14s after restart): wave=',global.__G.waveNum,'| zombie types on field:', Object.keys(earlyTypes).join(',')||'(none yet)');
const heavies=['gargantuar','ironclad','football','bucket'];
const leaked=Object.keys(earlyTypes).filter(x=>heavies.includes(x));
console.log('LEAKED heavy zombies in early restart:', leaked.length?leaked:'NONE (good)');
// Phase 3: persistence across a fresh page load (new eval, SAME _ls)
delete require.cache;
let ov2='';let sf2=null; let raf2=null; const sch2=[];
global.document={getElementById:id=>{ if(id==='game')return mk(); if(id==='overlay')return{classList:{add(){},remove(){}},set innerHTML(v){ov2=v;},get innerHTML(){return ov2;}}; if(id==='startBtn')return{set onclick(f){sf2=f;}}; return{set onclick(f){}};}};
global.requestAnimationFrame=c=>{raf2=c;}; global.setTimeout=(fn,ms)=>{sch2.push({fn,at:t+ms});};
global.__G=null;
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));  // fresh instance, same localStorage _ls
sf2();
if(raf2)raf2(t+16);
const persisted=JSON.parse(_ls['pvz_endless_highscores_v1']||'[]');
console.log('Phase3 persistence: highscores still in localStorage after fresh load:', persisted.length, '| top score:', (persisted[0]||{}).score);
