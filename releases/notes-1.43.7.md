## v1.43.7 — 背景配色改为「每帧从 DOM 重新推导」

1.43.6 把通知链补齐了（颜色通知 + 深色通知 + MutationObserver），但在真实页面上背景**仍然**停在挂载时的配色。实测证据（无头浏览器 + 页面侧探针 + WebGL 调用追踪）：

- 页面上执行的**确实是**带补丁的产物（探针读到 `buildMarker`、脚本里能搜到 `syncFluid`）；
- 流体**活着**：两个 program 都编译链接成功、乒乓 FBO 完整、每帧一对 drawArrays、`glError=0`；
- `<body>` 的 `data-dshome-color` 从 blue 写到 green，而 `u_color1..3` 整场都还是挂载时那组浅蓝；
- 画布只有一块、主题只挂载一次（排除重复实例）；
- 但 **CSS 侧是好的**：令牌一变，`body` 背景渐变立刻跟着 `--ds-brand` 变（绿 `#059669` → 红 `#F5222D`）。

结论：挂载发生在颜色驱动第一次写入**之前**，而之后的任何"通知/观察/轮询"都没能把它重新着色。所以这一版不再依赖谁记得通知：

- `dsttMarkerKey()`：把配色依赖的两个标记（`data-dshome-color` + `data-dshome-dark`）压成一个字符串；
- `startAmbient()` 里加 500ms 的 `markerPoll`，直接调 `syncFluid()`（键未变时是两次 `getAttribute` 的空操作），dispose 时 `clearInterval`；
- `window.__dshomeBuild = '1.43.7 palette-poll'`：**构建标记写进页面**，探针与用户都能一眼确认跑的是哪一版（这一版就是靠它才把"产物没更新"和"代码没生效"区分开的）；
- 探针 `tools/dstt-dark-report.js` 增补：列出**所有** canvas（尺寸/位置/z/中心像素）与 `buildMarker`。

**实测**：`data-dshome-color=red` → `--ds-brand:#F5222D`、body 背景 `color(srgb 0.96 0.13 0.18 / 0.14)`；`data-ds-dark-theme` → `data-dshome-dark` 出现 + 深色渐变；撤回全部复原。

> 注意：`.tmp-inspect/` 下那批一次性脚本不随包发布，`tools/` 才会被 README 收录。
