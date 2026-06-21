# 馨乐花园保卫战 (Plants vs Zombies)

无尽模式塔防小游戏，纯前端单文件可玩，作者 Niko。

## 目录结构

```
src/                      游戏程序
├── index.html            入口(按 styles.css + js/* 加载)
├── styles.css            样式
└── js/                   按工程分类的源码模块
    ├── core.js           画布引用 + 开始菜单/攻略界面
    ├── config.js         布局常量、植物/僵尸定义、卡片、快捷键、按钮区域
    ├── highscore.js      本地排行榜(localStorage)、数字/时间格式化
    ├── state.js          全局状态、reset、波次生成(无尽)
    ├── entities.js       植物/僵尸/子弹/阳光/粒子/爆炸/升级光环等创建逻辑
    ├── update.js         每帧主逻辑(移动、碰撞、波次、计分、胜负)
    ├── render.js         所有绘制(植物/僵尸造型、HUD、特效)
    ├── input.js          鼠标/键盘输入、快捷键、暂停/快进
    └── main.js           主循环、开始/结束、初始化

tests/                    测试脚本(无头 Node 验证逻辑)
├── *.js                  各功能单测/无崩溃长跑/数值校验脚本
├── snapshot/             渲染截图(用 @napi-rs/canvas 离屏渲染)
└── node_modules/         测试依赖(@napi-rs/canvas 等)
```

## 运行

- 在 `src/` 下用浏览器打开 `index.html`（需保留 `js/` 与 `styles.css` 同级）。

> 采用经典 `<script>` 顺序加载、共享全局作用域。
