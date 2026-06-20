const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1120,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1120,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
// snowpea Lv3, a destroyed Lv6 potato shield (-> mash), a gargantuar nearby
A.addPlant('snowpea',0,1); A.plants[A.plants.length-1].up=3;
A.addPlant('potatoshield',2,3); const ps=A.plants[A.plants.length-1]; ps.up=6; ps.selfHpMult=4; ps.hp=1; ps.dead=true;
A.addZombie('basic',2); A.zombies[A.zombies.length-1].x=560;
const dt=1000/60; for(let f=0;f<24;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview27.png', real.toBuffer('image/png'));
console.log('mashes:', A.mashes.length);
