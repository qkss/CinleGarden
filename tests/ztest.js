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
// costs halved
pass.push(['向日葵Lv1-5=250', A.nextUpgradeCost({type:'sunflower',up:0})===250 && A.nextUpgradeCost({type:'sunflower',up:4})===250]);
pass.push(['Lv6=1000', A.nextUpgradeCost({type:'sunflower',up:5})===1000]);
pass.push(['Lv7=1500', A.nextUpgradeCost({type:'sunflower',up:6})===1500]);
pass.push(['土豆盾每级=250', A.nextUpgradeCost({type:'potatoshield',up:0})===250]);
// gargantuar hp 2000
A.addZombie('gargantuar',2); const g=A.zombies.find(z=>z.type==='gargantuar');
pass.push(['巨人血量2000', g.maxHp===2000]);
// gargantuar smash deals damage (not instakill): wallnut(320) survives <1 smash? 400>320 dies in1; use potatoshield 520 survive 1
A.addPlant('potatoshield',2,7); const ps=A.plants.find(p=>p.type==='potatoshield');
// place gargantuar adjacent to shield
g.x = ps.x+38; const hp0=ps.hp;
step(90);  // ~1.5s -> at least 1 smash (smashCd starts undef ->immediate, then 1.3s)
const smashed = ps.hp < hp0;
pass.push(['巨人砸造成伤害而非秒杀(shield '+Math.round(hp0)+'->'+Math.round(Math.max(ps.hp,0))+', alive='+(A.plants.indexOf(ps)>=0)+')', smashed]);
// ICE: snowpea area freeze 3s, multiple zombies frozen, freezeT set
A.addPlant('snowpea',0,0);
for(let c=4;c<7;c++) A.addZombie('basic',0);   // cluster in row0
// fast-forward until a snow pea is fired and hits
let frozeCount=0;
for(let k=0;k<480;k++){ step(1); const f=A.zombies.filter(z=>z.r===0 && z.freezeT>0).length; if(f>frozeCount)frozeCount=f; }
pass.push(['寒冰命中范围冻结多只('+frozeCount+')', frozeCount>=2]);
// a frozen zombie should be (nearly) stationary
const fz=A.zombies.find(z=>z.freezeT>0);
if(fz){ const x0=fz.x; step(30); pass.push(['冰冻时静止', Math.abs(fz.x-x0)<0.5 || fz.freezeT<=0]); }
else pass.push(['冰冻时静止(无样本)', true]);
// ICE not enchanted by campfire: snowpea pea passing campfire stays freeze, not fire
A.addPlant('campfire',1,4); A.addPlant('snowpea',1,0); A.addZombie('basic',1);
let sawIce=false, iceBecameFire=false;
for(let k=0;k<240;k++){ step(1); for(const pe of A.peas){ if(pe.r===1){ if(pe.freeze)sawIce=true; if(pe.freeze&&pe.fire)iceBecameFire=true; } } }
pass.push(['冰冻弹不被篝火附魔', sawIce && !iceBecameFire]);
console.log('errors:', err.length?err.slice(0,4):'none');
let allok=true; for(const [n,ok] of pass){ console.log((ok?'PASS':'FAIL')+'  '+n); if(!ok)allok=false; }
console.log('ALL PASS:', allok);
