const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function C(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){try{sch[j].fn()}catch(e){err.push(e.message)}sch.splice(j,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}};
let pass=[];
// TEST A: spider lands in right-4 cols, steals the plant there
A.addZombie('spider',1); const sp=A.zombies.find(z=>z.type==='spider');
pass.push(['落点在右侧4列(col='+sp.col+')', sp.col>=A.COLS-4 && sp.col<=A.COLS-1]);
A.addPlant('peashooter',1,sp.col);     // a plant on its target cell
const plantsBefore=A.plants.length;
for(let k=0;k<400 && A.zombies.includes(sp);k++) step(1);
const stolen = A.plants.length===plantsBefore-1;
pass.push(['抓走该格植物', stolen]);
pass.push(['蜘蛛带走后离场', !A.zombies.includes(sp)]);
// TEST B: kill spider during drop -> plant saved
A.addZombie('spider',3); const sp2=A.zombies.find(z=>z.type==='spider'&&z!==sp);
A.addPlant('wallnut',3,sp2.col);
const before2=A.plants.length;
step(6);                 // a few frames into drop
sp2.hp=0;                // shoot it down during drop
step(2);
pass.push(['下落时击落→植物保留', A.plants.length===before2 && !A.zombies.includes(sp2)]);
console.log('errors:', err.length?err.slice(0,4):'none');
let ok=true; for(const[n,p] of pass){console.log((p?'PASS':'FAIL')+'  '+n); if(!p)ok=false;}
console.log('ALL PASS:', ok);
