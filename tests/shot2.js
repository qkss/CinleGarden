const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(980,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:980,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('game.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;
// pre-load lots of sun via space, then place a shooter + campfire per row
for(let f=0;f<30*fps;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
ch['win_keydown']({key:' ',code:'Space',preventDefault(){}});
for(let r=0;r<5;r++){plant('sunflower',0,r);}
ch['win_keydown']({key:' ',code:'Space',preventDefault(){}});
for(let pass=0;pass<6;pass++){
  for(let f=0;f<6*fps;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}for(let x=80;x<920;x+=20)for(let y=135;y<590;y+=20)click(x,y);}
  for(let r=0;r<5;r++){plant('peashooter',1,r);plant('campfire',4,r);}
}
// now run until peas are mid-flight past campfire (between col4 and zombies)
for(let f=0;f<200;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview4.png', real.toBuffer('image/png'));
console.log('done');
