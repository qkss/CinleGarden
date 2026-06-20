const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};
function mk(){return{width:980,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));sf();
const fps=60,dt=1000/fps;let err=[];
// PLANT NOTHING. Let wave1 (2 zombies @10s) reach the line. Mowers should fire, NOT lose.
let firstMowerSeen=false, lostEarly=false, mowerUsedCount=0;
let phase1End=70; // through wave1 & wave2
for(let f=0;f<phase1End*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 const G=global.__G;
 if(G){ if(G.mowers.some(m=>m.active)) firstMowerSeen=true;
        mowerUsedCount=G.mowers.filter(m=>m.used).length;
        if(G.state==='lost') lostEarly=true; }
 if(ov.includes('游戏结束')){lostEarly=true;break;}
}
console.log('PHASE1 (mowers protect, no planting):');
console.log('  mower activated at least once:', firstMowerSeen);
console.log('  mowers used so far:', mowerUsedCount, '| lost during phase1:', lostEarly);
console.log('  errors:', err.length?err.slice(0,3):'none');
// continue with NO planting -> eventually a row gets a 2nd zombie after its mower used -> must LOSE
let finalState=global.__G&&global.__G.state;
for(let f=0;f<160*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 if(ov.includes('游戏结束')){finalState='lost';break;}
 if(ov.includes('胜利')){finalState='won';break;}
}
console.log('PHASE2 (still no planting): final =', finalState, '(expect lost once a 2nd zombie hits a used row)');
