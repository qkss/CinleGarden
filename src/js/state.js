"use strict";
  function reset(startWave){
    state = "playing";
    plants = []; zombies = []; peas = []; suns = []; particles = []; explosions = []; debris = []; mashes = []; beams = []; floats = [];
    rowShield = [0,0,0,0,0];
    rowBerserk = [0,0,0,0,0];
    mowers = [];
    for(let r=0;r<ROWS;r++) mowers.push({ r, x:GRID.x-34, y:cellCenterY(r)+20, active:false, used:false, t:0 });
    startWave = Math.max(0, startWave|0);
    selected = null; shovelMode = false; showInfo = false;
    lastCardUse = {}; CARD_ORDER.forEach(k=>lastCardUse[k] = -99);
    gameTime = 0;
    nextSkyDrop = 4;
    // 从检查点开始: 给予筹备阳光与更长布防时间
    sun = startWave>0 ? (200 + startWave*40) : 75;
    waveNum = startWave; nextWaveAt = gameTime + (startWave>0 ? 25 : 10);
    score = 0; gameSpeed = 1; lastSaved = null; frostCd = 20;
    bannerTimer = 0;
    runId++;   // invalidate any pending spawn timers from a previous game
    bestScore = (loadHighScores()[0]||{}).score || 0;
    upgradeMenu = null;
    paused = false;
  }

  // 僵尸出场最早波数 (气球10波后、巨人20波后、女巫80波后、鸣人Boss 100波后、钢盔巨人100波后)
  const ZMINWAVE = { balloon:11, gargantuar:20, witch:81, mingzombie:101, irongarg:101 };
  // pool of zombie types by wave (difficulty ramps; heavies unlock progressively, no cap)
  function poolForWave(n){
    let pool;
    if(n<=2)       pool=["basic","basic","cone"];
    else if(n<=4)  pool=["basic","cone","cone","polevault"];
    else if(n<=6)  pool=["basic","cone","bucket","polevault"];
    else if(n<=9)  pool=["cone","bucket","polevault","ironclad","spider","balloon","screendoor"];
    else if(n<=13) pool=["cone","bucket","polevault","ironclad","football","spider","balloon","screendoor"];
    else if(n<=18) pool=["bucket","polevault","ironclad","football","ironclad","spider","balloon","screendoor"];
    else if(n<=26) pool=["bucket","ironclad","football","ironclad","gargantuar","polevault","spider","balloon","screendoor"];
    else if(n<=99) pool=["ironclad","football","gargantuar","ironclad","football","bucket","gargantuar","polevault","spider","balloon","screendoor","witch"];
    else           pool=["ironclad","football","gargantuar","irongarg","gargantuar","irongarg","football","bucket","polevault","spider","balloon","screendoor","mingzombie","witch"];
    pool = pool.filter(tt => n >= (ZMINWAVE[tt]||0));   // 未到出场波数则剔除
    return pool.length ? pool : ["basic"];
  }
  const rRow = ()=> Math.floor(Math.random()*ROWS);

  function spawnWave(n){
    const big = (n % 5 === 0);
    let count = Math.min(28, 2 + Math.floor(n*0.55));
    if(big) count = Math.round(count*1.5);
    const pool = poolForWave(n);
    const stepMs = big ? 480 : 700;
    const rid = runId;   // bind spawns to this game instance
    const spawn = (type)=>{ if(state==="playing" && runId===rid) addZombie(type, rRow()); };
    // big wave: a powerful leader (or two) charges in first
    if(big){
      const leader = n>=100 ? (Math.random()<0.5 ? "mingzombie" : "irongarg") : (n>=20 ? "gargantuar" : (n>=10 ? "ironclad" : "bucket"));
      const leaders = n>=30 ? 3 : (n>=15 ? 2 : 1);
      for(let L=0; L<leaders; L++)
        setTimeout(()=> spawn(leader), L*260);
    }
    for(let k=0;k<count;k++){
      setTimeout(()=> spawn(pool[Math.floor(Math.random()*pool.length)]), (big?300:0) + k*stepMs);
    }
  }
