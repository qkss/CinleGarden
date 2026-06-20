const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:980,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:980,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const key={sunflower:0,peashooter:1,snowpea:2,repeater:3,campfire:4,wallnut:5,potatoshield:6,cherrybomb:7,potatomine:8};
function plant(tp,c,r){click(CARDX(key[tp]),50);const p=cell(c,r);click(p.x,p.y);}
const fps=60,dt=1000/fps;let err=[],won=false,lost=false,sawFire=false,spaceWorked=false;
let prevSun=0,prevSuns=0;
for(let f=0;f<240*fps;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push('to:'+e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 const G=global.__G;
 // test spacebar collect at t~20s: if suns present, press space, expect suns->0 and sun increased
 if(G && Math.abs(t-20000)<20 && G.suns>0){ prevSun=G.sun; prevSuns=G.suns; keydown(' '); }
 if(G && prevSuns>0 && !spaceWorked){ if(global.__G.suns< prevSuns && global.__G.sun>prevSun){ spaceWorked=true; } }
 // otherwise collect by clicking
 if(f%6===0) for(let x=80;x<920;x+=22)for(let y=135;y<590;y+=22)click(x,y);
 const sec=t/1000;
 if(f%20===0){
   for(let r=0;r<5;r++){plant('sunflower',0,r);plant('sunflower',1,r);}
   if(sec>10)for(let r=0;r<5;r++)plant('peashooter',2,r);
   if(sec>30)for(let r=0;r<5;r++)plant('campfire',4,r);   // campfire downstream of shooters
   if(sec>30)for(let r=0;r<5;r++)plant('peashooter',3,r);
   if(sec>60)for(let r=0;r<5;r++){plant('repeater',5,r);plant('potatoshield',6,r);}
   if(sec>95)for(let r=0;r<5;r++)plant('potatomine',7,r);
   if(sec>120)for(let r=0;r<5;r++)plant('cherrybomb',7,r);
 }
 if(global.__G && global.__G.firePeas>0) sawFire=true;
 if(ov.includes('胜利')){won=true;break;}
 if(ov.includes('游戏结束')){lost=true;break;}
}
console.log('errors:',err.length?err.slice(0,4):'none');
console.log('saw fire peas (campfire enchant working):', sawFire);
console.log('spacebar collect-all worked:', spaceWorked);
console.log('won:',won,'lost:',lost,'t:',(t/1000).toFixed(1)+'s');
