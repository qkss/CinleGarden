const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(980,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:980,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('game.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const move=(x,y)=>ch['mousemove']({clientX:x,clientY:y});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;
for(let f=0;f<80*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;c(t);}
 for(let x=80;x<920;x+=20)for(let y=135;y<590;y+=20)click(x,y);
 if(f%18===0){
   plant('sunflower',0,0);plant('sunflower',0,4);
   plant('peashooter',1,0);plant('peashooter',1,1);plant('peashooter',1,2);plant('repeater',1,3);plant('peashooter',1,4);
   plant('campfire',3,0);plant('campfire',3,1);plant('campfire',3,2);plant('campfire',3,3);plant('campfire',3,4);
   plant('potatoshield',6,1);plant('wallnut',6,2);plant('potatomine',6,3);
 }
}
move(450,300); if(raf)raf(t);
fs.writeFileSync('preview3.png', real.toBuffer('image/png'));
console.log('done');
