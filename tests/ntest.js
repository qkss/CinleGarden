const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:(s?String(s).length:0)*7})};
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
step(1);
let pass=[];
// --- costs ---
const sfFake={type:'sunflower',up:5}, sfFake2={type:'sunflower',up:6};
pass.push(['Lv6费用2000', A.nextUpgradeCost(sfFake)===2000]);
pass.push(['Lv7费用3000', A.nextUpgradeCost(sfFake2)===3000]);
pass.push(['土豆盾每级500', A.nextUpgradeCost({type:'potatoshield',up:0})===500 && A.nextUpgradeCost({type:'potatoshield',up:9})===500 && A.nextUpgradeCost({type:'potatoshield',up:10})===null]);
// --- jalapeno clears a row ---
for(let c=2;c<8;c++) A.addZombie('basic', 1);     // 6 zombies in row1
for(let c=0;c<3;c++) A.addZombie('basic', 3);     // some in row3 (should survive)
const r1Before=A.zombies.filter(z=>z.r===1).length, r3Before=A.zombies.filter(z=>z.r===3).length;
A.addPlant('jalapeno',1,4);   // jalapeno in row1
step(70);                      // fuse ~1s
const r1After=A.zombies.filter(z=>z.r===1).length, r3After=A.zombies.filter(z=>z.r===3).length;
pass.push(['辣椒清空本行('+r1Before+'->'+r1After+')', r1After===0 && r1Before>=6]);
pass.push(['辣椒不影响其他行('+r3Before+'->'+r3After+')', r3After===r3Before]);
// --- threepeater fires 3 lanes ---
A.addPlant('threepeater',2,1);
A.addZombie('basic',1); A.addZombie('basic',2); A.addZombie('basic',3);  // one in each adjacent lane
const peasBefore=A.peas.length;
step(90);
const lanes=new Set(A.peas.map(p=>p.r));
pass.push(['三豆覆盖3行(rows: '+[...lanes].sort()+')', lanes.has(1)&&lanes.has(2)&&lanes.has(3)]);
// --- potato shield +50%/level ---
A.addPlant('potatoshield',0,0);
const ps=A.plants.find(p=>p.type==='potatoshield');
const baseHp=ps.maxHp; ps.up=4; ps.selfHpMult=1+0.5*4; step(3);
pass.push(['土豆盾Lv4=基础x3 ('+Math.round(baseHp)+'->'+Math.round(ps.maxHp)+')', Math.round(ps.maxHp)===Math.round(ps.baseMaxHp*3)]);
ps.up=10; ps.selfHpMult=1+0.5*10; step(3);
pass.push(['土豆盾Lv10=基础x6 ('+Math.round(ps.maxHp)+')', Math.round(ps.maxHp)===Math.round(ps.baseMaxHp*6)]);
let allok=true; for(const [n,ok] of pass){ console.log((ok?'PASS':'FAIL')+'  '+n); if(!ok)allok=false; }
console.log('ALL PASS:', allok);
