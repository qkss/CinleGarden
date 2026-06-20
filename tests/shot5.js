const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(980,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:980,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('game.js','utf8'));sf();
const fps=60,dt=1000/fps;
// run to ~149s with NO plants so wave7 (142s, leads with ironclad) is visible mid-lawn
for(let f=0;f<149*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;c(t);}
}
if(raf)raf(t);
fs.writeFileSync('preview5.png', real.toBuffer('image/png'));
console.log('done');
