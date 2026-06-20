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
function mk(r,c,b,up){ A.addPlant('sunflower',r,c); const p=A.plants[A.plants.length-1]; p.branch=b; p.up=up; }
mk(0,0,'atk',6); mk(0,2,'atk',7);   // 攻速流 钢化 / 终极
mk(2,0,'hp',6);  mk(2,2,'hp',7);    // 血量流 钢化 / 终极
mk(4,0,'atk',5); mk(4,2,'hp',5);    // 对比: 未合流的Lv5
const dt=1000/60; for(let f=0;f<40;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview20.png', real.toBuffer('image/png'));
console.log('done');
