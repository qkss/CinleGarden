"use strict";
  // ---------- Input ----------
  canvas.addEventListener("mousemove", e=>{
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX-rect.left)*(W/rect.width);
    mouse.y = (e.clientY-rect.top)*(H/rect.height);
    showInfo = e.altKey;
  });

  canvas.addEventListener("click", e=>{
    if(state!=="playing") return;
    const rect = canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(W/rect.width), my=(e.clientY-rect.top)*(H/rect.height);

    // bottom control buttons
    const hit=(b)=>mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h;
    if(hit(MUTEBTN)){ SFX.toggle(); return; }
    if(hit(SPEEDBTN)){ cycleSpeed(); return; }
    if(hit(PAUSEBTN)){ paused=!paused; return; }
    if(hit(RESTARTBTN)){ startGame(); return; }
    // while paused, any other click resumes
    if(paused){ paused=false; return; }

    // 土豆盾技能图标: 点击释放 / 切换自动模式 (优先于其它格子操作)
    for(const p of plants){
      if(p.type==="potatoshield" && (p.up||0)>=10){
        const rc = potatoSkillRects(p);
        const inR=(b)=>mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h;
        if(inR(rc.mode)){ autoSkill=!autoSkill; showBanner(autoSkill?L("🛡 土豆盾技能 · 自动释放","🛡 Potato Shield · Auto"):L("🛡 土豆盾技能 · 手动释放","🛡 Potato Shield · Manual")); return; }
        if(p.skillReady && inR(rc.icon)){ firePotatoSkill(p); return; }
      }
    }

    for(let i=suns.length-1;i>=0;i--){
      const s=suns[i];
      if(Math.hypot(mx-s.x,my-s.y)<24){ sun+=s.value; suns.splice(i,1); spawnParticles(s.x,s.y,"#ffe680",8); SFX.play("sun"); return; }
    }
    // 左上角阳光计数区: 双击快速收取; 50波后连点4次切换自动收取
    if(mx>=14 && mx<=118 && my>=18 && my<=82){
      if(gameTime - sunClickLast > 0.5) sunClickN = 0;
      sunClickN++; sunClickLast = gameTime;
      if(sunClickN>=4 && waveNum>=50){ autoCollectSun = !autoCollectSun; sunClickN = 0; showBanner(autoCollectSun?L("☀ 自动收取阳光: 开启","☀ Auto-collect sun: ON"):L("☀ 自动收取阳光: 关闭","☀ Auto-collect sun: OFF")); }
      else if(sunClickN>=2){ collectAllSun(); }   // 双击收取全部阳光
      return;
    }
    if(my<TOPBAR_H){
      // shovel button
      if(mx>=SHOVEL.x&&mx<=SHOVEL.x+SHOVEL.w&&my>=SHOVEL.y&&my<=SHOVEL.y+SHOVEL.h){
        shovelMode = !shovelMode; if(shovelMode) selected=null; return;
      }
      CARD_ORDER.forEach((key,i)=>{
        const x=CARD_X0+i*CARD_STRIDE;
        if(mx>=x&&mx<=x+CARD_W&&my>=CARD_Y&&my<=CARD_Y+CARD_H){
          const p=PLANTS[key]; const cd=effCooldown(key)-(gameTime-lastCardUse[key]);
          if(!cardLocked(key) && sun>=p.cost && cd<=0){ selected = selected===key? null : key; shovelMode=false; }
        }
      });
      return;
    }
    // shovel: dig up a plant to replace it
    if(shovelMode){
      const c=colAtX(mx), r=rowAtY(my);
      const idx=plants.findIndex(p=>p.r===r&&p.c===c);
      if(idx>=0){ spawnParticles(plants[idx].x,plants[idx].y,"#caa",10); plants.splice(idx,1); }
      shovelMode=false; return;
    }
    // branch-selection menu (open when upgrading a Lv0 sunflower)
    if(upgradeMenu){
      const b = upgradeMenuHit(mx, my);   // 'atk' | 'hp' | null
      if(b){
        const sp = upgradeMenu.p;
        if(plants.indexOf(sp)>=0 && sun>=250 && sp.up===0){
          sun -= 250; sp.branch = b; sp.up = 1; sp.selfHpMult = 1.25;   // 升级也提升自身最大血量
          spawnParticles(sp.x, sp.y, b==="hp"?"#7fd0ff":"#ff9a3c", 18, 220);
          SFX.play("upgrade");
          showBanner("🌻 "+upgradeLabel(sp)+"！");
        }
      }
      upgradeMenu = null; return;          // any click closes the menu
    }
    // upgrade a sunflower / potato-shield (unlocked after wave UPGRADE_WAVE) — click it to level up
    if(!selected){
      const c=colAtX(mx), r=rowAtY(my);
      const sp = plants.find(p=>p.r===r&&p.c===c&&(p.type==="sunflower"||p.type==="potatoshield"||p.type==="snowpea"||p.type==="threepeater"||p.type==="campfire"||p.type==="bigcactus"));
      if(sp){
        // 植物融合: 5棵满级(向日葵需同流派), 点击其一消耗1万阳光融合
        if(fusionEligible(sp)){
          if(sun>=FUSE_COST){
            sun -= FUSE_COST;
            let removed=0;
            for(const q of plants){ if(q!==sp && q.type===sp.type && !q.fused && removed<4 && (sp.type!=="sunflower" || q.branch===sp.branch) && fusionMember(q)){ q.dead=true; spawnParticles(q.x,q.y-8,"#ffd700",14,220); removed++; } }
            sp.fused = true; sp.fuseLevel = 1; applyFuseStats(sp);
            spawnParticles(sp.x, sp.y-10, "#ffd700", 36, 300); spawnShards(sp.x, sp.y-10, 12, ["#ffe680","#ffd23f"], "tri");
            SFX.play("ultimate");
            const fname = sp.type==="sunflower" ? L("融合向日葵·"+(sp.branch==="atk"?"狂暴(全屏)":"回血(全屏)"), "Fused Sunflower · "+(sp.branch==="atk"?"Berserk":"Heal")+" (all rows)")
                        : sp.type==="snowpea" ? L("融合寒冰·冰霜雪雨灼烧","Fused Snow Pea · Frost-storm burn")
                        : sp.type==="potatoshield" ? L("钛金属土豆盾·免疫偷取·常驻挡鸣人","Titanium Potato · steal-proof · blocks beam")
                        : sp.type==="bigcactus" ? L("融合巨仙掌·暴雨梨花","Fused Big Cactus · Pear-Blossom Storm")
                        : L("融合三豆·撒豆成兵","Fused Threepeater · Bean Barrage");
            showBanner("✨ "+fname+"！");
          }
          return;
        }
        // 二次融合(二合一): 两个同级融合体 -> 升一级, 属性提升
        if(refusionEligible(sp)){
          if(sun>=FUSE_COST){
            sun -= FUSE_COST;
            for(const q of plants){ if(q!==sp && q.fused && q.type===sp.type && (sp.type!=="sunflower"||q.branch===sp.branch) && (q.fuseLevel||1)===(sp.fuseLevel||1)){ q.dead=true; spawnParticles(q.x,q.y-8,"#ffd700",16,240); break; } }
            sp.fuseLevel = Math.min((sp.fuseLevel||1)+1, 6); applyFuseStats(sp);
            spawnParticles(sp.x, sp.y-10, "#ffd700", 40, 320); spawnShards(sp.x, sp.y-10, 14, ["#ffe680","#ffd23f"], "tri");
            SFX.play("ultimate");
            showBanner(L("✨ 二次融合 · 融合等级 Lv","✨ Re-Fusion · Fusion Lv")+sp.fuseLevel+"！");
          }
          return;
        }
        const cost = nextUpgradeCost(sp);
        if(waveNum>=upgradeMinWave(sp) && cost!=null && sun>=cost){
          if(sp.type==="sunflower" && sp.up===0){ upgradeMenu = { p:sp }; }   // choose a branch first
          else {
            sun -= cost; sp.up++;
            sp.selfHpMult = 1 + (sp.type==="potatoshield"?0.5:0.25)*sp.up;   // 每次升级提升自身最大血量(土豆盾+50%/级, 其余+25%/级)
            SFX.play(sp.up>=7?"ultimate":"upgrade");
            if(sp.type==="potatoshield"){
              spawnParticles(sp.x, sp.y, "#9fb6cf", 16, 200);
              showBanner(L("🥔 土豆盾 Lv","🥔 Potato Shield Lv")+sp.up+"！");
            } else if(sp.type==="snowpea"){
              spawnParticles(sp.x, sp.y, "#bfe9fb", 16, 200);
              showBanner(L("❄️ 寒冰 Lv","❄️ Snow Pea Lv")+sp.up+L(" (冻结"," (freeze ")+(1.5+0.2*sp.up).toFixed(1)+"s)");
            } else if(sp.type==="threepeater"){
              spawnParticles(sp.x, sp.y, "#9be36b", 18, 220);
              showBanner(L("🌿 三豆 Lv","🌿 Threepeater Lv")+sp.up+L(" (攻速 x"," (SP x")+threepeaterAtkMult(sp).toFixed(1)+")");
            } else if(sp.type==="campfire"){
              spawnParticles(sp.x, sp.y, "#ff9a3c", 18, 220);
              showBanner(sp.up>=5 ? L("🔥 篝火 Lv5 · 火焰点燃灼伤！","🔥 Torch Lv5 · ignite burn!") : (L("🔥 篝火 Lv","🔥 Torch Lv")+sp.up+L(" (火伤 x"," (fire x")+torchFireMult(sp.up).toFixed(1)+")"));
            } else if(sp.type==="bigcactus"){
              spawnParticles(sp.x, sp.y, "#5aa84a", 18, 220);
              showBanner(sp.up>=10 ? L("🌵 巨仙掌 Lv10 · 地刺(击退2格)！","🌵 Big Cactus Lv10 · Ground-spike!") : (L("🌵 巨仙掌 Lv","🌵 Big Cactus Lv")+sp.up+L(" (攻速 x"," (SP x")+bigcactusAtkMult(sp).toFixed(1)+")"));
            } else {
              spawnParticles(sp.x, sp.y, sp.up>=7?"#ffe680":(sp.up>=6?"#9fd0ff":(sp.branch==="hp"?"#7fd0ff":"#ff9a3c")), 18, 220);
              showBanner("🌻 "+upgradeLabel(sp)+"！");
            }
          }
        }
        return;   // clicking an upgradable plant is an upgrade attempt
      }
    }
    if(selected){
      const c=colAtX(mx), r=rowAtY(my);
      if(c>=0&&r>=0 && !plants.some(p=>p.r===r&&p.c===c)){
        const p=PLANTS[selected];
        if(sun>=p.cost){
          sun-=p.cost; lastCardUse[selected]=gameTime; addPlant(selected,r,c);
          spawnParticles(cellCenterX(c),cellCenterY(r),"#fff",6); SFX.play("plant"); selected=null;
        }
      }
    }
  });

  canvas.addEventListener("contextmenu", e=>{
    e.preventDefault();
    if(state!=="playing"){ selected=null; return; }
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(W/rect.width), my=(e.clientY-rect.top)*(H/rect.height);
    if(upgradeMenu){ upgradeMenu=null; return; }
    if(selected||shovelMode){ selected=null; shovelMode=false; return; }
    const c=colAtX(mx), r=rowAtY(my);
    const idx=plants.findIndex(p=>p.r===r&&p.c===c);
    if(idx>=0){ spawnParticles(plants[idx].x,plants[idx].y,"#caa",8); plants.splice(idx,1); }
  });

  function collectAllSun(){
    if(!suns.length) return;
    for(const s of suns){ sun += s.value; spawnParticles(s.x, s.y, "#ffe680", 6); }
    suns = []; SFX.play("sun");
  }

  function cycleSpeed(){ gameSpeed = SPEEDS[(SPEEDS.indexOf(gameSpeed)+1) % SPEEDS.length]; }

  window.addEventListener("keyup", e=>{ showInfo = e.altKey; });
  window.addEventListener("blur", ()=>{ showInfo = false; });
  window.addEventListener("keydown", e=>{
    showInfo = e.altKey;
    if(e.key==="Alt"){ e.preventDefault(); return; }
    if(e.key===" " || e.code==="Space"){ e.preventDefault(); if(state==="playing") collectAllSun(); return; }
    if(e.key==="f" || e.key==="F"){ if(state==="playing") cycleSpeed(); return; }
    if(e.key==="p" || e.key==="P"){ if(state==="playing") paused=!paused; return; }
    if(e.key==="m" || e.key==="M"){ SFX.toggle(); return; }
    // 测试模式：Shift+0 直接 +10000 阳光
    if(e.shiftKey && (e.code==="Digit0" || e.key===")" || e.key==="0")){ e.preventDefault(); if(state==="playing"){ sun+=10000; showBanner(L("🧪 测试：+10000 阳光","🧪 Cheat: +10000 sun")); } return; }
    // 铲子快捷键 ~
    if(e.key==="~" || e.key==="`"){ shovelMode=!shovelMode; if(shovelMode) selected=null; return; }
    // 卡片快捷键 1-9,0,-,+,=
    const idx = HOTKEYS.indexOf(e.key);
    if(idx>=0 && idx<CARD_ORDER.length){
      const key=CARD_ORDER[idx]; const p=PLANTS[key];
      const cd=effCooldown(key)-(gameTime-lastCardUse[key]);
      if(!cardLocked(key) && sun>=p.cost && cd<=0){ selected = selected===key? null : key; shovelMode=false; }
    } else if(e.key==="Escape"){ selected=null; shovelMode=false; upgradeMenu=null; }
  });
