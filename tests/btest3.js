const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7})};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
function test(type, expect){
  A.addPlant('peashooter',0,0);
  A.addZombie(type,0); const z=A.peas, zz=A.zombies[A.zombies.length-1];
  zz.x=300; zz.hp=zz.bodyMax+5;   // armor almost gone
  let shape=null;
  for(let k=0;k<240 && !zz.armorBroken;k++){ step(1); }
  const sh=A.particles.filter(p=>p.shard);
  shape = sh.length?sh[sh.length-1].shape:null;
  console.log(type, 'armorBroken='+zz.armorBroken, 'shardShape='+shape, '=>', shape===expect?'PASS':'FAIL');
}
test('bucket','square');
test('ironclad','square');
test('football','square');
test('cone','tri');
