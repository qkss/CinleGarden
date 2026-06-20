const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:980,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));sf();
const fps=60,dt=1000/fps;let err=[];
let firstUsedAt=null, firstActiveAt=null, lostAt=null, maxUsed=0, sawActive=false;
for(let f=0;f<300*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 const G=global.__G; if(!G)continue;
 const used=G.mowers.filter(m=>m.used).length;
 if(G.mowers.some(m=>m.active)){ sawActive=true; if(firstActiveAt==null)firstActiveAt=t/1000; }
 if(used>0 && firstUsedAt==null) firstUsedAt=t/1000;
 maxUsed=Math.max(maxUsed,used);
 if(G.state==='lost' && lostAt==null) lostAt=t/1000;
 if(ov.includes('游戏结束')||ov.includes('胜利'))break;
}
console.log('errors:', err.length?err.slice(0,3):'none');
console.log('first mower ACTIVE at:', firstActiveAt, 's  (saw a mower sweep:', sawActive+')');
console.log('first mower USED at:', firstUsedAt, 's');
console.log('max mowers used:', maxUsed, '/ 5');
console.log('first LOST at:', lostAt, 's');
console.log('CHECK mower fired before any loss:', firstActiveAt!=null && (lostAt==null || firstActiveAt<=lostAt));
