"use strict";
  // ---------- Layout ----------
  const COLS = 9, ROWS = 5;
  const GRID = { x: 60, y: 130, cw: 96, ch: 92 };
  const TOPBAR_H = 100;
  const W = canvas.width, H = canvas.height;
  const SHOVEL = { x: 128, y: 16, w: 58, h: 70 };          // 铲子放最左(紧挨阳光计数)
  const CARD_X0 = 194, CARD_W = 60, CARD_STRIDE = 67, CARD_Y = 14, CARD_H = 74;
  // 卡片快捷键: 1-9, 0, -, +, = (依次对应 13 张卡); 铲子: ~
  const HOTKEYS = ["1","2","3","4","5","6","7","8","9","0","-","+","="];
  const HOTKEY_LABEL = ["1","2","3","4","5","6","7","8","9","0","-","+","="];

  const cellX = c => GRID.x + c * GRID.cw;
  const cellY = r => GRID.y + r * GRID.ch;
  const cellCenterX = c => cellX(c) + GRID.cw/2;
  const cellCenterY = r => cellY(r) + GRID.ch/2;
  const colAtX = px => { const c = Math.floor((px - GRID.x)/GRID.cw); return (c>=0&&c<COLS)?c:-1; };
  const rowAtY = py => { const r = Math.floor((py - GRID.y)/GRID.ch); return (r>=0&&r<ROWS)?r:-1; };

  // ---------- Plant definitions ----------
  const PLANTS = {
    sunflower: { name:"向日葵", cost:50,  cooldown:5,  hp:60,  kind:"producer", color:"#ffd23f" },
    peashooter:{ name:"豌豆",  cost:100, cooldown:5,  hp:60,  kind:"shooter",  color:"#5cb85c", dmg:25, rate:1.2, shots:1 },
    snowpea:   { name:"寒冰",  cost:175, cooldown:8,  hp:60,  kind:"shooter",  color:"#4fb6e0", dmg:25, rate:2.6, shots:1, freeze:true, unlock:40 },
    repeater:  { name:"双发",  cost:200, cooldown:10, hp:60,  kind:"shooter",  color:"#3f9e3f", dmg:25, rate:1.3, shots:2, unlock:10 },
    threepeater:{name:"三豆",  cost:325, cooldown:12, hp:60,  kind:"shooter",  color:"#3f9e3f", dmg:25, rate:1.6, shots:3, unlock:50 },
    cactus:    { name:"仙人掌", cost:125, cooldown:6,  hp:60, kind:"shooter", color:"#5aa84a", dmg:20, rate:1.4, shots:1, spike:true, back:true },  // 穿透尖刺(仅地面)·可向后射击
    bigcactus: { name:"巨仙掌", cost:225, cooldown:10, hp:80, kind:"shooter", color:"#3f7e33", dmg:25, rate:1.4, shots:1, spike:true, air:true, unlock:10 },  // 穿透尖刺·可打空中(10波解锁)
    jalapeno:  { name:"辣椒",  cost:500, cooldown:25, hp:60,  kind:"rowbomb",   color:"#d23f3f", unlock:20 },
    campfire:  { name:"篝火",  cost:175, cooldown:15, hp:200, kind:"torch",    color:"#ff7a1e", unlock:10 },
    wallnut:   { name:"坚果",  cost:50,  cooldown:15, hp:320, kind:"defense",  color:"#c99761" },
    potatoshield:{ name:"土豆盾", cost:75, cooldown:20, hp:520, kind:"defense", color:"#9c6b3a" },
    cherrybomb:{ name:"樱桃",  cost:150, cooldown:22, hp:60,  kind:"bomb",     color:"#e0413f" },
    potatomine:{ name:"地雷",  cost:25,  cooldown:18, hp:60,  kind:"mine",     color:"#b58a4c" },
  };
  const CARD_ORDER = ["sunflower","peashooter","repeater","snowpea","threepeater","cactus","bigcactus","campfire","wallnut","potatoshield","jalapeno","cherrybomb","potatomine"];

  // ---------- Zombie definitions ----------
  const ZTYPES = {
    // hp = 总血量, body = 脱去护甲后的本体血量(护甲血 = hp - body)
    basic:     { name:"普通", hp:110,  body:110,  speed:14,   accessory:null },
    cone:      { name:"路障", hp:220,  body:110,  speed:13,   accessory:"cone" },      // 护甲≈1个普通, 共2个普通
    bucket:    { name:"铁桶", hp:500,  body:110,  speed:12,   accessory:"bucket" },    // 铁桶帽
    ironclad:  { name:"铁甲", hp:850,  body:110,  speed:10.5, accessory:"ironclad" },  // 钢盔
    polevault: { name:"撑杆", hp:160,  body:160,  speed:30,   accessory:"pole" },
    football:  { name:"橄榄球", hp:1100, body:200, speed:23,  accessory:"football" },  // 头盔护甲加厚, 本体也更厚
    gargantuar:{ name:"巨人", hp:3400, body:3400, speed:8,    accessory:"garg", big:true, eat:70 },
    irongarg:  { name:"钢盔巨人", hp:13600, body:13600, speed:8, accessory:"irongarg", big:true, eat:70 },  // 100波后, 血量再翻倍
    shieldgiant:{ name:"盾牌巨人", hp:3400, body:3400, speed:8, accessory:"shieldgiant", big:true, eat:70, shield:1500 },  // 盾牌只能被穿刺打破, 免疫豌豆, 破盾后才可击杀
    pangolin:  { name:"盾穿山甲", hp:900, body:360, speed:13, accessory:"pangolin", burrow:true },  // 地底潜行(不可攻击)最多钻到第5格, 厚甲高防御
    giantrider:{ name:"巨人骑兵", hp:17000, body:17000, speed:11, accessory:"giantrider", big:true, eat:70 },   // 5倍普通巨人血量, 骑乘战马较快
    armorboss: { name:"装甲车", hp:68000, body:68000, speed:6, accessory:"armorboss", big:true, eat:140 },       // BOSS: 20倍巨人血量, 车顶坐巨人, 同屏最多2个
    spider:    { name:"蜘蛛", hp:150,  body:150,  speed:0,    accessory:"spider", fly:true },   // 空降偷植物 — 判定空中, 仅对空可击
    balloon:   { name:"气球", hp:90,   body:90,   speed:17,   accessory:"balloon", fly:true },     // 飞行,需对空
    griffin:   { name:"狮鹫骑士", hp:3600, body:3600, speed:15, accessory:"griffin", fly:true },   // 骑乘狮鹫的强大空中僵尸, 需对空/爆炸
    screendoor:{ name:"铁门", hp:110,  body:110,  speed:11,   accessory:"screendoor", door:420 },  // 铁门挡豌豆,怕火/爆炸
    mingzombie:{ name:"鸣人", hp:32000, body:32000, speed:7,    accessory:"ming", big:true, eat:140, beam:true },  // 120波后Boss: 能量极光穿透整行, 同屏最多2个
    witch:     { name:"女巫", hp:1300, body:1300, speed:11,   accessory:"witch", buff:true },  // 80波后: 每5秒给周围僵尸+500%血2秒
  };

  // ---------- Waves ----------
  // ---------- State ----------
  let state, plants, zombies, peas, suns, particles, explosions, mowers, debris, mashes, beams, floats, gspikes, footballs;
  let rowShield;   // 每行无敌护盾剩余秒数(终极土豆盾技能)
  let rowBerserk;  // 每行狂暴(攻速+100%)剩余秒数(攻速流终极向日葵技能)
  let autoSkill;   // 土豆盾技能是否自动释放(false=手动点击释放)
  let sun, selected, lastCardUse, gameTime, shovelMode;
  let running = false, lastTs = 0;
  let mouse = { x:0, y:0 };
  let nextSkyDrop = 4;
  let bannerTimer = 0, bannerText = "";
  // endless mode
  let waveNum = 0, nextWaveAt = 10, score = 0, gameSpeed = 1, lastSaved = null;
  let frostCd = 20;   // 终极寒冰 全屏冰霜雪雨 全局冷却(100波后)
  let frostRainT = 0; // 冰霜雪雨 残留特效计时(秒)
  let runId = 0;   // increments on each reset; stale scheduled spawns from old runs are ignored
  let bestScore = 0;
  let upgradeMenu = null;   // {p} when choosing a branch for a Lv0 sunflower
  let showInfo = false;     // 按住 Alt/Option 显示所有植物属性

  const SPEEDS = [1,2,3];
  let paused = false;
  const MUTEBTN    = { x: W-392, y: H-44, w: 84, h: 30 };
  const RESTARTBTN = { x: W-300, y: H-44, w: 84, h: 30 };
  const PAUSEBTN   = { x: W-208, y: H-44, w: 84, h: 30 };
  const SPEEDBTN   = { x: W-116, y: H-44, w: 108, h: 30 };
  const KILLPTS = { basic:10, cone:25, polevault:30, bucket:60, football:140, ironclad:120, gargantuar:400, irongarg:800, shieldgiant:300, pangolin:90, giantrider:600, armorboss:3000, spider:60, balloon:45, griffin:200, screendoor:70, mingzombie:2000, witch:450 };
