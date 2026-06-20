const ctxProxy=new Proxy({},{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:980,height:620,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:620})};}
let ov='';let startFn=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){startFn=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
let rafCb=null;global.requestAnimationFrame=cb=>{rafCb=cb;};
let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
const fs=require('fs');(0,eval)(fs.readFileSync('game.js','utf8'));startFn();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const CARD={sunflower:200,peashooter:332,wallnut:464};
const cell=(c,r)=>({x:60+c*96+48,y:110+r*92+46});
const fps=60,dt=1000/fps;let err=[],won=false,lost=false;
function collect(){for(let x=80;x<920;x+=20)for(let y=115;y<560;y+=20)click(x,y);}
function plant(tp,c,r){click(CARD[tp],50);const p=cell(c,r);click(p.x,p.y);}
for(let f=0;f<170*fps;f++){
  t+=dt;
  for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
  if(rafCb){const cb=rafCb;rafCb=null;try{cb(t);}catch(e){err.push('f:'+e.message);}}
  collect(); // every frame
  const sec=t/1000;
  if(f%20===0){
    // economy first 18s: fill col0,col1 sunflowers
    for(let r=0;r<5;r++){plant('sunflower',0,r);}
    if(sec>10)for(let r=0;r<5;r++)plant('sunflower',1,r);
    // defense
    if(sec>6)for(let r=0;r<5;r++){plant('peashooter',3,r);}
    if(sec>20)for(let r=0;r<5;r++){plant('peashooter',4,r);}
    if(sec>30)for(let r=0;r<5;r++){plant('peashooter',2,r);plant('wallnut',6,r);}
    if(sec>45)for(let r=0;r<5;r++){plant('peashooter',5,r);}
  }
  if(ov.includes('胜利')){won=true;break;}
  if(ov.includes('游戏结束')){lost=true;break;}
}
console.log('errors:',err.length?err.slice(0,3):'none','won:',won,'lost:',lost,'t:',(t/1000).toFixed(1));
