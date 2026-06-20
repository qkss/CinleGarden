const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};function C(){return{width:1120,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:C(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
global.localStorage={getItem:()=>null,setItem:()=>{}};global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start(); A.setWave(20); A.setSun(99999);  // unlock all + afford
const key=k=>ch['win_keydown']({key:k,preventDefault(){},shiftKey:(k==='+')});
let pass=[], allok=true;
A.HOTKEYS.forEach((k,i)=>{
  // deselect first
  ch['win_keydown']({key:'Escape',preventDefault(){}});
  key(k);
  const ok = A.selected===A.CARD[i];
  pass.push([k+'→'+A.CARD[i], ok]); if(!ok)allok=false;
});
// shovel ~
ch['win_keydown']({key:'Escape',preventDefault(){}});
key('~'); const sh=A.shovelMode===true;
console.log(pass.map(p=>(p[1]?'ok':'FAIL')+' '+p[0]).join(' | '));
console.log('~ 铲子:', sh);
console.log('ALL PASS:', allok && sh);
