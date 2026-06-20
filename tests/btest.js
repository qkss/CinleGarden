const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:(s?String(s).length:0)*7})};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null, rafCount=0; global.requestAnimationFrame=c=>{raf=c;rafCount++;};
let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API;
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});
const CARDX=i=>130+i*90+43;
A.start(); step(1);
let pass=[];
A.setWave(5); A.setSun(99999);
// place two sunflowers + shooters in two rows
A.addPlant('sunflower',0,0); A.addPlant('repeater',0,2);
A.addPlant('sunflower',1,0); A.addPlant('repeater',1,2); A.addPlant('peashooter',1,3);
const sf0=A.plants.find(p=>p.type==='sunflower'&&p.r===0);
const sf1=A.plants.find(p=>p.type==='sunflower'&&p.r===1);
// --- Branch ATK on row0 to Lv5 ---
// click sunflower row0 -> opens menu; click ATK button
click(cell(0,0).x,cell(0,0).y); step(1);
// menu rects: compute like game: bw72 gap10 -> x0 = p.x-77 clamped; atk button center
const p0x=cell(0,0).x;
let x0=Math.max(62, p0x-77); const atkBtn={x:x0+36,y:Math.max(132,130+0*92-42)+15};
click(atkBtn.x, atkBtn.y); step(1);
pass.push(['ATK分支选择 up1 branch=atk', sf0.up===1 && sf0.branch==='atk']);
// upgrade row0 to Lv5 (4 more clicks on the flower)
for(let k=0;k<4;k++){ click(cell(0,0).x,cell(0,0).y); step(1); }
pass.push(['ATK升到Lv5', sf0.up===5 && sf0.branch==='atk']);
pass.push(['ATK Lv5 行攻速x2', Math.abs(A.rowAttackMult(0)-2)<1e-9]);
pass.push(['ATK行无血量光环', Math.abs(A.rowHpMult(0)-1)<1e-9]);
// --- Branch HP on row1 to Lv5 ---
click(cell(0,1).x,cell(0,1).y); step(1); // open menu for sf1
let x1=Math.max(62, cell(0,1).x-77); const hpBtn={x:x1+72+10+36, y:Math.max(132,130+1*92-42)+15};
click(hpBtn.x,hpBtn.y); step(1);
pass.push(['HP分支选择 up1 branch=hp', sf1.up===1 && sf1.branch==='hp']);
for(let k=0;k<4;k++){ click(cell(0,1).x,cell(0,1).y); step(1); }
pass.push(['HP升到Lv5', sf1.up===5 && sf1.branch==='hp']);
pass.push(['HP Lv5 行血量x3.5', Math.abs(A.rowHpMult(1)-3.5)<1e-9]);
pass.push(['HP行攻速不变(=1)', Math.abs(A.rowAttackMult(1)-1)<1e-9]);
// repeater in row1 maxHp should be 60*3.5=210 after a frame
step(3);
const pea1=A.plants.find(p=>p.type==='repeater'&&p.r===1);
pass.push(['HP行植物maxHp=60*3.5=210 (got '+Math.round(pea1.maxHp)+')', Math.round(pea1.maxHp)===210]);
// --- converge: row0 to Lv6 then Lv7 ---
click(cell(0,0).x,cell(0,0).y); step(1); // up5->6 cost 10000
pass.push(['Lv6钢化', sf0.up===6]);
pass.push(['Lv6后行血量x2', Math.abs(A.rowHpMult(0)-2)<1e-9]);
click(cell(0,0).x,cell(0,0).y); step(1); // up6->7 cost 20000
pass.push(['Lv7终极', sf0.up===7 && A.ultimateActive()]);
pass.push(['终极CD-50%', Math.abs(A.effCooldown('peashooter')-PLANTS_cd()*0.5)<1e-9]);
function PLANTS_cd(){ return 5; } // peashooter cooldown=5
// --- pause ---
ch['win_keydown']({key:'p',code:'',preventDefault(){}});
pass.push(['暂停P生效', A.paused()===true]);
const wBefore=A.getWave(); step(60*30); // 30s while paused: wave should NOT advance
pass.push(['暂停时游戏不推进', A.getWave()===wBefore]);
ch['win_keydown']({key:'p',code:'',preventDefault(){}}); // unpause
pass.push(['再按P恢复', A.paused()===false]);
// --- restart no double-loop ---
const before=rafCount; step(2); const afterTwo=rafCount;
// restart via button
click(960,640-44+15); // RESTARTBTN center approx (x W-300..; W-300+42=792?) -> recompute
// proper restart button center:
const RB={x:1050-300,y:640-44,w:84,h:30}; click(RB.x+42, RB.y+15); 
step(5);
// after restart, run 5 frames: rafCount should increase by ~ (5 + maybe1) not double per frame
const c1=rafCount; step(10); const c2=rafCount;
pass.push(['重开后无双循环(10帧约+10)', (c2-c1)>=9 && (c2-c1)<=12]);
pass.push(['重开重置波数为0', A.getWave()===0]);
let allok=true; for(const [n,ok] of pass){ console.log((ok?'PASS':'FAIL')+'  '+n); if(!ok)allok=false; }
console.log('ALL PASS:', allok);
