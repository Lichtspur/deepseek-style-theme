## v1.43.10 — 修掉 1.43.9 的致命错误：回退版没注册新 id，导致插件树整个加载失败

**1.43.9 请勿使用。** 症状是页面顶部弹出：

```
Failed to load plugins
failed to import loader entry 41d948cc (dsh-deepseek-style-theme): client-modules:
bundle /plugins/??…,dsh-deepseek-style-theme/client.js&rev=… loaded without
registering "dsh-deepseek-style-theme" via __ModuleLoader__.load
```

整棵插件树连带 GUI 一起挂掉。

原因：v1.41.2 的 `lib/client.js` 是**改名之前**的产物，只注册旧 scoped id `@dsh-external/dsh-deepseek-style-theme`；而宿主现在按包名请求 `dsh-deepseek-style-theme`（combo URL 里就是这个名字），找不到就直接判失败。1.43.3/1.43.4 引入的"双 id 注册 + 各自 try/catch"兼容层，在我直接 `git checkout v1.41.2 -- lib/client.js` 时被一起丢掉了 —— 这是我的操作失误。

**修法**（其余代码仍是 v1.41.2 原样，无流体、粒子背景）：
- 把行内的 `factory: (require) => {…}` 提成命名工厂 `dshDeepseekStyleThemeFactory`；
- 尾部改为**双 id 注册**，两条各自 `try/catch`；
- `PLUGIN_ID` 常量改为新包名（只影响样式表标签名与控制台诊断前缀）。

**验证**（无头浏览器加载真实页面，插件已装入 profile）：

```
theme style tags : 8   ["dsh-deepseek-style-theme/theme.css", …]
theme canvas     : 1   （粒子背景已挂载）
app shell        : true
loader 注册错误  : NONE
```

**本版功能面** = 1.41.2：粒子背景、玻璃拟态、DSTT 四种主题模式与明暗切换；**没有**流体背景 / 液态玻璃 / 边缘倒影 / 背景模糊开关。

想回到流体那套：`pnpm add dsh-deepseek-style-theme@1.43.8`，或切到分支 `backup/1.43.8-fluid-hsl`。
