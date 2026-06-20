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
const dt=1000/60; const step=(n)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
// row0 arc + trail
A.addPlant('snowpea',0,0); A.addZombie('basic',0);
// row2 bucket about to break -> square shards
A.addPlant('peashooter',2,0); const b=(A.addZombie('bucket',2),A.zombies.find(z=>z.type==='bucket')); b.x=330; b.hp=b.bodyMax+3;
// row4 cone about to break -> tri shards
A.addPlant('peashooter',4,0); const cn=(A.addZombie('cone',4),A.zombies.find(z=>z.type==='cone')); cn.x=330; cn.hp=cn.bodyMax+3;
step(95);
fs.writeFileSync('preview18.png', real.toBuffer('image/png'));
console.log('shards tri:', A.particles.filter(p=>p.shard&&p.shape==='tri').length, 'square:', A.particles.filter(p=>p.shard&&p.shape==='square').length);
