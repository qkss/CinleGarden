const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad};
const ctxProxy=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const ch={};function mk(){return{width:1050,height:640,getContext:()=>ctxProxy,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};}
let ov='';let sf=null;
global.document={getElementById:id=>({game:mk(),overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(require('fs').readFileSync('gamedbg.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; let err=[];
// place a column of sunflowers (varied levels) + shooters; force ultimate
for(let r=0;r<5;r++){ A.addPlant('sunflower',r,0); A.addPlant('repeater',r,2); }
const sfs=A.plants.filter(p=>p.type==='sunflower');
[1,3,5,6,7].forEach((lv,i)=>{ if(sfs[i]) sfs[i].up=lv; });   // one of each tier
A.setSun(99999);
for(let f=0;f<60*60;f++){t+=dt;
 for(let i=sch.length-1;i>=0;i--){if(sch[i].at<=t){try{sch[i].fn();}catch(e){err.push(e.message);}sch.splice(i,1);}}
 if(raf){const c=raf;raf=null;try{c(t);}catch(e){err.push('f:'+e.message);}}
 if(f%4===0)ch['win_keydown']({key:' ',code:'Space',preventDefault(){}});
 if(ov.includes('游戏结束')) break;
}
const buffedRepeaters=A.plants.filter(p=>p.type==='repeater'&&p.hpAura).length;
console.log('errors:', err.length?err.slice(0,5):'none');
console.log('repeaters that got HP aura:', buffedRepeaters);
console.log('ultimate active:', A.ultimateActive());
console.log('any 250-sun produced:', A.suns.some(s=>s.value===250) || 'collected/none-this-instant');
