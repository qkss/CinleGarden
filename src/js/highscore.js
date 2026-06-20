"use strict";
  // ---------- High scores (localStorage) ----------
  const HS_KEY = "pvz_endless_highscores_v1";
  function loadHighScores(){
    try { return JSON.parse(localStorage.getItem(HS_KEY)) || []; } catch(e){ return []; }
  }
  function saveHighScore(entry){
    let hs = loadHighScores();
    hs.push(entry);
    hs.sort((a,b)=> b.score - a.score);
    hs = hs.slice(0,10);
    try { localStorage.setItem(HS_KEY, JSON.stringify(hs)); } catch(e){}
    return hs;
  }
  // ---------- 已达到的最高波数 (用于关卡选择检查点) ----------
  const MAXWAVE_KEY = "pvz_endless_maxwave_v1";
  function loadMaxWave(){
    try { return parseInt(localStorage.getItem(MAXWAVE_KEY),10) || 0; } catch(e){ return 0; }
  }
  function saveMaxWave(w){
    try { if(w > loadMaxWave()) localStorage.setItem(MAXWAVE_KEY, String(w)); } catch(e){}
  }
  // 已解锁的检查点波数: 每 10 波一个 (10,20,...), 需已通过该波
  function unlockedCheckpoints(){
    const mx = loadMaxWave(), pts = [];
    for(let w=10; w<=mx; w+=10) pts.push(w);
    return pts;
  }

  function fmtClock(sec){ const m=Math.floor(sec/60), s=Math.floor(sec%60); return m+":"+String(s).padStart(2,"0"); }
  // 大数字缩写：超过 1 万显示 K，超过百万显示 M
  function fmtNum(n){
    n = Math.round(n);
    if(n>=1e6) return (+(n/1e6).toFixed(2))+"M";
    if(n>=1e4) return (+(n/1e3).toFixed(1))+"K";
    return ""+n;
  }
