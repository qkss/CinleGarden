const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1050,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1050,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('gamecheat4.js','utf8'));
const A=global.__API; A.start(); A.setWave(8);
// addPlant(type, r, c)
function P(tp,r,c,up){ A.addPlant(tp,r,c); const p=A.plants[A.plants.length-1]; if(up){p.up=up; if(tp==='potatoshield')p.selfHpMult=1+0.5*up;} }
P('threepeater',0,1); P('threepeater',2,1);
P('jalapeno',1,4); P('jalapeno',3,5);
P('potatoshield',0,6,3); P('potatoshield',1,6,7); P('potatoshield',2,6,10); P('wallnut',3,6);
P('sunflower',4,0);
const dt=1000/60; for(let f=0;f<40;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview14.png', real.toBuffer('image/png'));
console.log('done');
