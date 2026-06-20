"use strict";
  // ---------- Entities ----------
  function addPlant(type, r, c){
    const def = PLANTS[type];
    const p = { type, kind:def.kind, r, c, x:cellCenterX(c), y:cellCenterY(r),
      hp:def.hp, maxHp:def.hp, baseMaxHp:def.hp, selfHpMult:1, t:Math.random()*2, shootCd:0.6, recoil:0, up:0, branch:null };
    if(type==="cherrybomb") p.fuse = 1.0;
    if(type==="jalapeno") p.fuse = 1.0;
    if(type==="potatomine"){ p.arm = 6; p.armed = false; }
    plants.push(p);
  }
  function addZombie(type, row){
    const d = ZTYPES[type];
    const hp = d.hp;
    zombies.push({
      type, r:row, x:W + 30 + Math.random()*40, y:cellCenterY(row),
      hp, maxHp:hp, bodyMax:(d.body!=null?d.body:hp), baseSpeed:d.speed + Math.random()*2,
      eating:false, t:Math.random()*Math.PI*2, slowT:0, freezeT:0, freezeImmune:0, mireT:0, vaulted:false, vaultAnim:0,
      big:!!d.big, eat:d.eat||35, armorBroken:false,
    });
    const z = zombies[zombies.length-1];
    if(type==="spider"){
      // 空降：落在最右侧 4 列范围内的某格
      const col = COLS-1 - Math.floor(Math.random()*4);     // 列 5..8
      z.col = col; z.x = cellCenterX(col); z.y = TOPBAR_H-20;
      z.phase = "drop"; z.targetY = cellCenterY(row); z.grabT = 0.6; z.carry = null;
    }
    if(d.fly){ z.fly = true; z.baseRowY = cellCenterY(row); z.y = z.baseRowY - 32; }   // 气球飞行高度
    if(d.door!=null){ z.doorHp = d.door; }                                             // 铁门护盾值
    if(d.beam){ z.beam = true; z.beamCd = 3.5; }                                       // 鸣人: 能量极光
    if(d.buff){ z.buff = true; z.buffCd = 5; }                                         // 女巫: 群体增益
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
  function iceBurst(px, py, r, dur){
    dur = dur||1.5;
    explosions.push({ x:px, y:py, r:0, max:50, t:0, life:0.4, color:"#9fd8f5" });
    for(const z of zombies){
      // 小范围冻结(只冻命中点附近1格), 不再整片锁场
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
    return 1 + 0.2*lvl;                 // atk-branch Lv5 -> x2 fire rate
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
  function nextUpgradeCost(p){
    if(!p) return null;
    if(p.type==="sunflower"){
      if(p.up<5) return 250;
      if(p.up===5) return 1000;          // Lv6 钢化
      if(p.up===6) return 1500;          // Lv7 终极
      return null;
    }
    if(p.type==="potatoshield"){ return p.up<10 ? 250 : null; }   // 每级+50%血, 最高Lv10
    if(p.type==="snowpea"){ return p.up<5 ? 250 : null; }          // 每级+0.2s冰冻, 最高Lv5
    return null;
  }
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
    const y=Math.max(GRID.y+2, cellY(p.r)-42);
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
    explosions.push({ x, y, r:0, max:radius, t:0, life:0.5, color:color||"#ff8a1e" });
    for(const z of zombies){
      if(Math.hypot(z.x-x, z.y-y) < radius){ z.hp -= dmg; }
    }
    spawnParticles(x,y,"#ffb14e",24,300);
    spawnParticles(x,y,"#ff5a1e",16,260);
  }
