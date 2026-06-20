const grad={addColorStop(){}};const base={createRadialGradient:()=>grad,createLinearGradient:()=>grad,measureText:s=>({width:7}),setLineDash(){}};
const cx=new Proxy(base,{get:(t,p)=>p in t?t[p]:(()=>{}),set:()=>true});
const ch={};
// DOM stub with element registry so getElementById finds buttons inside overlay.innerHTML
const handlers={};
function makeEl(id){ return { _id:id, set onclick(f){handlers[id]=f;}, get onclick(){return handlers[id];}, addEventListener(){}, classList:{add(){},remove(){}} }; }
let overlayHTML="";
const overlay={ classList:{add(){},remove(){}}, set innerHTML(v){overlayHTML=v;}, get innerHTML(){return overlayHTML;} };
const game={width:1120,height:640,getContext:()=>cx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1120,height:640})};
global.document={getElementById:id=>{ if(id==='game')return game; if(id==='overlay')return overlay; return makeEl(id); }};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};global.setTimeout=()=>{};
(0,eval)(require('fs').readFileSync('game.js','utf8'));
// On load showMenu() ran:
console.log('菜单含标题:', overlayHTML.includes('馨乐花园保卫战'));
console.log('菜单含开始游戏:', overlayHTML.includes('开始游戏'));
console.log('菜单含查看攻略按钮:', overlayHTML.includes('查看攻略'));
console.log('菜单含作者Niko:', overlayHTML.includes('作者 Niko'));
console.log('菜单不含大段攻略(简洁):', !overlayHTML.includes('无尽模式'));
// click 查看攻略
handlers['guideBtn'] && handlers['guideBtn']();
console.log('攻略页含攻略内容:', overlayHTML.includes('无尽模式') && overlayHTML.includes('返回'));
// click 返回
handlers['guideBackBtn'] && handlers['guideBackBtn']();
console.log('返回回到菜单:', overlayHTML.includes('开始游戏') && !overlayHTML.includes('无尽模式'));
