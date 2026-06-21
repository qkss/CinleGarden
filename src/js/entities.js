"use strict";
  // ---------- Entities ----------
  const PLANT_HP_MULT = 3;   // 所有植物基础血量 ×3
  function addPlant(type, r, c){
    const def = PLANTS[type];
    const baseHp = def.hp * PLANT_HP_MULT;
    const p = { type, kind:def.kind, r, c, x:cellCenterX(c), y:cellCenterY(r),
      hp:baseHp, maxHp:baseHp, baseMaxHp:baseHp, selfHpMult:1, t:Math.random()*2, shootCd:0.6, recoil:0, up:0, branch:null };
    if(type==="cherrybomb") p.fuse = 1.0;
    if(type==="jalapeno") p.fuse = 1.0;
    if(type==="potatomine"){ p.arm = 6; p.armed = false; }
    plants.push(p);
  }
  // 100波后僵尸血量缩放: 每10波 +10% (110波=1.1x, 120波=1.2x ...)
  function zombieHpScale(){ return waveNum>100 ? 1 + 0.10*Math.floor((waveNum-100)/10) : 1; }
  function addZombie(type, row){
    const d = ZTYPES[type];
    const mult = zombieHpScale();
    const hp = Math.round(d.hp * mult);
    zombies.push({
      type, r:row, x:W + 30 + Math.random()*40, y:cellCenterY(row),
      hp, maxHp:hp, bodyMax:Math.round((d.body!=null?d.body:d.hp) * mult), baseSpeed:d.speed + Math.random()*2,
      eating:false, t:Math.random()*Math.PI*2, slowT:0, freezeT:0, freezeImmune:0, mireT:0, vaulted:false, vaultAnim:0,
      big:!!d.big, eat:d.eat||35, armorBroken:false,
    });
    const z = zombies[zombies.length-1];
    if(d.fly){ z.fly = true; z.baseRowY = cellCenterY(row); z.y = z.baseRowY - 32; }   // 气球飞行高度 (蜘蛛也判定为空中, 下方再覆盖坐标)
    if(type==="spider"){
      // 空降：落在最右侧 4 列范围内的某格 (覆盖 fly 块设置的 y)
      const col = COLS-1 - Math.floor(Math.random()*4);     // 列 5..8
      z.col = col; z.x = cellCenterX(col); z.y = TOPBAR_H-20;
      z.phase = "drop"; z.targetY = cellCenterY(row); z.grabT = 0.6; z.carry = null;
    }
    if(d.door!=null){ z.doorHp = d.door; }                                             // 铁门护盾值
    if(d.shield!=null){ z.shieldHp = Math.round(d.shield*mult); z.shieldMax = z.shieldHp; }   // 盾牌巨人: 只能被穿刺打破
    if(d.burrow){   // 盾穿山甲: 随机锁定本行一株植物, 最远钻到第5格
      z.phase = "dig"; z.burrowing = true;
      const rowPlants = plants.filter(pl=>pl.r===row);
      let col = 4;   // 默认第5格(列index4)
      if(rowPlants.length){ const tgt = rowPlants[Math.floor(Math.random()*rowPlants.length)]; col = Math.max(tgt.c, 4); }
      z.surfaceX = cellCenterX(col);
    }
    if(d.beam){ z.beam = true; z.beamCd = 9; z.invulnT = 8; }                            // 鸣人: 能量极光(每9秒) + 出场8秒无敌(期间免疫冰冻)
    if(d.buff){ z.buff = true; z.buffCd = 5; }                                         // 女巫: 群体增益
    if(d.heal){ z.heal = true; z.healCd = 5; }                                          // 骷髅祭祀: 群体回血
    if(d.sword){ z.sword = true; z.swordCd = 4; }                                       // 暗夜王: 刀光剑影
    if(d.noFreeze){ z.noFreeze = true; }                                                // 免疫冰冻
  }
  function addPea(x,y,r,freeze,air,spike,fdur,dir){
    if(freeze){
      // 抛物线投掷冰冻弹：朝本行最近僵尸抛出
      let tx = x+300;
      let best = Infinity;
      for(const z of zombies){ if(z.r===r && z.x>x && z.hp>0){ const d=z.x-x; if(d<best){ best=d; tx=z.x; } } }
      const baseY = cellCenterY(r);
      const D = Math.max(120, tx - x);                     // reach the target, any distance
      const apex = 95, vx = 330, T = D/vx, g = 8*apex/(T*T), vy0 = -g*T/2;  // constant apex, lands at baseY
      peas.push({ x, y:baseY-2, r, arc:true, vx, vy:vy0, g, baseY, dmg:25, freeze:true, freezeDur: fdur||1.5 });
      return;
    }
    const pea = { x, y, r, speed:330, dmg:25, freeze:false, air:!!air, spike:!!spike, dir:dir||1 };
    if(spike) pea.hit = new Set();   // 穿透: 记录已命中的僵尸, 避免重复
    peas.push(pea);
  }
  // 终极土豆盾技能: 释放本行 2 秒无敌护盾
  function firePotatoSkill(p){
    if(!p || p.dead) return;
    rowShield[p.r] = Math.max(rowShield[p.r], 5);
    const cy = cellCenterY(p.r);
    for(let gx=GRID.x+20; gx<GRID.x+COLS*GRID.cw; gx+=44){
      explosions.push({ x:gx, y:cy, r:0, max:30, t:0, life:0.5, color:"#bfe0ff" });
      spawnParticles(gx, cy, "#9fd8f5", 4, 120);
    }
    for(const q of plants){ if(q.r===p.r && q.hp>0) q.glowT = 2; }
    SFX.play("shield");
    p.skillCd = 20; p.skillReady = false;
  }
  // 土豆盾技能图标 / 自动开关 的点击热区 (悬浮在土豆盾上方)
  function potatoSkillRects(p){
    const cx = p.x, top = p.y - 40;
    return {
      icon: { x:cx-16, y:top-16, w:32, h:32 },     // 技能图标(就绪时点击释放)
      mode: { x:cx-24, y:top-34, w:48, h:16 },     // 自动/手动 小开关
    };
  }

  // 融化反应: 正在灼伤的僵尸被冰霜冻结 -> 剩余灼伤伤害 x3 立即爆发 + 蒸汽
  function meltBurn(z){
    if(!z || z.hp<=0 || !(z.burnT>0)) return;
    const dmg = z.burnDps * z.burnT * 3;   // 剩余灼伤 +200%
    z.hp -= dmg; z.burnT = 0;
    explosions.push({ x:z.x, y:z.y-8, r:0, max:54, t:0, life:0.38, color:"#ffd9a0" });
    spawnParticles(z.x, z.y-10, "#eaf6fb", 14, 220); spawnParticles(z.x, z.y-10, "#ffb14e", 8, 200);
    floats.push({ x:z.x, y:z.y-26, vy:-34, t:0, life:1.0, text:"融化!", color:"#ffd9a0" });
  }
  // 点燃僵尸: 持续5秒灼伤 (冰冻会熄火)
  function ignite(z){
    if(!z || z.hp<=0 || z.freezeT>0) return;
    z.burnT = 5; z.burnDps = 45;          // 5秒 × 45/s = 225 灼伤总量
    spawnParticles(z.x, z.y-16, "#ff7a1e", 8, 140);
  }
  function iceBurst(px, py, r, dur){
    dur = dur||1.5;
    SFX.play("freeze", 0.08);
    explosions.push({ x:px, y:py, r:0, max:50, t:0, life:0.4, color:"#9fd8f5" });
    for(const z of zombies){
      // 小范围冻结(只冻命中点附近1格), 不再整片锁场
      if(z.shieldHp>0 || z.burrowing) continue;   // 盾牌巨人未破盾 / 地底潜行: 免疫冰冻弹
      if(z.hp>0 && Math.hypot(z.x-px, z.y-py) < 50){
        z.hp -= 15;
        if(z.freezeT<=0 && (z.freezeImmune||0)<=0){ z.freezeT = dur; z.slowT = 0; }  // 解冻后免疫期内不可再冻, 杜绝无限冰冻
      }
    }
    spawnParticles(px, py, "#bfe9fb", 12, 160);
    spawnShards(px, py, 5, ["#dff4fc","#bfe9fb"]);
  }
  function addSun(x,y,fromSky,value){
    suns.push({ x, y, vy:fromSky?28:-40,
      targetY:fromSky?(GRID.y + Math.random()*(ROWS*GRID.ch-40)):y,
      landed:!fromSky, hop:fromSky?0:1, hopVy:fromSky?0:-70, value:value||25, life:9, t:0, fromSky,
      big:(value||25)>=100 });
  }

  // ---------- Sunflower upgrade auras (unlocked after wave 15) ----------
  // 两条分支: branch="atk"(攻速, 每级+20% 满级x2) / "hp"(血量, 每级+50% 本行植物血量)
  // Lv5 后合流: Lv6 钢化(再 +100% 血) / Lv7 终极(全场CD-50% 且自身产阳光x10)
  const UPGRADE_WAVE = 5;
  function rowAttackMult(r){
    let lvl=0;
    for(const p of plants) if(p.type==="sunflower" && p.r===r && p.branch==="atk" && p.up>=1) lvl=Math.max(lvl, Math.min(p.up,5));
    let m = 1 + 0.2*lvl;                 // atk-branch Lv5 -> x2 fire rate
    if(rowBerserk && rowBerserk[r]>0) m *= 2;   // 狂暴: 攻速 +100%
    return m;
  }
  function rowHpMult(r){
    let m=1;
    for(const p of plants){ if(p.type==="sunflower" && p.r===r){
      let pm = 1;
      if(p.branch==="hp") pm *= (1 + 0.5*Math.min(p.up,5));   // 血量分支 每级+50%
      if(p.up>=6) pm *= 2;                                    // 钢化 +100%
      m = Math.max(m, pm);                                    // 取本行最强一株, 不叠乘
    }}
    return m;
  }
  function ultimateActive(){ return plants.some(p=>p.type==="sunflower" && p.up>=7); }
  const FUSE_COST = 10000;
  // 可融合: 向日葵需同流派5棵终极; 寒冰/三豆需5棵满级
  function fusionEligible(p){
    if(!p || p.fused) return false;
    if(p.type==="sunflower"){
      if(!(p.up>=7 && p.branch)) return false;
      let n=0; for(const q of plants){ if(q.type==="sunflower" && q.up>=7 && q.branch===p.branch && !q.fused) n++; }
      return n>=5;
    }
    if(p.type==="snowpea" || p.type==="threepeater" || p.type==="potatoshield" || p.type==="bigcactus"){
      if(nextUpgradeCost(p)!==null) return false;   // 必须满级(Lv10)
      let n=0; for(const q of plants){ if(q.type===p.type && nextUpgradeCost(q)===null && !q.fused) n++; }
      return n>=5;
    }
    return false;
  }
  // 是否为可参与融合的满级植物(被吞并的判定)
  function fusionMember(q){
    if(q.type==="sunflower") return q.up>=7;
    return nextUpgradeCost(q)===null;
  }
  // 融合等级光环颜色: 1白 2绿 3蓝 4金 5黑 6暗红
  const FUSE_HALO = ["#ffffff","#7fe88a","#7fb8ff","#ffd23f","#3a3a3a","#9a2b2b"];
  const FUSE_MAXLV = 6;
  // 二次融合(二合一): 已融合植物 + 同类(同流派)另一融合体, 升一级
  function refusionEligible(p){
    if(!p || !p.fused || (p.fuseLevel||1) >= FUSE_MAXLV) return false;
    for(const q of plants){ if(q!==p && q.fused && q.type===p.type && (p.type!=="sunflower" || q.branch===p.branch) && (q.fuseLevel||1)===(p.fuseLevel||1)) return true; }
    return false;
  }
  // 应用融合等级数值: 血量随等级提升
  function applyFuseStats(p){
    const L = Math.min(p.fuseLevel||1, FUSE_MAXLV);
    p.selfHpMult = (p.type==="potatoshield" ? 20 : 10) * L;
  }
  // 同类融合体中的最高融合等级(全局技能用)
  function maxFuseLevel(type){
    let L=0; for(const q of plants){ if(q.type===type && q.fused) L=Math.max(L, q.fuseLevel||1); }
    return L;
  }
  function nextUpgradeCost(p){
    if(!p) return null;
    if(p.type==="sunflower"){
      if(p.up<5) return 250*(p.up+1);   // 线性: 250/500/750/1000/1250 (Lv1-5)
      if(p.up===5) return 2500;          // Lv6 钢化
      if(p.up===6) return 5000;          // Lv7 终极
      return null;
    }
    // 其余植物: 升级阳光随等级线性增加 base*(等级+1)
    if(p.type==="potatoshield"){ return p.up<10 ? 250*(p.up+1) : null; }   // 250,500...2500 最高Lv10
    if(p.type==="snowpea"){ return p.up<5 ? 250 : (p.up<10 ? 500*(p.up-4) : null); }   // Lv1-5:250; Lv6-10阳光大量增加(500/1000/1500/2000/2500); 最高Lv10
    if(p.type==="threepeater"){ return p.up<10 ? 300*(p.up+1) : null; }     // 300,600...3000 最高Lv10
    if(p.type==="campfire"){ return p.up<5 ? 250*(p.up+1) : null; }          // 250,500...1250 最高Lv5
    if(p.type==="bigcactus"){ return p.up<10 ? 250*(p.up+1) : null; }         // 250,500...2500 最高Lv10
    return null;
  }
  // 巨仙掌自身攻速倍率: Lv0=1, Lv10=2x
  function bigcactusAtkMult(p){ return 1 + 0.1 * Math.min(p.up||0, 10); }
  // 地刺(巨仙掌Lv10): 在攻击目标格钻出一根巨型仙人掌(斜向前), 击退2格 + 穿刺伤害
  function fireGroundSpikes(p){
    // 找本行前方4格内最近可命中目标 (含地底潜行的穿山甲: 地刺能把它撞出来)
    let target=null, best=Infinity;
    for(const z of zombies){
      if(z.r===p.r && z.hp>0 && z.x>p.x && !z.fly){ const d=z.x-p.x; if(d<best && d<=4*GRID.cw){ best=d; target=z; } }
    }
    if(!target) return false;
    const tx = target.x;
    gspikes.push({ r:p.r, x:tx, t:0, life:0.9 });    // 单根巨型地刺
    SFX.play("plant");
    const KB = 2*GRID.cw;   // 击退2格
    for(const z of zombies){
      if(z.r===p.r && z.hp>0 && !z.fly && Math.abs(z.x - tx) < GRID.cw*0.7){
        if(z.burrowing){   // 把地底潜行的穿山甲撞出地面
          z.burrowing=false; z.phase="surface"; z.surfT=0.5;
          spawnParticles(z.x, cellCenterY(z.r)+10, "#b9a06a", 18, 260);
        }
        if(z.shieldHp>0) z.shieldHp -= 250;   // 地刺=穿刺, 可破盾
        else z.hp -= 250;
        z.x = Math.min(W+24, z.x + KB);        // 击退2格
        z.slowT = Math.max(z.slowT, 0.6);
        spawnParticles(z.x, z.y, "#9be36b", 12, 260);
      }
    }
    return true;
  }
  // 各类植物可升级的最早波数 (篝火需50波, 其余沿用 UPGRADE_WAVE)
  function upgradeMinWave(p){ return (p && p.type==="campfire") ? 50 : UPGRADE_WAVE; }
  // 篝火火焰伤害倍率(随等级) 与 是否点燃(Lv5)
  function torchFireMult(lvl){ return 1.3 + 0.2*(lvl||0); }   // Lv0=1.3 ... Lv5=2.3
  function torchIgnites(lvl){ return (lvl||0) >= 5; }
  // 三豆射手自身攻速倍率: Lv0=1, Lv10=5
  function threepeaterAtkMult(p){ return 1 + 0.4 * Math.min(p.up||0, 10); }
  function upgradeLabel(p){
    const up=p.up, b=p.branch;
    if(up<=0) return "向日葵";
    if(up<=5) return (b==="hp"?"血量向日葵 Lv":"攻速向日葵 Lv")+up;
    return up===6 ? "钢化向日葵" : "终极向日葵";
  }
  function effCooldown(key){ return PLANTS[key].cooldown * (ultimateActive()?0.5:1); }
  function cardLocked(key){ return (PLANTS[key].unlock||0) > waveNum; }   // 未到解锁波数

  // branch-selection menu geometry/hit-test
  function upgradeMenuRects(){
    if(!upgradeMenu) return null;
    const p=upgradeMenu.p, bw=72, bh=30, gap=10, totalW=bw*2+gap;
    const y=Math.max(TOPBAR_H+24, cellY(p.r)-12);   // 紧贴花头上方(标题留在顶栏下方)
    let x0=p.x-totalW/2;
    x0=Math.max(GRID.x+2, Math.min(x0, GRID.x+COLS*GRID.cw-totalW-2));
    return { atk:{x:x0,y,w:bw,h:bh}, hp:{x:x0+bw+gap,y,w:bw,h:bh}, cx:x0+totalW/2, ty:y-18 };
  }
  function upgradeMenuHit(mx,my){
    const r=upgradeMenuRects(); if(!r) return null;
    const inside=b=>mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h;
    if(inside(r.atk)) return "atk";
    if(inside(r.hp)) return "hp";
    return null;
  }
  function spawnParticles(x,y,color,n,spread){
    spread = spread||120;
    for(let i=0;i<n;i++) particles.push({ x,y,
      vx:(Math.random()-.5)*spread, vy:(Math.random()-.7)*spread,
      life:.5+Math.random()*.4, t:0, color, size:3+Math.random()*3 });
  }
  // shatter shards: rotating fragments that fly out and fall (for ice break / armor break)
  function spawnShards(x,y,n,colors,shape){
    if(typeof colors==="string") colors=[colors];
    shape = shape||"tri";
    for(let i=0;i<n;i++) particles.push({ x:x+(Math.random()-.5)*22, y:y+(Math.random()-.5)*22,
      vx:(Math.random()-.5)*230, vy:-Math.random()*210-40,
      life:.6+Math.random()*.5, t:0, color:colors[i%colors.length], size:4+Math.random()*5,
      shard:true, shape, rot:Math.random()*6.28, vrot:(Math.random()-.5)*14 });
  }
  // 掉落的头盔：飞出后落到地上躺一会儿再渐隐
  function spawnHelmet(z){
    debris.push({ type:z.type, x:z.x+(Math.random()*8-4), y:z.y-30,
      vx:-40 + (Math.random()*60-30), vy:-220-Math.random()*60,
      rot:(Math.random()*0.6-0.3), vrot:(Math.random()-.5)*10,
      groundY: cellCenterY(z.r)+34, landed:false, life:4.5, t:0 });
  }
  function explode(x,y,radius,dmg,color){
    if(dmg>0) SFX.play("explode", 0.05);
    explosions.push({ x, y, r:0, max:radius, t:0, life:0.5, color:color||"#ff8a1e" });
    for(const z of zombies){
      if(z.burrowing) continue;   // 地底潜行免疫爆炸 (盾牌巨人的盾挡不住爆炸/火焰, 可被炸伤)
      if(Math.hypot(z.x-x, z.y-y) < radius){ z.hp -= dmg; }
    }
    spawnParticles(x,y,"#ffb14e",24,300);
    spawnParticles(x,y,"#ff5a1e",16,260);
  }
