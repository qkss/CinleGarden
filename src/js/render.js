"use strict";
  // ---------- Drawing ----------
  function draw(){
    ctx.fillStyle = "#7cc3e8"; ctx.fillRect(0,0,W,H);
    drawTopBar();
    drawLawn();
    drawMashes();
    drawMowers();
    drawDebris();
    for(const p of plants) drawPlant(p);
    for(const pea of peas) drawPea(pea);
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
  function drawUpgradeMenu(){
    const r=upgradeMenuRects(); if(!r) return;
    ctx.save();
    // title
    ctx.font="bold 12px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    const title="选择升级方向 (各250阳光)";
    const tw=ctx.measureText(title).width+14;
    ctx.fillStyle="rgba(20,20,30,.92)"; roundRect(r.cx-tw/2, r.ty-9, tw, 18, 5); ctx.fill();
    ctx.fillStyle="#fff"; ctx.fillText(title, r.cx, r.ty);
    btn(r.atk, "⚡攻速", "#3a7bd5");
    btn(r.hp, "🛡血量", "#3aa55a");
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
    if(selected||shovelMode || mouse.y<GRID.y) return;
    const c=colAtX(mouse.x), r=rowAtY(mouse.y);
    if(c<0||r<0) return;
    const sp=plants.find(p=>p.r===r&&p.c===c&&(p.type==="sunflower"||p.type==="potatoshield"||p.type==="snowpea"||p.type==="threepeater"));
    if(!sp) return;
    const cx=cellCenterX(c), cy=cellY(r);
    let txt, ok=false;
    if(waveNum<UPGRADE_WAVE){ txt="第"+UPGRADE_WAVE+"波后可升级"; }
    else { const cost=nextUpgradeCost(sp);
      if(cost==null) txt="已满级 MAX";
      else {
        ok = sun>=cost;
        let nxt;
        if(sp.type==="potatoshield") nxt="Lv"+(sp.up+1)+"(+50%血)";
        else if(sp.type==="snowpea") nxt="Lv"+(sp.up+1)+"(冻"+(1.5+0.2*(sp.up+1)).toFixed(1)+"s)";
        else if(sp.type==="threepeater") nxt="Lv"+(sp.up+1)+"(攻速 x"+(1+0.4*(sp.up+1)).toFixed(1)+")";
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
  function drawShields(){
    for(let r=0;r<ROWS;r++){
      if(rowShield[r]>0){
        const cy=cellY(r), pulse=0.5+0.5*Math.sin(performance.now()/120);
        ctx.save();
        ctx.fillStyle="rgba(120,200,255,"+(0.12+0.08*pulse)+")";
        ctx.fillRect(GRID.x, cy, COLS*GRID.cw, GRID.ch);
        ctx.strokeStyle="rgba(150,220,255,"+(0.5+0.3*pulse)+")"; ctx.lineWidth=3;
        ctx.strokeRect(GRID.x+1, cy+1, COLS*GRID.cw-2, GRID.ch-2);
        ctx.fillStyle="rgba(200,235,255,.9)"; ctx.font="bold 14px 'PingFang SC',Arial"; ctx.textAlign="left"; ctx.textBaseline="middle";
        ctx.fillText("🛡 无敌", GRID.x+6, cy+12);
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
    else if(type==="snowpea") drawPeashooterArt(x,y,t,recoil,"#7fcfee");
    else if(type==="repeater") drawRepeaterArt(x,y,t,recoil);
    else if(type==="threepeater") drawThreepeaterArt(x,y,t,recoil);
    else if(type==="cactus") drawCactusArt(x,y,t,recoil,false);
    else if(type==="bigcactus") drawCactusArt(x,y,t,recoil,true);
    else if(type==="jalapeno") drawJalapenoArt(x,y,t);
    else if(type==="campfire") drawCampfireArt(x,y,t);
    else if(type==="wallnut") drawWallnutArt(x,y,hpFrac==null?1:hpFrac);
    else if(type==="potatoshield") drawPotatoShieldArt(x,y,hpFrac==null?1:hpFrac,0);
    else if(type==="cherrybomb") drawCherryArt(x,y,t);
    else if(type==="potatomine") drawMineArt(x,y,iconMode?true:undefined);
  }

  function drawPlant(p){
    ctx.save();
    ctx.translate(p.x, p.y);
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
    if((p.type==="cherrybomb"||p.type==="jalapeno") && p.fuse<0.5){ const s=1+(0.5-p.fuse)*0.6; ctx.scale(s,s); }
    if(p.type==="potatomine") drawMineArt(0,0,false,p.armed);
    else if(p.type==="sunflower") drawSunflowerArt(0,0,p.t,p.up,p.branch);
    else if(p.type==="potatoshield") drawPotatoShieldArt(0,0,p.hp/p.maxHp,p.up);
    else drawPlantArt(p.type, 0,0, p.t, p.recoil||0, p.hp/p.maxHp, false);
    // 三豆射手 / 寒冰 升级等级角标
    if(p.up>0 && (p.type==="threepeater" || p.type==="snowpea")){
      const lbl = (p.type==="threepeater" ? "x"+(1+0.4*p.up).toFixed(1) : "Lv"+p.up);
      ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const bw=ctx.measureText(lbl).width+10;
      ctx.fillStyle="rgba(0,0,0,.6)"; roundRect(-bw/2,-46,bw,13,5); ctx.fill();
      ctx.fillStyle = p.type==="threepeater" ? "#caff9a" : "#bfe9fb";
      ctx.fillText(lbl, 0, -39);
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
  function drawSunflowerArt(x,y,t,up,branch){
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
      // 流派角标(右上): ⚡攻速 / 🛡血量
      ctx.translate(15,-26);
      ctx.fillStyle=bcol; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#10212e"; ctx.font="bold 9px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(branch==="atk"?"⚡":"盾", 0, 1);
      ctx.restore();
    }
    // level badge
    if(up>0){
      const suffix = (up>=6 && branch) ? (branch==="atk"?"·攻速":"·血量") : "";
      const lbl = up>=7?("终极"+suffix):(up>=6?("钢化"+suffix):((branch==="hp"?"血":"攻")+"Lv"+up));
      ctx.font="bold 10px 'PingFang SC',Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const bw=ctx.measureText(lbl).width+10;
      ctx.fillStyle="rgba(0,0,0,.62)"; roundRect(-bw/2,-48,bw,13,5); ctx.fill();
      ctx.fillStyle = up>=6 ? (branch==="atk"?"#9fe4ff":"#a7ecb8") : (branch==="hp"?"#bfe0ff":"#ffd2a0");
      ctx.fillText(lbl, 0, -41);
    }
    ctx.restore();
  }

  function peaHead(headColor){
    ctx.fillStyle=headColor; ctx.beginPath(); ctx.arc(0,0,19,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(-4,-4,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#3f8e2a"; ctx.beginPath(); ctx.ellipse(20,-2,9,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#2e6b1c"; ctx.beginPath(); ctx.arc(26,-2,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#1f3a14"; ctx.beginPath(); ctx.arc(-2,-4,3,0,Math.PI*2); ctx.fill();
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
  function drawCampfireArt(x,y,t){
    ctx.save(); ctx.translate(x,y);
    // wooden stump / logs
    ctx.fillStyle="#6b4a2a"; roundRect(-20,14,40,16,5); ctx.fill();
    ctx.fillStyle="#5a3d22"; roundRect(-20,22,40,8,4); ctx.fill();
    // crossed logs
    ctx.strokeStyle="#7a5530"; ctx.lineWidth=6; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-16,24); ctx.lineTo(14,14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16,24); ctx.lineTo(-14,14); ctx.stroke();
    ctx.fillStyle="#caa15a";
    ctx.beginPath(); ctx.arc(-16,24,3.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(16,24,3.2,0,Math.PI*2); ctx.fill();
    // flames (animated flicker)
    const f1 = 1+Math.sin(t*9)*0.12, f2 = 1+Math.sin(t*13+1)*0.15;
    ctx.fillStyle="#ff5a1e";
    ctx.beginPath(); ctx.moveTo(-14,16);
    ctx.quadraticCurveTo(-18,-4, -4,-22*f1);
    ctx.quadraticCurveTo(2,-6, 6,-14*f2);
    ctx.quadraticCurveTo(16,-2, 14,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffae3c";
    ctx.beginPath(); ctx.moveTo(-8,16);
    ctx.quadraticCurveTo(-10,-2, -2,-14*f1);
    ctx.quadraticCurveTo(3,-2, 8,-8*f2);
    ctx.quadraticCurveTo(12,0, 8,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#fff2b0";
    ctx.beginPath(); ctx.ellipse(0,4,5,9*f1,0,0,Math.PI*2); ctx.fill();
    // sparks
    ctx.fillStyle="#ffd27a";
    ctx.beginPath(); ctx.arc(-2+Math.sin(t*7)*4, -22*f1, 1.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5+Math.sin(t*5)*3, -16*f2, 1.3, 0, Math.PI*2); ctx.fill();
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

  function drawPea(pea){
    ctx.save(); ctx.translate(pea.x,pea.y);
    if(pea.spike){
      if((pea.dir||1)<0) ctx.scale(-1,1);   // 向后发射的尖刺翻转朝向
      // 尖刺：细长锥形, 火焰尖刺为橙色
      const body = pea.fire?"#ff7a1e":"#caa15a", tip = pea.fire?"#ffd27a":"#e6d2a0";
      if(pea.fire){ ctx.fillStyle="rgba(255,150,40,.5)"; ctx.beginPath(); ctx.ellipse(-10,0,9,3,0,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle=body; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-8,-4); ctx.lineTo(-8,4); ctx.closePath(); ctx.fill();
      ctx.fillStyle=tip; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(2,-2); ctx.lineTo(2,2); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if(pea.fire){
      // flame trail
      const fl = 1+Math.sin(pea.x*0.5)*0.2;
      ctx.fillStyle="rgba(255,150,40,.5)";
      ctx.beginPath(); ctx.ellipse(-8,0,8*fl,4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ff5a1e"; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffb14e"; ctx.beginPath(); ctx.arc(0,0,5.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff2c2"; ctx.beginPath(); ctx.arc(-1,-1,2.5,0,Math.PI*2); ctx.fill();
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
  function drawZombie(z){
    if(z.type==="spider"){ drawSpider(z); return; }
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
    // frozen overlay: icy block + frost
    if(z.freezeT>0){
      ctx.fillStyle="rgba(150,220,250,.38)"; roundRect(-20,-44,40,86,8); ctx.fill();
      ctx.strokeStyle="rgba(220,245,255,.7)"; ctx.lineWidth=2; ctx.beginPath(); roundRect(-20,-44,40,86,8); ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.85)"; ctx.font="14px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("❄", 0, -30);
    }
    if(z.slowT>0||z.freezeT>0){ ctx.restore(); }
    ctx.restore();
    drawHealthBar(z.x, z.y - (z.big?98:50), z.hp/z.maxHp, z.big?64:34, "#c0392b");
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
