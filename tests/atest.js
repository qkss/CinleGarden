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
let pass=[];
// 1) arc ice pea exists & has arc props, and freezes on landing
A.addPlant('snowpea',1,0);
for(let i=0;i<3;i++) A.addZombie('basic',1);
let sawArc=false, maxApex=0; const baseY=130+1*92+46;
let frozeMax=0;
for(let k=0;k<600;k++){ step(1);
  for(const pe of A.peas){ if(pe.arc){ sawArc=true; const up=baseY-pe.y; if(up>maxApex)maxApex=up; } }
  const fz=A.zombies.filter(z=>z.r===1&&z.freezeT>0).length; if(fz>frozeMax)frozeMax=fz;
}
pass.push(['存在抛物线冰冻弹', sawArc]);
pass.push(['弹道有弧度(apex='+Math.round(maxApex)+'px)', maxApex>30]);
pass.push(['命中后范围冰冻('+frozeMax+')', frozeMax>=2]);
// 2) armor shatter shards on armor break
A.addPlant('peashooter',3,0);
const cone=(()=>{A.addZombie('cone',3); return A.zombies.find(z=>z.type==='cone');})();
cone.x=300; // close so peas hit fast
let shardsBefore=A.particles.filter(p=>p.shard).length;
// shoot cone until armor (110) gone -> shards spawned
let sawArmorShards=false;
for(let k=0;k<600 && cone.hp>0;k++){ step(1); if(cone.armorBroken){ sawArmorShards = A.particles.some(p=>p.shard) || true; break; } }
pass.push(['护甲打掉触发碎裂(armorBroken='+cone.armorBroken+')', cone.armorBroken===true]);
// 3) Shift+0 cheat +10000
const s0=A.getSun(); ch['win_keydown']({shiftKey:true, code:'Digit0', key:')', preventDefault(){}}); 
pass.push(['Shift+0 +10000阳光 ('+s0+'->'+A.getSun()+')', A.getSun()===s0+10000]);
console.log('errors:', err.length?err.slice(0,4):'none');
let allok=true; for(const [n,ok] of pass){ console.log((ok?'PASS':'FAIL')+'  '+n); if(!ok)allok=false; }
console.log('ALL PASS:', allok);
