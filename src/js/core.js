"use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");

  // 开始界面攻略内容(点"查看攻略"展开)
  const GUIDE_HTML = L(`
    <p><b>🎮 操作</b>：顶部点击卡片选植物（或快捷键 <b>1-9 0 - + =</b>），再点击草坪格子种下。点击阳光收集，或按 <b>空格</b>一键拾取全部阳光 ☀️。<b>~</b> 键 / 右上角 <b>🛠️铲子</b> / 右键可铲除植物。右下角：<b>🔊音效</b>(M) · <b>重开</b> · <b>暂停</b>(P) · <b>快进</b>(F)。按住 <b>Alt</b> 查看植物属性。</p>
    <div class="legend">
      <b>🌱 植物</b>（多数可升级，满级后还有更强的进阶玩法，等你探索）<br>
      🌻 <b>向日葵</b> 产阳光 · 🟢 <b>豌豆射手</b> 基础输出 · ❄️ <b>寒冰射手</b> 冰冻减速(40波) ·
      🔁 <b>双发射手</b> 双倍火力(10波) · 🌿 <b>三豆射手</b> 三行连发(50波) · 🌵 <b>仙人掌</b> 穿透整行尖刺 · 🌵 <b>巨仙掌</b> 穿透·可打空中·克制气球(10波) · 🔥 <b>篝火</b> 豌豆附魔火焰·穿铁门(10波) ·
      🟤 <b>坚果墙</b> 肉盾 · 🥔 <b>土豆盾</b> 超级肉盾·摧毁时爆炸 ·
      🌶️ <b>辣椒</b> 烧光一整横排(20波) · 🍒 <b>樱桃炸弹</b> 范围秒杀 · 💣 <b>土豆地雷</b> 埋雷炸一只
    </div>
    <div class="legend">
      <b>🧟 僵尸</b>（护甲会先被打掉再变普通）<br>
      普通 · 🚧 路障 · 🪣 铁桶 · 🛡️ 钢盔铁甲 · 🦘 撑杆(快·跳过第一株) · 🏈 橄榄球(快·远程砸植物) · 🦣 巨人(一拳碎植物·死亡爆炸) · 🐴 巨人骑兵(高血·较快) · 🚙 装甲车BOSS(超高血·车顶坐巨人) ·
      🕷️ 空降蜘蛛(偷植物) · 🎈 气球(飞行·需对空) · 🦅 狮鹫骑士(强大空中·高血) · 🚪 铁门(挡豌豆·用火焰/爆炸破) · 🛡️ 盾牌巨人(免疫豌豆·只能被穿刺破盾) · 🦔 盾穿山甲(地底潜行·钻出破坏植物)<br>
      <b>Boss</b>：🌀 鸣人(能量极光穿透整行) · 🚙 装甲车(超高血·装甲格挡穿甲) · 🧙 女巫(给周围僵尸加血) · 💀 骷髅祭祀(治疗周围僵尸) · ❄️ 暗夜王(免疫冰冻·远程刀光剑影)
    </div>
    <p>🛒 每行左侧有<b>小推车</b>：僵尸冲到底线时自动清空整行，但<b>每行仅一次</b>！波数越高越难，每 5 波是<b>巨潮</b>——活得越久、分数越高。其余的升级、融合与终极技能，留给你在战斗中慢慢探索 🌟</p>`,
  `
    <p><b>🎮 Controls</b>: Click a card up top to pick a plant (or hotkeys <b>1-9 0 - + =</b>), then click a lawn cell to plant it. Click suns to collect, or press <b>Space</b> to grab all suns ☀️. Press <b>~</b> / the <b>🛠️ shovel</b> (top-right) / right-click to dig up a plant. Bottom-right: <b>🔊 Sound</b> (M) · <b>Restart</b> · <b>Pause</b> (P) · <b>Fast-forward</b> (F). Hold <b>Alt</b> to view plant stats.</p>
    <div class="legend">
      <b>🌱 Plants</b> (most can be upgraded — stronger plays unlock at max level, for you to discover)<br>
      🌻 <b>Sunflower</b> makes sun · 🟢 <b>Peashooter</b> basic damage · ❄️ <b>Snow Pea</b> freeze & slow (W40) ·
      🔁 <b>Repeater</b> double fire (W10) · 🌿 <b>Threepeater</b> 3 lanes (W50) · 🌵 <b>Cactus</b> piercing spike through the row · 🌵 <b>Big Cactus</b> piercing · hits air · counters balloons (W10) · 🔥 <b>Torch</b> enchants peas to fire · burns through screen doors (W10) ·
      🟤 <b>Wall-nut</b> tank · 🥔 <b>Potato Shield</b> super tank · explodes when destroyed ·
      🌶️ <b>Jalapeno</b> burns a whole lane (W20) · 🍒 <b>Cherry Bomb</b> area instakill · 💣 <b>Potato Mine</b> one-shot buried bomb
    </div>
    <div class="legend">
      <b>🧟 Zombies</b> (armor is stripped first, then they turn normal)<br>
      Basic · 🚧 Conehead · 🪣 Buckethead · 🛡️ Knight · 🦘 Pole Vault (fast · vaults the first plant) · 🏈 Football (fast · throws footballs at range) · 🦣 Gargantuar (one-punch crush · death blast) · 🐴 Giant Rider (high HP · faster) · 🚙 Armor Tank BOSS (huge HP · giant on top) ·
      🕷️ Spider (steals plants) · 🎈 Balloon (flying · needs anti-air) · 🦅 Griffin Rider (strong flier · high HP) · 🚪 Screen Door (blocks peas · break with fire/explosion) · 🛡️ Shield Giant (immune to peas · shield only broken by cactus spikes) · 🦔 Pangolin (burrows underground · surfaces to destroy a plant)<br>
      <b>Bosses</b>: 🌀 Beam Boss (energy beam pierces the whole row) · 🚙 Armor Tank (huge HP · armor blocks piercing) · 🧙 Witch (buffs nearby zombies) · 💀 Skeleton Priest (heals nearby zombies) · ❄️ Night King (freeze-immune · ranged sword slashes)
    </div>
    <p>🛒 Each lane has a <b>lawn-mower</b> on the left: it auto-clears the lane when a zombie reaches the house, but <b>only once per lane</b>! It gets harder every wave, and every 5th is a <b>Huge Wave</b> — survive long, score high. Upgrades, fusion and ultimate skills are left for you to discover in battle 🌟</p>`);

  function showMenu(){
    overlay.classList.remove("hidden");
    const hasCheckpoints = unlockedCheckpoints().length > 0;
    overlay.innerHTML =
      `<h1 class="big">🌻 ${L("馨乐花园保卫战","Cinle Garden Defense")} 🧟</h1>
       <div class="menuRow">
         <button class="btn" id="startBtn">${L("开始游戏","Start")}</button>
         ${hasCheckpoints ? '<button class="btn btn2" id="levelBtn">'+L("选择关卡","Levels")+'</button>' : ''}
         <button class="btn btn2" id="guideBtn">${L("查看攻略","How to play")}</button>
       </div>
       <div class="author">${L("作者 Niko","by Niko")}</div>`;
    document.getElementById("startBtn").onclick = ()=>startGame(0);
    document.getElementById("guideBtn").onclick = showGuide;
    if(hasCheckpoints) document.getElementById("levelBtn").onclick = showLevelSelect;
  }
  function showLevelSelect(){
    const pts = unlockedCheckpoints();
    const mx = loadMaxWave();
    const cells = pts.map(w=>
      `<button class="btn lvlBtn" data-wave="${w}" style="min-width:96px">${L("第 "+w+" 波","Wave "+w)}</button>`
    ).join("");
    overlay.classList.remove("hidden");
    overlay.innerHTML =
      `<h1>📍 ${L("选择关卡","Level Select")}</h1>
       <p>${L("已达到最高 <b>第 "+mx+" 波</b>，每 <b>10 波</b>解锁一个检查点。","Best reached: <b>Wave "+mx+"</b>. Every <b>10 waves</b> unlocks a checkpoint.")}<br>
          ${L("从检查点开始会获得<b>筹备阳光</b>与更长的布防时间。","Starting from a checkpoint grants <b>bonus prep-sun</b> and longer setup time.")}</p>
       <div class="menuRow" style="flex-wrap:wrap;max-width:560px;justify-content:center;gap:8px">
         <button class="btn lvlBtn" data-wave="0" style="min-width:120px">${L("🌱 新游戏 (第1波)","🌱 New Game (W1)")}</button>
         ${cells}
       </div>
       <button class="btn btn2" id="lvlBackBtn" style="margin-top:14px">${L("返回","Back")}</button>
       <div class="author">${L("作者 Niko","by Niko")}</div>`;
    overlay.querySelectorAll(".lvlBtn").forEach(b=>{
      b.onclick = ()=> startGame(parseInt(b.getAttribute("data-wave"),10)||0);
    });
    document.getElementById("lvlBackBtn").onclick = showMenu;
  }
  function showGuide(){
    overlay.innerHTML =
      `<h1>📖 ${L("游戏攻略","How to Play")}</h1>${GUIDE_HTML}
       <button class="btn" id="guideBackBtn">${L("返回","Back")}</button>
       <div class="author">${L("作者 Niko","by Niko")}</div>`;
    document.getElementById("guideBackBtn").onclick = showMenu;
  }
