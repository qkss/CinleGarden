const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1120,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
let pass=[];
// A) ground cactus spike pierces whole row (3 zombies all take damage from one volley)
A.addPlant('cactus',0,0);
const zs=[]; for(let i=0;i<3;i++){ A.addZombie('basic',0); const z=A.zombies[A.zombies.length-1]; z.x=300+i*40; z.hp=500; zs.push(z); }
// step until one spike has traveled across all 3
let allHit=false;
for(let k=0;k<120;k++){ step(1); if(zs.every(z=>z.hp<500)){allHit=true;break;} }
pass.push(['尖刺贯穿整行(同一波伤到所有僵尸)', allHit]);
// B) ground cactus can't hit flying balloon
A.zombies.length=0; A.plants.length=0;
A.addPlant('cactus',1,0); const bal=(A.addZombie('balloon',1),A.zombies.find(z=>z.type==='balloon')); bal.x=360; const bh=bal.hp;
for(let k=0;k<200;k++) step(1);
pass.push(['普通仙人掌打不到气球', A.zombies.includes(bal) && bal.hp===bh]);
// C) big cactus CAN hit balloon
A.zombies.length=0; A.plants.length=0;
A.addPlant('bigcactus',2,0); const bal2=(A.addZombie('balloon',2),A.zombies.find(z=>z.type==='balloon')); bal2.x=360; const bh2=bal2.hp;
for(let k=0;k<200;k++) step(1);
pass.push(['巨仙掌能打到气球', !A.zombies.includes(bal2) || bal2.hp<bh2]);
// D) spike through campfire becomes fire spike
A.zombies.length=0; A.plants.length=0;
A.addPlant('cactus',3,0); A.addPlant('campfire',3,3); A.addZombie('basic',3); A.zombies[A.zombies.length-1].x=820;
let sawFireSpike=false;
for(let k=0;k<200;k++){ step(1); if(A.peas.some(p=>p.spike&&p.fire)){sawFireSpike=true;break;} }
pass.push(['尖刺穿过篝火变火焰尖刺', sawFireSpike]);
console.log('errors:', err.length?err.slice(0,4):'none');
let ok=true;for(const[n,p] of pass){console.log((p?'PASS':'FAIL')+'  '+n);if(!p)ok=false;}
console.log('ALL PASS:', ok);
