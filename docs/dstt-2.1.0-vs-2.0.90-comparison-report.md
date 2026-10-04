# DSTT 对比报告：原版（2.0.90 写死哈希）→ 现在的插件（2.1.0 语义锚点版）

| 项 | 值 |
|---|---|
| 报告日期 | 2026-10-03 |
| 对比对象（原版） | `lib/client.hash-variant.js` — DSTT 2.0.90，写死产品 CSS Module 哈希 |
| 对比对象（现版） | `lib/client.js` — DSTT 2.1.0，只依赖产品语义钩子 |
| 现版是否在用 | **是**。`C:\Users\Nove\.dsh\profiles\desktop\node_modules\dsh-deepseek-style-theme\lib\client.js` 的 sha256 = `D4E5EDB0…`，与仓库工作树逐字节一致 |
| 运行产品 | DeepSeek Harness 桌面版，`app.asar` 121,348,951 字节（2026-09-29 18:34） |
| 结论 | 丢的不是能力而是**覆盖面**：约 22 处视觉/交互面不再被覆盖，另有 1 项功能被停用、3 项行为在当前产品上已静默失效 |

---

## 0. 总览数据

### 0.1 代码规模

| 指标 | 原版 2.0.90 | 现版 2.1.0 | 变化 |
|---|---|---|---|
| `client.js` 行数 | 5,445 | 5,181 | −264 |
| `client.js` 字节 | 287,173 | 266,657 | −20,516（−7.1%） |
| `git diff` 统计 | — | — | 293 增 / 557 删 |
| CSS 选择器（去重） | 229 | 170 | **−59** |
| 其中：被移除 | — | — | **100 条** |
| 其中：新增 | — | — | 41 条 |
| `PATCH_BLOCKS` 补丁块 | 14 | 4 | **−10 块** |
| JS 里写死的产品哈希选择器 | 12 处 | 2 处（+3 个常量） | −7 |

### 0.2 被移除的 100 条规则，按面分布

| 面 | 被移除的规则条数 |
|---|---|
| B 会话标题栏 | 45 |
| E 输入卡 | 17 |
| A 侧栏会话行 / 图标按钮 | 8 |
| D 侧栏外壳 | 8 |
| G 时间轴面板 | 5 |
| K 其它（多行 / `:is()` 复合选择器） | 5 |
| I 设置面板 | 4 |
| C 应用外框 / 分栏 | 3 |
| F 首屏 | 2 |
| J 会话滚动区 | 2 |
| H 子代理面板 | 1 |
| **合计** | **100** |

> E 组（输入卡 17 条）绝大多数是**改名而非丢失**——产品的 `[data-dsh-inputbar]` + `[data-dsh-stats]` 在 0.2.0 变成 `[data-composer-stats]` / `[data-composer-card]`，新版本已逐条对齐。真正丢的是输入卡上的旋转描边与发送按钮配色（见 2.5）。

### 0.3 验证方法

| 手段 | 作用 |
|---|---|
| 两份 bundle 的结构化抽取比对（选择器 / 声明 / 常量 / 属性 / 全局自检入口） | 得出 0.1 与第 2 节 |
| `PATCH_BLOCKS` 数组逐块解析 + 锚点与字节数比对 | 得出 14 → 4 与各块缩水幅度 |
| 直接对 `E:\Softwares\DeepSeekHarness\resources\app.asar` 做二进制检索 | 证明哪些哈希在当前产品里**已不存在**（第 3 节，这是最硬的证据） |
| `git diff HEAD`（HEAD 即 2.0.90 提交 `193d691`） | 得出宿主端与文档的实际改动面 |

复现脚本（本次新增，均在 `PluginDeveloping/_compat/`）：
`diff-old-vs-new-client.mjs`、`diff-css-rules.mjs`、`cmp-patch-blocks.mjs`、`cmp-glass-surfaces.mjs`、`probe-js-selectors.mjs`、`probe-asar-hashes.mjs`、`probe-asar-anchors.mjs`、`report-numbers.mjs`。

---

## 1. 功能性缺失（行为层面，非样式）

### 1.1 模型目录同步（`catalogSync`）被停用 —— 唯一被主动删除的功能

现版 `lib/index.js` 的 `apply()` 中，激活期的调用被删除（`lib/index.js:907-912`）：

```diff
-// Activation-time, best-effort, silent unless it really changed something.
-try {
-    startCatalogSync(settingsCtx);
-} catch (error) {
-    console.warn("[deepseek-style-theme] catalog sync unavailable:", error);
-}
+// 模型目录同步已移除（2.1.0）：该功能会改写 llm-deepseek 的 models 列表，
+// 而官方 0.2.0 自带模型目录（ui-model-selection + modelCatalog），
+// 选择器内容以官方为准，本插件不再介入。
```

**但实现没有删。** 计数证据：

| 符号 | `lib/index.js` 中的出现次数 | 含义 |
|---|---|---|
| `syncDeepseekCatalog` | 3 | 定义 + 内部引用，实现完整保留 |
| `startCatalogSync` | **1** | **只剩函数声明（L574），调用点已无** |
| `catalogSync` | 6 | 设置项 schema（L138）、策略读取、日志文案仍在 |

**连带的不一致**：README 仍在四处把该功能当现存功能描述——L30 的功能列表、L280「## 模型目录同步」整节、L320 隐私章节「运行时的唯一出网动作」、L355 的 `catalog-sync-smoke.mjs` 说明、L385 的 `index.js` 职责注释。也就是说文档承诺了一件事，代码不再做。

**影响**：插件启动不再向 DeepSeek 端点询问模型列表，「选择器里有哪些模型」完全交给官方目录；原本的「绝不臆造能力位、绝不清空你的条目」那套保护也不再起作用。约 330 行宿主代码成为死代码。

### 1.2 三条行为在当前产品上已静默失效

见第 3 节（`app.asar` 检索已证伪其依赖的类名）。

### 1.3 轨迹视图判定被写死

```js
const isTrajectory = () => false;   // 现版 client.js:2781
```

原版靠 DOM 反推：`header.closest('.wSkVaW_root').querySelector('.fV0t5q_root') !== null`。现版既拿掉了这个判据，也拿掉了让标签显形的 CSS（见 2.2），两者叠加的效果是**轨迹入口实际不可达**。

---

## 2. 视觉面缺失（原版有规则，现版没有）

### 2.1 侧栏外壳的液态玻璃配方 —— D 组，8 条

原版 `GLASS_CSS` / `LIQUID_CSS` 里 `hHd-Xa_root` 相关的全部规则消失：

| 被移除的规则 | 原本做什么 |
|---|---|
| `html .hHd-Xa_root::before`（GLASS_CSS） | 侧栏毛玻璃底：白色填充 + `blur()` + 右边框 |
| `html[data-dshome-glass="liquid"] body .hHd-Xa_root::before` | 液态档位下的侧栏调参 |
| `html[data-dshome-glass="liquid"] body .hHd-Xa_root::after`、`… .hHd-Xa_root::after` | 走光边环（sheen / ring） |
| `html[data-dshome-dispersion][data-dshome-glass="liquid"] body .hHd-Xa_root::before` | SVG `feDisplacementMap` 边缘折射 |
| `body .hHd-Xa_root [class*="_fade" i]` | 侧栏内部渐隐层处理 |
| `body[data-dshome-dark] .hHd-Xa_root::before` | 暗色侧栏底色 |

**现版保留了什么**：`PATCH#2` 给侧栏一层普通毛玻璃（`rgba(255,255,255,.5)` + `blur(var(--ds-glass-blur))` + `border-right`），锚点是 `:is(aside,[role="navigation"]):has(:is([class*="_newSession"],[class*="_brand"]))`。

**净损失**：侧栏**不再参与「液态 / 白磨砂」切换**——切档位时侧栏外观不变；折射、边环全部没有。这是「视觉上少两块」中的一块。

### 2.2 「对话 / 轨迹」标签页 —— B 组核心，整套 + 显示逻辑

| 被移除的规则 | 原本做什么 |
|---|---|
| `.wSkVaW_tabs{order:0;display:none;gap:8px}` | **基线：隐藏** |
| `.wSkVaW_header.dshome-swap .wSkVaW_tabs{display:flex;animation:dshome-tab-in .22s}` | **悬停标题栏时显形** |
| `.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_tabs{display:flex!important}` | **首屏常驻显形** |
| `.wSkVaW_tab` / `:hover` / `:active` / `::after` / 暗色两套 | 标签胶囊本体：底、边、圆角 `corner-shape:round`、悬停抬升 + 品牌晕、按下回弹 |
| `.wSkVaW_tabActive` / `:hover` / 暗色 | 选中态：品牌渐变底 + 白字 + 投影 |
| `@keyframes dshome-tab-pop` | 切标签时的弹入动画 |

**这条最严重**：`watchHeaderInteraction()` 的 JS 交换逻辑**完整保留并在跑**（`enter`/`leave`/`over`/`out`，读写 `dshome-swap` 类、做 FLIP 位移动画），但**没有任何规则再把标签显出来**。原版 `display:none` 是主题自己下的，现版这条基线也没了，于是标签只能听产品的——而产品在会话视图下默认 `display:none`。

**净损失**：轨迹视图入口不可达；标题栏悬停时不再有「操作块 ←→ 路径块」的位移交换。

### 2.3 悬浮标题栏本体与布局重排 —— B 组，45 条中的大部分

| 被移除的规则 | 原本做什么 |
|---|---|
| `.wSkVaW_header{position:absolute;top:8px;left:24px;right:24px;z-index:9;min-height:36px;…}` | 把标题栏从文档流里提出来，做成悬浮条 |
| `.wSkVaW_header::before` + `:hover` + `:hover::before` + 暗色 `:hover::before` | 悬停时收成 999 圆角的毛玻璃胶囊 |
| `.wSkVaW_header:after{display:none!important}` | 干掉产品自带的分隔线（悬浮条下那条 0.5px 发丝线） |
| `.wSkVaW_titleRow{display:contents}` / `.wSkVaW_titleCluster{display:contents}` | 抹平中间层，让子块能参与父级 flex 排序 |
| `.wSkVaW_crumbs{order:2}` / `_tabs{order:0}` / `_headerActions{order:1}` / `_headerUtilities{order:3}` / `_headerCorner{order:4}` | 逐个指定顺序（否则 `headerCorner` 的右栏展开按钮会掉到最左，压住第一个标签） |
| `z-index:9` 覆盖 | 产品的列宽抓手（`_widthHandle`，40px 宽满高、z-index 8）会盖住标题栏，导致标题栏控件点不到 |

**现版保留了什么**：`PATCH#3` 只剩 4 条规则——`_headerActions:has(_tabs){background:transparent}`、`_tabs{border:none}`、`.dshome-swap` 下 crumb/tabs 的 transition、`_moreButton` 的收放（`:has()` 门控）、以及一条把 `_label/_seat/_split/_crumb/_moreButton/[data-sidebar-right-expand]` 统一成 `corner-shape:round` 的规则。

**净损失**：整个悬浮胶囊形态、顺序重排、z-index 修复。`:hover` 时不再有任何玻璃与形变。

### 2.4 「打开方式」分裂按钮 / 标签胶囊 / 中·EN 展开

| 被移除的规则 | 原本做什么 |
|---|---|
| `.CAgGvG_split` + `:hover` + `:active` + `_main`/`_chevron` + 暗色两套 | 「打开方式」按钮悬停抬升、品牌色描边/底色/阴影；箭头按 `aria-expanded` 翻转 180°；按下回弹 |
| `.SVAs4q_label` + 暗色 | 标签胶囊：`color-mix` 品牌底 + 描边 + 999 圆角 + 28px 高 |
| `.wSkVaW_header:hover .dshome-locale .dshome-short` / `.dshome-full` | 中/EN 控件在标题栏悬停时从「中/E」平滑展开成「中文/EN」（max-width + opacity + transform 过渡，非 `display` 硬切） |

**现版保留了什么**：`_label` 只出现在 `corner-shape:round` 名单里（只修方圆、不带样式）；`.dshome-locale` 组件本体由 `ACTIONS_CSS` 注入，仍在。

**净损失**：三处样式本体 + 悬停展开定位。

### 2.5 输入卡：旋转描边与发送按钮 —— E 组真正丢的部分

| 被移除的规则 | 原本做什么 |
|---|---|
| `.uV2eYG_card::before`（浅/暗两套） | 卡片外圈 1px 的 `conic-gradient(from var(--dsh-border-angle), …)` **旋转描边** |
| `.uV2eYG_primary` / `:hover` | 发送按钮品牌渐变底 + 悬停加重投影 |

**现版保留了什么**：`[data-dsh-inputbar]:has([data-dsh-stats])` → `:where(div):has(> [data-composer-stats])` 的整块玻璃化（融合底板、`::before` 背板模糊、统计行透明化、`scale(1.04)` / 倾斜时 `scale(1.08)`、暗色两套）——**逐条对齐，无损失**。

**净损失**：旋转描边 + 发送按钮配色。附带证据：`@property --dsh-border-angle` 与 `@keyframes dsh-border-spin` 在现版**仍然声明着**（`client.js:1174-1175`），但全文件只剩这 2 处引用（原版 4 处，含两处使用），即**已无人调用的死声明**。

### 2.6 侧栏会话行：选中态与图标按钮 —— A 组，8 条中的 4 条

| 被移除的规则 | 原本做什么 |
|---|---|
| `.YDXeBa_sessionRow.YDXeBa_selected` | 选中会话行：品牌渐变底 + 品牌描边 + `--ds-brand-deep` 文字 |
| `body[data-dshome-dark] … .YDXeBa_selected` | 暗色选中态：更强渐变 + `#eef2ff` 文字 |
| `.YDXeBa_iconButton` | 图标按钮的 background/color/transform/opacity 过渡 |
| `.YDXeBa_iconButton:hover{transform:scale(1.1)}` | 悬停放大 |

**现版保留了什么**：行的 base、`:hover`（含 `blur(8px)` 与 `translateX(2px)`）、暗色 base 与暗色 hover 都迁到了 `:is([class*="_sessionRow"],[class*="_projectRow"])`。

**净损失**：**选中态完全没迁**（`_selected` 在现版 `client.js` 里 0 命中），图标按钮的过渡与悬停放大也没迁。而产品里 `_selected`、`_iconButton` 后缀**都存在**（见第 4 节），是可以补的。

### 2.7 首屏容器 —— F 组，2 条

| 被移除的规则 | 原本做什么 |
|---|---|
| `.fV0t5q_root{background:rgba(255,255,255,.45);border-bottom:1px solid rgba(0,0,0,.06)}` | 首屏容器底色 + 下边框 |
| `body[data-dshome-dark] .fV0t5q_root{…}` | 暗色版本 |

**净损失**：首屏整块没有主题底色了。（注意：首屏**标题**那条 `:is([class*="composerHero"] [class*="_headline"])` 新旧完全一致，但它现在是死的 —— 见 3.4。）

### 2.8 时间轴面板 —— G 组，5 条

| 被移除的规则 | 原本做什么 |
|---|---|
| `._1p9O6q_root` + 暗色 | 面板底 + 下边框 |
| `._1p9O6q_plot` | 透明化 |
| `._1p9O6q_span[data-timeline-span=user]` | 用户段用 `--ds-brand-light` |
| `._1p9O6q_span[data-timeline-span=assistant]` | 助手段用 `--ds-brand` |

**净损失**：整块。产品的 `_plot` 后缀现在**存在**（`ZNyiNW_plot`），只是主题不再管。

### 2.9 设置面板 / 子代理面板 —— I 组 4 条 + H 组 1 条 + 折射 1 条

| 被移除的规则 | 原本做什么 |
|---|---|
| `.VOzbGW_panel` + 暗色 | 面板底色 `rgba(255,255,255,.97)` / `rgba(13,30,60,.96)` + `dshome-modal-in` 弹入 |
| `.VOzbGW_mask` | 遮罩 `dshome-fade-in` |
| `.VOzbGW_overlay` | 强制 `position:fixed; inset:0; 100vw×100vh` |
| `html[data-dshome-dispersion] .VOzbGW_panel`（GLASS_CSS） | 设置面板的液态折射 |
| `.Nqubda_panel{animation:dshome-pop-in .25s …}` | 子代理面板弹入 |

### 2.10 会话滚动区与横向滚动守卫 —— J 组，2 条 + 1 条

| 被移除的规则 | 原本做什么 |
|---|---|
| `.wSkVaW_viewArea{animation:dshome-view-enter .45s ease}` | 会话切换时的入场动画（`@keyframes` 现版还在，**无规则引用**） |
| `[class*="scrollBody"],[class*="composerSeat"],[class*="viewArea"]{overflow-x:clip}` | **2.0.78「会话列不再横向滚动」那条修复** |
| `.wSkVaW_scrollBody{padding-top:56px}` / `.wSkVaW_viewArea{padding:0 18px}` | 已迁移到 `:is([class*="_scrollBody"])` / `[class*="_viewArea"]`，**无损失** |

**净损失**：入场动画 + 横向滚动守卫。`overflow-x:clip` 在现版**整文件 0 命中**。

### 2.11 应用外框 / 分栏 —— C 组，3 条（部分覆盖）

| 原版规则 | 现版对应 | 状态 |
|---|---|---|
| `.pI_x6G_frame{background:transparent}` | `:where(div):has(> [class*="_overlayLayer"]){background:transparent!important}` | ✅ 已覆盖（改用几何反推） |
| `.pI_x6G_sidebarCol{border-right:none}` | `:where(div):has(> [class*="_overlayLayer"]) [class*="_sidebarCol"]{border-right:none}` | ✅ 已覆盖 |
| `.pI_x6G_detailsCol{border-left:none}` | — | ❌ 未覆盖（且产品里 `_detailsCol` 后缀也已不存在） |
| `.pI_x6G_centerCol{background:transparent}` | — | ❌ 未覆盖（产品里 `_centerCol` 存在：`BynINW_centerCol`） |

---

## 3. 当前产品上已静默失效的部分（硬证据）

对 `E:\Softwares\DeepSeekHarness\resources\app.asar` 做二进制检索（latin1 全文）：

### 3.1 旧哈希族在当前产品里**全部为 0**

| 检索串 | 命中数 |
|---|---|
| `wSkVaW_` | **0** |
| `hHd-Xa_` | **0** |
| `YDXeBa_` | **0** |
| `VOzbGW_` | **0** |
| `fV0t5q_` | **0** |
| `_1p9O6q_` | **0** |
| `Nqubda_` | **0** |
| `uV2eYG_` | **0** |
| `pI_x6G_` | **0** |

产品现有的是新族：`_2H3hWW_` 190、`hIlkoa_` 153、`Dc7zOa_` 108、`cJsG2q_` 91、`RlGAzG_` 87、`wCInkW_` 49、`BynINW_` 46。

### 3.2 因此，现版 `client.js` 里仍写死哈希的三处行为**当前就是坏的**

| 位置 | 选择器 | 失效的功能 | 产品的实际类名 |
|---|---|---|---|
| `client.js:2759` | `.hHd-Xa_brand` | 点侧栏 DeepSeek 标识 → 打开 `deepseek.com` | `_2H3hWW_brand` |
| `client.js:2932-2934` | `.YDXeBa_projectRow` / `_rowActions` / `_title` | 项目行三点菜单里的「打开工作区」 | `hIlkoa_projectRow` / `_rowActions` |
| `client.js:2741` | `.VOzbGW_options` | 设置面板切换项的淡入动画 | `wCInkW_*` |

> 这三处是**语义化迁移漏掉的部分**：CSS 全面换成了 `[class*="_xxx"]` 模糊后缀，JS 里的硬编码选择器没跟着换。它们不会报错，只会静默不做任何事。

### 3.3 语义锚点在产品里的实际存在性（复核结论：绝大部分成立）

| 现版依赖的后缀 | 产品中 | 实例 |
|---|---|---|
| `_newSession` | ✅ | `_2H3hWW_newSession` |
| `_brand` | ✅ | `_2H3hWW_brand`、`kh1pJG_brand` |
| `_sessionRow` / `_projectRow` | ✅ | `hIlkoa_sessionRow` / `hIlkoa_projectRow` |
| `_scrollBody` / `_viewArea` | ✅ | `Dc7zOa_scrollBody` / `Dc7zOa_viewArea` |
| `_headerActions` / `_tabs` / `_crumb` / `_crumbs` | ✅ | `Dc7zOa_*` |
| `_moreButton` / `_label` / `_seat` / `_split` | ✅ | `_4Nnt6q_moreButton`、`_oGoKq_seat`、`WgQWqa_split` |
| `_overlayLayer` / `_sidebarCol` / `_centerCol` / `_frame` | ✅ | `BynINW_*` |
| `_bubble` / `_headline` / `_previewBadge` | ✅ | `cJsG2q_bubble`、`Hqq-bq_headline` |
| `_selected` / `_iconButton` / `_rowActions` / `_panel` / `_mask` / `_options` / `_plot` / `_widthHandle` | ✅ | 均存在（**可用来补回第 2 节的缺口**） |
| **`_composerCard`** | ❌ **0** | `PATCH#2` 的 anchor 备选之一，永不匹配 |
| **`composerHero`** | ❌ **0** | 见 3.4 |
| **`_detailsCol`** | ❌ 0 | 原版 `border-left:none` 无处可指 |

三个关键族的成员全表（说明第 6 节的补回方案有据可依）：

```
hIlkoa_ (35)  archived, arrow, arrowOpen, chevron, dot, dropAfter, dropBefore, folder,
              folderActive, hoverArchived, hoverContent, hoverPath, hoverStatus, hoverTime,
              hoverTitle, iconButton, menuOpen, meta, pinIndicator, projectRow, projectText,
              renameInput, rowActions, searchResult*, selected, sessionRow, slot, time,
              title, visuallyHidden

wCInkW_ (21)  actions, active, close, content, header, hiddenLabel, mask, nav, navCell,
              navIcon, navLabel, navList, navTitle, options, overlay, panel, rail,
              railRow, trigger, triggerLabel, triggerRow

_2H3hWW_ (35) brand, brandIdentity, brandMark, brandName, buildVersion, collapsed, fading,
              fallbackBrandName, footArea, footerActions, iconButton, localBuildBrand,
              localBuildTitle, logoRow, newSession, newSessionContent, newSessionLabel,
              newSessionLabelMask, newSessionShortcut, panelActive, panelGlyph, panelIcon,
              panelList, panelRow, panelTitle, quietBars, rail, railIn, railMark, regionArea,
              root, settingsArea, toggle, topStrip, wide
```

> 注意 `hIlkoa_` 里同时有 `selected` 和 `iconButton` —— 第 2.6 节丢掉的选中态与图标按钮悬停，用 `[class*="_selected"]` / `[class*="_iconButton"]` 就能补回，不需要任何哈希。`wCInkW_` 里 `options` / `mask` / `panel` 齐全，对应第 2.9 节。`_2H3hWW_` 里 `brand` / `newSession` / `root` 齐全，对应第 1.2 节的品牌链接。

### 3.4 一处旧账：首屏标题样式是死的（不是 2.1.0 造成的）

`PATCH#0`（现版）与 `PATCH#7`（原版）**逐字节相同**：

```css
:is([class*="composerHero"] [class*="_headline"]){font-size:34px; …}
body[data-dshome-dark] :is([class*="composerHero"] [class*="_headline"]){ …}
:is([class*="composerHero"] [class*="_previewBadge"]){ …}
```

但 `composerHero` 在当前 `app.asar` 里 **0 命中**，而 `_headline` / `_previewBadge` 存在（`Hqq-bq_headline`）。也就是说 34px 渐变标题与预览角标胶囊**当前不会生效**。这条是产品漂移，不是 2.1.0 的取舍——但它现在确实缺着。

---

## 4. 现版里的死代码 / 死规则清单

| 位置 | 内容 | 状态 |
|---|---|---|
| `lib/index.js:306-640` | `syncDeepseekCatalog` / `startCatalogSync` 及全部辅助函数（约 330 行） | 无调用点 |
| `lib/index.js:138` | `catalogSync` 设置项 schema | 仍在 schema 里，UI 可写，无效果 |
| `lib/client.js:1174-1175` | `@property --dsh-border-angle` + `@keyframes dsh-border-spin` | 无规则引用 |
| `lib/client.js:1176` | `@keyframes dshome-view-enter` | 无规则引用 |
| `lib/client.js:1179` | `@keyframes dshome-tab-in` | 无规则引用 |
| `lib/client.js:2741` | `.VOzbGW_options` | 产品中不存在 |
| `lib/client.js:2759` | `.hHd-Xa_brand` | 产品中不存在 |
| `lib/client.js:2932-2934` | `.YDXeBa_projectRow/_rowActions/_title` | 产品中不存在 |
| `lib/client.js:2781` | `isTrajectory = () => false` | 恒定假 |
| `README.md` L30 / L280-314 / L320 / L330 / L355 / L385 | 模型目录同步的四处文档 | 与代码不符 |

---

## 5. 明确**没有**丢失的部分（避免误判）

| 面 | 说明 |
|---|---|
| 输入卡玻璃化 | `[data-dsh-inputbar]:has([data-dsh-stats])` → `:where(div):has(> [data-composer-stats])`，逐条对齐 |
| 浮层菜单液态玻璃 | `MENU_GLASS_CSS` 三块规则**逐字节相同**，锚点 `[data-menu-material]` |
| 用户消息气泡 | `USER_BUBBLE` 仍在 `GLASS_CSS` / `LIQUID_CSS` / `PATCH` 中使用 |
| 交付文件卡片 / 文件改动行 / 行内 `@文件` 引用 | 三种菜单全在（`[data-presented-file]` / `[data-presented-files-row]` / `button[data-ref-chip]`） |
| 会话行 base + hover + 暗色 | 已迁到模糊后缀 |
| 侧栏毛玻璃底、`_newSession` 渐变按钮、`_brand` 配色 | 已迁（`PATCH#2` / `PATCH#3`） |
| 光标高光跟随 | `SPOT_SURFACES` 里侧栏外壳仍在；`data-dshome-spot` 引用数 8 → 8 |
| 流体背景 / 背景四档 / 玻璃两档 / 高峰配色 / 高峰计时 | 完全未动 |
| 子代理运行面板、壁纸引擎与侧栏插件共存 | 完全未动；`SUBAGENT_PANEL_CSS` 还**新增**了拖拽（`dshome-sa-grab` / `-dragging`） |
| 设置页 DSTT 选项卡、`dstt.mode.get/set` 私有桥 | 完全未动（RPC 端点两侧一致） |

**一句话**：丢的是「覆盖面」，不是「能力」；核心视觉（流体 + 玻璃 + 高峰配色 + 文件菜单 + 子代理面板）都在。

---

## 6. 可补回的清单（按性价比排序）

下列缺口的依赖后缀**已确认存在于当前产品**，可在不重新引入哈希硬编码的前提下补回：

| 优先级 | 缺口 | 可用的锚点 | 工作量 |
|---|---|---|---|
| P0 | 轨迹标签不显形（`display` 逻辑） | `[class*="_tabs"]` + `[class*="_headerActions"]` | 极小，3 条规则 |
| P0 | 会话行选中态 | `[class*="_selected"]` 与 `[class*="_sessionRow"]` 组合 | 小，浅/暗两套 |
| P0 | 横向滚动守卫 | `[class*="_scrollBody"]` / `[class*="_viewArea"]` | 极小，1 条 |
| P1 | 图标按钮过渡 + 悬停放大 | `[class*="_iconButton"]` | 小 |
| P1 | 首屏容器底色 | `[class*="_headline"]` 的最近容器，或 `[class*="composerHero"]` 换成实测存在的前缀 | 小 |
| P1 | 时间轴面板配色 | `[class*="_plot"]` + `[data-timeline-span]` | 小 |
| P1 | 三处 JS 硬编码选择器（品牌链接 / 工作区菜单 / 设置面板动画） | `.hHd-Xa_brand` → `[class*="_brand"]`；`.YDXeBa_projectRow/_rowActions/_title` → `[class*="_projectRow"]/_rowActions/_title`；`.VOzbGW_options` → `[class*="_options"]`（三者均已验证存在于产品） | 中 |
| P2 | 子代理面板弹入 | `[class*="_panel"]`（需先定唯一性） | 小 |
| P2 | 设置面板底色与遮罩 | `[class*="_mask"]` / `[class*="_options"]` | 中，需防撞名 |
| P2 | 侧栏液态玻璃配方 | 侧栏已有 `:has()` 反推锚点，直接挂 `::after` 与 dispersion 规则 | 中 |
| P3 | 悬浮标题栏胶囊 + 布局重排 | `[class*="_headerActions"]` / `[class*="_crumb"]` / `[class*="_tabs"]` + `:has()` | 大，且需重新验证 z-index 与列宽抓手 |
| P3 | 标题栏悬停胶囊 / 打开方式分裂按钮 / 标签胶囊 / 中·EN 展开 | `[class*="_label"]` / `[class*="_split"]` / `[class*="_seat"]` | 大 |
| — | 旋转描边 + 发送按钮配色 | `[data-composer-card]`（描边）/ 发送按钮需先定位 | 小，但 `--dsh-border-angle` 需重新接线 |
| — | 模型目录同步 | 恢复 `apply()` 里的 `startCatalogSync(settingsCtx)`，或删代码 + 改 README | 二选一，**不能维持现状** |

---

## 7. 附：本次分析产出的脚本

均位于 `D:\DeepSeek\PluginDeveloping\_compat\`：

| 脚本 | 作用 |
|---|---|
| `diff-old-vs-new-client.mjs` | 属性 / CSS 变量 / 全局入口 / 块常量 / RPC 端点集合比对 |
| `diff-patch-blocks.mjs` | `PATCH_BLOCKS` 的锚点与选择器集合比对 |
| `diff-css-rules.mjs` | 229 vs 170 条选择器逐条比对，按面归类移除项 |
| `cmp-patch-blocks.mjs` | 逐块字节级一致性检查（找出「看似迁移、实为同一条」的块） |
| `cmp-glass-surfaces.mjs` | `GLASS_CSS` / `LIQUID_CSS` / `MENU_GLASS_CSS` 的作用面清单比对 |
| `probe-js-selectors.mjs` | 两份 bundle 里 JS 用到的 DOM 选择器字面量 |
| `probe-asar-hashes.mjs` | `app.asar` 全文检索旧/新哈希族与语义钩子 |
| `probe-asar-anchors.mjs` | 现版依赖的每个后缀在产品里是否存在 |
| `report-numbers.mjs` | 本报告 0.2 与 3.x 各表的数字来源 |
