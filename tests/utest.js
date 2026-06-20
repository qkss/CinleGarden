const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API;
A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
step(1);
let pass=[];
// ---- attack speed mult ----
A.addPlant('sunflower',0,0); A.addPlant('peashooter',0,2);
let sf0=A.plants.find(p=>p.type==='sunflower'&&p.r===0);
const m0=A.rowAttackMult(0); sf0.up=5; const m5=A.rowAttackMult(0);
pass.push(['攻速 up0=1x',Math.abs(m0-1)<1e-9]);
pass.push(['攻速 up5=2x',Math.abs(m5-2)<1e-9]);
// ---- HP aura ----
A.addPlant('peashooter',1,2); A.addPlant('sunflower',1,0);
let sf1=A.plants.find(p=>p.type==='sunflower'&&p.r===1); sf1.up=6;
const pea1=A.plants.find(p=>p.type==='peashooter'&&p.r===1);
const beforeHp=pea1.maxHp; step(2); const afterHp=pea1.maxHp;
pass.push(['钢化 血量x2 ('+beforeHp+'->'+afterHp+')', afterHp===beforeHp*2]);
// ---- ultimate CD + sun x10 ----
const cdBefore=A.effCooldown('peashooter');
A.addPlant('sunflower',2,0); let sf2=A.plants.find(p=>p.type==='sunflower'&&p.r===2); sf2.up=7;
const cdAfter=A.effCooldown('peashooter');
pass.push(['终极 CD-50% ('+cdBefore+'->'+cdAfter+')', Math.abs(cdAfter-cdBefore*0.5)<1e-9 && A.ultimateActive()]);
// sun x10: clear suns, run ~7.2s, expect a 250-value sun produced by the up7 sunflower
const beforeSunCount=A.suns.length;
step(Math.ceil(7.2*60));
const big=A.suns.some(s=>s.value===250);
pass.push(['终极 产阳光x10(=250)', big]);
// ---- wave-15 gate via click ----
// place fresh sunflower, set sun high, click before wave15 -> no upgrade
A.setSun(50000);
A.addPlant('sunflower',3,0);
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});
let sf3=A.plants.find(p=>p.type==='sunflower'&&p.r===3);
const cc=cell(0,3); click(cc.x,cc.y); step(1);
const upBeforeWave=sf3.up;
A.setWave(15); A.setSun(50000); click(cc.x,cc.y); step(1);
const upAfterWave=sf3.up; const sunAfter=A.getSun();
pass.push(['15波前点击不升级', upBeforeWave===0]);
pass.push(['15波后点击升级+扣1000', upAfterWave===1 && sunAfter===49000]);
let allok=true;
for(const [name,ok] of pass){ console.log((ok?'PASS':'FAIL')+'  '+name); if(!ok)allok=false; }
console.log('ALL PASS:', allok);
