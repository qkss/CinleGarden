const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1050,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1050,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('gamecheat2.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const move=(x,y)=>ch['mousemove']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;
keydown('f'); // 2x to show button highlighted
for(let f=0;f<95*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;c(t);}
 if(f%4===0)keydown(' ');
 if(f%18===0){
   for(let r=0;r<5;r++){plant('repeater',1,r);plant('campfire',2,r);plant('repeater',3,r);plant('potatoshield',6,r);}
 }
}
move(450,300); if(raf)raf(t);
fs.writeFileSync('preview9.png', real.toBuffer('image/png'));
console.log('done wave/score check:');
