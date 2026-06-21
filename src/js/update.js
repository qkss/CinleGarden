"use strict";
  // ---------- Update ----------
  function update(dt){
    if(state!=="playing") return;
    gameTime += dt;

    nextSkyDrop -= dt;
    if(nextSkyDrop<=0){
      nextSkyDrop = 6 + Math.random()*3;
      addSun(GRID.x + 40 + Math.random()*(COLS*GRID.cw-80), TOPBAR_H+10, true);
    }

    // endless wave scheduler
    if(gameTime >= nextWaveAt){
      waveNum++;
      saveMaxWave(waveNum);                     // 记录最高波数, 解锁检查点
      const big = (waveNum % 5 === 0);
      spawnWave(waveNum);
      score += 50 + waveNum*15;                 // survival/progress bonus for reaching a wave
      SFX.play(big?"bigwave":"wave");
      showBanner(big ? ("⚠ 第 "+waveNum+" 波 · 巨潮来袭！") : ("第 "+waveNum+" 波"));
      const interval = Math.max(15, 28 - waveNum*0.3);   // 拉长波间隔下限, 避免后期成片堆叠
      nextWaveAt = gameTime + (big ? interval + 8 : interval);
    }

    // 全局计时: 行无敌护盾倒计时 / 能量极光残留 / 终极寒冰全屏冰霜
    for(let r=0;r<ROWS;r++){ if(rowShield[r]>0) rowShield[r]-=dt; if(rowBerserk[r]>0) rowBerserk[r]-=dt; }
    for(const b of beams){ b.t+=dt; if(b.src && b.src.hp>0) b.x = b.src.x; }
    beams = beams.filter(b=>b.t<b.life);
    if(plants.some(p=>p.type==="snowpea" && p.up>=5)){   // 终极寒冰(Lv5)即可触发, 不再要求100波
      frostCd -= dt;
      if(frostCd<=0){ frostCd = 20; frostRainT = 5;        // 持续5秒
        for(const z of zombies){ if(z.hp>0){ if(z.burnT>0) meltBurn(z); z.freezeT=5; z.freezeImmune=0; z.slowT=0; } }   // 全屏冰冻5秒(灼伤者触发融化)
        SFX.play("freeze");
      }
    }
    if(frostRainT>0){
      frostRainT -= dt;
      // 大范围冰雨: 持续从顶部落下
      for(let i=0;i<8;i++){
        particles.push({ x:GRID.x+Math.random()*COLS*GRID.cw, y:GRID.y-12+Math.random()*40,
          vx:-18+Math.random()*8, vy:430+Math.random()*240, life:0.45+Math.random()*0.4, t:0,
          color: Math.random()<0.5?"#cfeefb":"#9fd8f5", size:1.8+Math.random()*2.4, rain:true });
      }
      // 期间保持冰冻(新刷出的僵尸也冻住)
      for(const z of zombies){ if(z.hp>0 && z.freezeT<frostRainT){ if(z.burnT>0) meltBurn(z); z.freezeT=frostRainT; z.slowT=0; } }
      // 融合寒冰: 冰霜雪雨持续按最大血量造成百分比伤害(5秒共10%×融合等级 -> 2%×等级/秒)
      const snowFL = maxFuseLevel("snowpea");
      if(snowFL>0){
        for(const z of zombies){ if(z.hp>0 && !z.burrowing){ z.hp -= z.maxHp * 0.02 * snowFL * dt; if(Math.random()<0.05) spawnParticles(z.x, z.y-8, "#bfe9fb", 1, 60); } }
      }
    }

    // plants
    for(const p of plants){
      p.t += dt;
      if(p.recoil>0) p.recoil -= dt;
      if(p.glowT>0) p.glowT -= dt;
      const def = PLANTS[p.type];

      // 王冠三豆: 撒豆成兵 — 每10秒从天降下最多5个巨型点燃豌豆火球, 砸向血量最高的目标
      if(p.type==="threepeater" && p.fused){
        if(p.beanCd==null) p.beanCd=10;
        p.beanCd -= dt;
        if(p.beanCd<=0){ p.beanCd=10;
          const fl = p.fuseLevel||1;
          // 最多攻击7格距离内的目标(血量优先)
          const targets = zombies.filter(z=>z.hp>0 && !z.burrowing && z.x>p.x && (z.x-p.x)<=7*GRID.cw).sort((a,b)=>b.hp-a.hp).slice(0, 5+(fl-1));
          for(const z of targets){
            // 斜向下坠落: 从目标左后上方抛出, 带水平速度
            beanbombs.push({ x:z.x-80, y:TOPBAR_H-20, targetY:cellCenterY(z.r), r:z.r, vx:160, vy:120+Math.random()*40, g:760, rot:0, vrot:(Math.random()-.5)*8, dmg:600*fl });
          }
          if(targets.length){ showBanner("🌿 撒豆成兵！"); SFX.play("ultimate"); }
        }
      }

      // 巨仙掌(Lv10): 每20秒发动地刺, 击退本行前方僵尸2格
      if(p.type==="bigcactus" && (p.up||0)>=10){
        if(p.spikeCd==null) p.spikeCd=20;
        if(p.spikeCd>0) p.spikeCd -= dt;
        // 冷却完毕进入"就绪": 仅在本行有目标时才发动, 否则保持就绪不触发
        if(p.spikeCd<=0 && fireGroundSpikes(p)) p.spikeCd = 20;
      }
      // 融合巨仙掌: 暴雨梨花 — 每15秒, 5秒内向前发射最多50发高轨穿刺(密集弹幕)
      if(p.type==="bigcactus" && p.fused){
        if(p.barrageCd==null) p.barrageCd=15;
        if(p.barrageT>0){
          p.barrageT -= dt; p.barrageFireCd -= dt;
          if(p.barrageFireCd<=0 && p.barrageShots>0){
            p.barrageFireCd = 0.1; p.barrageShots--;   // 50发 / 5秒 = 10发/秒
            peas.push({ x:p.x+24, y:p.y-22, r:p.r, speed:460, dmg:25*(p.fuseLevel||1), freeze:false, air:true, spike:true, dir:1, hit:new Set(), barrage:true });
            p.recoil = 0.08;
          }
          if(p.barrageT<=0 || p.barrageShots<=0){ p.barrageT=0; p.barrageCd=15; }
        } else {
          p.barrageCd -= dt;
          if(p.barrageCd<=0){
            if(zombies.some(z=>z.r===p.r && z.hp>0 && z.x>p.x && !z.burrowing)){
              p.barrageT=5; p.barrageShots=50; p.barrageFireCd=0; showBanner("🌵 暴雨梨花！"); SFX.play("ultimate");
            } else p.barrageCd=1;   // 无目标稍后再探
          }
        }
      }

      // 终极土豆盾(Lv10): 蓄力20秒 -> 技能就绪(身上出现图标)。手动点击释放, 或开启自动释放
      if(p.type==="potatoshield" && (p.up||0)>=10){
        if(p.skillCd==null) p.skillCd=20;
        if(!p.skillReady){ p.skillCd -= dt; if(p.skillCd<=0){ p.skillCd=0; p.skillReady=true; } }
        if(p.skillReady && autoSkill && rowShield[p.r]<=0){
          // 自动模式: 智能格挡 — 本行鸣人即将发射激光, 或本行有僵尸啃食时, 自动释放护盾
          const beamSoon = zombies.some(z=> z.beam && z.r===p.r && z.hp>0 && (z.beamCd!=null?z.beamCd:9) < 0.45);
          const underAttack = zombies.some(z=> z.r===p.r && z.hp>0 && z.eating);
          if(beamSoon || underAttack) firePotatoSkill(p);
        }
      }

      // 血量光环(血量分支 + 钢化) × 自身升级(土豆盾)：动态调整最大血量
      const targetMax = p.baseMaxHp * (p.selfHpMult||1) * rowHpMult(p.r);
      if(Math.abs(targetMax - p.maxHp) > 0.5){
        const add = targetMax - p.maxHp;
        p.maxHp = targetMax;
        p.hp = Math.min(p.maxHp, p.hp + Math.max(0, add));   // 升级时回血, 失去光环时夹紧
      }

      if(p.kind==="producer"){
        // 每级升级提升阳光产量; 终极(Lv7)产阳光x10
        if(p.t>=7){
          p.t=0;
          const val= p.fused ? 2500*(p.fuseLevel||1) : ((p.up>=7)?250:Math.round(25*(1+0.4*p.up)));   // 融合: 产量随融合等级
          addSun(p.x, p.y-10, false, val);
          // 产阳光特效: 金色光环 + 花瓣火花
          const sparkColor = p.up>=7 ? "#fff5a8" : (p.up>=6 ? "#ffe680" : "#ffd23f");
          explosions.push({ x:p.x, y:p.y-8, r:0, max:p.up>=7?44:28, t:0, life:0.45, color:sparkColor });
          spawnParticles(p.x, p.y-10, sparkColor, p.up>=7?16:10, 160);
          spawnShards(p.x, p.y-10, p.up>=7?6:3, ["#ffe680","#ffd23f"], "tri");
        }
        // 终极向日葵(Lv7) 技能 — 按流派区分
        if(p.up>=7){
          if(p.branch==="atk"){
            // 攻速流: 每10秒触发狂暴, 本行植物攻速+100% 持续4秒
            if(p.skillCd==null) p.skillCd=10;
            p.skillCd -= dt;
            if(p.skillCd<=0){ p.skillCd=10;
              const rows = p.fused ? [0,1,2,3,4] : [p.r];   // 融合: 全屏狂暴
              for(const rr of rows){
                rowBerserk[rr]=Math.max(rowBerserk[rr],4);
                const cy = cellCenterY(rr);
                for(let gx=GRID.x+20; gx<GRID.x+COLS*GRID.cw; gx+=44){
                  explosions.push({ x:gx, y:cy, r:0, max:28, t:0, life:0.4, color:"#ff7a3c" });
                  spawnParticles(gx, cy, "#ff9a3c", 4, 150);
                }
              }
              for(const q of plants){ if((p.fused||q.r===p.r) && q.hp>0) q.glowT = 1.6; }
              SFX.play("ultimate");
            }
          } else if(p.branch==="hp"){
            // 血量流: 每10秒给本行所有植物回血 20% 最大血量
            if(p.healCd==null) p.healCd=10;
            p.healCd -= dt;
            if(p.healCd<=0){ p.healCd=10;
              for(const q of plants){ if((p.fused||q.r===p.r) && q.hp>0){   // 融合: 全屏回血
                q.glowT = 1.4;                                       // 金光笼罩本行植物
                const heal = q.maxHp*0.2;
                if(q.hp<q.maxHp){
                  const before=q.hp; q.hp=Math.min(q.maxHp, q.hp+heal);
                  const gained=Math.round(q.hp-before);
                  if(gained>0){ floats.push({ x:q.x, y:q.y-26, vy:-34, t:0, life:1.1, text:"+"+gained, color:"#7fe88a" }); }
                  spawnParticles(q.x, q.y-10, "#ffe680", 10, 180);
                }
              }}
              // 中心金色光环
              explosions.push({ x:p.x, y:p.y-8, r:0, max:60, t:0, life:0.55, color:"#ffe680" });
              spawnShards(p.x, p.y-10, 8, ["#ffe680","#a7ecb8"], "tri");
              SFX.play("heal");
            }
          }
        }

      } else if(p.kind==="shooter" || p.kind==="shooter3"){
        const rows = p.kind==="shooter3" ? [p.r-1,p.r,p.r+1].filter(rr=>rr>=0&&rr<ROWS) : [p.r];
        const canHit = z => rows.includes(z.r) && z.hp>0 && (def.air || !z.fly);
        // 普通仙人掌(back)：后方有僵尸优先向后打；否则向前
        let dir = 1, target = null;
        if(def.back){
          const behind = zombies.find(z=> canHit(z) && z.x < p.x+10);
          if(behind){ dir = -1; target = behind; }
          else target = zombies.find(z=> canHit(z) && z.x > p.x-10);
        } else {
          target = zombies.find(z=> canHit(z) && z.x > p.x-10);
        }
        p.shootCd -= dt;
        if(target && p.shootCd<=0){
          const ownMult = (p.type==="threepeater") ? threepeaterAtkMult(p) : (p.type==="bigcactus" ? bigcactusAtkMult(p) : 1);
          p.shootCd = def.rate / (rowAttackMult(p.r) * ownMult);   // 攻速光环 + 自身升级
          SFX.play(def.freeze?"shootIce":"shoot", 0.05);
          const shots = def.shots||1;
          const ox = dir>0 ? p.x+24 : p.x-24;
          for(let s=0; s<shots; s++){
            const fdur = 1.5 + 0.2*(p.up||0);   // 寒冰升级延长冰冻时长
            if(s===0){ for(const rr of rows) addPea(ox, p.y-6, rr, def.freeze, def.air, def.spike, fdur, dir); }
            else { const rid=runId; setTimeout(()=>{ if(state==="playing" && runId===rid) for(const rr of rows) addPea(ox, p.y-6, rr, def.freeze, def.air, def.spike, fdur, dir); }, s*120); }
          }
          p.recoil = 0.12;
        }

      } else if(p.kind==="bomb"){
        p.fuse -= dt;
        if(p.fuse<=0){
          explode(p.x, p.y-6, GRID.cw*1.6, 1800, "#ff5a1e");
          p.dead = true;
        }

      } else if(p.kind==="rowbomb"){   // 辣椒：清掉一整横排
        p.fuse -= dt;
        if(p.fuse<=0){
          const cy = cellCenterY(p.r);
          for(const z of zombies){ if(z.r===p.r && !z.burrowing) z.hp = 0; }   // 烧光本行(盾牌巨人也怕火, 地底潜行免疫)
          // 火线特效
          for(let gx=GRID.x+20; gx<GRID.x+COLS*GRID.cw; gx+=46){
            explosions.push({ x:gx, y:cy, r:0, max:40, t:0, life:0.45, color:"#ff5a1e" });
            spawnParticles(gx, cy, "#ffb14e", 5, 200);
          }
          p.dead = true;
        }

      } else if(p.kind==="mine"){
        if(!p.armed){ p.arm -= dt; if(p.arm<=0) p.armed = true; }
        else {
          // 地雷只对地面/地底单位起效(飞行的狮鹫/气球飞越, 不触发)
          const z = zombies.find(z=> z.r===p.r && Math.abs(z.x-p.x)<42 && z.hp>0 && !z.fly);
          if(z){
            if(z.burrowing){ z.burrowing=false; z.phase="surface"; z.surfT=0.5; spawnParticles(z.x, cellCenterY(z.r)+10, "#b9a06a", 16, 240); }  // 把地底穿山甲炸出地面再受伤
            explode(p.x, p.y, GRID.cw*0.9, 1800, "#ffcaa0"); p.dead = true;
          }
        }
      }
    }

    // peas
    for(const pea of peas){
      // 抛物线冰冻弹
      if(pea.arc){
        pea.x += pea.vx*dt; pea.vy += pea.g*dt; pea.y += pea.vy*dt;
        // 飞行拖尾
        if(Math.random()<0.7) particles.push({ x:pea.x, y:pea.y, vx:0, vy:8, life:0.35, t:0, color:"#cfeefb", size:2.6 });
        let burst=false;
        for(const z of zombies){ if(z.r===pea.r && z.hp>0 && Math.abs(z.x-pea.x)<28 && Math.abs(z.y-pea.y)<44){ burst=true; break; } }
        if(!burst && pea.vy>0 && pea.y>=pea.baseY){ burst=true; pea.y=pea.baseY; }
        if(burst){ iceBurst(pea.x, pea.baseY, pea.r, pea.freezeDur); pea.dead=true; }
        else if(pea.x>W+20) pea.dead=true;
        continue;
      }
      pea.x += pea.speed*(pea.dir||1)*dt;
      // 点燃弹: 拖出燃烧余烬
      if(pea.ignite && Math.random()<0.7){
        particles.push({ x:pea.x-(pea.dir||1)*6+(Math.random()*6-3), y:pea.y+(Math.random()*6-3),
          vx:-(pea.dir||1)*40+(Math.random()*20-10), vy:-20-Math.random()*40, life:0.35+Math.random()*0.3, t:0,
          color: Math.random()<0.5?"#ff5a1e":"#ffb14e", size:2+Math.random()*2.5 });
      }
      // pass through a campfire -> become a fire pea: +30% damage, explosive splash
      // 冰冻弹(freeze)不会被附魔, 不叠加火焰
      if(!pea.fire && !pea.freeze){
        const torch = plants.find(p=>p.kind==="torch" && p.hp>0 && p.r===pea.r && Math.abs(p.x-pea.x)<26);
        if(torch){
          const lvl = torch.up||0;
          pea.fire = true;
          pea.dmg = Math.round(pea.dmg * torchFireMult(lvl));   // 火焰伤害随篝火等级提升
          pea.ignite = torchIgnites(lvl);                       // Lv5: 点燃灼伤
          spawnParticles(pea.x, pea.y, "#ff9a3c", lvl>=5?9:6, 90);
        }
      }
      // 尖刺：贯穿整行, 命中每只僵尸一次, 不消失 (无视铁门, 直接打本体)
      if(pea.spike){
        let blocked=false;
        for(const z of zombies){
          if(z.r===pea.r && z.hp>0 && !z.burrowing && Math.abs(z.x-pea.x)<26 && !pea.hit.has(z) && (pea.air || !z.fly)){
            if(z.shieldHp>0){
              // 盾牌巨人: 盾牌挡住穿刺并吸收伤害, 尖刺被消耗(不再穿透)
              pea.hit.add(z);
              z.shieldHp -= pea.dmg;
              spawnParticles(pea.x, pea.y, "#cdd3da", 5);
              if(z.shieldHp<=0){ spawnShards(z.x-22, z.y-8, 13, ["#c2c7cf","#9aa0aa"], "square"); SFX.play("break", 0.05); }
              blocked=true; break;
            }
            if(z.type==="armorboss"){
              // 装甲车BOSS: 厚重装甲格挡穿甲子弹, 仍受伤但子弹无法继续穿透
              pea.hit.add(z);
              z.hp -= pea.dmg;
              spawnParticles(pea.x, pea.y, "#cdd3da", 5); SFX.play("hit", 0.1);
              blocked=true; break;
            }
            pea.hit.add(z);
            z.hp -= pea.dmg;
            spawnParticles(pea.x, pea.y, pea.fire?"#ff7a1e":"#cfe6a0", 4);
          }
        }
        if(blocked){ pea.dead = true; continue; }
        if(pea.x>W+20 || pea.x<-20) pea.dead = true;
        continue;
      }
      for(const z of zombies){
        if(z.r===pea.r && Math.abs(z.x-pea.x)<26 && z.hp>0 && !z.burrowing && (pea.air || !z.fly)){
          // 盾牌巨人: 盾牌未破时免疫一切豌豆(含火焰), 只能被穿刺打破
          if(z.shieldHp>0){
            spawnParticles(pea.x, pea.y, "#cfd4da", 4);
            SFX.play("hit", 0.12);
            pea.dead = true; break;
          }
          // 铁门完全免疫普通/冰冻豌豆(火焰豌豆仍可击穿) — 仙人掌穿刺走 spike 分支
          if(z.doorHp>0 && !pea.fire){
            spawnParticles(pea.x, pea.y, "#cfd4da", 4);
            SFX.play("hit", 0.12);
            pea.dead = true; break;
          }
          // 融化反应: 终极点燃弹(Lv5篝火)击中冰冻僵尸 -> 伤害+200%(x3) + 解冻 + 蒸汽
          const meltMain = pea.ignite && z.freezeT>0;
          if(meltMain){
            z.freezeT=0; z.freezeImmune=0;
            explosions.push({ x:pea.x, y:pea.y, r:0, max:56, t:0, life:0.38, color:"#ffd9a0" });
            spawnParticles(z.x, z.y-10, "#eaf6fb", 16, 220); spawnParticles(z.x, z.y-10, "#ffb14e", 8, 200);
            SFX.play("explode", 0.05);
          }
          z.hp -= meltMain ? pea.dmg*3 : pea.dmg;
          if(pea.fire){
            // 爆裂(范围)伤害：溅射到同行附近的僵尸 (冰冻者同样触发融化)
            explosions.push({ x:pea.x, y:pea.y, r:0, max:44, t:0, life:0.3, color:"#ff7a1e" });
            for(const z2 of zombies){
              if(z2!==z && z2.r===pea.r && Math.abs(z2.x-pea.x)<48 && z2.hp>0){
                const meltS = pea.ignite && z2.freezeT>0;
                if(meltS){ z2.freezeT=0; z2.freezeImmune=0; spawnParticles(z2.x, z2.y-10, "#eaf6fb", 8, 180); }
                z2.hp -= meltS ? pea.dmg*1.5 : pea.dmg*0.5;
                if(pea.ignite) ignite(z2);
              }
            }
            if(pea.ignite) ignite(z);                    // Lv5篝火: 点燃, 持续5秒灼伤
            spawnParticles(pea.x, pea.y, "#ff7a1e", 9, 170);
          } else if(pea.freeze){
            // 投掷冰冻弹命中：范围冰冻1.5秒(完全停滞)
            explosions.push({ x:pea.x, y:pea.y, r:0, max:70, t:0, life:0.4, color:"#9fd8f5" });
            for(const z2 of zombies){
              if(z2.hp>0 && Math.hypot(z2.x-pea.x, z2.y-pea.y) < 78){ z2.freezeT = 3; z2.slowT = 0; }
            }
            spawnParticles(pea.x, pea.y, "#bfe9fb", 14, 200);
          } else {
            spawnParticles(pea.x, pea.y, "#9be36b", 5);
          }
          pea.dead = true; break;
        }
      }
      if(pea.x>W+20 || pea.x<-20) pea.dead = true;
    }
    peas = peas.filter(p=>!p.dead);

    // 土豆泥: 区域内僵尸大幅减速 (每帧刷新 mireT)
    for(const m of mashes){ m.t += dt;
      for(const z of zombies){ if(z.r===m.r && Math.abs(z.x-m.x) < m.w/2+8) z.mireT = 0.2; }
    }
    mashes = mashes.filter(m=>m.t < m.life);

    // zombies
    for(const z of zombies){
      z.t += dt;
      // 出场无敌(鸣人Boss): 期间任何伤害都被抵消(每帧回满)
      if(z.invulnT>0){ z.invulnT -= dt; z.hp = z.maxHp; z.burnT = 0; z.freezeT = 0; z.slowT = 0; }   // 无敌期间免疫一切伤害与冰冻/减速
      if(z.noFreeze){ z.freezeT = 0; z.freezeImmune = 0; }   // 免疫冰冻(暗夜王)
      if(z.slowT>0) z.slowT -= dt;
      if(z.mireT>0) z.mireT -= dt;
      const wasFrozen = z.freezeT>0;
      if(z.freezeT>0) z.freezeT -= dt;
      if(z.freezeImmune>0) z.freezeImmune -= dt;
      if(wasFrozen && z.freezeT<=0){ spawnShards(z.x, z.y-18, 12, ["#dff4fc","#bfe9fb","#9fd8f5"]); z.freezeImmune = 1.5; }  // 解冻→碎裂+免疫1.5s
      // 灼伤(篝火Lv5点燃): 持续掉血 + 火焰余烬粒子; 冰冻会熄火
      if(z.burnT>0){
        if(z.freezeT>0){ z.burnT = 0; }
        else {
          z.burnT -= dt; z.hp -= z.burnDps*dt;
          if(Math.random()<0.5) particles.push({ x:z.x+(Math.random()*16-8), y:z.y-10-Math.random()*14,
            vx:(Math.random()-.5)*30, vy:-60-Math.random()*50, life:.4+Math.random()*.3, t:0,
            color: Math.random()<0.5?"#ff7a1e":"#ffb14e", size:2.5+Math.random()*2.5 });
        }
      }
      // 护甲被打掉的碎裂动画
      if(!z.armorBroken && z.maxHp>z.bodyMax && z.hp<=z.bodyMax){
        z.armorBroken = true;
        const a = {cone:{c:["#e08a2e","#b96d1c"],s:"tri"}, bucket:{c:["#c2c7cf","#9aa0aa"],s:"square"},
                   ironclad:{c:["#aab0b8","#7e848c"],s:"square"}, football:{c:["#c64b4b","#7a2b2b"],s:"square"},
                   pangolin:{c:["#9c7a4a","#7a5c34"],s:"tri"}}[z.type];
        if(a){ spawnShards(z.x, z.y-34, 13, a.c, a.s); if(z.type!=="pangolin") spawnHelmet(z); SFX.play("break", 0.05); }
      }
      if(z.vaultAnim>0) z.vaultAnim -= dt;
      // 女巫增益到期 -> 还原血量(+500%临时血)
      if(z.buffT>0){ z.buffT-=dt; if(z.buffT<=0 && z.buffActive){ z.buffActive=false; z.maxHp/=6; if(z.hp>z.maxHp) z.hp=z.maxHp; } }
      const frozen = z.freezeT>0;

      // 女巫: 每5秒给周围未被增益的僵尸 +500% 血量(持续2秒) - 效果不叠加, 已增益僵尸不刷新
      if(z.buff && !frozen){
        if(z.buffCd==null) z.buffCd=5;
        z.buffCd -= dt;
        if(z.buffCd<=0){ z.buffCd=5;
          for(const z2 of zombies){ if(z2.hp>0 && !z2.buffActive && Math.hypot(z2.x-z.x, z2.y-z.y) < GRID.cw*1.6){
            z2.buffActive=true; z2.maxHp*=6; z2.hp*=6; z2.buffT=2;
          }}
          for(let i=0;i<16;i++) spawnParticles(z.x, z.y-10, "#c77dff", 1, 180);
        }
      }
      // 鸣人Boss: 能量极光 — 穿透整行, 高伤
      if(z.beam && !frozen){
        if(z.beamCd==null) z.beamCd=9;
        z.beamCd -= dt;
        if(z.beamCd<=0){ z.beamCd=9; z.beamActiveT=5; beams.push({ r:z.r, x:z.x, src:z, t:0, life:5 }); }   // 持续5秒激光
        if(z.beamActiveT>0){
          z.beamActiveT -= dt;
          // 钛金属土豆盾常驻挡鸣人; 或本行无敌护盾激活时也挡
          const titanium = plants.some(p=>p.type==="potatoshield" && p.fused && p.r===z.r && p.hp>0);
          if(rowShield[z.r]>0 || titanium){
            // 被护盾挡住: 盾牌前沿迸发火花
            if(Math.random()<0.6){
              const fp = plants.filter(p=>p.r===z.r && p.hp>0).sort((a,b)=>a.x-b.x)[0];
              const fx = fp ? fp.x+18 : GRID.x+20;
              spawnParticles(fx, cellCenterY(z.r)-2, Math.random()<0.5?"#c77dff":"#ffffff", 3, 240);
            }
          } else {
            for(const p of plants){ if(p.r===z.r && p.hp>0){ p.hp -= 25*dt; if(p.hp<=0) p.dead=true; } }   // 总125伤 / 5秒 = 25/秒
          }
        }
      }

      // 骷髅祭祀: 每5秒治疗周围僵尸(回复12%最大血量)
      if(z.heal && !frozen){
        if(z.healCd==null) z.healCd=5;
        z.healCd -= dt;
        if(z.healCd<=0){ z.healCd=5;
          explosions.push({ x:z.x, y:z.y-8, r:0, max:GRID.cw*2, t:0, life:0.5, color:"#9be36b" });
          for(const z2 of zombies){ if(z2.hp>0 && Math.hypot(z2.x-z.x, z2.y-z.y) < GRID.cw*2 && z2.hp<z2.maxHp){
            z2.hp = Math.min(z2.maxHp, z2.hp + z2.maxHp*0.12); spawnParticles(z2.x, z2.y-10, "#9be36b", 6, 150);
          }}
        }
      }
      // 暗夜王: 挥舞暗夜王之剑, 发射刀光剑影(远程穿行伤害)
      if(z.sword && !frozen){
        if(z.swordCd==null) z.swordCd=4;
        z.swordCd -= dt;
        if(z.swordCd<=0){ z.swordCd=4; z.swingT=0.4;
          swordwaves.push({ x:z.x-34, y:z.y-14, r:z.r, vx:-380, dmg:240, hit:new Set(), t:0, life:3.5 });
          SFX.play("hit", 0.05);
        }
      }
      if(z.swingT>0) z.swingT -= dt;

      // 空降蜘蛛：下降 → 抓取 → 升空带走
      if(z.type==="spider"){
        if(!frozen){
          if(z.phase==="drop"){
            z.y += 135*dt;
            if(z.y>=z.targetY){ z.y=z.targetY; z.phase="grab"; }
          } else if(z.phase==="grab"){
            z.grabT -= dt;
            if(z.grabT<=0){
              const idx = plants.findIndex(pl=>pl.r===z.r && pl.c===z.col);
              // 钛金属土豆盾太重, 偷不走
              if(idx>=0 && !(plants[idx].type==="potatoshield" && plants[idx].fused)){ z.carry = plants[idx]; spawnParticles(z.x, z.y, "#caa", 10); plants.splice(idx,1); }
              z.phase = "lift";
            }
          } else { // lift
            z.y -= 115*dt;
            if(z.y < TOPBAR_H-50) z.gone = true;
          }
        }
        continue;   // 蜘蛛不走地面、不触发推车
      }

      // 盾穿山甲：从地底潜行(不可被攻击/无视植物)，最多钻到第5格后出土
      if(z.type==="pangolin" && z.phase!=="walk"){
        if(!frozen){
          if(z.phase==="dig"){
            z.x -= z.baseSpeed*1.4*dt;
            if(Math.random()<0.5) spawnParticles(z.x+10, cellCenterY(z.r)+30, "#9c7a4a", 1, 80);  // 土屑
            if(z.x <= z.surfaceX){ z.x = z.surfaceX; z.phase = "surface"; z.surfT = 0.5; z.burrowing = false;
              spawnParticles(z.x, cellCenterY(z.r)+12, "#b9a06a", 18, 240); SFX.play("chomp", 0.1);
              // 出土破坏当前格植物 (5级及以上土豆盾抗破坏, 不会被顶破)
              const c = colAtX(z.x), pi = plants.findIndex(pl=>pl.r===z.r && pl.c===c);
              if(pi>=0){ const pl=plants[pi];
                if(pl.type==="potatoshield" && (pl.up||0)>=5){ spawnParticles(z.x, pl.y, "#9fb6cf", 12, 200); }   // 顶不破
                else { spawnParticles(pl.x, pl.y, PLANTS[pl.type].color, 16, 240); explode(pl.x, pl.y, 6, 0, "#caa"); pl.dead = true; }
              }
            }
          } else { // surface 出土动画
            z.surfT -= dt; if(z.surfT<=0) z.phase = "walk";
          }
        }
        continue;   // 钻地/出土期间不做常规移动
      }

      // 橄榄球僵尸: 边走边向前方植物投掷橄榄球(远程伤害)
      // 投掷橄榄球 — 30波后才解锁(前期橄榄球只冲撞, 坚果/土豆盾可正面挡住)
      if(z.type==="football" && !frozen && waveNum>=30){
        if(z.throwCd==null) z.throwCd = 2 + Math.random()*1.5;
        z.throwCd -= dt;
        if(z.throwCd<=0){
          let tgt=null, best=Infinity;
          for(const p of plants){ if(p.r===z.r && p.hp>0 && p.x < z.x-20){ const d=z.x-p.x; if(d<best && d<5*GRID.cw){ best=d; tgt=p; } } }
          if(tgt){
            z.throwCd = 2.6 + Math.random()*1.2;
            const D=Math.max(80, z.x-tgt.x), apex=70, vx=300, T=D/vx, g=8*apex/(T*T), vy0=-g*T/2;
            footballs.push({ x:z.x-18, y:z.y-24, r:z.r, vx:-vx, vy:vy0, g, baseY:cellCenterY(z.r)+18, dmg:80, rot:0, vrot:-16 });
          } else { z.throwCd = 0.6; }   // 无目标稍后再探测
        }
      }

      const speed = frozen ? 0 : z.baseSpeed * (z.slowT>0 ? 0.45 : 1) * (z.mireT>0 ? 0.22 : 1);

      // 飞行单位(气球)无视植物, 直接飘过
      const blocker = z.fly ? null : plants.find(p=> p.r===z.r && p.hp>0 && p.kind!=="bomb" && p.kind!=="rowbomb" && Math.abs(p.x - z.x) < 40 && p.x < z.x+10);

      if(blocker && z.type==="polevault" && !z.vaulted && !frozen){
        z.vaulted = true; z.vaultAnim = 0.5; z.x = blocker.x - 46;
      } else if(blocker && z.big && !z.beam){
        // 巨人/钢盔巨人 重砸：每下造成固定伤害(肉盾可扛几下)，砸完短暂停顿 (鸣人Boss 用普通啃食)
        z.eating = true;
        if(z.freezeT>0){ /* 冰冻时停手 */ }
        else if(rowShield[blocker.r]>0){ /* 本行无敌护盾, 砸不动 */ }
        else {
          z.smashCd = (z.smashCd||0) - dt;
          if(z.smashCd<=0){
            spawnParticles(blocker.x, blocker.y, PLANTS[blocker.type].color, 16, 220);
            explode(blocker.x, blocker.y, 6, 0, "#caa");   // dust puff (0 dmg)
            blocker.dead = true;                            // 一拳碎植物
            z.smashCd = 1.3;
          }
        }
      } else if(blocker){
        z.eating = true;
        if(!frozen && rowShield[blocker.r]<=0){
          SFX.play("chomp", 0.35);
          blocker.hp -= z.eat*dt;
          if(blocker.hp<=0){ spawnParticles(blocker.x, blocker.y, PLANTS[blocker.type].color, 12); blocker.dead = true; }
        }
      } else {
        z.eating = false;
        z.x -= speed*dt;
      }
      if(z.x < GRID.x + 8){
        const m = mowers.find(m=>m.r===z.r && !m.used);
        if(m){ m.active = true; m.used = true; SFX.play("mower"); }          // launch the lawn-mower
        else if(z.x < GRID.x - 28){ state="lost"; endGame(); } // no mower left
      }
    }

    // lawn-mowers sweep
    for(const m of mowers){
      if(m.active){
        m.t += dt;
        m.x += 430*dt;
        for(const z of zombies){
          if(z.r===m.r && z.hp>0 && z.x < m.x+34 && z.x > m.x-34){
            z.hp = 0; spawnParticles(z.x, z.y, "#7a9e5e", 10);
          }
        }
        if(m.x > W+40) m.active = false;  // gone; stays used
      }
    }

    // 土豆盾被摧毁 -> 爆炸(伤害随等级) + Lv5以上留下土豆泥减速区
    for(const p of plants){
      if(p.dead && p.type==="potatoshield" && !p._boomed){
        p._boomed = true;
        const dmg = 120 + (p.up||0)*70;
        explode(p.x, p.y, GRID.cw*1.15, dmg, "#caa15a");
        spawnShards(p.x, p.y, 10, ["#b58a4c","#9c733a"]);
        if((p.up||0) >= 5) mashes.push({ r:p.r, x:p.x, w:GRID.cw, t:0, life:9 });   // 土豆泥
      }
    }
    plants = plants.filter(p=>!p.dead);
    zombies = zombies.filter(z=>{
      if(z.gone) return false;   // 蜘蛛带着植物飞走了(不计分)
      if(z.hp<=0){
        spawnParticles(z.x,z.y,"#7a9e5e",14);
        SFX.play("zombieDie", 0.04);
        if(z.freezeT>0) spawnShards(z.x,z.y-18,8,["#dff4fc","#bfe9fb"]);
        if(z.type==="gargantuar" || z.type==="irongarg"){   // 巨人/钢盔巨人死亡爆炸: 波及周围植物
          const dmg = z.type==="irongarg" ? 600 : 320;
          const rad = z.type==="irongarg" ? GRID.cw*1.7 : GRID.cw*1.5;
          explode(z.x, z.y, rad, 0, "#ff5a1e"); spawnShards(z.x,z.y-20,16,["#7a9e5e","#5a6b3c"]);
          for(const p of plants){ if(rowShield[p.r]<=0 && Math.hypot(p.x-z.x, p.y-z.y) < rad*0.93){ p.hp -= dmg; if(p.hp<=0) p.dead=true; } }
        }
        score += (KILLPTS[z.type]||10); return false;
      }
      return true;
    });

    // suns
    for(const s of suns){
      s.t += dt;
      if(s.fromSky && !s.landed){
        s.y += s.vy*dt; if(s.y>=s.targetY){ s.y=s.targetY; s.landed=true; }
      } else if(!s.fromSky && s.hop){
        s.hopVy += 200*dt; s.y += s.hopVy*dt; if(s.hopVy>0 && s.y>=s.targetY+20) s.hop=0;
      }
      if(s.landed || (!s.fromSky && !s.hop)) s.life -= dt;
      if(s.life<=0) s.dead = true;
    }
    suns = suns.filter(s=>!s.dead);

    for(const pt of particles){ pt.t+=dt; pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vy+=(pt.shard?520:200)*dt; if(pt.shard) pt.rot+=pt.vrot*dt; }
    particles = particles.filter(p=>p.t<p.life);
    // 掉落头盔
    for(const d of debris){
      d.t += dt;
      if(!d.landed){
        d.vy += 900*dt; d.x += d.vx*dt; d.y += d.vy*dt; d.rot += d.vrot*dt;
        if(d.y >= d.groundY){ d.y=d.groundY; d.landed=true; d.vy=0; d.vx*=0.2; d.vrot=0;
          // 躺平到接近水平
          d.rot = (d.rot>0?1:-1) * (Math.PI/2 - 0.2);
        }
      }
    }
    debris = debris.filter(d=>d.t < d.life);
    for(const e of explosions){ e.t+=dt; e.r = e.max*Math.min(1,e.t/0.18); }
    explosions = explosions.filter(e=>e.t<e.life);
    // 漂浮数字(回血等)
    for(const f of floats){ f.t+=dt; f.y+=f.vy*dt; f.vy*=(1-1.2*dt); }
    floats = floats.filter(f=>f.t<f.life);
    // 地刺动画
    for(const g of gspikes) g.t+=dt;
    gspikes = gspikes.filter(g=>g.t<g.life);
    // 橄榄球投射物: 抛物线飞向植物, 命中造成伤害
    for(const fb of footballs){
      fb.x += fb.vx*dt; fb.vy += fb.g*dt; fb.y += fb.vy*dt; fb.rot += fb.vrot*dt;
      if(Math.random()<0.4) particles.push({ x:fb.x, y:fb.y, vx:0, vy:10, life:0.3, t:0, color:"#7a4a28", size:2 });
      let hit=null;
      for(const p of plants){ if(p.r===fb.r && p.hp>0 && Math.abs(p.x-fb.x)<26 && Math.abs(p.y-fb.y)<32){ hit=p; break; } }
      if(!hit && fb.vy>0 && fb.y>=fb.baseY){            // 落地: 砸到该格植物
        hit = plants.find(p=>p.r===fb.r && p.hp>0 && Math.abs(p.x-fb.x)<GRID.cw*0.5) || true;
        fb.y = fb.baseY;
      }
      if(hit){
        if(hit!==true){ hit.hp -= fb.dmg; spawnParticles(hit.x, hit.y, PLANTS[hit.type].color, 8, 180); if(hit.hp<=0) hit.dead=true; }
        spawnParticles(fb.x, fb.y, "#8a5a30", 6, 160);
        fb.dead = true;
      } else if(fb.x < -20){ fb.dead = true; }
    }
    footballs = footballs.filter(f=>!f.dead);
    // 撒豆成兵: 巨型点燃豌豆火球从天而降, 落地大范围爆炸+点燃
    for(const bb of beanbombs){
      bb.vy += bb.g*dt; bb.y += bb.vy*dt; bb.x += (bb.vx||0)*dt; bb.rot += bb.vrot*dt;
      if(Math.random()<0.9) particles.push({ x:bb.x+(Math.random()*14-7), y:bb.y+(Math.random()*10-5), vx:-(bb.vx||0)*0.3, vy:-40-Math.random()*30, life:0.4, t:0, color:Math.random()<0.5?"#ff5a1e":"#ffb14e", size:3.5+Math.random()*2 });
      if(bb.y >= bb.targetY){
        explode(bb.x, bb.targetY, GRID.cw*1.3, bb.dmg, "#ff5a1e");
        for(const z of zombies){ if(z.hp>0 && Math.hypot(z.x-bb.x, z.y-bb.targetY) < GRID.cw*1.05) ignite(z); }
        spawnShards(bb.x, bb.targetY, 8, ["#9be36b","#3f9e3f"], "tri");
        bb.dead = true;
      }
    }
    beanbombs = beanbombs.filter(b=>!b.dead);
    // 暗夜王刀光剑影: 向左穿行, 伤害本行植物(无敌护盾可挡)
    for(const sw of swordwaves){
      sw.x += sw.vx*dt; sw.t += dt;
      if(rowShield[sw.r]<=0){
        for(const p of plants){ if(p.r===sw.r && p.hp>0 && Math.abs(p.x-sw.x)<30 && !sw.hit.has(p)){
          sw.hit.add(p); p.hp -= sw.dmg; spawnParticles(p.x, p.y, PLANTS[p.type].color, 8, 200); if(p.hp<=0) p.dead=true;
        }}
      }
      if(sw.x < GRID.x-40 || sw.t > sw.life) sw.dead = true;
    }
    swordwaves = swordwaves.filter(s=>!s.dead);
    // endless: no win condition — survive as long as possible
  }
