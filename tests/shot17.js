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
// row0: snowpea + far zombie -> arc in flight
A.addPlant('snowpea',0,0); A.addZombie('basic',0);
// row2: cone + peashooter to capture armor shatter; pre-set cone armor near break
A.addPlant('peashooter',2,0); const cone=(A.addZombie('cone',2),A.zombies.find(z=>z.type==='cone')); cone.x=320; cone.hp=cone.bodyMax+2;
// row4: a zombie that we freeze then expire to show ice shards
A.addZombie('basic',4); const fzb=A.zombies.find(z=>z.r===4); fzb.x=400; fzb.freezeT=0.05;
step(6);   // ~0.1s: arc mid-air, cone armor breaks (peashooter hits), freeze expires -> shards
// ensure an arc pea exists mid-air: step a bit so snowpea fired
step(40);
fs.writeFileSync('preview17.png', real.toBuffer('image/png'));
console.log('arc peas:', A.peas.filter(p=>p.arc).length, '| shards:', A.particles.filter(p=>p.shard).length);
