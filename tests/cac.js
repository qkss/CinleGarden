const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1050,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=n=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
A.addPlant('cactus',0,0); const b=(A.addZombie('balloon',0),A.zombies.find(z=>z.type==='balloon')); b.x=380; const h0=b.hp;
let popped=false;
for(let k=0;k<700;k++){ step(1); if(!A.zombies.includes(b)){popped=true;break;} }
const finalHp = A.zombies.includes(b)? b.hp : 0;
console.log('balloon hp', h0, '->', finalHp, '| popped:', popped, '| 仙人掌能打到气球:', popped||finalHp<h0);
