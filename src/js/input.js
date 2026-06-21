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
        if(inR(rc.mode)){ autoSkill=!autoSkill; showBanner(autoSkill?"🛡 土豆盾技能 · 自动释放":"🛡 土豆盾技能 · 手动释放"); return; }
        if(p.skillReady && inR(rc.icon)){ firePotatoSkill(p); return; }
      }
    }

    for(let i=suns.length-1;i>=0;i--){
      const s=suns[i];
      if(Math.hypot(mx-s.x,my-s.y)<24){ sun+=s.value; suns.splice(i,1); spawnParticles(s.x,s.y,"#ffe680",8); SFX.play("sun"); return; }
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
        // 植物融合: 5棵满级(向日葵需同流派), 点击其一消耗1万阳光融合为王冠植物
        if(fusionEligible(sp)){
          if(sun>=FUSE_COST){
            sun -= FUSE_COST;
            let removed=0;
            for(const q of plants){ if(q!==sp && q.type===sp.type && !q.fused && removed<4 && (sp.type!=="sunflower" || q.branch===sp.branch) && fusionMember(q)){ q.dead=true; spawnParticles(q.x,q.y-8,"#ffd700",14,220); removed++; } }
            sp.fused = true; sp.selfHpMult = (sp.type==="potatoshield") ? 20 : 10;   // 土豆盾血量更高
            spawnParticles(sp.x, sp.y-10, "#ffd700", 36, 300); spawnShards(sp.x, sp.y-10, 12, ["#ffe680","#ffd23f"], "tri");
            SFX.play("ultimate");
            const fname = sp.type==="sunflower" ? ("王冠向日葵·"+(sp.branch==="atk"?"狂暴(全屏)":"回血(全屏)"))
                        : sp.type==="snowpea" ? "王冠寒冰·冰霜雪雨灼烧"
                        : sp.type==="potatoshield" ? "钛金属土豆盾·免疫偷取·常驻挡鸣人"
                        : "王冠三豆·撒豆成兵";
            showBanner("👑 "+fname+"！");
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
              showBanner("🥔 土豆盾 Lv"+sp.up+"！");
            } else if(sp.type==="snowpea"){
              spawnParticles(sp.x, sp.y, "#bfe9fb", 16, 200);
              showBanner("❄️ 寒冰 Lv"+sp.up+" (冻结"+(1.5+0.2*sp.up).toFixed(1)+"s)");
            } else if(sp.type==="threepeater"){
              spawnParticles(sp.x, sp.y, "#9be36b", 18, 220);
              showBanner("🌿 三豆 Lv"+sp.up+" (攻速 x"+threepeaterAtkMult(sp).toFixed(1)+")");
            } else if(sp.type==="campfire"){
              spawnParticles(sp.x, sp.y, "#ff9a3c", 18, 220);
              showBanner(sp.up>=5 ? "🔥 篝火 Lv5 · 火焰点燃灼伤！" : ("🔥 篝火 Lv"+sp.up+" (火伤 x"+torchFireMult(sp.up).toFixed(1)+")"));
            } else if(sp.type==="bigcactus"){
              spawnParticles(sp.x, sp.y, "#5aa84a", 18, 220);
              showBanner(sp.up>=10 ? "🌵 巨仙掌 Lv10 · 地刺(击退2格)！" : ("🌵 巨仙掌 Lv"+sp.up+" (攻速 x"+bigcactusAtkMult(sp).toFixed(1)+")"));
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
    if(e.shiftKey && (e.code==="Digit0" || e.key===")" || e.key==="0")){ e.preventDefault(); if(state==="playing"){ sun+=10000; showBanner("🧪 测试：+10000 阳光"); } return; }
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
