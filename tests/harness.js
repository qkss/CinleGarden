// Stub a canvas 2D context: every method is a no-op, props settable.
const ctxProxy = new Proxy({}, {
  get: (t,p) => {
    if (p in t) return t[p];
    return (...a)=>{};          // any method -> noop
  },
  set: (t,p,v)=>{ t[p]=v; return true; }
});
function makeCanvas(){
  return {
    width:980, height:620,
    getContext:()=>ctxProxy,
    addEventListener:(ev,fn)=>{ canvasHandlers[ev]=fn; },
    getBoundingClientRect:()=>({left:0,top:0,width:980,height:620}),
  };
}
const canvasHandlers={};
let overlayInner='';
const elements={
  game: makeCanvas(),
  overlay:{ classList:{add(){},remove(){}}, set innerHTML(v){overlayInner=v;}, get innerHTML(){return overlayInner;} },
  startBtn:{ set onclick(fn){startFn=fn;}, get onclick(){return startFn;} },
  againBtn:{ set onclick(fn){}, },
};
let startFn=null;
global.document={
  getElementById:id=>elements[id]|| { set onclick(fn){}, },
};
let rafCb=null, rafCount=0;
global.requestAnimationFrame=cb=>{ rafCb=cb; };
let t=0;
global.performance={ now:()=>t };
global.setTimeout=(fn,ms)=>{ scheduled.push({fn,at:t+ms}); return 0; };
let scheduled=[];

const fs=require('fs');
const code=fs.readFileSync('game.js','utf8');
let errors=[];
try { (0,eval)(code); } catch(e){ errors.push('load: '+e.message); }

// start the game
try { startFn(); } catch(e){ errors.push('start: '+e.message); }

// simulate: place plants by invoking click handler, collect sun, advance time
const clickH=canvasHandlers['click'];
function click(x,y){ clickH({clientX:x,clientY:y}); }

// helper card positions: cards at x=140,272,404 width120 y14..86
const CARD={sunflower:200,peashooter:332,wallnut:464};
function cellCenter(c,r){ return {x:60+c*96+48, y:110+r*92+46}; }

let frameErr=null;
let lastSunCollect=0, lastPlant=0;
const totalSeconds=140;
const fps=60, dtMs=1000/fps;
let placedCols=0;
for(let f=0; f<totalSeconds*fps; f++){
  t+=dtMs;
  // run scheduled timeouts
  for(let i=scheduled.length-1;i>=0;i--){ if(scheduled[i].at<=t){ try{scheduled[i].fn();}catch(e){errors.push('to:'+e.message);} scheduled.splice(i,1);} }
  if(rafCb){ const cb=rafCb; rafCb=null; try{ cb(t);}catch(e){ if(!frameErr){frameErr=e.message; errors.push('frame:'+e.message);} } }
  // every 0.5s collect all suns by clicking them: we can't see suns, so click a grid sweep? Instead click card+place.
}
// We can't introspect internal arrays (IIFE). So this test mainly checks no runtime crash over full game + final overlay shown.
console.log('ERRORS:', errors.length? errors : 'none');
console.log('overlay after run (first 60 chars):', overlayInner.replace(/\s+/g,' ').slice(0,80));
console.log('rafCb still pending:', !!rafCb);
