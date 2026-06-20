const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1050,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1050,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
// a descending spider (mid-air) and one carrying a plant (lifting)
A.addZombie('spider',1); const s1=A.zombies[A.zombies.length-1]; s1.col=7; s1.x=60+7*96+48; s1.phase='drop'; s1.y=200; s1.targetY=130+1*92+46;
A.addZombie('spider',3); const s2=A.zombies[A.zombies.length-1]; s2.col=6; s2.x=60+6*96+48; s2.phase='lift'; s2.y=240; A.addPlant('peashooter',3,6); s2.carry=A.plants[A.plants.length-1]; 
const dt=1000/60; for(let f=0;f<30;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview23.png', real.toBuffer('image/png'));
console.log('done');
