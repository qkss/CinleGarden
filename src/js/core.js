"use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");

  // 开始界面攻略内容(点"查看攻略"展开)
  const GUIDE_HTML = `
    <p>顶部点击卡片选植物（或按快捷键 <b>1-9 0 - + =</b> 依次对应各卡），再点击草坪格子种下。点击阳光收集，或按 <b>空格</b>一键拾取全部阳光 ☀️。<b>~</b> 键或右上角 <b>🛠️铲子</b>（或右键）铲除植物以便更换。</p>
    <div class="legend">
      🌻 <b>向日葵</b> 产阳光 · 🟢 <b>豌豆射手</b> 基础输出 · ❄️ <b>寒冰射手</b> 投掷冰冻·可升级延长冻结(15波解锁) ·
      🔁 <b>双发射手</b> 双倍火力 · 🌿 <b>三豆射手</b> 连发3颗(10波解锁) · 🌵 <b>仙人掌</b> 穿透尖刺(贯穿整行·后方有僵尸会向后射击) · 🌵 <b>巨仙掌</b> 穿透尖刺·可打空中·克制气球(10波解锁·可升级到Lv10·每级加攻速·Lv10解锁地刺每20秒击退本行僵尸2格) · 🔥 <b>篝火</b> 豌豆附魔火焰·穿铁门(10波解锁·50波后可升级·每级加火伤·Lv5点燃僵尸灼伤5秒) ·
      🟤 <b>坚果墙</b> 肉盾 · 🥔 <b>土豆盾</b> 超级肉盾·可升级·摧毁爆炸(5级留土豆泥减速·Lv10每20秒给本行2秒无敌护盾) ·
      🌶️ <b>辣椒</b> 烧光一整横排(20波解锁) · 🍒 <b>樱桃炸弹</b> 范围秒杀 · 💣 <b>土豆地雷</b> 埋雷炸一只<br>
      敌人(护甲会先被打掉再变普通)：普通 / 🚧 路障 / 🪣 铁桶 / 🛡️ 钢盔铁甲 /
      🦘 撑杆(快·跳过第一株) / 🏈 橄榄球 / 🦣 巨人(一拳碎植物·死亡爆炸) /
      🕷️ 空降蜘蛛(偷植物·只落右侧4列) / 🎈 气球(飞行·需仙人掌/炸弹) / 🚪 铁门(挡豌豆·用火焰/爆炸破) / 🛡️ 盾牌巨人(免疫豌豆/爆炸·盾牌只能被仙人掌穿刺打破·破盾后才可击杀)<br>
      <b>Boss</b>：🌀 鸣人(100波后·能量极光穿透整行·高血高伤) / 🧙 女巫(80波后·每5秒给周围僵尸+500%血2秒)<br>
      <b>终极技能</b>：🌻终极向日葵(攻速流)每10秒触发⚡狂暴·本行攻速+100%持续4秒 / 🌻终极向日葵(血量流)每10秒给本行植物回血20% · 🥔终极土豆盾(Lv10)蓄力满后身上出现护盾图标·点击释放给本行植物套上闪电护盾2秒无敌(可切换手动/自动) ·❄️终极寒冰(Lv5)每20秒冰霜雪雨·全屏冻结5秒(100波后)<br>
      🛒 每行左侧有<b>小推车</b>：僵尸到底线自动冲出清空整行，但<b>每行仅一次</b>！
    </div>
    <p>🔁 <b>无尽模式</b>：波数越高越难，每 5 波是<b>巨潮</b>(强力僵尸带队)。尽量活久、拿高分！<br>
       📍 <b>关卡选择</b>：每通过 10 波解锁一个检查点(第10/20/30…波)，可从该波直接开局，并获得筹备阳光与更长布防时间。<br>
       右下角：<b>🔊音效/🔇静音</b>(M) / <b>重开</b> / <b>暂停</b>(P) / <b>快进 1x/2x/3x</b>(F)。最高分自动记录到本机排行榜(前 10)。<br>
       🧪 <b>Shift+0</b> 加 10000 阳光；按住 <b>Alt</b> 查看所有植物属性。</p>
    <p style="font-size:14px">🌻 <b>第 5 波后点击向日葵升级</b>，二选一分支(各级 250 阳光，5 级)：⚡攻速(满级本行攻速翻倍) 或 🛡血量(每级 +50% 本行血量)；
       Lv5 后合流 → Lv6 钢化(1000，本行+100%血) → Lv7 终极(1500，全场CD−50%·产阳光×10)。
       🥔 土豆盾 / ❄️ 寒冰 也可点击升级。</p>`;

  function showMenu(){
    overlay.classList.remove("hidden");
    const hasCheckpoints = unlockedCheckpoints().length > 0;
    overlay.innerHTML =
      `<h1 class="big">🌻 馨乐花园保卫战 🧟</h1>
       <div class="menuRow">
         <button class="btn" id="startBtn">开始游戏</button>
         ${hasCheckpoints ? '<button class="btn btn2" id="levelBtn">选择关卡</button>' : ''}
         <button class="btn btn2" id="guideBtn">查看攻略</button>
       </div>
       <div class="author">作者 Niko</div>`;
    document.getElementById("startBtn").onclick = ()=>startGame(0);
    document.getElementById("guideBtn").onclick = showGuide;
    if(hasCheckpoints) document.getElementById("levelBtn").onclick = showLevelSelect;
  }
  function showLevelSelect(){
    const pts = unlockedCheckpoints();
    const mx = loadMaxWave();
    const cells = pts.map(w=>
      `<button class="btn lvlBtn" data-wave="${w}" style="min-width:96px">第 ${w} 波</button>`
    ).join("");
    overlay.classList.remove("hidden");
    overlay.innerHTML =
      `<h1>📍 选择关卡</h1>
       <p>已达到最高 <b>第 ${mx} 波</b>，每 <b>10 波</b>解锁一个检查点。<br>
          从检查点开始会获得<b>筹备阳光</b>与更长的布防时间。</p>
       <div class="menuRow" style="flex-wrap:wrap;max-width:560px;justify-content:center;gap:8px">
         <button class="btn lvlBtn" data-wave="0" style="min-width:120px">🌱 新游戏 (第1波)</button>
         ${cells}
       </div>
       <button class="btn btn2" id="lvlBackBtn" style="margin-top:14px">返回</button>
       <div class="author">作者 Niko</div>`;
    overlay.querySelectorAll(".lvlBtn").forEach(b=>{
      b.onclick = ()=> startGame(parseInt(b.getAttribute("data-wave"),10)||0);
    });
    document.getElementById("lvlBackBtn").onclick = showMenu;
  }
  function showGuide(){
    overlay.innerHTML =
      `<h1>📖 游戏攻略</h1>${GUIDE_HTML}
       <button class="btn" id="guideBackBtn">返回</button>
       <div class="author">作者 Niko</div>`;
    document.getElementById("guideBackBtn").onclick = showMenu;
  }
