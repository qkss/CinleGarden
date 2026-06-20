const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:(s?String(s).length:0)*7})};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){try{sch[j].fn();}catch(e){err.push(e.message)}sch.splice(j,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}};
step(1);
// trail
A.addPlant('snowpea',1,0); A.addZombie('basic',1);
let trail=0; for(let k=0;k<120;k++){ step(1); trail += A.particles.filter(p=>!p.shard && p.color==='#cfeefb').length; }
console.log('trail particles seen(累计):', trail>0?'yes':'no');
// armor shapes: cone->tri, bucket->square
A.addPlant('peashooter',3,0); const cone=(A.addZombie('cone',3),A.particles, A.addZombie('bucket',4));
const c=A.peas; // ignore
// find cone/bucket zombies
const Z=require('fs'); // noop
// shoot via peashooters
A.addPlant('peashooter',4,0);
let coneShape=null, bucketShape=null;
for(let k=0;k<700;k++){ step(1);
  const sh=A.particles.filter(p=>p.shard);
  if(sh.some(p=>p.shape==='tri'&&(p.color==='#e08a2e'||p.color==='#b96d1c'))) coneShape='tri';
  if(sh.some(p=>p.shape==='square')) bucketShape='square';
}
console.log('errors:', err.length?err.slice(0,3):'none');
console.log('cone shards = tri:', coneShape==='tri');
console.log('bucket/metal shards = square:', bucketShape==='square');
