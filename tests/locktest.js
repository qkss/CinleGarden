const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1050,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const CARDY=50;
function selectCard(key){ const i=A.CARD.indexOf(key); ch['click']({clientX:A.CARDX(i)+10,clientY:CARDY}); }
let pass=[];
A.setSun(99999);
// wave 0: snowpea/threepeater/campfire locked; peashooter/cactus unlocked
A.setWave(0);
pass.push(['寒冰0波锁定', A.locked('snowpea')===true]);
pass.push(['三豆0波锁定', A.locked('threepeater')===true]);
pass.push(['篝火0波锁定', A.locked('campfire')===true]);
pass.push(['豌豆/仙人掌不锁', A.locked('peashooter')===false && A.locked('cactus')===false]);
// try select locked snowpea -> should NOT select
selectCard('snowpea'); pass.push(['锁定时无法选中寒冰', A.selected!==('snowpea')]);
// wave 10: threepeater+campfire unlock, snowpea still locked
A.setWave(10);
pass.push(['10波三豆解锁', A.locked('threepeater')===false]);
pass.push(['10波篝火解锁', A.locked('campfire')===false]);
pass.push(['10波寒冰仍锁', A.locked('snowpea')===true]);
selectCard('threepeater'); pass.push(['10波可选三豆', A.selected==='threepeater']);
// wave 15: snowpea unlock
A.setWave(15); pass.push(['15波寒冰解锁', A.locked('snowpea')===false]);
selectCard('snowpea'); pass.push(['15波可选寒冰', A.selected==='snowpea']);
let ok=true;for(const[n,p] of pass){console.log((p?'PASS':'FAIL')+'  '+n);if(!p)ok=false;}
console.log('ALL PASS:', ok);
