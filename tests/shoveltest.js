const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));sf();
const click=(x,y)=>ch['click']({clientX:x,clientY:y});
const keydown=k=>ch['win_keydown']({key:k,code:k===' '?'Space':'',preventDefault(){}});
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});const CARDX=i=>130+i*90+43;
const SHOVEL_X=946+33, SHOVEL_Y=16+35;
const step=()=>{t+=1000/60;for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){sch[i].fn();sch.splice(i,1);}}if(raf){const c=raf;raf=null;c(t);}};
// accumulate sun
for(let f=0;f<60;f++)step();
keydown(' '); step();
// plant a sunflower at (0,0)
click(CARDX(0),50); step(); const cc=cell(0,0); click(cc.x,cc.y); step();
const afterPlant=global.__G.plants;
// click shovel button -> shovelMode true
click(SHOVEL_X,SHOVEL_Y); step();
const shovelOn=global.__G.shovelMode;
// click the plant to remove it
click(cc.x,cc.y); step();
const afterDig=global.__G.plants;
const shovelOff=global.__G.shovelMode;
console.log('plants after planting:',afterPlant);
console.log('shovelMode after clicking button:',shovelOn);
console.log('plants after shovel-dig:',afterDig,'| shovelMode reset:',shovelOff);
console.log('PASS:', afterPlant>=1 && shovelOn===true && afterDig===afterPlant-1 && shovelOff===false);
