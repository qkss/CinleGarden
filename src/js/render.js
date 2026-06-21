"use strict";
  // ---------- Drawing ----------
  function draw(){
    ctx.fillStyle = "#7cc3e8"; ctx.fillRect(0,0,W,H);
    drawTopBar();
    drawLawn();
    if(frostRainT>0){   // 冰霜雪雨: 大范围淡蓝霜冻覆盖
      ctx.save();
      ctx.fillStyle="rgba(150,210,250,"+(0.12+0.06*Math.sin(performance.now()/120)).toFixed(3)+")";
      ctx.fillRect(GRID.x, GRID.y, COLS*GRID.cw, ROWS*GRID.ch);
      ctx.restore();
    }
    drawMashes();
    drawMowers();
    drawDebris();
    for(const p of plants) drawPlant(p);
    drawGroundSpikes();
    for(const pea of peas) drawPea(pea);
    drawFootballs();
    drawBeanbombs();
    [...zombies].sort((a,b)=>a.y-b.y).forEach(drawZombie);
    drawBeams();
    drawSuns();
    drawExplosions();
    drawParticles();
    drawFloats();
    drawShields();
    drawSelectionGhost();
    drawPlantInfo();
    drawUpgradeHint();
    drawUpgradeMenu();
    for(const p of plants) if(p.type==="potatoshield" && (p.up||0)>=10) drawPotatoSkillUI(p);
    drawHUD();
    drawControlButtons();
    drawWaveBanner();
    if(paused) drawPauseOverlay();
  }

  function btn(b, label, fill, textCol){
    ctx.save();
    roundRect(b.x,b.y,b.w,b.h,8); ctx.fillStyle=fill; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle="#ffffff66"; ctx.stroke();
    ctx.fillStyle=textCol||"#fff"; ctx.font="bold 14px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(label, b.x+b.w/2, b.y+b.h/2);
    ctx.restore();
  }
  function drawControlButtons(){
    const on = SFX.isOn();
    btn(MUTEBTN, on?"🔊 音效":"🔇 静音", on?"rgba(0,0,0,.35)":"#7a3a3a");
    btn(RESTARTBTN, "↻ 重开", "rgba(0,0,0,.35)");
    btn(PAUSEBTN, paused?"▶ 继续":"⏸ 暂停", paused?"#3aa55a":"rgba(0,0,0,.35)");
    const sl = gameSpeed===1?"▶ 1x":(gameSpeed===2?"▶▶ 2x":"▶▶▶ 3x");
    btn(SPEEDBTN, sl, gameSpeed>1?"#ff9d2e":"rgba(0,0,0,.35)");
  }
  function drawPauseOverlay(){
    ctx.save();
    ctx.fillStyle="rgba(15,10,25,.55)"; ctx.fillRect(0,TOPBAR_H,W,H-TOPBAR_H);
    ctx.fillStyle="#fff"; ctx.font="bold 40px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("⏸ 已暂停", W/2, H/2-10);
    ctx.font="16px 'PingFang SC',Arial"; ctx.fillStyle="#cfe7f5";
    ctx.fillText("点击任意处 或 按 P 继续", W/2, H/2+30);
    ctx.restore();
  }
  // 矢量闪电图标
  function drawBoltIcon(cx,cy,s){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx+s*0.4, cy-s);
    ctx.lineTo(cx-s*0.55, cy+s*0.12);
    ctx.lineTo(cx-s*0.05, cy+s*0.12);
    ctx.lineTo(cx-s*0.4, cy+s);
    ctx.lineTo(cx+s*0.6, cy-s*0.12);
    ctx.lineTo(cx+s*0.05, cy-s*0.12);
    ctx.closePath();
    ctx.fillStyle="#ffe96b"; ctx.fill();
    ctx.strokeStyle="rgba(150,95,0,.6)"; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  }
  // 矢量爱心图标
  function drawHeartIcon(cx,cy,s){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy+s*0.8);
    ctx.bezierCurveTo(cx-s*1.25, cy-s*0.25, cx-s*0.5, cy-s*1.1, cx, cy-s*0.35);
    ctx.bezierCurveTo(cx+s*0.5, cy-s*1.1, cx+s*1.25, cy-s*0.25, cx, cy+s*0.8);
    ctx.closePath();
    ctx.fillStyle="#ff6b7a"; ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(cx-s*0.34,cy-s*0.32,s*0.2,s*0.3,-0.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function branchBtn(b, label, c1, c2, iconFn){
    ctx.save();
    const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);
    g.addColorStop(0,c1); g.addColorStop(1,c2);
    roundRect(b.x,b.y,b.w,b.h,9); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.6)"; ctx.lineWidth=1.5; ctx.stroke();
    // 顶部高光
    ctx.fillStyle="rgba(255,255,255,.2)"; roundRect(b.x+2,b.y+2,b.w-4,b.h*0.4,7); ctx.fill();
    // 图标圆底 + 矢量图标
    ctx.fillStyle="rgba(0,0,0,.18)"; ctx.beginPath(); ctx.arc(b.x+16, b.y+b.h/2, 10, 0, Math.PI*2); ctx.fill();
    iconFn(b.x+16, b.y+b.h/2, 8);
    // 文字
    ctx.fillStyle="#fff"; ctx.font="bold 13px 'PingFang SC',Arial"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.shadowColor="rgba(0,0,0,.4)"; ctx.shadowBlur=2;
    ctx.fillText(label, b.x+30, b.y+b.h/2+0.5);
    ctx.restore();
  }
  function drawUpgradeMenu(){
    const r=upgradeMenuRects(); if(!r) return;
    ctx.save();
    // title
    ctx.font="bold 12px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    const title="选择升级方向 (各250阳光)";
    const tw=ctx.measureText(title).width+14;
    ctx.fillStyle="rgba(20,20,30,.92)"; roundRect(r.cx-tw/2, r.ty-9, tw, 18, 5); ctx.fill();
    ctx.fillStyle="#fff"; ctx.fillText(title, r.cx, r.ty);
    branchBtn(r.atk, "攻速", "#5b9be8", "#2f63b8", drawBoltIcon);
    branchBtn(r.hp, "血量", "#5fc888", "#2f8a52", drawHeartIcon);
    ctx.restore();
  }

  function plantInfoLines(p){
    const def = PLANTS[p.type];
    const lines = ["血量 "+Math.round(Math.max(0,p.hp))+"/"+Math.round(p.maxHp)];
    if(p.kind==="shooter" || p.kind==="shooter3"){
      const interval = def.rate / rowAttackMult(p.r);
      const shots = def.shots||1;
      lines.push("攻速 "+(shots/interval).toFixed(1)+" 发/秒");
      lines.push("伤害 "+def.dmg+(def.freeze?"·冰冻":"")+(p.kind==="shooter3"?"·三连":""));
      if(def.freeze) lines.push("冰冻 "+(1.5+0.2*(p.up||0)).toFixed(1)+"s"+(p.up>0?" Lv"+p.up:""));
    } else if(p.kind==="producer"){
      const val = (p.up>=7)?250:Math.round(25*(1+0.4*p.up));
      lines.push("产阳光 "+val+"/7秒 (≈"+(val/7).toFixed(1)+"/s)");
      if(p.up>0) lines.push(upgradeLabel(p));
    } else if(p.kind==="defense"){
      if(p.type==="potatoshield" && p.up>0) lines.push("护甲 Lv"+p.up+" (+"+(p.up*50)+"%血)");
      else lines.push("肉盾");
    } else if(p.kind==="torch"){ lines.push("豌豆穿过 +30%·火焰溅射");
    } else if(p.kind==="bomb"){ lines.push("范围秒杀");
    } else if(p.kind==="rowbomb"){ lines.push("烧光一整行");
    } else if(p.kind==="mine"){ lines.push(p.armed?"已激活·炸一只":"激活中…"); }
    return lines;
  }
  function drawPlantInfo(){
    if(!showInfo) return;
    ctx.save();
    ctx.font="10px 'PingFang SC',Arial"; ctx.textBaseline="top";
    for(const p of plants){
      const lines = plantInfoLines(p);
      let w=0; for(const l of lines) w=Math.max(w, ctx.measureText(l).width);
      w+=10; const h=lines.length*12+6;
      let bx=p.x-w/2, by=cellY(p.r)-h-1;
      if(by < TOPBAR_H+2) by = cellY(p.r)+GRID.ch-h-2;   // no room above -> show below
      bx = Math.max(2, Math.min(bx, W-w-2));
      ctx.fillStyle="rgba(14,18,28,.88)"; roundRect(bx,by,w,h,5); ctx.fill();
      ctx.strokeStyle="rgba(120,200,255,.45)"; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle="#e3eef8"; ctx.textAlign="left";
      lines.forEach((l,i)=> ctx.fillText(l, bx+5, by+4+i*12));
    }
    // hint
    ctx.fillStyle="rgba(255,255,255,.8)"; ctx.font="bold 12px 'PingFang SC',Arial"; ctx.textAlign="left";
    ctx.fillText("属性总览 (松开 Alt 关闭)", GRID.x, TOPBAR_H+6);
    ctx.restore();
  }

  function drawUpgradeHint(){
    if(selected||shovelMode || upgradeMenu || mouse.y<GRID.y) return;
    const c=colAtX(mouse.x), r=rowAtY(mouse.y);
    if(c<0||r<0) return;
    const sp=plants.find(p=>p.r===r&&p.c===c&&(p.type==="sunflower"||p.type==="potatoshield"||p.type==="snowpea"||p.type==="threepeater"||p.type==="campfire"||p.type==="bigcactus"));
    if(!sp) return;
    const cx=cellCenterX(c), cy=cellY(r);
    const minW = upgradeMinWave(sp);
    let txt, ok=false;
    if(waveNum<minW){ txt="第"+minW+"波后可升级"; }
    else { const cost=nextUpgradeCost(sp);
      if(cost==null) txt="已满级 MAX";
      else {
        ok = sun>=cost;
        let nxt;
        if(sp.type==="potatoshield") nxt="Lv"+(sp.up+1)+"(+50%血)";
        else if(sp.type==="snowpea") nxt="Lv"+(sp.up+1)+"(冻"+(1.5+0.2*(sp.up+1)).toFixed(1)+"s)";
        else if(sp.type==="threepeater") nxt="Lv"+(sp.up+1)+"(攻速 x"+(1+0.4*(sp.up+1)).toFixed(1)+")";
        else if(sp.type==="campfire") nxt = (sp.up+1>=5) ? "Lv5(点燃灼伤)" : ("Lv"+(sp.up+1)+"(火伤 x"+(1.3+0.2*(sp.up+1)).toFixed(1)+")");
        else if(sp.type==="bigcactus") nxt = (sp.up+1>=10) ? "Lv10(地刺·击退2格)" : ("Lv"+(sp.up+1)+"(攻速 x"+(1+0.1*(sp.up+1)).toFixed(1)+")");
        else if(sp.up===0) nxt="选择分支";
        else if(sp.up<5) nxt=(sp.branch==="hp"?"血量":"攻速")+"Lv"+(sp.up+1);
        else if(sp.up===5) nxt="钢化";
        else nxt="终极";
        txt="点击升级→"+nxt+" "+cost+"阳光";
      }
    }
    ctx.save();
    ctx.font="bold 12px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    const w=ctx.measureText(txt).width+18;
    ctx.fillStyle="rgba(20,20,30,.88)"; roundRect(cx-w/2, cy-20, w, 20, 6); ctx.fill();
    ctx.fillStyle = ok ? "#9be36b" : "#ffd2a0";
    ctx.fillText(txt, cx, cy-10);
    ctx.restore();
  }

  function drawTopBar(){
    ctx.fillStyle = "#6b4a2f"; ctx.fillRect(0,0,W,TOPBAR_H);
    ctx.fillStyle = "#8a6240"; ctx.fillRect(0,TOPBAR_H-6,W,6);

    ctx.save();
    roundRect(14,18,104,64,12); ctx.fillStyle="#f4e8c1"; ctx.fill();
    ctx.strokeStyle="#b89b5e"; ctx.lineWidth=3; ctx.stroke();
    drawSunIcon(40,50,15);
    ctx.fillStyle="#5a4327"; ctx.font="bold 24px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(fmtNum(sun), 86, 50);
    ctx.restore();

    CARD_ORDER.forEach((key,i)=> drawCard(key, CARD_X0 + i*CARD_STRIDE, CARD_Y));
    drawShovelButton();
  }

  function drawShovelButton(){
    const s=SHOVEL;
    ctx.save();
    roundRect(s.x,s.y,s.w,s.h,10);
    ctx.fillStyle = shovelMode ? "#ffe1b0" : "#e8d9a8"; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle = shovelMode ? "#ff7a1e" : "#9a7c45"; ctx.stroke();
    // shovel icon
    ctx.save(); ctx.translate(s.x+s.w/2, s.y+s.h/2-2); ctx.rotate(-0.5);
    ctx.strokeStyle="#7a5a32"; ctx.lineWidth=5; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,8); ctx.stroke();
    ctx.strokeStyle="#5a4327"; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(-7,-18); ctx.lineTo(7,-18); ctx.stroke();
    ctx.fillStyle="#b8bcc4";
    ctx.beginPath(); ctx.moveTo(-9,8); ctx.lineTo(9,8); ctx.lineTo(7,20); ctx.quadraticCurveTo(0,26,-7,20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle="#8a9099"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = shovelMode?"#b5621c":"#6b5026"; ctx.font="bold 11px 'PingFang SC',Arial";
    ctx.textAlign="center"; ctx.textBaseline="bottom";
    ctx.fillText("铲子", s.x+s.w/2, s.y+s.h-4);
    // hotkey ~
    ctx.fillStyle="#9a7c45"; ctx.font="bold 10px Arial"; ctx.textAlign="left"; ctx.textBaseline="top";
    ctx.fillText("~", s.x+5, s.y+4);
    ctx.restore();
  }

  function drawCard(key, x, y){
    const p = PLANTS[key];
    const w=CARD_W, h=CARD_H;
    const cdLeft = Math.max(0, effCooldown(key) - (gameTime - lastCardUse[key]));
    ctx.save();
    roundRect(x,y,w,h,10);
    ctx.fillStyle = selected===key ? "#fff7d6" : "#e8d9a8"; ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle = selected===key ? "#ff9d2e" : "#9a7c45"; ctx.stroke();

    // name
    ctx.fillStyle="#4a3a1c"; ctx.textAlign="center"; ctx.textBaseline="top";
    ctx.font="bold 13px 'PingFang SC',Arial";
    ctx.fillText(p.name, x+w/2, y+6);

    // icon
    ctx.save();
    ctx.translate(x+w/2, y+38); ctx.scale(.42,.42);
    drawPlantArt(key, 0, 0, 0, 0, 1, true);
    ctx.restore();

    // cost
    drawSunIcon(x+w/2-14, y+h-12, 7);
    ctx.fillStyle="#3a2e14"; ctx.font="bold 14px Arial"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(p.cost, x+w/2-3, y+h-11);

    // hotkey label
    ctx.fillStyle="#9a7c45"; ctx.font="bold 10px Arial"; ctx.textAlign="left"; ctx.textBaseline="top";
    ctx.fillText(HOTKEY_LABEL[CARD_ORDER.indexOf(key)]||"", x+5, y+4);

    if(cardLocked(key)){
      // 未解锁：整张变暗 + 锁 + 解锁波数
      ctx.fillStyle="rgba(15,15,25,.74)"; roundRect(x,y,w,h,10); ctx.fill();
      ctx.fillStyle="#ffd23f"; ctx.font="bold 14px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("🔒", x+w/2, y+h/2-6);
      ctx.fillStyle="#fff"; ctx.font="bold 11px 'PingFang SC',Arial";
      ctx.fillText(p.unlock+"波解锁", x+w/2, y+h/2+12);
    } else if(cdLeft>0){
      const frac = cdLeft/p.cooldown;
      ctx.fillStyle="rgba(20,20,30,.55)"; roundRect(x,y,w,h*frac,10); ctx.fill();
    } else if(sun<p.cost){
      ctx.fillStyle="rgba(20,20,30,.4)"; roundRect(x,y,w,h,10); ctx.fill();
    }
    ctx.restore();
  }

  function drawMowers(){
    for(const m of mowers){
      if(m.used && !m.active) continue; // consumed and off-screen: don't draw
      ctx.save(); ctx.translate(m.x, m.y);
      ctx.scale(-1, 1); // face right (the direction it charges toward the zombies)
      const spin = m.active ? m.t*30 : 0;
      // wheels
      ctx.fillStyle="#2c2c2c";
      ctx.beginPath(); ctx.arc(-9,12,7,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(9,12,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#777"; ctx.lineWidth=1.5;
      [-9,9].forEach(wx=>{ ctx.save(); ctx.translate(wx,12); ctx.rotate(spin);
        ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(5,0); ctx.moveTo(0,-5); ctx.lineTo(0,5); ctx.stroke(); ctx.restore(); });
      // body
      ctx.fillStyle="#3fae3f"; roundRect(-14,-6,28,16,4); ctx.fill();
      ctx.fillStyle="#2e8b2e"; roundRect(-14,4,28,5,2); ctx.fill();
      // front cutter housing
      ctx.fillStyle="#d23f3f"; roundRect(-22,-2,12,14,3); ctx.fill();
      ctx.fillStyle="#b22"; ctx.beginPath(); ctx.arc(-16,5,5,0,Math.PI*2); ctx.fill();
      // blade flash when active
      if(m.active){
        ctx.strokeStyle="#fff"; ctx.lineWidth=2;
        ctx.save(); ctx.translate(-16,5); ctx.rotate(spin);
        for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(5,0); ctx.stroke(); }
        ctx.restore();
      }
      // handle
      ctx.strokeStyle="#555"; ctx.lineWidth=3; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(12,-4); ctx.lineTo(20,-16); ctx.lineTo(14,-16); ctx.stroke();
      ctx.restore();
    }
  }

  function drawHelmetShape(type){
    // drawn centered at origin (helmet only, no head)
    if(type==="cone"){
      ctx.fillStyle="#e08a2e"; ctx.beginPath(); ctx.moveTo(-13,13); ctx.lineTo(13,13); ctx.lineTo(0,-15); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="#b96d1c"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,5); ctx.lineTo(8,5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4,-3); ctx.lineTo(4,-3); ctx.stroke();
    } else if(type==="bucket"){
      ctx.fillStyle="#b8bcc4"; roundRect(-15,-12,30,24,4); ctx.fill();
      ctx.fillStyle="#9aa0aa"; roundRect(-15,8,30,5,2); ctx.fill();
      ctx.fillStyle="#d6dade"; roundRect(-12,-9,5,18,2); ctx.fill();
    } else if(type==="ironclad"){
      ctx.fillStyle="#9aa0aa"; ctx.beginPath(); ctx.arc(0,0,15,Math.PI,0); ctx.fill();
      ctx.fillStyle="#7e848c"; roundRect(-16,-2,32,12,3); ctx.fill();
      ctx.fillStyle="#2a2e33"; roundRect(-12,2,24,4,2); ctx.fill();
      ctx.fillStyle="#c0392b"; ctx.beginPath(); ctx.moveTo(0,-15); ctx.quadraticCurveTo(8,-26,3,-30); ctx.quadraticCurveTo(1,-20,-2,-15); ctx.closePath(); ctx.fill();
    } else if(type==="football"){
      ctx.fillStyle="#7a2b2b"; ctx.beginPath(); ctx.arc(0,0,15,Math.PI,0); ctx.fill();
      ctx.fillStyle="#a83b3b"; ctx.beginPath(); ctx.arc(0,0,15,Math.PI,1.3*Math.PI); ctx.fill();
      ctx.fillStyle="#fff"; ctx.fillRect(-2,-15,4,9);
      ctx.strokeStyle="#dcdcdc"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-14,4); ctx.lineTo(14,4); ctx.stroke();
    }
  }
  function drawDebris(){
    for(const d of debris){
      ctx.save();
      ctx.globalAlpha = d.t > d.life-1 ? Math.max(0, d.life-d.t) : 1;   // fade out last 1s
      // ground shadow when landed
      if(d.landed){ ctx.fillStyle="rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(d.x, d.groundY+8, 16, 4, 0, 0, Math.PI*2); ctx.fill(); }
      ctx.translate(d.x, d.y); ctx.rotate(d.rot);
      drawHelmetShape(d.type);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }

  function drawBeams(){
    for(const b of beams){
      const a = 1 - b.t/b.life;
      const cy = cellCenterY(b.r);
      ctx.save();
      ctx.globalAlpha = a;
      // 能量极光: 横贯整行的发光光束(从Boss向左)
      const g = ctx.createLinearGradient(GRID.x, cy, b.x, cy);
      g.addColorStop(0, "rgba(180,120,255,0)");
      g.addColorStop(0.5, "rgba(150,90,255,0.85)");
      g.addColorStop(1, "rgba(220,180,255,0.95)");
      ctx.fillStyle = g;
      const h = 22 + Math.sin(b.t*40)*4;
      ctx.fillRect(GRID.x-4, cy-h/2, b.x-GRID.x, h);
      ctx.fillStyle="rgba(255,255,255,"+(a*0.7)+")"; ctx.fillRect(GRID.x-4, cy-3, b.x-GRID.x, 6);
      ctx.restore();
    }
  }
  // 矢量盾牌图标(内含闪电), 无 emoji
  function drawShieldGlyph(cx,cy,s,fill,stroke){
    ctx.beginPath();
    ctx.moveTo(cx, cy-s);
    ctx.lineTo(cx+s*0.85, cy-s*0.55);
    ctx.lineTo(cx+s*0.85, cy+s*0.22);
    ctx.quadraticCurveTo(cx+s*0.8, cy+s*0.85, cx, cy+s*1.12);
    ctx.quadraticCurveTo(cx-s*0.8, cy+s*0.85, cx-s*0.85, cy+s*0.22);
    ctx.lineTo(cx-s*0.85, cy-s*0.55);
    ctx.closePath();
    if(fill){ ctx.fillStyle=fill; ctx.fill(); }
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.stroke(); }
    // 内部闪电
    ctx.beginPath();
    ctx.moveTo(cx+s*0.12, cy-s*0.5);
    ctx.lineTo(cx-s*0.26, cy+s*0.08);
    ctx.lineTo(cx-s*0.02, cy+s*0.08);
    ctx.lineTo(cx-s*0.14, cy+s*0.62);
    ctx.lineTo(cx+s*0.30, cy-s*0.04);
    ctx.lineTo(cx+s*0.04, cy-s*0.04);
    ctx.closePath();
    ctx.fillStyle="#ffe96b"; ctx.fill();
  }
  // 闪电护盾: 围绕单株植物的电护罩 + 跳动闪电弧
  function drawLightningShield(x,y,r){
    const t=performance.now();
    ctx.save();
    const pulse=0.5+0.5*Math.sin(t/120);
    const g=ctx.createRadialGradient(x,y,r*0.35,x,y,r);
    g.addColorStop(0,"rgba(120,200,255,0)");
    g.addColorStop(0.72,"rgba(120,200,255,"+(0.08+0.05*pulse).toFixed(3)+")");
    g.addColorStop(1,"rgba(150,220,255,"+(0.30+0.12*pulse).toFixed(3)+")");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(185,232,255,"+(0.55+0.3*pulse).toFixed(3)+")"; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
    // 闪电弧线
    ctx.strokeStyle="rgba(210,242,255,.92)"; ctx.lineWidth=1.6;
    ctx.shadowColor="#9fd8ff"; ctx.shadowBlur=6;
    const arcs=3;
    for(let a=0;a<arcs;a++){
      const base=t/170 + a*Math.PI*2/arcs;
      ctx.beginPath();
      const segs=6;
      for(let i=0;i<=segs;i++){
        const ang=base + i/segs*1.25;
        const jag=(i%2? 0.16 : -0.06) + 0.05*Math.sin(t/40 + i + a*2);
        const rr=r*(0.92 + jag);
        const px=x+Math.cos(ang)*rr, py=y+Math.sin(ang)*rr;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawShields(){
    for(let r=0;r<ROWS;r++){
      if(rowShield[r]>0){
        const cy=cellY(r), pulse=0.5+0.5*Math.sin(performance.now()/120);
        ctx.save();
        ctx.fillStyle="rgba(120,200,255,"+(0.06+0.04*pulse).toFixed(3)+")";
        ctx.fillRect(GRID.x, cy, COLS*GRID.cw, GRID.ch);
        ctx.fillStyle="rgba(200,235,255,.9)"; ctx.font="bold 13px 'PingFang SC',Arial"; ctx.textAlign="left"; ctx.textBaseline="middle";
        ctx.fillText("无敌护盾", GRID.x+6, cy+12);
        ctx.restore();
        // 给本行每株植物套上闪电护盾
        for(const p of plants){ if(p.r===r && p.hp>0) drawLightningShield(p.x, p.y-2, 32); }
      }
      if(rowBerserk[r]>0){
        const cy=cellY(r), pulse=0.5+0.5*Math.sin(performance.now()/90);
        ctx.save();
        ctx.fillStyle="rgba(255,120,50,"+(0.10+0.08*pulse).toFixed(3)+")";
        ctx.fillRect(GRID.x, cy, COLS*GRID.cw, GRID.ch);
        ctx.strokeStyle="rgba(255,150,70,"+(0.5+0.3*pulse).toFixed(3)+")"; ctx.lineWidth=3;
        ctx.strokeRect(GRID.x+1, cy+1, COLS*GRID.cw-2, GRID.ch-2);
        ctx.fillStyle="rgba(255,225,190,.95)"; ctx.font="bold 14px 'PingFang SC',Arial"; ctx.textAlign="right"; ctx.textBaseline="middle";
        ctx.fillText("狂暴", GRID.x+COLS*GRID.cw-6, cy+12);
        ctx.restore();
      }
    }
  }
  function drawMashes(){
    for(const m of mashes){
      const a = Math.min(1, (m.life-m.t)/1.5);           // fade out near end
      const cy = cellCenterY(m.r)+18;
      ctx.save(); ctx.globalAlpha = 0.75*a;
      ctx.fillStyle="#c2a25a"; ctx.beginPath(); ctx.ellipse(m.x, cy, m.w*0.46, 16, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="#a8853f"; ctx.beginPath(); ctx.ellipse(m.x-6, cy+2, m.w*0.30, 9, 0, 0, Math.PI*2); ctx.fill();
      // bubbles
      ctx.fillStyle="#d8bd7a";
      for(let i=0;i<4;i++){ const bx=m.x-18+i*12, by=cy-3+Math.sin(m.t*4+i)*2; ctx.beginPath(); ctx.arc(bx,by,2.2,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawLawn(){
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      ctx.fillStyle = (r+c)%2===0 ? "#a4d84a" : "#8ecb3c";
      ctx.fillRect(cellX(c), cellY(r), GRID.cw, GRID.ch);
    }
    if((selected||shovelMode) && mouse.y>GRID.y){
      const c=colAtX(mouse.x), r=rowAtY(mouse.y);
      if(c>=0&&r>=0){
        ctx.fillStyle = shovelMode ? "rgba(255,120,40,.25)" : "rgba(255,255,255,.25)";
        ctx.fillRect(cellX(c),cellY(r),GRID.cw,GRID.ch);
      }
    }
  }

  // ---- generic plant art dispatcher ----
  function drawPlantArt(type, x, y, t, recoil, hpFrac, iconMode){
    if(type==="sunflower") drawSunflowerArt(x,y,t);
    else if(type==="peashooter") drawPeashooterArt(x,y,t,recoil,"#6cc24a");
    else if(type==="snowpea") drawSnowpeaArt(x,y,t,recoil,0);
    else if(type==="repeater") drawRepeaterArt(x,y,t,recoil);
    else if(type==="threepeater") drawThreepeaterArt(x,y,t,recoil);
    else if(type==="cactus") drawCactusArt(x,y,t,recoil,false);
    else if(type==="bigcactus") drawCactusArt(x,y,t,recoil,true);
    else if(type==="jalapeno") drawJalapenoArt(x,y,t);
    else if(type==="campfire") drawCampfireArt(x,y,t,0);
    else if(type==="wallnut") drawWallnutArt(x,y,hpFrac==null?1:hpFrac);
    else if(type==="potatoshield") drawPotatoShieldArt(x,y,hpFrac==null?1:hpFrac,0);
    else if(type==="cherrybomb") drawCherryArt(x,y,t);
    else if(type==="potatomine") drawMineArt(x,y,iconMode?true:undefined);
  }

  function drawPlant(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    if(p.fused) drawFuseHalo(p.fuseLevel);   // 融合: 脚下椭圆光环(颜色随融合等级)
    const bob = Math.sin(p.t*2 + p.c)*2;
    ctx.translate(0, bob);
    // 终极向日葵: 金光笼罩
    if(p.glowT>0){
      const a = Math.min(1, p.glowT/1.4);
      const pulse = 0.55+0.45*Math.sin(p.t*9);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(0,0,4, 0,0,40);
      g.addColorStop(0, "rgba(255,238,150,"+(0.55*a).toFixed(3)+")");
      g.addColorStop(0.6, "rgba(255,215,80,"+(0.28*a*pulse).toFixed(3)+")");
      g.addColorStop(1, "rgba(255,215,80,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,40,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="rgba(255,245,180,"+(0.5*a*pulse).toFixed(3)+")"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(0,0,32+3*pulse,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // 狂暴状态: 红橙能量光环 + 跳动火花
    if(rowBerserk[p.r]>0){
      const t2=performance.now()/1000, pl=0.5+0.5*Math.sin(t2*14);
      ctx.save(); ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(0,-4,3,0,-4,30);
      g.addColorStop(0,"rgba(255,180,70,"+(0.30*pl+0.14).toFixed(3)+")");
      g.addColorStop(0.6,"rgba(255,95,30,"+(0.18*pl).toFixed(3)+")");
      g.addColorStop(1,"rgba(255,95,30,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-4,30,0,Math.PI*2); ctx.fill();
      // 环绕能量火花
      ctx.strokeStyle="rgba(255,210,120,"+(0.5+0.4*pl).toFixed(3)+")"; ctx.lineWidth=2;
      for(let i=0;i<5;i++){ const a=t2*4 + i*Math.PI*2/5; const r1=20, r2=27+3*Math.sin(t2*9+i);
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*r1, -4+Math.sin(a)*r1); ctx.lineTo(Math.cos(a)*r2, -4+Math.sin(a)*r2); ctx.stroke(); }
      ctx.restore();
    }
    if((p.type==="cherrybomb"||p.type==="jalapeno") && p.fuse<0.5){ const s=1+(0.5-p.fuse)*0.6; ctx.scale(s,s); }
    if(p.type==="potatomine") drawMineArt(0,0,false,p.armed);
    else if(p.type==="sunflower"){
      // 初始幼苗较小, 随升级逐步长大; 融合后更大
      let gs = 0.62 + 0.38*Math.min(p.up||0,7)/7;
      if(p.fused) gs *= 1.18;
      ctx.save(); ctx.translate(0,(1-gs)*22); ctx.scale(gs,gs);   // 以根部为锚, 向上长高
      drawSunflowerArt(0,0,p.t,p.up,p.branch,p.fused);
      ctx.restore();
      // 等级标签紧贴花头顶部(花头最高花瓣约在 local -47, 随生长缩放)
      const topY = (1-gs)*22 + (-47)*gs;
      drawSunflowerBadge(p, topY);
      // 可融合 / 可二合一 提示
      if(fusionEligible(p) || refusionEligible(p)){
        const pl=0.5+0.5*Math.sin(p.t*6);
        ctx.save(); ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
        const txt = p.fused ? "✨ 可二合一" : "✨ 可融合"; const bw=ctx.measureText(txt).width+10;
        ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw/2,topY-30,bw,14,6); ctx.fill();
        ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,topY-23);
        ctx.restore();
      }
    }
    else if(p.type==="potatoshield") drawPotatoShieldArt(0,0,p.hp/p.maxHp,p.up);
    else if(p.type==="snowpea") drawSnowpeaArt(0,0,p.t,p.recoil||0,p.up);
    else if(p.type==="campfire") drawCampfireArt(0,0,p.t,p.up);
    else if(p.type==="peashooter"||p.type==="repeater"||p.type==="threepeater"){
      const ps = p.type==="peashooter" ? 0.82 : (p.type==="threepeater" ? 1.2 : 1.0);  // 一豆小·二豆中·三豆大
      ctx.save(); ctx.translate(0, 36*(1-ps)); ctx.scale(ps,ps);   // 以根部为锚
      drawPlantArt(p.type, 0,0, p.t, p.recoil||0, p.hp/p.maxHp, false);
      ctx.restore();
    }
    else drawPlantArt(p.type, 0,0, p.t, p.recoil||0, p.hp/p.maxHp, false);
    // 三豆射手 / 寒冰 升级等级角标 / 融合王冠 / 可融合提示
    if(p.up>0 && (p.type==="threepeater" || p.type==="snowpea")){
      if(p.fused){
        // 不再戴王冠(底部椭圆光环表示融合等级); 可二次融合时给提示
        if(refusionEligible(p)){
          const pl=0.5+0.5*Math.sin(p.t*6);
          ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
          const txt="✨ 可二合一", bw2=ctx.measureText(txt).width+10;
          ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw2/2,-50,bw2,14,6); ctx.fill();
          ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,-43);
        }
      } else {
        const lbl = nextUpgradeCost(p)===null ? "Lv MAX" : (p.type==="threepeater" ? "x"+(1+0.4*p.up).toFixed(1) : "Lv"+p.up);
        ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
        const bw=ctx.measureText(lbl).width+10;
        ctx.fillStyle="rgba(0,0,0,.6)"; roundRect(-bw/2,-46,bw,13,5); ctx.fill();
        ctx.fillStyle = p.type==="threepeater" ? "#caff9a" : "#bfe9fb";
        ctx.fillText(lbl, 0, -39);
        if(fusionEligible(p)){
          const pl=0.5+0.5*Math.sin(p.t*6);
          ctx.font="bold 10px 'PingFang SC',Arial"; const txt="✨ 可融合", bw2=ctx.measureText(txt).width+10;
          ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw2/2,-64,bw2,14,6); ctx.fill();
          ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,-57);
        }
      }
    }
    // 巨仙掌 地刺就绪: 脚下泛起地刺微光
    if(p.type==="bigcactus" && (p.up||0)>=10 && p.spikeCd<=0){
      const pl=0.5+0.5*Math.sin(p.t*6);
      ctx.save();
      ctx.fillStyle="rgba(120,200,90,"+(0.18+0.14*pl).toFixed(3)+")";
      ctx.beginPath(); ctx.ellipse(0,40,22,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(180,240,150,"+(0.5+0.3*pl).toFixed(3)+")";
      for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*9-2,40); ctx.lineTo(i*9,40-5-3*pl); ctx.lineTo(i*9+2,40); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    // 篝火 / 巨仙掌 升级等级角标 (巨仙掌融合后不显示等级, 由光环表示)
    if(p.up>0 && (p.type==="campfire" || p.type==="bigcactus") && !p.fused){
      const lbl = nextUpgradeCost(p)===null ? "Lv MAX" : ("Lv"+p.up);
      ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const bw=ctx.measureText(lbl).width+10;
      ctx.fillStyle="rgba(0,0,0,.6)"; roundRect(-bw/2,-46,bw,13,5); ctx.fill();
      ctx.fillStyle = p.type==="campfire" ? "#ffc78a" : "#bdf0a0"; ctx.fillText(lbl, 0, -39);
    }
    // 巨仙掌 可融合 / 可二合一 提示
    if(p.type==="bigcactus" && (fusionEligible(p) || refusionEligible(p))){
      const pl=0.5+0.5*Math.sin(p.t*6);
      ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const txt = p.fused ? "✨ 可二合一" : "✨ 可融合", bw2=ctx.measureText(txt).width+10;
      ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw2/2,-50,bw2,14,6); ctx.fill();
      ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,-43);
    }
    // 钛金属土豆盾(融合) 王冠 / 可融合提示
    if(p.type==="potatoshield"){
      if(p.fused){
        const gp=0.5+0.5*Math.sin(p.t*5);
        ctx.save(); ctx.globalCompositeOperation="lighter";
        ctx.fillStyle="rgba(200,220,255,"+(0.16+0.1*gp).toFixed(3)+")"; ctx.beginPath(); ctx.arc(0,4,30,0,Math.PI*2); ctx.fill();
        ctx.restore();
        drawCrown(0,-24);
        if(refusionEligible(p)){
          const pl=0.5+0.5*Math.sin(p.t*6);
          ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
          const txt="✨ 可二合一", bw2=ctx.measureText(txt).width+10;
          ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw2/2,-44,bw2,14,6); ctx.fill();
          ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,-37);
        }
      } else if(fusionEligible(p)){
        const pl=0.5+0.5*Math.sin(p.t*6);
        ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
        const txt="✨ 可融合", bw2=ctx.measureText(txt).width+10;
        ctx.fillStyle="rgba(120,60,0,"+(0.7+0.3*pl).toFixed(2)+")"; roundRect(-bw2/2,-30,bw2,14,6); ctx.fill();
        ctx.fillStyle="#ffe680"; ctx.fillText(txt,0,-23);
      }
    }
    ctx.restore();
    if(p.kind!=="bomb") drawHealthBar(p.x, p.y+40, p.hp/p.maxHp, 40);
  }

  // ---------- individual plant arts ----------
  function drawSunIcon(x,y,r){
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle="#ffcf33"; ctx.beginPath();
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; const rr=i%2?r*1.45:r; ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffe680"; ctx.beginPath(); ctx.arc(0,0,r*0.78,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  const SF_ATK = ["#ffd23f","#ffc02e","#ffa61e","#ff8a1e","#ff6a1e","#ff4a2a"];   // 攻速分支 橙红
  const SF_HP  = ["#ffd23f","#bcd2e8","#9fc0e0","#82add6","#6f9fd0","#5b90c8"];   // 血量分支 蓝
  function drawSunflowerArt(x,y,t,up,branch,fused){
    up = up||0;
    ctx.save(); ctx.translate(x,y);
    const pulse = 0.5+0.5*Math.sin(t*5);
    // ---- aura rings (behind the flower) ----
    if(up>=7){ ctx.fillStyle="rgba(255,215,0,"+(0.16+0.12*pulse).toFixed(3)+")"; ctx.beginPath(); ctx.arc(0,-12,32+3*pulse,0,Math.PI*2); ctx.fill(); }
    if(up>=6 || (branch==="hp"&&up>=1)){ ctx.strokeStyle="rgba(120,205,120,"+(0.45+0.3*pulse).toFixed(3)+")"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,-12,28,0,Math.PI*2); ctx.stroke(); }
    if(branch==="atk"&&up>=1){ ctx.strokeStyle="rgba(90,200,255,"+(0.4+0.35*pulse).toFixed(3)+")"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-12,24,0,Math.PI*2); ctx.stroke(); }
    // stem + leaves
    ctx.strokeStyle="#4a9e2f"; ctx.lineWidth=7; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(0,34); ctx.lineTo(0,6); ctx.stroke();
    ctx.fillStyle="#5cb85c";
    ctx.beginPath(); ctx.ellipse(-14,24,12,6,-0.6,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14,28,12,6,0.6,0,Math.PI*2); ctx.fill();
    // petals (color shifts with tier/branch)
    let petal;
    if(up>=7) petal="#ffd700";
    else if(up>=6) petal="#a6bcd2";
    else petal = (branch==="hp"?SF_HP:SF_ATK)[Math.min(up,5)];
    ctx.save(); ctx.translate(0,-12); ctx.rotate(Math.sin(t*2)*0.08);
    ctx.fillStyle=petal;
    for(let i=0;i<12;i++){ ctx.save(); ctx.rotate(i/12*Math.PI*2);
      ctx.beginPath(); ctx.ellipse(0,-22,7,13,0,0,Math.PI*2); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = up>=6 ? "#7a5028" : "#a9742a"; ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = up>=7 ? "#e0a93a" : (up>=6 ? "#9c7a4a" : "#c98c34"); ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3a2a14";
    ctx.beginPath(); ctx.arc(-5,-2,2.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5,-2,2.4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#3a2a14"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,3,5,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
    ctx.restore();
    // 钢化/终极保留流派标识：分支色虚线环 + 角标徽章
    if(up>=6 && branch){
      const bcol = branch==="atk" ? "#5ac8ff" : "#5fd07a";
      ctx.save();
      ctx.strokeStyle=bcol; ctx.lineWidth=2.4; ctx.setLineDash&&ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.arc(0,-12,21,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash&&ctx.setLineDash([]);
      // 流派角标(右上): 矢量闪电(攻速) / 爱心(血量)
      ctx.translate(11,-23);
      ctx.fillStyle="rgba(10,22,34,.85)"; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=bcol; ctx.lineWidth=2; ctx.stroke();
      if(branch==="atk") drawBoltIcon(0,0,5); else drawHeartIcon(0,0,4.6);
      ctx.restore();
    }
    // 融合: 头戴王冠 + 光环
    if(fused){
      const pulse=0.5+0.5*Math.sin(t*5);
      ctx.save(); ctx.globalCompositeOperation="lighter";
      ctx.fillStyle="rgba(255,215,80,"+(0.18+0.12*pulse).toFixed(3)+")"; ctx.beginPath(); ctx.arc(0,-12,34+3*pulse,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // 王冠(花头顶部)
      ctx.save(); ctx.translate(0,-34);
      ctx.fillStyle="#ffd23f"; ctx.strokeStyle="#c8901a"; ctx.lineWidth=1.2;
      ctx.beginPath();
      ctx.moveTo(-13,4); ctx.lineTo(-13,-6); ctx.lineTo(-6,1); ctx.lineTo(0,-9); ctx.lineTo(6,1); ctx.lineTo(13,-6); ctx.lineTo(13,4); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle="#ff6b7a"; ctx.beginPath(); ctx.arc(0,-1,1.8,0,Math.PI*2); ctx.fill();   // 宝石
      ctx.fillStyle="#7fd0ff"; ctx.beginPath(); ctx.arc(-13,-6,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(13,-6,1.6,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  // 向日葵等级标签(在生长缩放之外绘制, 紧贴花头顶部)
  function drawSunflowerBadge(p, topY){
    if(!(p.up>0)) return;
    const up=p.up, branch=p.branch;
    const suffix = (up>=6 && branch) ? (branch==="atk"?"·攻速":"·血量") : "";
    const lbl = p.fused ? ("王冠"+(branch==="atk"?"·狂暴":"·回血")) : (up>=7?("终极"+suffix):(up>=6?("钢化"+suffix):((branch==="hp"?"血":"攻")+"Lv"+up)));
    ctx.save();
    ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    const bw=ctx.measureText(lbl).width+10;
    ctx.fillStyle="rgba(0,0,0,.62)"; roundRect(-bw/2, topY-13, bw, 13, 5); ctx.fill();
    ctx.fillStyle = up>=6 ? (branch==="atk"?"#9fe4ff":"#a7ecb8") : (branch==="hp"?"#bfe0ff":"#ffd2a0");
    ctx.fillText(lbl, 0, topY-6);
    ctx.restore();
  }

  function peaHead(headColor){
    ctx.fillStyle=headColor; ctx.beginPath(); ctx.arc(0,0,19,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(-4,-4,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3f8e2a"; ctx.beginPath(); ctx.ellipse(20,-2,9,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2e6b1c"; ctx.beginPath(); ctx.arc(26,-2,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#1f3a14"; ctx.beginPath(); ctx.arc(-2,-4,3,0,Math.PI*2); ctx.fill();
  }
  function drawSnowpeaArt(x,y,t,recoil,up){
    up = up||0;
    ctx.save(); ctx.translate(x,y);
    // 茎叶
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=8; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(0,36); ctx.lineTo(0,2); ctx.stroke();
    ctx.fillStyle="#4a9e2f"; ctx.beginPath(); ctx.ellipse(-13,26,11,5,-0.6,0,Math.PI*2); ctx.fill();
    // 等级越高头部越深越亮
    const headCol = up>=10 ? "#5aa6e6" : up>=5 ? "#6cc4ee" : "#7fcfee";
    ctx.save(); ctx.translate(recoil>0?-6:0,-8);
    peaHead(headCol);
    // 雪花火花(随等级增多并旋转)
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.6;
    const sparks = 3 + Math.min(up,6);
    for(let i=0;i<sparks;i++){ ctx.save(); ctx.translate(-4,-3); ctx.rotate(i*Math.PI*2/sparks + t*0.6);
      ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(5,0); ctx.stroke(); ctx.restore(); }
    // Lv5-9: 冰晶冠
    if(up>=5 && up<10){
      ctx.fillStyle="#e6f6fc"; ctx.strokeStyle="#afe0f2"; ctx.lineWidth=1;
      for(let i=-1;i<=1;i++){ const cx=i*9; ctx.beginPath(); ctx.moveTo(cx-3.5,-15); ctx.lineTo(cx,-26-(i===0?4:0)); ctx.lineTo(cx+3.5,-15); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    // Lv10(满级): 头戴魔法帽
    if(up>=10){
      const sway = Math.sin(t*1.5)*0.12;
      ctx.save(); ctx.translate(0,-17); ctx.rotate(sway);
      // 帽檐
      ctx.fillStyle="#3a2d6e"; ctx.beginPath(); ctx.ellipse(0,0,17,5.5,0,0,Math.PI*2); ctx.fill();
      // 帽锥(弯尖)
      const g=ctx.createLinearGradient(0,-46,0,0); g.addColorStop(0,"#6a52c8"); g.addColorStop(1,"#3f307e");
      ctx.fillStyle=g; ctx.beginPath();
      ctx.moveTo(-12,-1); ctx.quadraticCurveTo(-6,-30,10,-48); ctx.quadraticCurveTo(4,-26,12,-1); ctx.closePath(); ctx.fill();
      // 帽带
      ctx.fillStyle="#2a2050"; ctx.beginPath(); ctx.moveTo(-12,-4); ctx.quadraticCurveTo(0,0,12,-4); ctx.lineTo(11,-9); ctx.quadraticCurveTo(0,-5,-11,-9); ctx.closePath(); ctx.fill();
      // 星星点缀
      ctx.fillStyle="#cfe0ff"; star(-2,-20,2.4); star(4,-32,1.8);
      // 帽尖星
      ctx.fillStyle="#ffd23f"; star(10,-48,3.2);
      ctx.restore();
      // 魔法光环
      ctx.strokeStyle="rgba(150,200,255,"+(0.35+0.25*Math.sin(t*5)).toFixed(3)+")"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore(); ctx.restore();
  }
  // 小四角星
  function star(cx,cy,r){
    ctx.beginPath();
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const rr=i%2?r*0.42:r; ctx.lineTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr); }
    ctx.closePath(); ctx.fill();
  }
  function drawPeashooterArt(x,y,t,recoil,headColor){
    ctx.save(); ctx.translate(x,y);
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=8; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(0,36); ctx.lineTo(0,2); ctx.stroke();
    ctx.fillStyle="#4a9e2f"; ctx.beginPath(); ctx.ellipse(-13,26,11,5,-0.6,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(recoil>0?-6:0,-8); peaHead(headColor);
    if(headColor==="#7fcfee"){ // snow sparkle
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.6;
      for(let i=0;i<3;i++){ ctx.save(); ctx.translate(-4,-3); ctx.rotate(i*Math.PI/3);
        ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(4,0); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore(); ctx.restore();
  }
  function drawRepeaterArt(x,y,t,recoil){
    ctx.save(); ctx.translate(x,y);
    // stem
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=8; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-6,38); ctx.lineTo(-6,8); ctx.stroke();
    ctx.fillStyle="#4a9e2f"; ctx.beginPath(); ctx.ellipse(-18,28,11,5,-0.6,0,Math.PI*2); ctx.fill();
    const rx = recoil>0?-5:0;
    // ----- BACK head (upper-left, slightly smaller) -----
    ctx.save(); ctx.translate(-14+rx, -18); ctx.scale(0.92,0.92); peaHead("#4fa233"); ctx.restore();
    // short neck connecting the two heads
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=7; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-12,-14); ctx.lineTo(4,-2); ctx.stroke();
    // ----- FRONT head (lower-right) -----
    ctx.save(); ctx.translate(6+rx, -2); peaHead("#6cc24a"); ctx.restore();
    ctx.restore();
  }
  function drawThreepeaterArt(x,y,t,recoil){
    ctx.save(); ctx.translate(x,y);
    // thick stalk
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=9; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-8,38); ctx.lineTo(-8,6); ctx.stroke();
    ctx.fillStyle="#4a9e2f"; ctx.beginPath(); ctx.ellipse(-20,28,11,5,-0.6,0,Math.PI*2); ctx.fill();
    const rx = recoil>0?-4:0;
    // three stacked heads, all aiming forward (单行三连发)
    const heads=[{dx:2,dy:-16},{dx:5,dy:-1},{dx:2,dy:14}];
    ctx.strokeStyle="#3f8e2a"; ctx.lineWidth=6;
    for(const h of heads){ ctx.beginPath(); ctx.moveTo(-8,2); ctx.lineTo(h.dx-4,h.dy); ctx.stroke(); }
    for(const h of heads){ ctx.save(); ctx.translate(h.dx+rx,h.dy); ctx.scale(0.82,0.82); peaHead("#5cb83c"); ctx.restore(); }
    ctx.restore();
  }
  function drawCactusArt(x,y,t,recoil,big){
    ctx.save(); ctx.translate(x,y);
    if(big){ ctx.scale(1.18,1.18); }
    const colMain = big?"#3f7e33":"#4e9e3a", colLit = big?"#52a345":"#5fb84a";
    const rx = recoil>0?-3:0;
    // pot
    ctx.fillStyle="#c1703a"; roundRect(-12,26,24,12,3); ctx.fill();
    ctx.fillStyle="#a85d2e"; ctx.fillRect(-12,26,24,3);
    // main column
    ctx.fillStyle=colMain; roundRect(-9+rx,-22,18,50,9); ctx.fill();
    ctx.fillStyle=colLit; roundRect(-7+rx,-20,7,46,4); ctx.fill();
    // giant cactus: a flower on top
    if(big){
      ctx.fillStyle="#ff6f9c"; for(let i=0;i<6;i++){ ctx.save(); ctx.translate(0,-24); ctx.rotate(i/6*Math.PI*2); ctx.beginPath(); ctx.ellipse(0,-5,2.6,5,0,0,Math.PI*2); ctx.fill(); ctx.restore(); }
      ctx.fillStyle="#ffd23f"; ctx.beginPath(); ctx.arc(0,-24,2.6,0,Math.PI*2); ctx.fill();
    }
    // arms (L 形: 横段 + 竖段)
    ctx.fillStyle=colMain;
    roundRect(-22+rx,-4,13,6,3); ctx.fill();  roundRect(-22+rx,-18,6,18,3); ctx.fill();   // 左臂
    roundRect(12+rx,-8,12,6,3); ctx.fill();   roundRect(18+rx,-20,6,18,3); ctx.fill();    // 右臂
    // spikes
    ctx.strokeStyle="#2f6b22"; ctx.lineWidth=1.4;
    for(let i=-1;i<5;i++){ const yy=-18+i*8; ctx.beginPath(); ctx.moveTo(-9+rx,yy); ctx.lineTo(-13+rx,yy-2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(9+rx,yy); ctx.lineTo(13+rx,yy-2); ctx.stroke(); }
    // face + mouth (shooter)
    ctx.fillStyle="#1f3a14"; ctx.beginPath(); ctx.arc(-3+rx,-6,2.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3+rx,-6,2.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2e6b1c"; ctx.beginPath(); ctx.ellipse(11+rx,0,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawJalapenoArt(x,y,t){
    ctx.save(); ctx.translate(x,y);
    const glow=0.5+0.5*Math.sin(t*10);
    ctx.fillStyle="rgba(255,90,30,"+(0.18+0.18*glow).toFixed(3)+")";
    ctx.beginPath(); ctx.arc(0,4,26,0,Math.PI*2); ctx.fill();
    // curved red chili body
    ctx.fillStyle="#d8312f"; ctx.beginPath();
    ctx.moveTo(-16,-14); ctx.quadraticCurveTo(20,-18,18,14);
    ctx.quadraticCurveTo(16,30,2,30); ctx.quadraticCurveTo(-18,28,-16,-14); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ff5b59"; ctx.beginPath();
    ctx.moveTo(-10,-8); ctx.quadraticCurveTo(10,-10,10,10); ctx.quadraticCurveTo(8,20,-2,20); ctx.quadraticCurveTo(-12,18,-10,-8); ctx.closePath(); ctx.fill();
    // green stem
    ctx.strokeStyle="#5a7a2a"; ctx.lineWidth=5; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-14,-14); ctx.lineTo(-22,-26); ctx.stroke();
    ctx.fillStyle="#6fae3a"; ctx.beginPath(); ctx.ellipse(-15,-16,7,4,0.6,0,Math.PI*2); ctx.fill();
    // angry eyes
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(-2,2,3.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8,2,3.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#222"; ctx.beginPath(); ctx.arc(-1,3,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(9,3,1.6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawWallnutArt(x,y,frac){
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle="#c99761"; ctx.beginPath(); ctx.ellipse(0,4,22,30,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#b3814c"; ctx.beginPath(); ctx.ellipse(6,8,14,22,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#a06f3c"; ctx.beginPath(); ctx.ellipse(0,-24,7,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3a2a18";
    if(frac<0.4){
      ctx.beginPath(); ctx.arc(-7,-2,2.6,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(7,-2,2.6,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a2a18"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,12,5,1.1*Math.PI,1.9*Math.PI); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-7,-2,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(7,-2,3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a2a18"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,6,6,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
    }
    ctx.restore();
  }
  function drawCampfireArt(x,y,t,up){
    up = up||0; const lvl = Math.min(up,5), max = up>=5;
    const fs = 1 + 0.1*lvl;                  // 火焰随等级增高
    ctx.save(); ctx.translate(x,y);
    // 满级: 跳动火光光环
    if(max){
      const pl=0.5+0.5*Math.sin(t*8);
      ctx.save(); ctx.globalCompositeOperation="lighter";
      const g=ctx.createRadialGradient(0,-2,4,0,-2,34);
      g.addColorStop(0,"rgba(255,150,50,"+(0.22+0.12*pl).toFixed(3)+")");
      g.addColorStop(1,"rgba(255,120,40,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-2,34,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    // wooden stump / logs
    ctx.fillStyle="#6b4a2a"; roundRect(-20,14,40,16,5); ctx.fill();
    ctx.fillStyle="#5a3d22"; roundRect(-20,22,40,8,4); ctx.fill();
    ctx.strokeStyle="#7a5530"; ctx.lineWidth=6; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-16,24); ctx.lineTo(14,14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16,24); ctx.lineTo(-14,14); ctx.stroke();
    ctx.fillStyle="#caa15a";
    ctx.beginPath(); ctx.arc(-16,24,3.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(16,24,3.2,0,Math.PI*2); ctx.fill();
    // flames (随等级增高; 满级偏红更猛)
    const f1 = 1+Math.sin(t*9)*0.12, f2 = 1+Math.sin(t*13+1)*0.15;
    ctx.fillStyle = max ? "#ff3a14" : "#ff5a1e";
    ctx.beginPath(); ctx.moveTo(-14,16);
    ctx.quadraticCurveTo(-18,-4*fs, -4,-22*f1*fs);
    ctx.quadraticCurveTo(2,-6*fs, 6,-14*f2*fs);
    ctx.quadraticCurveTo(16,-2, 14,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffae3c";
    ctx.beginPath(); ctx.moveTo(-8,16);
    ctx.quadraticCurveTo(-10,-2*fs, -2,-14*f1*fs);
    ctx.quadraticCurveTo(3,-2*fs, 8,-8*f2*fs);
    ctx.quadraticCurveTo(12,0, 8,16); ctx.closePath(); ctx.fill();
    // 焰心: 普通黄白; 满级蓝白高温
    ctx.fillStyle = max ? "#dff0ff" : "#fff2b0";
    ctx.beginPath(); ctx.ellipse(0,4,5,9*f1*fs,0,0,Math.PI*2); ctx.fill();
    if(max){ ctx.fillStyle="#7fc4ff"; ctx.beginPath(); ctx.ellipse(0,10,3.4,6*f1,0,0,Math.PI*2); ctx.fill(); }  // 蓝色焰底
    // sparks
    ctx.fillStyle="#ffd27a";
    ctx.beginPath(); ctx.arc(-2+Math.sin(t*7)*4, -22*f1*fs, 1.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5+Math.sin(t*5)*3, -16*f2*fs, 1.3, 0, Math.PI*2); ctx.fill();
    // 满级: 上升余烬
    if(max){ ctx.fillStyle="#ffb14e";
      for(let i=0;i<3;i++){ const ph=(t*0.5+i/3)%1; ctx.globalAlpha=1-ph;
        ctx.beginPath(); ctx.arc(Math.sin(t*4+i*2)*7, 8-ph*44*fs, 1.5, 0, Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function drawPotatoShieldArt(x,y,frac,up){
    up = up||0; const cov = Math.min(up,10)/10;       // 0..1 钢铁覆盖比例
    ctx.save(); ctx.translate(x,y);
    // glow ring grows with level
    if(up>0){
      ctx.strokeStyle="rgba(150,175,210,"+(0.28+cov*0.4).toFixed(3)+")"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(0,2,30+cov*5,38+cov*5,0,0,Math.PI*2); ctx.stroke();
    }
    // potato body
    ctx.fillStyle="#8a5e30"; ctx.beginPath(); ctx.ellipse(0,2,26,34,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#9c6b3a"; ctx.beginPath(); ctx.ellipse(-3,0,22,30,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#7a5028"; ctx.beginPath(); ctx.ellipse(8,8,13,20,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#6b441f";
    [[-10,-12],[12,-4],[-6,14],[14,16],[2,-20]].forEach(s=>{
      ctx.beginPath(); ctx.ellipse(s[0],s[1],2.6,3.6,0.5,0,Math.PI*2); ctx.fill();
    });

    const steel = up>=10 ? "#cdd3db" : "#b8bcc4";
    const helmeted = up>=4;   // visor face once armor covers the head
    if(up===0){
      // bare potato face
      potatoFace(frac);
    } else {
      // ===== steel plating grows with level =====
      const plateH = 14 + cov*46;            // 14 -> 60 (covers more of the body)
      const plateY = 4 - plateH/2;
      const plateW = 48 + cov*6;
      ctx.fillStyle = steel; roundRect(-plateW/2, plateY, plateW, plateH, 7); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.30)"; ctx.fillRect(-plateW/2, plateY, plateW, 3);
      ctx.fillStyle="rgba(0,0,0,.14)";  ctx.fillRect(-plateW/2, plateY+plateH-3, plateW, 3);
      // riveted seams: more rows as it grows
      const rows = 1 + Math.floor(cov*3.5);
      ctx.fillStyle="#6b7079";
      for(let ri=0; ri<rows; ri++){
        const ry = plateY + 7 + (rows>1 ? ri*(plateH-14)/(rows-1) : (plateH-14)/2);
        ctx.fillStyle="rgba(0,0,0,.12)"; ctx.fillRect(-plateW/2+3, ry-3, plateW-6, 1.5);
        ctx.fillStyle="#6b7079";
        for(let bx=-18;bx<=18;bx+=9){ ctx.beginPath(); ctx.arc(bx, ry, 1.5, 0, Math.PI*2); ctx.fill(); }
      }
      // helmet dome on top (Lv4+)
      if(up>=4){
        ctx.fillStyle=steel; ctx.beginPath(); ctx.arc(0,-22,15,Math.PI,0); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.32)"; ctx.beginPath(); ctx.arc(0,-22,15,Math.PI,1.3*Math.PI); ctx.fill();
      }
      // shoulder side-plates (Lv7+)
      if(up>=7){
        ctx.fillStyle="#9aa0aa";
        ctx.beginPath(); ctx.ellipse(-25,8,7,13,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25,8,7,13,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.25)";
        ctx.beginPath(); ctx.ellipse(-25,4,7,5,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25,4,7,5,0,0,Math.PI*2); ctx.fill();
      }
      // crest (Lv10)
      if(up>=10){
        ctx.fillStyle="#c0392b"; ctx.beginPath();
        ctx.moveTo(0,-36); ctx.quadraticCurveTo(9,-50,3,-56); ctx.quadraticCurveTo(1,-44,-2,-38); ctx.closePath(); ctx.fill();
      }
      // face: visor slit when helmeted, else potato face peeking over the plate
      if(helmeted){
        ctx.fillStyle="#2a2e33"; roundRect(-13,-18,26,7,3); ctx.fill();
        ctx.fillStyle = frac<0.4 ? "#ff6a4a" : "#3a2a18";
        ctx.beginPath(); ctx.arc(-6,-14.5,2.4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6,-14.5,2.4,0,Math.PI*2); ctx.fill();
      } else {
        potatoFace(frac);
      }
    }
    // level badge
    if(up>0){
      const lbl="Lv"+up;
      ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const bw=ctx.measureText(lbl).width+10;
      ctx.fillStyle="rgba(0,0,0,.6)"; roundRect(-bw/2,-46,bw,13,5); ctx.fill();
      ctx.fillStyle="#cfe0f0"; ctx.fillText(lbl, 0, -39);
    }
    ctx.restore();
  }
  function potatoFace(frac){
    ctx.fillStyle="#3a2a18";
    if(frac<0.4){
      ctx.beginPath(); ctx.arc(-8,-14,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(8,-14,3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a2a18"; ctx.lineWidth=2.4;
      ctx.beginPath(); ctx.arc(0,-2,5,1.1*Math.PI,1.9*Math.PI); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-8,-14,3.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(8,-14,3.4,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a2a18"; ctx.lineWidth=2.4; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(-13,-20); ctx.lineTo(-4,-17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13,-20); ctx.lineTo(4,-17); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-7,7,0.12*Math.PI,0.88*Math.PI); ctx.stroke();
    }
  }
  function drawCherryArt(x,y,t){
    ctx.save(); ctx.translate(x,y);
    // stems
    ctx.strokeStyle="#5a7a2a"; ctx.lineWidth=3; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-8,-2); ctx.lineTo(-2,-22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,-2); ctx.lineTo(4,-22); ctx.stroke();
    ctx.fillStyle="#5cb85c"; ctx.beginPath(); ctx.ellipse(8,-22,6,3,0.5,0,Math.PI*2); ctx.fill();
    const pulse = 1+Math.sin(t*12)*0.05;
    for(const cx of [-9,9]){
      ctx.save(); ctx.translate(cx,6); ctx.scale(pulse,pulse);
      ctx.fillStyle="#d8312f"; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ff5b59"; ctx.beginPath(); ctx.arc(-4,-4,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(-5,-2,2.6,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5,-2,2.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#222"; ctx.beginPath(); ctx.arc(-4,-2,1.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6,-2,1.3,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function drawMineArt(x,y,iconMode,armed){
    ctx.save(); ctx.translate(x,y);
    // potato body
    ctx.fillStyle="#b58a4c"; ctx.beginPath(); ctx.ellipse(0,10,22,15,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#9c733a"; ctx.beginPath(); ctx.ellipse(6,13,12,9,0,0,Math.PI*2); ctx.fill();
    if(iconMode || armed){
      // mine top exposed
      ctx.fillStyle="#444"; ctx.beginPath(); ctx.ellipse(0,2,10,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#e0413f"; ctx.beginPath(); ctx.arc(0,-2,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ff908e"; ctx.beginPath(); ctx.arc(-1,-3,1.5,0,Math.PI*2); ctx.fill();
    } else {
      // unarmed: just sprout, eyes closed
      ctx.strokeStyle="#5a7a2a"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(0,-8); ctx.stroke();
      ctx.fillStyle="#5cb85c"; ctx.beginPath(); ctx.ellipse(0,-9,4,2.5,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#3a2a18"; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(-6,8,2.5,0,Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(6,8,2.5,0,Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFuseHalo(level){
    const L = Math.min(Math.max(level||1,1), 6);
    const t = performance.now()/1000, pulse=0.5+0.5*Math.sin(t*3);
    const cy = 42, topCol = FUSE_HALO[L-1];
    const rwOf = i => 15 + (i-1)*6 + pulse*1.2;   // 内圈(Lv1白圈)较小, 每层向外+6
    ctx.save();
    // 柔光底盘(随最外圈大小)
    ctx.globalAlpha = 0.22+0.12*pulse;
    ctx.fillStyle = topCol; const orw=rwOf(L); ctx.beginPath(); ctx.ellipse(0, cy, orw+4, (orw+4)*0.38, 0, 0, Math.PI*2); ctx.fill();
    // 一圈圈叠加: Lv1(白,最内最小) -> LvL(最外), 每层一个本级颜色的圈
    for(let i=1;i<=L;i++){
      const col=FUSE_HALO[i-1], rw=rwOf(i), rh=rw*0.38;
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, cy, rw, rh, 0, 0, Math.PI*2); ctx.stroke();
      // 上弧白色高光(深色圈也清晰)
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, cy, rw, rh, 0, Math.PI*1.05, Math.PI*1.95); ctx.stroke();
    }
    // 升腾螺旋光点(带白芯, 用最高级颜色)
    for(let i=0;i<6;i++){
      const ph=(t*0.7+i/6)%1, ang=t*2.2+i*1.05, rad=(orw-4)*(1-ph*0.5), sz=2.4*(1-ph*0.5);
      const px=Math.cos(ang)*rad, py=cy - ph*48;
      ctx.globalAlpha = (1-ph)*0.95;
      ctx.fillStyle = topCol; ctx.beginPath(); ctx.arc(px,py, sz, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(px,py, sz*0.45, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
  function drawCrown(x,y){
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle="#ffd23f"; ctx.strokeStyle="#c8901a"; ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(-13,4); ctx.lineTo(-13,-6); ctx.lineTo(-6,1); ctx.lineTo(0,-9); ctx.lineTo(6,1); ctx.lineTo(13,-6); ctx.lineTo(13,4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle="#ff6b7a"; ctx.beginPath(); ctx.arc(0,-1,1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#7fd0ff"; ctx.beginPath(); ctx.arc(-13,-6,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(13,-6,1.6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function drawBeanbombs(){
    for(const bb of beanbombs){
      ctx.save(); ctx.translate(bb.x, bb.y); ctx.rotate(bb.rot);
      // 火焰拖尾光晕
      ctx.save(); ctx.globalCompositeOperation="lighter";
      ctx.fillStyle="rgba(255,120,30,.5)"; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // 巨型豌豆(绿核+火焰外壳)
      ctx.fillStyle="#ff5a1e"; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#6cc24a"; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffb14e"; ctx.beginPath(); ctx.arc(-3,-3,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff2c2"; ctx.beginPath(); ctx.arc(-4,-4,2,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  function drawFootballs(){
    for(const fb of footballs){
      ctx.save(); ctx.translate(fb.x, fb.y); ctx.rotate(fb.rot);
      // 橄榄球: 棕色椭球 + 白色缝线
      ctx.fillStyle="#7a3a22"; ctx.beginPath(); ctx.ellipse(0,0,11,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#9a4a2a"; ctx.beginPath(); ctx.ellipse(-2,-2,5,3.4,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#f0e8d8"; ctx.lineWidth=1.4; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.stroke();
      for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*3,-2.5); ctx.lineTo(i*3,2.5); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawPea(pea){
    ctx.save(); ctx.translate(pea.x,pea.y);
    if(pea.spike){
      if((pea.dir||1)<0) ctx.scale(-1,1);   // 向后发射的尖刺翻转朝向
      if(pea.barrage){
        // 暴雨梨花: 粉白花瓣穿刺 + 白色拖光(高轨·辨识度)
        ctx.fillStyle="rgba(255,210,230,.55)"; ctx.beginPath(); ctx.ellipse(-11,0,11,3.2,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#ffd8e8"; ctx.beginPath(); ctx.moveTo(13,0); ctx.lineTo(-9,-4.5); ctx.lineTo(-9,4.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(13,0); ctx.lineTo(1,-2.2); ctx.lineTo(1,2.2); ctx.closePath(); ctx.fill();
        ctx.restore(); return;
      }
      // 尖刺：细长锥形, 火焰尖刺为橙色
      const body = pea.fire?"#ff7a1e":"#caa15a", tip = pea.fire?"#ffd27a":"#e6d2a0";
      if(pea.fire){ ctx.fillStyle="rgba(255,150,40,.5)"; ctx.beginPath(); ctx.ellipse(-10,0,9,3,0,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle=body; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-8,-4); ctx.lineTo(-8,4); ctx.closePath(); ctx.fill();
      ctx.fillStyle=tip; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(2,-2); ctx.lineTo(2,2); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if(pea.fire){
      const ig = pea.ignite;                 // 点燃弹: 更猛烈
      const fl = 1+Math.sin(performance.now()/60)*0.25;
      const dir = (pea.dir||1);
      // 外焰光晕(发光叠加)
      ctx.save(); ctx.globalCompositeOperation="lighter";
      ctx.fillStyle = ig ? "rgba(255,120,30,.55)" : "rgba(255,150,40,.4)";
      ctx.beginPath(); ctx.arc(0,0,(ig?13:10)*fl,0,Math.PI*2); ctx.fill();
      // 拖尾火舌
      ctx.fillStyle = ig ? "rgba(255,90,20,.6)" : "rgba(255,150,40,.45)";
      ctx.beginPath(); ctx.ellipse(-dir*9,0,(ig?12:8)*fl,(ig?5:4),0,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // 核心 (点燃弹: 蓝白高温焰心, 与满级篝火呼应)
      ctx.fillStyle="#ff5a1e"; ctx.beginPath(); ctx.arc(0,0,ig?10:9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffb14e"; ctx.beginPath(); ctx.arc(0,0,ig?6.5:5.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle= ig?"#dff0ff":"#fff2c2"; ctx.beginPath(); ctx.arc(-1,-1,ig?3.4:2.5,0,Math.PI*2); ctx.fill();
      if(ig){
        ctx.fillStyle="#7fc4ff"; ctx.beginPath(); ctx.arc(0,1,1.8,0,Math.PI*2); ctx.fill();   // 蓝色焰心
        // 顶部跳动小火苗
        ctx.fillStyle="rgba(255,220,120,.9)";
        const h=6+3*Math.sin(performance.now()/50);
        ctx.beginPath(); ctx.moveTo(-3,-6); ctx.quadraticCurveTo(0,-6-h,3,-6); ctx.closePath(); ctx.fill();
        // 环绕余烬
        const e=performance.now()/120;
        ctx.fillStyle="rgba(255,170,70,.9)";
        ctx.beginPath(); ctx.arc(Math.cos(e)*11, Math.sin(e)*7, 1.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(Math.cos(e+3.1)*11, Math.sin(e+3.1)*7, 1.2, 0, Math.PI*2); ctx.fill();
      }
    } else {
      ctx.fillStyle = pea.freeze?"#5bc0e8":"#3fae3f";
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = pea.freeze?"#bfe9fb":"#73d873";
      ctx.beginPath(); ctx.arc(-2,-2,3,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- zombies ----------
  function drawSpider(z){
    const frozen = z.freezeT>0;
    // silk thread from the sky
    ctx.strokeStyle="rgba(255,255,255,.5)"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(z.x, TOPBAR_H-6); ctx.lineTo(z.x, z.y-12); ctx.stroke();
    // carried plant dangling below
    if(z.carry){
      ctx.save(); ctx.translate(z.x, z.y+20); ctx.scale(0.5,0.5); ctx.globalAlpha=0.95;
      try{ drawPlantArt(z.carry.type,0,0,0,0,1,true); }catch(e){}
      ctx.restore();
    }
    ctx.save(); ctx.translate(z.x, z.y);
    const sk = frozen ? "#7fa6b8" : "#3a2f3a";
    // legs (4 each side, bent)
    ctx.strokeStyle = frozen ? "#8fb6c8" : "#241c24"; ctx.lineWidth=2.4; ctx.lineCap="round";
    const wig = Math.sin(z.t*8)*2;
    for(let i=0;i<4;i++){
      const ly = -6 + i*5;
      ctx.beginPath(); ctx.moveTo(-6,ly); ctx.lineTo(-15,ly-4+wig); ctx.lineTo(-20,ly+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,ly); ctx.lineTo(15,ly-4-wig); ctx.lineTo(20,ly+3); ctx.stroke();
    }
    // body
    ctx.fillStyle=sk; ctx.beginPath(); ctx.ellipse(0,4,11,13,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = frozen ? "#9ec6d6" : "#4a3a4a"; ctx.beginPath(); ctx.arc(0,-8,8,0,Math.PI*2); ctx.fill();
    // red eyes
    ctx.fillStyle="#ff5a3a"; ctx.beginPath(); ctx.arc(-3,-9,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3,-9,2,0,Math.PI*2); ctx.fill();
    // hourglass mark
    ctx.fillStyle="#c0392b"; ctx.beginPath(); ctx.moveTo(-3,0); ctx.lineTo(3,0); ctx.lineTo(-3,8); ctx.lineTo(3,8); ctx.closePath(); ctx.fill();
    if(frozen){ ctx.fillStyle="rgba(150,220,250,.4)"; roundRect(-16,-18,32,36,8); ctx.fill(); }
    ctx.restore();
    drawHealthBar(z.x, z.y-24, z.hp/z.maxHp, 30, "#c0392b");
  }
  function drawPangolin(z){
    const cy = cellCenterY(z.r), ground = cy + 30;
    const frozen = z.freezeT>0;
    const scale = (c1,c2)=> frozen ? c2 : c1;
    if(z.burrowing){
      // 地底潜行: 移动的土堆 + 土屑
      ctx.save(); ctx.translate(z.x, ground);
      ctx.fillStyle="#7a5c34"; ctx.beginPath(); ctx.ellipse(0,0,26,12,0,Math.PI,0); ctx.fill();
      ctx.fillStyle="#9c7a4a"; ctx.beginPath(); ctx.ellipse(-2,-2,20,9,0,Math.PI,0); ctx.fill();
      // 拱起的甲背尖端
      ctx.fillStyle="#6b5230"; ctx.beginPath(); ctx.moveTo(-8,-4); ctx.lineTo(0,-12); ctx.lineTo(8,-4); ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(z.x, z.y);
    const emerge = z.phase==="surface" ? (1 - z.surfT/0.5) : 1;   // 出土升起
    ctx.translate(0, (1-emerge)*26);
    const walk = z.phase==="walk" ? Math.sin(z.t*7) : 0;
    // 腿
    ctx.strokeStyle=scale("#6b4f2e","#7fa6b8"); ctx.lineWidth=5; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-8,14); ctx.lineTo(-12+walk*4,30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,14); ctx.lineTo(12-walk*4,30); ctx.stroke();
    // 尾巴(右后)
    ctx.strokeStyle=scale("#8a6a3c","#8fb6c8"); ctx.lineWidth=7; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(14,8); ctx.quadraticCurveTo(30,10,34,-6); ctx.stroke();
    // 头(左前, 尖吻)
    ctx.fillStyle=scale("#caa46a","#b6cdd6"); ctx.beginPath(); ctx.ellipse(-16,-2,11,8,-0.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=scale("#9c7a4a","#9ec0cc"); ctx.beginPath(); ctx.moveTo(-22,-2); ctx.lineTo(-30,1); ctx.lineTo(-22,4); ctx.closePath(); ctx.fill();  // 尖吻
    ctx.fillStyle="#2a1a10"; ctx.beginPath(); ctx.arc(-18,-4,1.8,0,Math.PI*2); ctx.fill();   // 眼
    // 厚甲背壳(层叠鳞片)
    const shellAlive = z.hp > z.bodyMax+0.5;
    ctx.save();
    ctx.fillStyle=scale(shellAlive?"#7a5c34":"#b08a52", "#8aa6b2");
    ctx.beginPath(); ctx.ellipse(2,-6,20,16,0,0,Math.PI*2); ctx.fill();
    if(shellAlive){
      ctx.strokeStyle="#5a4222"; ctx.lineWidth=1.6;
      for(let i=0;i<4;i++){ const rr=18-i*3.6; ctx.beginPath(); ctx.arc(2,-6+i*1.5,rr,Math.PI*0.9,Math.PI*0.1,true); ctx.stroke(); }
      // 鳞片高光
      ctx.fillStyle="rgba(255,235,180,.25)"; ctx.beginPath(); ctx.ellipse(-4,-12,8,5,-0.4,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    if(frozen){ ctx.fillStyle="rgba(150,220,250,.38)"; roundRect(-30,-26,60,52,8); ctx.fill(); }
    ctx.restore();
    drawHealthBar(z.x, z.y-30, z.hp/z.maxHp, 38, "#c0392b");
  }
  function drawGiantRider(z){
    const slowed = z.slowT>0 || z.freezeT>0;
    ctx.save(); ctx.translate(z.x, z.y); ctx.scale(2.0,2.0);
    const walk = z.eating?0:Math.sin(z.t*4);
    const hide = slowed?"#9fc6cf":"#6b5440";
    // 战马腿
    ctx.strokeStyle=slowed?"#8ab2bb":"#4a3a2a"; ctx.lineWidth=4; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-14,8); ctx.lineTo(-16+walk*3,26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8,8); ctx.lineTo(-6-walk*3,26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10,8); ctx.lineTo(12+walk*3,26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16,8); ctx.lineTo(18-walk*3,26); ctx.stroke();
    // 马身
    ctx.fillStyle=hide; ctx.beginPath(); ctx.ellipse(0,2,20,11,0,0,Math.PI*2); ctx.fill();
    // 颈+头(朝左)
    ctx.beginPath(); ctx.moveTo(-16,-2); ctx.lineTo(-26,-14); ctx.lineTo(-20,-16); ctx.lineTo(-12,-4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-26,-15,6,4,-0.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ff5a3a"; ctx.beginPath(); ctx.arc(-27,-16,1.4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#3a2a1a"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-18,-10); ctx.lineTo(-10,-2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20,-2); ctx.lineTo(28,8); ctx.stroke();   // 尾
    // 骑乘巨人(上半身)
    ctx.save(); ctx.translate(2,-10);
    const gskin=slowed?"#9fc6cf":"#62804a", gskin2=slowed?"#8ab2bb":"#4f6a3a", shirt=slowed?"#7e93b2":"#4a3a2a";
    ctx.fillStyle=shirt; roundRect(-10,-6,20,20,5); ctx.fill();
    ctx.strokeStyle=gskin; ctx.lineWidth=5; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(-6,-2); ctx.lineTo(-16,2); ctx.stroke();
    ctx.fillStyle=gskin; ctx.beginPath(); ctx.arc(0,-14,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=gskin2; ctx.beginPath(); ctx.arc(3,-13,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1a10"; ctx.beginPath(); ctx.arc(-3,-15,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3,-15,1.6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#8a6a3a"; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(-18,4); ctx.lineTo(-34,-12); ctx.stroke();   // 长矛
    ctx.fillStyle="#c0c6d0"; ctx.beginPath(); ctx.moveTo(-34,-12); ctx.lineTo(-29,-10); ctx.lineTo(-31,-16); ctx.closePath(); ctx.fill();
    ctx.restore();
    if(z.freezeT>0){ ctx.fillStyle="rgba(150,220,250,.35)"; roundRect(-32,-30,62,60,8); ctx.fill(); }
    ctx.restore();
    drawHealthBar(z.x, z.y-58, z.hp/z.maxHp, 72, "#c0392b");
  }
  function drawArmorBoss(z){
    const slowed = z.slowT>0 || z.freezeT>0;
    ctx.save(); ctx.translate(z.x, z.y); ctx.scale(2.3,2.3);
    // 轮
    ctx.fillStyle="#2a2e33";
    [-16,0,16].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,18,8,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle="#555"; [-16,0,16].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,18,3,0,Math.PI*2); ctx.fill(); });
    // 车体
    ctx.fillStyle=slowed?"#8ea2b0":"#5c6b78";
    ctx.beginPath(); ctx.moveTo(-26,16); ctx.lineTo(26,16); ctx.lineTo(22,0); ctx.lineTo(-22,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle=slowed?"#aebcc8":"#76889a"; ctx.fillRect(-22,2,44,4);
    ctx.fillStyle="#3a4450"; for(let rx=-18;rx<=18;rx+=9){ ctx.beginPath(); ctx.arc(rx,12,1.4,0,Math.PI*2); ctx.fill(); }
    // 前斜装甲(左迎敌)
    ctx.fillStyle=slowed?"#9fb0bc":"#6b7c8a"; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-31,14); ctx.lineTo(-26,16); ctx.lineTo(-22,16); ctx.closePath(); ctx.fill();
    // 车顶巨人
    ctx.save(); ctx.translate(2,-2);
    const gskin=slowed?"#9fc6cf":"#62804a", gskin2=slowed?"#8ab2bb":"#4f6a3a", shirt=slowed?"#7e93b2":"#3a2a1a";
    ctx.fillStyle=shirt; roundRect(-12,-8,24,12,5); ctx.fill();
    ctx.fillStyle=gskin; ctx.beginPath(); ctx.arc(0,-16,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=gskin2; ctx.beginPath(); ctx.arc(4,-15,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1a10"; ctx.beginPath(); ctx.arc(-4,-17,1.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4,-17,1.8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#2a1a10"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-8,-20); ctx.lineTo(-2,-18); ctx.moveTo(8,-20); ctx.lineTo(2,-18); ctx.stroke();
    ctx.strokeStyle=gskin; ctx.lineWidth=5; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(-10,-4); ctx.lineTo(-18,2); ctx.stroke();
    ctx.restore();
    if(z.freezeT>0){ ctx.fillStyle="rgba(150,220,250,.35)"; roundRect(-36,-30,72,52,8); ctx.fill(); }
    ctx.restore();
    drawHealthBar(z.x, z.y-64, z.hp/z.maxHp, 88, "#c0392b");
  }
  function drawGriffin(z){
    const slowed = z.slowT>0 || z.freezeT>0;
    // 地面投影(强调飞行)
    ctx.save(); ctx.fillStyle="rgba(0,0,0,.15)";
    ctx.beginPath(); ctx.ellipse(z.x, cellCenterY(z.r)+28, 22, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(z.x, z.y); ctx.scale(1.7,1.7);
    const flap = Math.sin(z.t*8);
    const fur=slowed?"#9fc6cf":"#c89a4a", fur2=slowed?"#8ab2bb":"#a87f34", feather=slowed?"#aebcc8":"#8a6a3a";
    // 远侧翼
    ctx.save(); ctx.translate(4,-2); ctx.rotate(-0.5+flap*0.3);
    ctx.fillStyle=feather; ctx.beginPath(); ctx.ellipse(10,-2,16,7,0.3,0,Math.PI*2); ctx.fill(); ctx.restore();
    // 狮身
    ctx.fillStyle=fur; ctx.beginPath(); ctx.ellipse(0,2,16,9,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=fur2; ctx.lineWidth=4; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(10,8); ctx.lineTo(13,16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,9); ctx.lineTo(7,16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15,2); ctx.quadraticCurveTo(26,0,26,10); ctx.stroke();   // 尾
    ctx.fillStyle=fur2; ctx.beginPath(); ctx.arc(26,11,3,0,Math.PI*2); ctx.fill();
    // 鹰头颈(朝左)
    ctx.fillStyle=feather; ctx.beginPath(); ctx.moveTo(-12,-2); ctx.lineTo(-22,-10); ctx.lineTo(-14,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle=slowed?"#dfeef5":"#e8e0d0"; ctx.beginPath(); ctx.arc(-22,-11,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ffcf33"; ctx.beginPath(); ctx.moveTo(-27,-11); ctx.lineTo(-33,-9); ctx.lineTo(-27,-7); ctx.closePath(); ctx.fill();  // 喙
    ctx.fillStyle="#2a1a10"; ctx.beginPath(); ctx.arc(-23,-12,1.4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#ffcf33"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-8,8); ctx.lineTo(-10,16); ctx.stroke();   // 前爪
    // 近侧翼(大, 拍动)
    ctx.save(); ctx.translate(-2,-4); ctx.rotate(-0.7+flap*0.5);
    ctx.fillStyle=feather; ctx.beginPath(); ctx.ellipse(8,0,20,9,0.2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=fur2; ctx.lineWidth=1; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(2+i*6,-4); ctx.lineTo(4+i*6,6); ctx.stroke(); }
    ctx.restore();
    // 骑手(僵尸)
    ctx.save(); ctx.translate(2,-10);
    const sk=slowed?"#9fc6cf":"#8fb06a", sk2=slowed?"#8ab2bb":"#7a9e5e", shirt=slowed?"#7e93b2":"#6d7a8a";
    ctx.fillStyle=shirt; roundRect(-6,-4,12,12,4); ctx.fill();
    ctx.strokeStyle=sk; ctx.lineWidth=3; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(-12,2); ctx.stroke();
    ctx.fillStyle=sk; ctx.beginPath(); ctx.arc(0,-9,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=sk2; ctx.beginPath(); ctx.arc(2,-8,3.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1a10"; ctx.beginPath(); ctx.arc(-2,-10,1.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(2,-10,1.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
    if(z.freezeT>0){ ctx.fillStyle="rgba(150,220,250,.35)"; roundRect(-32,-26,60,50,8); ctx.fill(); }
    ctx.restore();
    drawHealthBar(z.x, z.y-40, z.hp/z.maxHp, 56, "#c0392b");
  }
  function drawZombie(z){
    if(z.type==="spider"){ drawSpider(z); return; }
    if(z.type==="pangolin"){ drawPangolin(z); return; }
    if(z.type==="giantrider"){ drawGiantRider(z); return; }
    if(z.type==="armorboss"){ drawArmorBoss(z); return; }
    if(z.type==="griffin"){ drawGriffin(z); return; }
    ctx.save(); ctx.translate(z.x, z.y);
    if(z.big) ctx.scale(1.95,1.95);               // 巨人放大
    if(z.slowT>0||z.freezeT>0){ ctx.save(); } // marker; tint handled per part via slow flag
    const slowed = z.slowT>0 || z.freezeT>0;
    const vault = z.vaultAnim>0 ? Math.sin((1-z.vaultAnim/0.5)*Math.PI)*22 : 0;
    ctx.translate(0, -vault);
    const walk = z.eating?0:Math.sin(z.t*(z.big?3:6));
    ctx.rotate(z.eating? Math.sin(z.t*12)*0.06 : walk*0.04);

    let skin = slowed ? "#9fc6cf" : "#8fb06a";
    let skin2 = slowed ? "#8ab2bb" : "#7a9e5e";
    let shirt = slowed ? "#7e93b2" : "#6d7a8a";
    if(z.type==="gargantuar" && !slowed){ skin="#62804a"; skin2="#4f6a3a"; shirt="#4a3a2a"; }
    if(z.type==="irongarg" && !slowed){ skin="#5c7846"; skin2="#48623a"; shirt="#3a3030"; }    // 钢盔巨人: 暗绿肤 + 深灰甲衣
    if(z.type==="football" && !slowed){ shirt="#9a3a3a"; }
    if(z.type==="mingzombie" && !slowed){ skin="#d6a060"; skin2="#b87f44"; shirt="#e08a1e"; }   // 鸣人: 橙黄
    if(z.type==="witch" && !slowed){ skin="#9c7ab0"; skin2="#7e5d92"; shirt="#5a3d72"; }        // 女巫: 紫
    if(z.buffActive){ shirt="#a14de0"; }   // 被女巫增益: 紫色光环底

    // legs
    ctx.strokeStyle=skin2; ctx.lineWidth=7; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-4,18); ctx.lineTo(-8+walk*5,40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,18); ctx.lineTo(10-walk*5,40); ctx.stroke();
    // body
    ctx.fillStyle=shirt; roundRect(-14,-12,28,32,8); ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.12)"; roundRect(-14,4,28,10,4); ctx.fill();
    // arms
    ctx.strokeStyle=skin; ctx.lineWidth=6;
    const arm = z.eating? Math.sin(z.t*12)*4 : 0;
    ctx.beginPath(); ctx.moveTo(-8,-4); ctx.lineTo(-22,2+arm); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22,2+arm); ctx.lineTo(-30,-2+arm); ctx.stroke();
    // pole for vaulter
    if(z.type==="polevault" && !z.vaulted){
      ctx.strokeStyle="#caa15a"; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(-18,-30); ctx.lineTo(-26,44); ctx.stroke();
    }
    // head
    ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(0,-22,15,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=skin2; ctx.beginPath(); ctx.arc(4,-20,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2a1a10";
    ctx.beginPath(); ctx.arc(-5,-24,2.6,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3,-24,2.6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#2a1a10"; ctx.lineWidth=2; ctx.beginPath();
    if(z.eating) ctx.arc(-1,-16,4,0,Math.PI*2); else { ctx.moveTo(-6,-15); ctx.lineTo(2,-15); }
    ctx.stroke();
    // accessory (armor falls off once armor HP is depleted -> becomes a normal zombie)
    const armorAlive = z.hp > z.bodyMax + 0.5;
    if(armorAlive && z.type==="cone"){
      ctx.fillStyle="#e08a2e"; ctx.beginPath();
      ctx.moveTo(-13,-32); ctx.lineTo(13,-32); ctx.lineTo(0,-58); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="#b96d1c"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-8,-40); ctx.lineTo(8,-40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4,-48); ctx.lineTo(4,-48); ctx.stroke();
    } else if(armorAlive && z.type==="bucket"){
      ctx.fillStyle="#b8bcc4"; roundRect(-15,-50,30,24,4); ctx.fill();
      ctx.fillStyle="#9aa0aa"; roundRect(-15,-30,30,6,2); ctx.fill();
      ctx.fillStyle="#d6dade"; roundRect(-12,-47,5,18,2); ctx.fill();
    } else if(armorAlive && z.type==="ironclad"){
      // shoulder armor plates
      ctx.fillStyle="#8a9099"; ctx.beginPath(); ctx.ellipse(-13,-6,8,7,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13,-6,8,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#aab0b8"; ctx.beginPath(); ctx.ellipse(-13,-8,8,4,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13,-8,8,4,0,0,Math.PI*2); ctx.fill();
      // full knight helmet over the head
      ctx.fillStyle="#9aa0aa"; ctx.beginPath(); ctx.arc(0,-22,18,Math.PI,0); ctx.fill();
      ctx.fillStyle="#c2c7cf"; ctx.beginPath(); ctx.arc(0,-22,18,Math.PI,1.25*Math.PI); ctx.fill();
      ctx.fillStyle="#7e848c"; roundRect(-18,-24,36,16,3); ctx.fill();   // face guard
      // visor slit
      ctx.fillStyle="#2a2e33"; roundRect(-13,-19,26,4,2); ctx.fill();
      ctx.fillStyle="#ff5a3a"; // glowing eyes through slit
      ctx.beginPath(); ctx.arc(-6,-17,1.8,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6,-17,1.8,0,Math.PI*2); ctx.fill();
      // rivets + plume
      ctx.fillStyle="#6b7079";
      for(let rx=-12;rx<=12;rx+=8){ ctx.beginPath(); ctx.arc(rx,-9,1.4,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle="#c0392b"; ctx.beginPath();
      ctx.moveTo(0,-40); ctx.quadraticCurveTo(10,-52,4,-58); ctx.quadraticCurveTo(2,-48,-2,-42); ctx.closePath(); ctx.fill();
    } else if(armorAlive && z.type==="football"){
      // football helmet + facemask
      ctx.fillStyle="#7a2b2b"; ctx.beginPath(); ctx.arc(0,-23,17,Math.PI,0); ctx.fill();
      ctx.fillStyle="#a83b3b"; ctx.beginPath(); ctx.arc(0,-23,17,Math.PI,1.3*Math.PI); ctx.fill();
      ctx.fillStyle="#fff"; ctx.fillRect(-2,-40,4,10);            // helmet stripe
      ctx.strokeStyle="#dcdcdc"; ctx.lineWidth=2;                 // facemask
      ctx.beginPath(); ctx.moveTo(-15,-19); ctx.lineTo(15,-19); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13,-14); ctx.lineTo(13,-14); ctx.stroke();
      ctx.fillStyle="#fff"; ctx.font="bold 9px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("07", 0, 6);                                   // jersey number
    } else if(z.type==="gargantuar" || z.type==="irongarg"){
      // brute club over the shoulder
      ctx.strokeStyle="#6e4a28"; ctx.lineWidth=6; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(10,-4); ctx.lineTo(30,-32); ctx.stroke();
      ctx.fillStyle = z.type==="irongarg" ? "#7c7c84" : "#8a5e30"; roundRect(24,-50,17,24,5); ctx.fill();
      ctx.fillStyle = z.type==="irongarg" ? "#5c5c66" : "#6e4a28";
      ctx.beginPath(); ctx.arc(29,-44,2.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(35,-36,2.4,0,Math.PI*2); ctx.fill();
      // angry brow
      ctx.strokeStyle="#2a1a10"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(-10,-28); ctx.lineTo(-2,-25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10,-28); ctx.lineTo(2,-25); ctx.stroke();
      // 钢盔巨人: 头戴钢盔 + 肩甲 + 红羽
      if(z.type==="irongarg"){
        // 肩甲
        ctx.fillStyle="#8a9099"; ctx.beginPath(); ctx.ellipse(-15,-6,9,8,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(15,-6,9,8,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#aab0b8"; ctx.beginPath(); ctx.ellipse(-15,-9,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(15,-9,9,4,0,0,Math.PI*2); ctx.fill();
        // 钢盔
        ctx.fillStyle="#9aa0aa"; ctx.beginPath(); ctx.arc(0,-22,20,Math.PI,0); ctx.fill();
        ctx.fillStyle="#c2c7cf"; ctx.beginPath(); ctx.arc(0,-22,20,Math.PI,1.25*Math.PI); ctx.fill();
        ctx.fillStyle="#7e848c"; roundRect(-20,-24,40,17,3); ctx.fill();
        // 面甲缝
        ctx.fillStyle="#2a2e33"; roundRect(-14,-19,28,4,2); ctx.fill();
        ctx.fillStyle="#ff5a3a";
        ctx.beginPath(); ctx.arc(-6,-17,2.2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6,-17,2.2,0,Math.PI*2); ctx.fill();
        // 铆钉
        ctx.fillStyle="#6b7079";
        for(let rx=-14;rx<=14;rx+=8){ ctx.beginPath(); ctx.arc(rx,-9,1.6,0,Math.PI*2); ctx.fill(); }
        // 红色羽冠
        ctx.fillStyle="#c0392b"; ctx.beginPath();
        ctx.moveTo(0,-42); ctx.quadraticCurveTo(12,-56,5,-62); ctx.quadraticCurveTo(2,-50,-2,-44); ctx.closePath(); ctx.fill();
      }
    } else if(z.type==="shieldgiant"){
      // 怒眉
      ctx.strokeStyle="#2a1a10"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(-10,-28); ctx.lineTo(-2,-25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10,-28); ctx.lineTo(2,-25); ctx.stroke();
      // 右肩甲
      ctx.fillStyle="#7c828c"; ctx.beginPath(); ctx.ellipse(15,-6,9,8,0,0,Math.PI*2); ctx.fill();
      if(z.shieldHp>0){
        const frac = Math.max(0, z.shieldHp/(z.shieldMax||1));
        // 大盾(heater shield)挡在身前左侧, 只能被穿刺打破
        ctx.save(); ctx.translate(-30,-4);
        ctx.fillStyle="#8a929e";
        ctx.beginPath();
        ctx.moveTo(-12,-32); ctx.lineTo(12,-32); ctx.lineTo(12,12);
        ctx.quadraticCurveTo(12,30,0,38); ctx.quadraticCurveTo(-12,30,-12,12); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle="#5b626c"; ctx.lineWidth=3; ctx.stroke();
        ctx.fillStyle="#aab1bb"; ctx.fillRect(-2,-30,4,60);                              // 中脊
        ctx.fillStyle="#c7ccd4"; ctx.beginPath(); ctx.arc(0,-2,5,0,Math.PI*2); ctx.fill(); // 盾心
        ctx.fillStyle="#6b7079"; ctx.beginPath(); ctx.arc(0,-2,2.4,0,Math.PI*2); ctx.fill();
        // 裂纹随耐久下降
        ctx.strokeStyle="#3a3f47"; ctx.lineWidth=1.4;
        if(frac<0.66){ ctx.beginPath(); ctx.moveTo(-6,-24); ctx.lineTo(2,-8); ctx.lineTo(-4,6); ctx.stroke(); }
        if(frac<0.33){ ctx.beginPath(); ctx.moveTo(8,-18); ctx.lineTo(0,-2); ctx.lineTo(8,16); ctx.stroke(); }
        ctx.restore();
      }
    } else if(z.type==="screendoor" && z.doorHp>0){
      // 铁门挡在身前(僵尸朝左走, 左侧迎着豌豆) — 免疫豌豆射击, 仅穿刺/火焰/爆炸可破
      ctx.fillStyle="#aab0b8"; roundRect(-26,-30,12,52,3); ctx.fill();
      ctx.fillStyle="#c2c7cf"; ctx.fillRect(-18,-30,4,52);
      ctx.fillStyle="#7e848c"; ctx.fillRect(-26,-6,12,3);
      ctx.fillStyle="#6b7079"; ctx.beginPath(); ctx.arc(-20,-2,2,0,Math.PI*2); ctx.fill();
    } else if(z.type==="balloon"){
      // 头顶气球 + 提线
      ctx.strokeStyle="#7a6a3a"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(-2,-44); ctx.stroke();
      ctx.fillStyle="#d8413f"; ctx.beginPath(); ctx.ellipse(-2,-58,15,18,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ff6b69"; ctx.beginPath(); ctx.ellipse(-7,-63,5,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#b53330"; ctx.beginPath(); ctx.moveTo(-2,-41); ctx.lineTo(-6,-45); ctx.lineTo(2,-45); ctx.closePath(); ctx.fill();
    } else if(z.type==="mingzombie"){
      // 鸣人Boss: 胸前"鸣"字 + 头带
      ctx.fillStyle="#1f2a44"; roundRect(-15,-30,30,8,3); ctx.fill();   // 头带
      ctx.fillStyle="#c0c6d0"; ctx.beginPath(); ctx.arc(0,-26,3.4,0,Math.PI*2); ctx.fill();  // 头带金属片
      ctx.fillStyle="#fff5e0"; roundRect(-10,-6,20,20,3); ctx.fill();   // 胸前白牌
      ctx.fillStyle="#b22"; ctx.font="bold 16px 'PingFang SC',sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("鸣", 0, 5);
      // 周身能量光环
      ctx.strokeStyle="rgba(180,120,255,"+(0.4+0.3*Math.sin(z.t*6))+")"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,-12,24,0,Math.PI*2); ctx.stroke();
    } else if(z.type==="witch"){
      // 女巫尖帽 + 扫帚
      ctx.fillStyle="#3a2150"; ctx.beginPath(); ctx.moveTo(-15,-30); ctx.lineTo(15,-30); ctx.lineTo(2,-60); ctx.closePath(); ctx.fill();
      ctx.fillStyle="#4a2d68"; roundRect(-17,-32,34,6,3); ctx.fill();   // 帽檐
      ctx.fillStyle="#ffd23f"; ctx.beginPath(); ctx.moveTo(-2,-44); for(let i=0;i<5;i++){const a=i/5*Math.PI*2; ctx.lineTo(-2+Math.cos(a)*3, -44+Math.sin(a)*3);} ctx.fill(); // 帽上小星
      ctx.strokeStyle="#7a5530"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-22,-2); ctx.lineTo(-30,18); ctx.stroke(); // 扫帚柄
      ctx.fillStyle="#caa15a"; ctx.beginPath(); ctx.ellipse(-31,20,5,8,0.4,0,Math.PI*2); ctx.fill();
    }
    if(z.buffActive){   // 女巫增益光环
      ctx.strokeStyle="rgba(199,125,255,"+(0.5+0.3*Math.sin(z.t*8))+")"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(0,-8,22,0,Math.PI*2); ctx.stroke();
    }
    if(z.invulnT>0){   // 出场无敌: 金色护罩
      const pulse=0.5+0.5*Math.sin(performance.now()/110);
      ctx.save();
      const g=ctx.createRadialGradient(0,-8,8,0,-8,30);
      g.addColorStop(0,"rgba(255,235,140,0)");
      g.addColorStop(0.7,"rgba(255,225,110,"+(0.10+0.07*pulse).toFixed(3)+")");
      g.addColorStop(1,"rgba(255,210,80,"+(0.32+0.14*pulse).toFixed(3)+")");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-8,30,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="rgba(255,240,170,"+(0.6+0.3*pulse).toFixed(3)+")"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(0,-8,29,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle="rgba(255,245,190,.95)"; ctx.font="bold 11px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("无敌 "+Math.ceil(z.invulnT)+"s", 0, -44);
      ctx.restore();
    }
    // frozen overlay: icy block + frost
    if(z.freezeT>0){
      ctx.fillStyle="rgba(150,220,250,.38)"; roundRect(-20,-44,40,86,8); ctx.fill();
      ctx.strokeStyle="rgba(220,245,255,.7)"; ctx.lineWidth=2; ctx.beginPath(); roundRect(-20,-44,40,86,8); ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.85)"; ctx.font="14px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("❄", 0, -30);
    }
    if(z.slowT>0||z.freezeT>0){ ctx.restore(); }
    // 灼伤火焰: 跳动的火舌 + 橙色光晕
    if(z.burnT>0 && z.freezeT<=0){
      ctx.save();
      ctx.globalCompositeOperation="lighter";
      const fl = performance.now()/90;
      ctx.fillStyle="rgba(255,120,30,.18)"; ctx.beginPath(); ctx.arc(0,-14,26,0,Math.PI*2); ctx.fill();
      for(let i=0;i<3;i++){
        const fx=(i-1)*9, sw=1+0.4*Math.sin(fl*1.7+i), h=20+8*Math.sin(fl+i*2);
        const grd=ctx.createLinearGradient(fx,-20-h,fx,4);
        grd.addColorStop(0,"rgba(255,238,120,0)"); grd.addColorStop(0.4,"rgba(255,180,40,.85)"); grd.addColorStop(1,"rgba(255,90,20,.9)");
        ctx.fillStyle=grd; ctx.beginPath();
        ctx.moveTo(fx-6*sw,4); ctx.quadraticCurveTo(fx-7*sw,-12,fx,-20-h);
        ctx.quadraticCurveTo(fx+7*sw,-12,fx+6*sw,4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    drawHealthBar(z.x, z.y - (z.big?98:50), z.hp/z.maxHp, z.big?64:34, "#c0392b");
    if(z.shieldHp>0) drawHealthBar(z.x, z.y - (z.big?108:60), z.shieldHp/z.shieldMax, z.big?64:34, "#8aa6c8");
  }

  function drawHealthBar(cx, cy, frac, w, color){
    if(frac>=1) return; frac=Math.max(0,frac);
    ctx.save();
    ctx.fillStyle="rgba(0,0,0,.35)"; ctx.fillRect(cx-w/2, cy, w, 5);
    ctx.fillStyle = color || (frac>0.5?"#5cb85c":frac>0.25?"#f0ad4e":"#d9534f");
    ctx.fillRect(cx-w/2, cy, w*frac, 5);
    ctx.restore();
  }

  function drawSuns(){
    for(const s of suns){
      ctx.save(); ctx.translate(s.x,s.y);
      ctx.scale(1+Math.sin(s.t*4)*0.04, 1+Math.sin(s.t*4)*0.04);
      if(s.life<2.5) ctx.globalAlpha=.4+0.6*Math.abs(Math.sin(s.t*6));
      drawSunIcon(0,0,16); ctx.restore();
    }
  }
  // 地刺: 在攻击目标格钻出一根巨型仙人掌(斜向前, 升起→回落)
  function drawGroundSpikes(){
    for(const g of gspikes){
      const cy = cellY(g.r) + GRID.ch;          // 地面线
      const prog = g.t/g.life;
      const rise = Math.sin(Math.min(1,prog)*Math.PI); // 0→1→0
      const H = 140 * rise;                      // 巨型高度
      if(H>=2){
        const WB = 28;                           // 基部宽度
        ctx.save(); ctx.translate(g.x, cy+6); ctx.rotate(0.34);   // 斜向前(朝僵尸来向)
        // 主刺体
        const grd=ctx.createLinearGradient(0,0,0,-H);
        grd.addColorStop(0,"#2e6b22"); grd.addColorStop(0.5,"#4f9e3a"); grd.addColorStop(1,"#7fce52");
        ctx.fillStyle=grd;
        ctx.beginPath();
        ctx.moveTo(-WB*0.5,10); ctx.lineTo(WB*0.5,10); ctx.lineTo(WB*0.16,-H); ctx.lineTo(-WB*0.16,-H); ctx.closePath(); ctx.fill();
        // 棱线
        ctx.strokeStyle="rgba(40,90,30,.5)"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-H); ctx.stroke();
        // 尖端
        ctx.fillStyle="#cdf5ac"; ctx.beginPath(); ctx.moveTo(-WB*0.16,-H); ctx.lineTo(WB*0.16,-H); ctx.lineTo(0,-H-18); ctx.closePath(); ctx.fill();
        // 成对侧刺
        ctx.strokeStyle="#2e6b22"; ctx.lineWidth=3.4; ctx.lineCap="round";
        for(let k=1;k<=5;k++){ const yy=-H*k/6, w=WB*0.5*(1-k/7);
          ctx.beginPath(); ctx.moveTo(-w,yy); ctx.lineTo(-w-14,yy-10); ctx.moveTo(w,yy); ctx.lineTo(w+14,yy-10); ctx.stroke(); }
        ctx.restore();
      }
      // 钻出尘土
      if(prog<0.35 && Math.random()<0.6) spawnParticles(g.x+Math.random()*36-18, cy-2, "#b9a06a", 2, 160);
    }
  }
  function drawExplosions(){
    for(const e of explosions){
      const a = 1 - e.t/e.life;
      ctx.save(); ctx.globalAlpha = a*0.7;
      const g = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);
      g.addColorStop(0,"#fff2c2"); g.addColorStop(0.5,e.color); g.addColorStop(1,"rgba(255,90,30,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  function drawParticles(){
    for(const p of particles){
      ctx.globalAlpha=Math.max(0,1-p.t/p.life); ctx.fillStyle=p.color;
      if(p.shard){
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        if(p.shape==="square"){
          const s=p.size*1.1; ctx.fillRect(-s/2,-s/2,s,s);
          ctx.fillStyle="rgba(255,255,255,.35)"; ctx.fillRect(-s/2,-s/2,s,s*0.32);  // metal glint
        } else {
          ctx.beginPath(); ctx.moveTo(0,-p.size); ctx.lineTo(p.size,p.size*0.6); ctx.lineTo(-p.size*0.8,p.size*0.5); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      } else if(p.rain){
        // 冰雨: 竖向流光条
        ctx.save(); ctx.strokeStyle=p.color; ctx.lineWidth=p.size*0.8; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*0.02, p.y-Math.min(16,p.vy*0.03)); ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }
  function drawFloats(){
    ctx.save();
    ctx.font="bold 16px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    for(const f of floats){
      const a = Math.max(0, 1 - f.t/f.life);
      ctx.globalAlpha = a;
      ctx.lineWidth=3; ctx.strokeStyle="rgba(20,40,20,"+(0.6*a).toFixed(3)+")";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle=f.color||"#7fe88a";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function drawSelectionGhost(){
    if(shovelMode){
      ctx.save(); ctx.translate(mouse.x, mouse.y-4); ctx.rotate(-0.4); ctx.scale(1.1,1.1);
      ctx.strokeStyle="#7a5a32"; ctx.lineWidth=5; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,8); ctx.stroke();
      ctx.fillStyle="#b8bcc4";
      ctx.beginPath(); ctx.moveTo(-9,8); ctx.lineTo(9,8); ctx.lineTo(7,20); ctx.quadraticCurveTo(0,26,-7,20); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if(!selected) return;
    const c=colAtX(mouse.x), r=rowAtY(mouse.y);
    if(c>=0&&r>=0){
      ctx.save(); ctx.globalAlpha=.55; ctx.translate(cellCenterX(c), cellCenterY(r));
      drawPlantArt(selected,0,0,0,0,1,false); ctx.restore();
    }
  }

  function drawPotatoSkillUI(p){
    const rc = potatoSkillRects(p);
    const t = performance.now()/1000;
    // 自动/手动 小开关
    const m = rc.mode;
    ctx.save();
    ctx.fillStyle = autoSkill ? "rgba(60,150,90,.9)" : "rgba(40,40,55,.82)";
    roundRect(m.x, m.y, m.w, m.h, 7); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.35)"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#fff"; ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(autoSkill?"自动":"手动", m.x+m.w/2, m.y+m.h/2+0.5);
    ctx.restore();
    // 技能图标 / 蓄力进度
    const ic = rc.icon, cx=ic.x+ic.w/2, cy=ic.y+ic.h/2, r=ic.w/2;
    ctx.save();
    if(p.skillReady){
      const pulse=0.5+0.5*Math.sin(t*6);
      ctx.save(); ctx.globalCompositeOperation="lighter";
      ctx.fillStyle="rgba(150,210,255,"+(0.3+0.3*pulse).toFixed(3)+")"; ctx.beginPath(); ctx.arc(cx,cy,r+5+2*pulse,0,Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.fillStyle="rgba(40,90,150,.94)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#bfe0ff"; ctx.lineWidth=2; ctx.stroke();
      drawShieldGlyph(cx, cy-1, r*0.6, "#dff0ff", "#7fb8e8");
      ctx.fillStyle="rgba(190,224,255,.95)"; ctx.font="bold 9px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("点击释放", cx, cy-r-7);
    } else {
      const frac = 1 - Math.max(0, Math.min(1, p.skillCd/20));
      ctx.fillStyle="rgba(20,30,45,.5)"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="rgba(150,200,255,.3)"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r-1,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle="#7fc0ff"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r-1,-Math.PI/2, -Math.PI/2 + frac*Math.PI*2); ctx.stroke();
      ctx.globalAlpha=0.6; drawShieldGlyph(cx, cy-1, r*0.52, "#9fc4e8", null);
    }
    ctx.restore();
  }
  function drawHUD(){
    const best = Math.max(bestScore, Math.round(score));
    ctx.save();
    ctx.textBaseline="middle";
    // wave pill
    ctx.fillStyle="rgba(0,0,0,.32)"; roundRect(GRID.x, H-40, 150, 26, 8); ctx.fill();
    ctx.fillStyle="#ffd23f"; ctx.font="bold 16px 'PingFang SC',Arial"; ctx.textAlign="left";
    ctx.fillText("🌊 第 "+waveNum+" 波", GRID.x+12, H-27);
    // score
    ctx.fillStyle="rgba(0,0,0,.32)"; roundRect(GRID.x+162, H-40, 200, 26, 8); ctx.fill();
    ctx.fillStyle="#fff"; ctx.fillText("得分 "+fmtNum(score), GRID.x+174, H-27);
    // best
    ctx.fillStyle="rgba(0,0,0,.32)"; roundRect(GRID.x+374, H-40, 190, 26, 8); ctx.fill();
    ctx.fillStyle="#9be36b"; ctx.fillText("最高 "+fmtNum(best), GRID.x+386, H-27);
    // clock
    ctx.fillStyle="#cfe7f5"; ctx.font="13px 'PingFang SC',Arial";
    ctx.fillText("⏱ "+fmtClock(gameTime), GRID.x+572, H-27);
    ctx.restore();
  }

  function drawSpeedButton(){
    const s=SPEEDBTN;
    ctx.save();
    roundRect(s.x,s.y,s.w,s.h,8);
    ctx.fillStyle = gameSpeed>1 ? "#ff9d2e" : "rgba(0,0,0,.35)"; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle="#fff6"; ctx.stroke();
    ctx.fillStyle="#fff"; ctx.font="bold 14px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    const label = gameSpeed===1?"▶ 1x 正常":(gameSpeed===2?"▶▶ 2x 快进":"▶▶▶ 3x 快进");
    ctx.fillText(label, s.x+s.w/2, s.y+s.h/2);
    ctx.restore();
  }

  function showBanner(txt){ bannerText=txt; bannerTimer=2.2; }
  function drawWaveBanner(){
    if(bannerTimer>0){
      ctx.save(); ctx.globalAlpha=Math.min(1,bannerTimer);
      ctx.fillStyle="rgba(120,20,20,.85)"; const tw=400;
      roundRect(W/2-tw/2, H/2-40, tw, 80, 16); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="bold 28px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(bannerText, W/2, H/2);
      ctx.restore();
    }
  }

  function roundRect(x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
