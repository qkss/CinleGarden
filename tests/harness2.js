const ctxProxy=new Proxy({},{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const canvasHandlers={};
function makeCanvas(){return{width:980,height:620,getContext:()=>ctxProxy,addEventListener:(e,f)=>{canvasHandlers[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:620})};}
let overlayInner='';let startFn=null;
const elements={game:makeCanvas(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){overlayInner=v;},get innerHTML(){return overlayInner;}},startBtn:{set onclick(f){startFn=f;}},againBtn:{set onclick(f){}}};
global.document={getElementById:id=>elements[id]||{set onclick(f){}}};
let rafCb=null;global.requestAnimationFrame=cb=>{rafCb=cb;};
let t=0;global.performance={now:()=>t};
let scheduled=[];global.setTimeout=(fn,ms)=>{scheduled.push({fn,at:t+ms});return 0;};
const fs=require('fs');(0,eval)(fs.readFileSync('game.js','utf8'));
startFn();
const click=(x,y)=>canvasHandlers['click']({clientX:x,clientY:y});
const CARD={sunflower:200,peashooter:332,wallnut:464};
const cell=(c,r)=>({x:60+c*96+48,y:110+r*92+46});
const fps=60,dtMs=1000/fps;
let errors=[];
function sweepCollect(){ // click many lawn points to grab any sun
  for(let r=0;r<5;r++)for(let c=0;c<9;c++){const p=cell(c,r);click(p.x,p.y);}
  // also click upper sky band
  for(let x=100;x<900;x+=40)for(let y=100;y<560;y+=40){click(x,y);}
}
function plant(type,c,r){click(CARD[type],50);const p=cell(c,r);click(p.x,p.y);}
let won=false,lost=false;
for(let f=0;f<160*fps;f++){
  t+=dtMs;
  for(let i=scheduled.length-1;i>=0;i--){if(scheduled[i].at<=t){try{scheduled[i].fn();}catch(e){errors.push(e.message);}scheduled.splice(i,1);}}
  if(rafCb){const cb=rafCb;rafCb=null;try{cb(t);}catch(e){errors.push('frame:'+e.message);}}
  if(f%15===0){ // 4x/sec collect suns
    for(let x=80;x<920;x+=24)for(let y=120;y<560;y+=24)click(x,y);
  }
  if(f%30===0){ // try to plant a defensive layout each 0.5s
    // sunflowers in col0-1, peashooters col2-3, wallnut col5
    for(let r=0;r<5;r++){plant('sunflower',0,r);plant('sunflower',1,r);plant('peashooter',2,r);plant('peashooter',3,r);plant('wallnut',5,r);}
  }
  if(overlayInner.includes('胜利')){won=true;break;}
  if(overlayInner.includes('游戏结束')){lost=true;break;}
}
console.log('errors:',errors.length?errors.slice(0,3):'none');
console.log('won:',won,'lost:',lost,'at t(s):',(t/1000).toFixed(1));
