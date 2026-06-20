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
  function fmtClock(sec){ const m=Math.floor(sec/60), s=Math.floor(sec%60); return m+":"+String(s).padStart(2,"0"); }
  // 大数字缩写：超过 1 万显示 K，超过百万显示 M
  function fmtNum(n){
    n = Math.round(n);
    if(n>=1e6) return (+(n/1e6).toFixed(2))+"M";
    if(n>=1e4) return (+(n/1e3).toFixed(1))+"K";
    return ""+n;
  }
