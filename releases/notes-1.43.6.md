## v1.43.6 — 背景跟随颜色令牌与明暗方案

用户报告两个症状：切「主题模式」背景不变、切深色背景还是蓝白。实测（无头浏览器只读探测实时页面）：

```
data-dshome-color = "blue"      而 :root --ds-brand 是 #059669
data-dshome-dark  = 属性根本不存在
body background   = radial-gradient(... color(srgb .30 .42 1.00 / .14) ...)   <- 蓝白
```

三处独立缺陷，同一个根因——背景只「读」标记，没人告诉它标记变了：

1. `subscribeColor` 只在颜色**字符串**变化时才通知，而它是背景重新着色的唯一入口；
2. `data-dshome-dark` 只有写入方、没有订阅方（`startAmbient` 里的 MutationObserver 观察的是一个 `createDarkSync` 故意不重复写的属性）；
3. 启动竞态：canvas 在 `dsttSync`（异步 bridge）返回**之前**就按默认模式解析了颜色，之后的 `dsttNotify` 只让设置面板重渲染，颜色驱动没被重新锚定。

**修法**：`createDarkSync` 返回 `{ subscribe, dispose }` 并在写入后播报（`lastDark` 去重）；`startAmbient` 收敛出单一 `syncFluid()`（从 DOM 重新推导 + 序列化比对去重），同时挂在颜色通知、深色通知、`body[data-dshome-color]` 的 MutationObserver 三处；每条监听单独 `try`；`watchPeakHour` 补一次幂等的启动重锚；粒子回落路径同样接上。

**实测**：写 `data-dshome-color=green` → 背景引导色 `#5e82de`→`#059669`；写 `data-ds-dark-theme` → `data-dshome-dark` 出现、背景切深色渐变；撤回后复原。

### 安装
```bash
dsh plugin --profile web add github:Lichtspur/deepseek-style-theme
```
npm：`dsh-deepseek-style-theme@1.43.6`（本页 tarball 与 npm 内容一致）。

### 另
README 增加「鸣谢」，点名两个上游：dsh-theme-mineradio（@dhicoc）与 deepseek-harness-background（@HaoyueQin）。
