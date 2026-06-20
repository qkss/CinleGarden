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
      const big = (waveNum % 5 === 0);
      spawnWave(waveNum);
      score += 50 + waveNum*15;                 // survival/progress bonus for reaching a wave
      showBanner(big ? ("⚠ 第 "+waveNum+" 波 · 巨潮来袭！") : ("第 "+waveNum+" 波"));
      const interval = Math.max(12, 26 - waveNum*0.35);
      nextWaveAt = gameTime + (big ? interval + 8 : interval);
    }

    // 全局计时: 行无敌护盾倒计时 / 能量极光残留 / 终极寒冰全屏冰霜
    for(let r=0;r<ROWS;r++) if(rowShield[r]>0) rowShield[r]-=dt;
    for(const b of beams) b.t+=dt;
    beams = beams.filter(b=>b.t<b.life);
    if(waveNum>=100 && plants.some(p=>p.type==="snowpea" && p.up>=5)){
      frostCd -= dt;
      if(frostCd<=0){ frostCd = 20;
        for(const z of zombies){ if(z.hp>0){ z.freezeT=3; z.freezeImmune=0; z.slowT=0; } }   // 全屏冰冻3秒
        for(let i=0;i<32;i++) spawnParticles(GRID.x+Math.random()*COLS*GRID.cw, GRID.y+Math.random()*(ROWS*GRID.ch), "#bfe9fb", 1, 60);
        showBanner("❄️ 终极寒冰 · 冰霜雪雨！");
      }
    }

    // plants
    for(const p of plants){
      p.t += dt;
      if(p.recoil>0) p.recoil -= dt;
      const def = PLANTS[p.type];

      // 血量光环(血量分支 + 钢化) × 自身升级(土豆盾)：动态调整最大血量
      const targetMax = p.baseMaxHp * (p.selfHpMult||1) * rowHpMult(p.r);
      if(Math.abs(targetMax - p.maxHp) > 0.5){
        const add = targetMax - p.maxHp;
        p.maxHp = targetMax;
        p.hp = Math.min(p.maxHp, p.hp + Math.max(0, add));   // 升级时回血, 失去光环时夹紧
      }

      if(p.kind==="producer"){
        // 每级升级提升阳光产量; 终极(Lv7)产阳光x10
        if(p.t>=7){ p.t=0; const val=(p.up>=7)?250:Math.round(25*(1+0.4*p.up)); addSun(p.x, p.y-10, false, val); }
        // 终极向日葵(Lv7) 技能 — 按流派区分
        if(p.up>=7){
          if(p.branch==="atk" && waveNum>=100){
            // 攻速流: 100波后 每20秒给本行 2秒无敌护盾
            if(p.skillCd==null) p.skillCd=20;
            p.skillCd -= dt;
            if(p.skillCd<=0){ p.skillCd=20; rowShield[p.r]=Math.max(rowShield[p.r],2); showBanner("🌻 终极向日葵(攻速) · 无敌护盾！"); }
          } else if(p.branch==="hp"){
            // 血量流: 每10秒给本行所有植物回血 20% 最大血量
            if(p.healCd==null) p.healCd=10;
            p.healCd -= dt;
            if(p.healCd<=0){ p.healCd=10;
              for(const q of plants){ if(q.r===p.r && q.hp>0 && q.hp<q.maxHp){ q.hp=Math.min(q.maxHp, q.hp + q.maxHp*0.2); spawnParticles(q.x, q.y-10, "#7fd07a", 6, 140); } }
              showBanner("🌻 终极向日葵(血量) · 本行回血 +20%！");
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
          p.shootCd = def.rate / rowAttackMult(p.r);   // 攻速光环
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
          for(const z of zombies){ if(z.r===p.r) z.hp = 0; }
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
          const z = zombies.find(z=> z.r===p.r && Math.abs(z.x-p.x)<42 && z.hp>0);
          if(z){ explode(p.x, p.y, GRID.cw*0.9, 1800, "#ffcaa0"); p.dead = true; }
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
      // pass through a campfire -> become a fire pea: +30% damage, explosive splash
      // 冰冻弹(freeze)不会被附魔, 不叠加火焰
      if(!pea.fire && !pea.freeze){
        const torch = plants.find(p=>p.kind==="torch" && p.hp>0 && p.r===pea.r && Math.abs(p.x-pea.x)<26);
        if(torch){
          pea.fire = true;
          pea.dmg = Math.round(pea.dmg * 1.3);         // +30% damage
          spawnParticles(pea.x, pea.y, "#ff9a3c", 6, 90);
        }
      }
      // 尖刺：贯穿整行, 命中每只僵尸一次, 不消失
      if(pea.spike){
        for(const z of zombies){
          if(z.r===pea.r && z.hp>0 && Math.abs(z.x-pea.x)<26 && !pea.hit.has(z) && (pea.air || !z.fly)){
            pea.hit.add(z);
            if(z.doorHp>0 && !pea.fire){
              z.doorHp -= pea.dmg; spawnParticles(pea.x, pea.y, "#cfd4da", 4);
              if(z.doorHp<=0) spawnShards(z.x+16, z.y-4, 11, ["#c2c7cf","#9aa0aa"], "square");
            } else {
              z.hp -= pea.dmg;
              spawnParticles(pea.x, pea.y, pea.fire?"#ff7a1e":"#cfe6a0", 4);
            }
          }
        }
        if(pea.x>W+20 || pea.x<-20) pea.dead = true;
        continue;
      }
      for(const z of zombies){
        if(z.r===pea.r && Math.abs(z.x-pea.x)<26 && z.hp>0 && (pea.air || !z.fly)){
          // 铁门挡住普通豌豆(伤害打在门上)；火焰豌豆无视铁门直接打本体
          if(z.doorHp>0 && !pea.fire){
            z.doorHp -= pea.dmg;
            spawnParticles(pea.x, pea.y, "#cfd4da", 5);
            if(z.doorHp<=0) spawnShards(z.x+16, z.y-4, 11, ["#c2c7cf","#9aa0aa"], "square");
            pea.dead = true; break;
          }
          z.hp -= pea.dmg;
          if(pea.fire){
            // 爆裂(范围)伤害：溅射到同行附近的僵尸
            explosions.push({ x:pea.x, y:pea.y, r:0, max:44, t:0, life:0.3, color:"#ff7a1e" });
            for(const z2 of zombies){
              if(z2!==z && z2.r===pea.r && Math.abs(z2.x-pea.x)<48 && z2.hp>0) z2.hp -= pea.dmg*0.5;
            }
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
      if(z.slowT>0) z.slowT -= dt;
      if(z.mireT>0) z.mireT -= dt;
      const wasFrozen = z.freezeT>0;
      if(z.freezeT>0) z.freezeT -= dt;
      if(z.freezeImmune>0) z.freezeImmune -= dt;
      if(wasFrozen && z.freezeT<=0){ spawnShards(z.x, z.y-18, 12, ["#dff4fc","#bfe9fb","#9fd8f5"]); z.freezeImmune = 1.5; }  // 解冻→碎裂+免疫1.5s
      // 护甲被打掉的碎裂动画
      if(!z.armorBroken && z.maxHp>z.bodyMax && z.hp<=z.bodyMax){
        z.armorBroken = true;
        const a = {cone:{c:["#e08a2e","#b96d1c"],s:"tri"}, bucket:{c:["#c2c7cf","#9aa0aa"],s:"square"},
                   ironclad:{c:["#aab0b8","#7e848c"],s:"square"}, football:{c:["#c64b4b","#7a2b2b"],s:"square"}}[z.type];
        if(a){ spawnShards(z.x, z.y-34, 13, a.c, a.s); spawnHelmet(z); }
      }
      if(z.vaultAnim>0) z.vaultAnim -= dt;
      // 女巫增益到期 -> 还原血量(+500%临时血)
      if(z.buffT>0){ z.buffT-=dt; if(z.buffT<=0 && z.buffActive){ z.buffActive=false; z.maxHp/=6; if(z.hp>z.maxHp) z.hp=z.maxHp; } }
      const frozen = z.freezeT>0;

      // 女巫: 每5秒给周围僵尸 +500% 血量(持续2秒)
      if(z.buff && !frozen){
        if(z.buffCd==null) z.buffCd=5;
        z.buffCd -= dt;
        if(z.buffCd<=0){ z.buffCd=5;
          for(const z2 of zombies){ if(z2.hp>0 && Math.hypot(z2.x-z.x, z2.y-z.y) < GRID.cw*1.6){
            if(!z2.buffActive){ z2.buffActive=true; z2.maxHp*=6; z2.hp*=6; }   // +500% 血
            z2.buffT = 2;
          }}
          for(let i=0;i<16;i++) spawnParticles(z.x, z.y-10, "#c77dff", 1, 180);
        }
      }
      // 鸣人Boss: 能量极光 — 穿透整行, 高伤
      if(z.beam && !frozen){
        if(z.beamCd==null) z.beamCd=3.5;
        z.beamCd -= dt;
        if(z.beamCd<=0){ z.beamCd=3.5;
          beams.push({ r:z.r, x:z.x, t:0, life:0.5 });
          if(rowShield[z.r]<=0){ for(const p of plants){ if(p.r===z.r && p.hp>0){ p.hp-=250; if(p.hp<=0) p.dead=true; } } }
        }
      }

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
              if(idx>=0){ z.carry = plants[idx]; spawnParticles(z.x, z.y, "#caa", 10); plants.splice(idx,1); }
              z.phase = "lift";
            }
          } else { // lift
            z.y -= 115*dt;
            if(z.y < TOPBAR_H-50) z.gone = true;
          }
        }
        continue;   // 蜘蛛不走地面、不触发推车
      }

      const speed = frozen ? 0 : z.baseSpeed * (z.slowT>0 ? 0.45 : 1) * (z.mireT>0 ? 0.22 : 1);

      // 飞行单位(气球)无视植物, 直接飘过
      const blocker = z.fly ? null : plants.find(p=> p.r===z.r && p.hp>0 && p.kind!=="bomb" && p.kind!=="rowbomb" && Math.abs(p.x - z.x) < 40 && p.x < z.x+10);

      if(blocker && z.type==="polevault" && !z.vaulted && !frozen){
        z.vaulted = true; z.vaultAnim = 0.5; z.x = blocker.x - 46;
      } else if(blocker && z.type==="gargantuar"){
        // 巨人重砸：每下造成固定伤害(肉盾可扛几下)，砸完短暂停顿
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
          blocker.hp -= z.eat*dt;
          if(blocker.hp<=0){ spawnParticles(blocker.x, blocker.y, PLANTS[blocker.type].color, 12); blocker.dead = true; }
        }
      } else {
        z.eating = false;
        z.x -= speed*dt;
      }
      if(z.x < GRID.x + 8){
        const m = mowers.find(m=>m.r===z.r && !m.used);
        if(m){ m.active = true; m.used = true; }          // launch the lawn-mower
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
        if(z.freezeT>0) spawnShards(z.x,z.y-18,8,["#dff4fc","#bfe9fb"]);
        if(z.type==="gargantuar"){   // 巨人死亡爆炸: 波及周围植物
          explode(z.x, z.y, GRID.cw*1.5, 0, "#ff5a1e"); spawnShards(z.x,z.y-20,16,["#7a9e5e","#5a6b3c"]);
          for(const p of plants){ if(rowShield[p.r]<=0 && Math.hypot(p.x-z.x, p.y-z.y) < GRID.cw*1.4){ p.hp -= 320; if(p.hp<=0) p.dead=true; } }
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
    // endless: no win condition — survive as long as possible
  }
