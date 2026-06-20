const { createCanvas } = require('@napi-rs/canvas');const fs=require('fs');
const real=createCanvas(1050,640); const rctx=real.getContext('2d');
const ch={};
const gameEl={width:1050,height:640,getContext:()=>rctx,addEventListener:(e,f)=>{ch[e]=f;},getBoundingClientRect:()=>({left:0,top:0,width:1050,height:640})};
let ov='';let sf=null;
global.document={getElementById:id=>({game:gameEl,overlay:{classList:{add(){},remove(){}},set innerHTML(v){ov=v;},get innerHTML(){return ov;}},startBtn:{set onclick(f){sf=f;}},againBtn:{set onclick(f){}}}[id]||{set onclick(f){}})};
const _ls={}; global.localStorage={getItem:k=>k in _ls?_ls[k]:null,setItem:(k,v)=>{_ls[k]=String(v);}};
global.window={addEventListener:(e,f)=>{ch['win_'+e]=f;}};
let raf=null;global.requestAnimationFrame=c=>{raf=c;};let t=0;global.performance={now:()=>t};let sch=[];global.setTimeout=(fn,ms)=>{sch.push({fn,at:t+ms});};
(0,eval)(fs.readFileSync('gamecheat3b.js','utf8'));
const A=global.__API; A.start();
const dt=1000/60; const step=(n=1)=>{for(let i=0;i<n;i++){t+=dt;for(let j=sch.length-1;j>=0;j--){if(sch[j].at<=t){sch[j].fn();sch.splice(j,1);}}if(raf){const c=raf;raf=null;c(t);}}};
A.setWave(8);
// build varied sunflowers: atk Lv3, atk Lv5, hp Lv3, hp Lv5, MAX
function mk(r,c,branch,up){ A.addPlant('sunflower',r,c); const p=A.plants[A.plants.length-1]; p.branch=branch; p.up=up; }
mk(0,0,'atk',3); mk(1,0,'atk',5); mk(2,0,'hp',3); mk(3,0,'hp',5); mk(4,0,'atk',7);
A.addPlant('repeater',1,3); A.addPlant('repeater',3,3);
step(20);
// open branch menu on a fresh Lv0 sunflower at (row0,col4)
A.addPlant('sunflower',0,4);
const cell=(c,r)=>({x:60+c*96+48,y:130+r*92+46});
ch['click']({clientX:cell(4,0).x,clientY:cell(4,0).y});
// speed to 2x
ch['click']({clientX:1050-116+50,clientY:640-44+15});
step(2);
fs.writeFileSync('preview11.png', real.toBuffer('image/png'));
console.log('done');
