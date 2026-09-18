## v2.0.87 — 背景模糊终于有着落 / 白磨砂横带 / 你要的透镜放大

### 1. 「没有背景模糊效果」：是我们自己两处写法挡掉了 `backdrop-filter` 的采样

Chromium 的 `backdrop-filter` 只对**能进入 backdrop 的常规绘制内容**生效，本主题里正好有两处把它排除掉：

- **`body{background-attachment:fixed}`**：fixed 背景在独立绘制阶段上色，不参与 backdrop 采样 → 页面底色的那层渐变**根本模糊不到**，玻璃就只剩半透明。改法：底色挪到 **`body::before{position:fixed;inset:0;z-index:-2}`**——观感一样是"钉在视口"，但它是普通绘制内容、会被采样；`body` 自身对主题配方改成 `background:none!important`。③ 自选背景仍保留 `fixed`（那是你自己的图）。
- **`[data-composer-card]{will-change:transform}`**：这个性能提示会把面板提升为独立图层，是另一种已知的"丢失 backdrop"路径；而合成器在真正 transform 时本来就会提升它，提示白付代价，已删。

新增 **`__dshomeGlassProbe()`** —— 一次给出：四个面的计算 `backdropFilter`、`body` 的 `backgroundAttachment`、`::before` 层的 position、卡片的 `willChange`、以及 `backdropBlur` 设置。"为什么没模糊"不用再猜。

### 2. 白磨砂的浅色横带（你的截图）

那是产品给工作区列表底部加的渐隐，终点是**不透明的 sidebar 底色**；玻璃面板半透明后终点对不上，就在「设置」上方留一条浅带。2.0.76 只在**液态**配方里关掉了它，你这张图确认**白磨砂也一样**（白磨砂面板同样是半透明的）。现在两套配方都关。

### 3. 透镜放大（你要的「对对话窗下方文字进行放大」）

真透镜放大的是玻璃**后面**的内容，而 `backdrop-filter` 只能 blur/saturate/brightness——放大了不了。可行的近似就是你说的那招：把**紧贴面板下方**的状态行（`[data-dsh-stats]`，产品标记）放大一点点：

- 常态 **`scale(1.06)`**；
- **面板倾斜时 `scale(1.12)`**（倾斜状态由 `html[data-dshome-leaning]` 标记，随鼠标随动）；
- 过渡 240ms，`prefers-reduced-motion` 下不动。

数值是保守起点——想更明显就告诉我，改两个数字（1.06 / 1.12）。

### 装完请验（两行）

```js
window.__dshomeBuild        // 期望 '2.0.87 lens-blur'
__dshomeGlassProbe()        // bodyBackgroundAttachment 期望 'scroll'；tiltCard 期望 'blur(11px) saturate(1.75) …'
```

判读：
- 若 `tiltCard` 是 `none` → 说明配方/设置把模糊关了（看 `recipe` 与 `backdropBlurSetting`）；
- 若它已经是 `blur(11px) saturate(1.75)` 而肉眼仍觉得"没模糊"，那多半是**面板后面本来就没有细节可糊**（主题底色是平滑渐变）——这时把消息往下滚、让文字从面板后面经过再看，或者用你要的放大效果（本版第 3 条）来补足"玻璃感"。

### 验证账
`parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **81/81**、`dstt-schema-smoke` **29/29**、`bridge-smoke` **26/26**。**真机复核仍未做**（审批策略 never）。

### 退路
`@2.0.86`、`@2.0.85`。
