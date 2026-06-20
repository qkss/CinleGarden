"use strict";
  // ---------- Procedural sound effects (Web Audio, no asset files) ----------
  const SFX = (function(){
    let ctx = null, master = null;
    let enabled = true;
    let lastAt = {};                 // 节流: 同名音效最小间隔

    function ensure(){
      if(ctx) return ctx;
      try{
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }catch(e){ ctx = null; }
      return ctx;
    }
    // 在首个用户手势内解锁(浏览器自动播放策略)
    function unlock(){ const c = ensure(); if(c && c.state==="suspended") c.resume(); }

    function now(){ return ctx.currentTime; }

    // 单个振荡器音符
    function tone(opt){
      if(!ctx) return;
      const t0 = now() + (opt.delay||0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = opt.type || "sine";
      o.frequency.setValueAtTime(opt.f0||440, t0);
      if(opt.f1!=null) o.frequency.exponentialRampToValueAtTime(Math.max(1,opt.f1), t0 + (opt.dur||0.15));
      const vol = (opt.vol!=null?opt.vol:0.3);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (opt.atk||0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opt.dur||0.15));
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + (opt.dur||0.15) + 0.02);
    }
    // 噪声爆破(爆炸/碎裂/割草)
    function noise(opt){
      if(!ctx) return;
      const t0 = now() + (opt.delay||0);
      const dur = opt.dur||0.3;
      const n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for(let i=0;i<n;i++) d[i] = (Math.random()*2-1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = opt.filter || "lowpass";
      f.frequency.setValueAtTime(opt.fc0||1200, t0);
      if(opt.fc1!=null) f.frequency.exponentialRampToValueAtTime(Math.max(40,opt.fc1), t0+dur);
      const vol = (opt.vol!=null?opt.vol:0.3);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0); src.stop(t0 + dur + 0.02);
    }

    // 音效字典
    const BANK = {
      plant:     ()=>{ tone({type:"sine", f0:520, f1:300, dur:0.12, vol:0.22}); noise({fc0:600,fc1:120,dur:0.12,vol:0.12,filter:"lowpass"}); },
      shoot:     ()=>{ tone({type:"square", f0:680, f1:420, dur:0.07, vol:0.10}); },
      shootIce:  ()=>{ tone({type:"triangle", f0:900, f1:560, dur:0.10, vol:0.12}); },
      hit:       ()=>{ tone({type:"square", f0:240, f1:140, dur:0.05, vol:0.08}); },
      sun:       ()=>{ tone({type:"sine", f0:740, f1:1180, dur:0.16, vol:0.22}); tone({type:"sine", f0:1180, dur:0.12, vol:0.12, delay:0.06}); },
      chomp:     ()=>{ noise({fc0:500,fc1:90,dur:0.10,vol:0.16,filter:"lowpass"}); },
      explode:   ()=>{ noise({fc0:1600,fc1:60,dur:0.5,vol:0.42,filter:"lowpass"}); tone({type:"sine",f0:160,f1:40,dur:0.45,vol:0.25}); },
      freeze:    ()=>{ tone({type:"triangle", f0:1400, f1:400, dur:0.4, vol:0.18}); noise({fc0:5000,fc1:2000,dur:0.3,vol:0.06,filter:"highpass"}); },
      break:     ()=>{ noise({fc0:4000,fc1:800,dur:0.22,vol:0.2,filter:"highpass"}); },
      upgrade:   ()=>{ [523,659,784,1047].forEach((f,i)=> tone({type:"triangle", f0:f, dur:0.16, vol:0.2, delay:i*0.07})); },
      heal:      ()=>{ tone({type:"sine", f0:660, f1:990, dur:0.22, vol:0.16}); },
      zombieDie: ()=>{ tone({type:"sawtooth", f0:200, f1:60, dur:0.3, vol:0.14}); noise({fc0:800,fc1:120,dur:0.2,vol:0.1,filter:"lowpass"}); },
      mower:     ()=>{ noise({fc0:900,fc1:500,dur:0.6,vol:0.26,filter:"bandpass"}); tone({type:"sawtooth", f0:120, f1:90, dur:0.6, vol:0.12}); },
      wave:      ()=>{ [392,523].forEach((f,i)=> tone({type:"square", f0:f, dur:0.3, vol:0.18, delay:i*0.12})); },
      bigwave:   ()=>{ [330,392,494].forEach((f,i)=> tone({type:"sawtooth", f0:f, dur:0.4, vol:0.2, delay:i*0.13})); noise({fc0:400,fc1:80,dur:0.6,vol:0.16,filter:"lowpass"}); },
      gameover:  ()=>{ [440,349,262].forEach((f,i)=> tone({type:"sine", f0:f, dur:0.5, vol:0.26, delay:i*0.22})); },
      shield:    ()=>{ tone({type:"sine", f0:300, f1:760, dur:0.3, vol:0.2}); },
      ultimate:  ()=>{ [523,784,1047,1319].forEach((f,i)=> tone({type:"triangle", f0:f, dur:0.3, vol:0.22, delay:i*0.08})); },
    };

    function play(name, minGap){
      if(!enabled) return;
      const c = ensure(); if(!c || c.state!=="running") return;
      if(minGap){ const t = c.currentTime; if(lastAt[name] && t - lastAt[name] < minGap) return; lastAt[name] = t; }
      const fn = BANK[name]; if(fn) try{ fn(); }catch(e){}
    }

    function toggle(){ enabled = !enabled; if(enabled) unlock(); return enabled; }
    function isOn(){ return enabled; }

    return { play, unlock, toggle, isOn };
  })();
