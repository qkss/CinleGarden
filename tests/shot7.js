const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1050,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1050,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('game.js','utf8'));sf();
// Directly render a big repeater + peashooter + snowpea side by side on a plain panel for comparison
const ctx=rctx;
ctx.fillStyle="#7cc3e8"; ctx.fillRect(0,0,1050,640);
// access drawing via re-eval? They're in closure. Instead screenshot in-game by planting with cheats:
// give time, collect, plant a single repeater and peashooter and snowpea in row, freeze early
const click=(x,y)=>ch['click']({clientX:x,clientY:y});const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;
// accumulate plenty of sun first (no zombies reach yet), pressing space
for(let f=0;f<9*fps;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}keydown(' ');}
for(let r=0;r<5;r++) plant('sunflower',0,r);
for(let f=0;f<40*fps;f++){t+=dt;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}keydown(' ');}
plant('peashooter',2,1); plant('snowpea',2,2); plant('repeater',2,3); plant('repeater',4,3);
for(let f=0;f<30;f++){t+=dt;if(raf){const c=raf;raf=null;c(t);}}
if(raf)raf(t);
fs.writeFileSync('preview7.png', real.toBuffer('image/png'));
console.log('done');
