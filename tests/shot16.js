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
A.addPlant('snowpea',1,0);
// cluster of zombies in row1 close together, then freeze them directly for the shot
for(let i=0;i<4;i++){ A.addZombie('basic',1); }
A.addZombie('gargantuar',3);
const dt=1000/60; const step=(n)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
step(60);
// position row1 zombies near col5 and freeze them for the visual
let row1=A.zombies.filter(z=>z.r===1); row1.forEach((z,i)=>{ z.x=560+i*36; z.freezeT=3; });
step(2);
fs.writeFileSync('preview16.png', real.toBuffer('image/png'));
console.log('frozen in row1:', A.zombies.filter(z=>z.r===1&&z.freezeT>0).length);
