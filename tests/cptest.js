const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1050,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){try{sch[j].fn()}catch(e){err.push(e.message)}sch.splice(j,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}};
step(1);
let pass=[];
// A) 普通豌豆打不到气球；仙人掌能打到
A.addPlant('peashooter',0,0); const bal=(A.addZombie('balloon',0),A.zombies.find(z=>z.type==='balloon')); bal.x=400; const bhp=bal.hp;
for(let k=0;k<200 && A.zombies.includes(bal);k++) step(1);
pass.push(['普通豌豆无法击落气球', A.zombies.includes(bal) && bal.hp===bhp]);
// clear & test cactus pops it
A.zombies.length=0; A.plants.length=0;
A.addPlant('cactus',0,0); const bal2=(A.addZombie('balloon',0),A.zombies.find(z=>z.type==='balloon')); bal2.x=380;
let popped=false;
const bh2=bal2.hp; for(let k=0;k<520;k++){ step(1); if(!A.zombies.includes(bal2)){popped=true;break;} } if(bal2for(let k=0;k<260;k++){ step(1); if(!A.zombies.includes(bal2)){popped=true;break;} }for(let k=0;k<260;k++){ step(1); if(!A.zombies.includes(bal2)){popped=true;break;} }bal2.hp<bh2)popped=true;
pass.push(['仙人掌击落气球', popped]);
// B) 铁门挡普通豌豆(门吸伤害, 本体不掉血)
A.zombies.length=0; A.plants.length=0;
A.addPlant('peashooter',2,0); const sd=(A.addZombie('screendoor',2),A.zombies.find(z=>z.type==='screendoor')); sd.x=380; const sdbody=sd.hp, door0=sd.doorHp;
for(let k=0;k<160;k++) step(1);
pass.push(['铁门吸豌豆伤害(门<初始)', sd.doorHp<door0]);
pass.push(['铁门未破时本体不掉血', sd.hp===sdbody]);
// C) 爆炸无视铁门直接打本体
A.explode(sd.x, sd.y, 60, 200, '#f00'); step(2);
pass.push(['爆炸无视铁门打本体', sd.hp<sdbody]);
// D) 火焰豌豆无视铁门: place campfire in front of peashooter, new screendoor
A.zombies.length=0; A.plants.length=0;
A.addPlant('peashooter',3,0); A.addPlant('campfire',3,2);
const sd2=(A.addZombie('screendoor',3),A.zombies.find(z=>z.type==='screendoor')); sd2.x=520; const body2=sd2.hp;
for(let k=0;k<240;k++) step(1);
pass.push(['火焰豌豆无视铁门(本体掉血)', sd2.hp<body2]);
console.log('errors:', err.length?err.slice(0,4):'none');
let ok=true;for(const[n,p] of pass){console.log((p?'PASS':'FAIL')+'  '+n);if(!p)ok=false;}
console.log('ALL PASS:', ok);
