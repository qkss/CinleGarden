"use strict";
  // ---------- Loop ----------
  function frame(ts){
    if(!running) return;
    const dt = Math.min(0.05,(ts-lastTs)/1000) || 0;
    lastTs = ts;
    // fast-forward via fixed sub-steps (keeps collision/physics stable)
    if(!paused){
      const steps = gameSpeed;
      for(let s=0; s<steps && state==="playing"; s++){
        if(bannerTimer>0) bannerTimer-=dt;
        update(dt);
      }
    }
    draw();
    requestAnimationFrame(frame);
  }

  function endGame(){
    if(lastSaved) return;            // avoid double-save
    running=false;
    SFX.play("gameover");
    const entry = { score: Math.round(score), wave: waveNum, dur: Math.round(gameTime), date: new Date().toLocaleString("zh-CN") };
    lastSaved = entry;
    const hs = saveHighScore(entry);
    bestScore = (hs[0]||{}).score || bestScore;
    const rank = hs.indexOf(entry) + 1;
    const rows = hs.map((h,i)=>{
      const mine = (h===entry) ? ' style="color:#ffd23f;font-weight:bold"' : '';
      return `<tr${mine}><td style="padding:2px 10px">${i+1}</td><td style="padding:2px 10px;text-align:right">${fmtNum(h.score)}</td><td style="padding:2px 10px;text-align:center">${h.wave}</td><td style="padding:2px 10px;font-size:12px;opacity:.85">${h.date}</td></tr>`;
    }).join("");
    const newRecord = rank===1 ? `<p style="color:#ffd23f">${L("🏆 新纪录！","🏆 New record!")}</p>` : (rank>0&&rank<=10 ? `<p>${L("进入排行榜第 "+rank+" 名！","Leaderboard #"+rank+"!")}</p>` : "");
    overlay.classList.remove("hidden");
    overlay.innerHTML =
      `<h1>💀 ${L("游戏结束","Game Over")}</h1>
       <p>${L("你坚持到了 <b>第 "+waveNum+" 波</b>，存活 <b>"+fmtClock(gameTime)+"</b>，得分 <b>"+fmtNum(score)+"</b>。",
              "You reached <b>Wave "+waveNum+"</b>, survived <b>"+fmtClock(gameTime)+"</b>, scored <b>"+fmtNum(score)+"</b>.")}</p>
       ${newRecord}
       <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:10px 14px;max-width:520px">
         <div style="font-weight:bold;margin-bottom:4px">${L("🏅 排行榜 (前 10)","🏅 Leaderboard (Top 10)")}</div>
         <table style="border-collapse:collapse;margin:0 auto;font-size:14px">
           <tr style="opacity:.7"><td style="padding:2px 10px">#</td><td style="padding:2px 10px;text-align:right">${L("分数","Score")}</td><td style="padding:2px 10px">${L("波数","Wave")}</td><td style="padding:2px 10px">${L("时间","Time")}</td></tr>
           ${rows}
         </table>
       </div>
       <div class="menuRow">
         <button class="btn" id="againBtn">${L("再玩一次","Play Again")}</button>
         ${unlockedCheckpoints().length ? '<button class="btn btn2" id="levelBtn2">'+L("选择关卡","Levels")+'</button>' : ''}
         <button class="btn btn2" id="guideBtn2">${L("查看攻略","How to play")}</button>
       </div>
       <div class="author">${L("作者 Niko","by Niko")}</div>`;
    document.getElementById("againBtn").onclick = ()=>startGame(0);
    const lvb = document.getElementById("levelBtn2"); if(lvb) lvb.onclick = showLevelSelect;
    document.getElementById("guideBtn2").onclick = showGuide;
  }

  // 手机/平板检测 + 进入全屏(需在用户点击手势内调用)
  function isMobileDevice(){
    try{
      const ua = navigator.userAgent || "";
      if(/Mobi|Android|iPhone|iPad|iPod|Tablet|Silk|Kindle|PlayBook|BlackBerry|Opera Mini/i.test(ua)) return true;
      // iPadOS 13+ 伪装成桌面 Safari: 用触摸 + 屏幕尺寸判断
      return ("ontouchstart" in window) && Math.min(screen.width, screen.height) <= 1024;
    }catch(e){ return false; }
  }
  function lockLandscape(){
    try{
      const o = screen.orientation;
      if(o && o.lock){ const p = o.lock("landscape"); if(p && p.catch) p.catch(()=>{}); }
    }catch(e){}
  }
  function enterFullscreen(){
    try{
      const el = document.getElementById("wrap") || document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if(req){
        const p = req.call(el);
        if(p && p.then){ p.then(lockLandscape).catch(()=>{}); } else { lockLandscape(); }
      } else {
        lockLandscape();
      }
      lockLandscape();   // 部分浏览器无需等待全屏
    }catch(e){}
  }

  function startGame(startWave){
    SFX.unlock();   // 在用户点击手势内解锁音频
    if(isMobileDevice() && !(document.fullscreenElement||document.webkitFullscreenElement)) enterFullscreen();  // 手机/平板自动全屏
    overlay.classList.add("hidden");
    const wasRunning = running;
    reset(typeof startWave==="number" ? startWave : 0);
    running = true;
    if(!wasRunning){ lastTs=performance.now(); requestAnimationFrame(frame); }  // avoid stacking loops on restart
  }

  try{ document.title = L("馨乐花园保卫战","Cinle Garden Defense"); }catch(e){}
  reset(); state="idle"; showMenu(); draw();
