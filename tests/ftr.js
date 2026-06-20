const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1120,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
let err=[];(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){try{sch[j].fn()}catch(e){err.push(e.message)}sch.splice(j,1);}}if(raf){const c=raf;raf=null;try{c(t)}catch(e){err.push('f:'+e.message)}}}};
step(1);
let pass=[];
// 0) spike crash fix: place cactus + zombie, run, no error
A.addPlant('cactus',0,0); A.addZombie('basic',0); A.zombies[A.zombies.length-1].x=400;
for(let k=0;k<120;k++) step(1);
pass.push(['仙人掌不再崩溃(spike已定义)', err.length===0]);
// 1) snowpea freeze duration scales with level
A.zombies.length=0; A.plants.length=0; err.length=0;
A.addPlant('snowpea',1,0); const snow=A.plants.find(p=>p.type==='snowpea'); snow.up=5;
A.addZombie('basic',1); const z1=A.zombies[0]; z1.x=420; z1.hp=99999;
let maxFreeze=0;
for(let k=0;k<600;k++){ step(1); if(z1.freezeT>maxFreeze)maxFreeze=z1.freezeT; }
pass.push(['寒冰Lv5冻结≈2.5s ('+maxFreeze.toFixed(2)+')', maxFreeze>2.3 && maxFreeze<2.7]);
// 2) gargantuar death explosion damages nearby plants
A.zombies.length=0; A.plants.length=0; err.length=0;
A.addPlant('peashooter',2,5); const pp=A.plants.find(p=>p.type==='peashooter'); const ph=pp.hp;
A.addZombie('gargantuar',2); const g=A.zombies[0]; g.x=pp.x+30; g.hp=1;  // about to die
step(2);  // dies -> explosion
pass.push(['巨人死亡爆炸伤及植物', pp.hp<ph || A.plants.indexOf(pp)<0]);
// 3) potato shield destroyed -> explode (dmg by level) + Lv5 leaves mash
A.zombies.length=0; A.plants.length=0; err.length=0;
A.addPlant('potatoshield',3,4); const ps=A.plants.find(p=>p.type==='potatoshield'); ps.up=6; ps.selfHpMult=1+0.5*6;
A.addZombie('basic',3); const zb=A.zombies[0]; zb.x=ps.x+60; zb.hp=400;
ps.hp=1; ps.dead=true;  // simulate destroyed
const zbh=zb.hp;
step(2);
pass.push(['土豆盾摧毁爆炸伤到僵尸', zb.hp<zbh || A.zombies.indexOf(zb)<0]);
pass.push(['Lv6土豆盾留下土豆泥', A.mashes.length>=1]);
// mash slows zombies
A.zombies.length=0; A.addZombie('basic',3); const zm=A.zombies[0]; zm.x=A.mashes[0].x; const x0=zm.x;
step(30);
const moved = x0 - zm.x;
pass.push(['土豆泥大幅减速(30帧位移<3px)', moved<3 && moved>=0]);
console.log('errors:', err.length?err.slice(0,4):'none');
let ok=true;for(const[n,p] of pass){console.log((p?'PASS':'FAIL')+'  '+n);if(!p)ok=false;}
console.log('ALL PASS:', ok);
