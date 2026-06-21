"use strict";
  // 语言: 默认按浏览器语言(以 "zh" 开头 -> 中文, 否则英文); 可用 ?lang=zh|en 或 localStorage 覆盖
  let lang;
  (function(){
    const q = (location.search.match(/[?&]lang=(zh|en)/) || [])[1];
    let stored = null; try{ stored = localStorage.getItem("cg_lang"); }catch(e){}
    const pick = q || stored;
    if(pick === "zh" || pick === "en") lang = pick;
    else lang = ((navigator.language || navigator.userLanguage || "en").toLowerCase().indexOf("zh") === 0) ? "zh" : "en";
  })();
  // L(中文, English) -> 按当前语言返回对应文案(未提供英文则回退中文)
  function L(zh, en){ return lang === "zh" ? zh : (en == null ? zh : en); }
