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
function P(tp,c,r,up){ A.addPlant(tp,c,r); const p=A.plants[A.plants.length-1]; if(up){p.up=up; if(tp==='potatoshield')p.selfHpMult=1+0.5*up;} }
P('threepeater',1,0); P('threepeater',1,2); P('jalapeno',3,1); P('jalapeno',4,3);
P('potatoshield',6,0,3); P('potatoshield',6,1,7); P('potatoshield',6,2,10); P('wallnut',6,3);
P('sunflower',0,4);
const dt=1000/60; for(let f=0;f<40;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview13.png', real.toBuffer('image/png'));
console.log('done');
