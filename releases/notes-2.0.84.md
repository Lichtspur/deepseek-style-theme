## v2.0.84 — 修 BUG-REPORT 的四条 + 修 2.0.83 的激活期崩溃

**先说结论：2.0.83 那个 tag 的产物不要发——它在激活期就抛 `ReferenceError`，主题完全不加载。本版才是可用的。**

### 1. 激活期崩溃（并行会话的 2.0.83 带进来的）

`54fa442` 把 `USER_BUBBLE` 的声明留在 `PATCH_BLOCKS` / `GLASS_CSS` 之后，而这两个表**在构建时**就用 `${USER_BUBBLE}` 插值 → 工厂一跑就抛 `Cannot access 'USER_BUBBLE' before initialization` → `style[data-plugin-css]` 一个都不注入，页面上等于没装主题。本版把声明提到两个表之前，并加了会拦住它的断言（`bg-recipes-smoke` 的"模板插值不得早于 const 声明"，已用真 bug 反向验证过）。它自带的 `默认背景方式 classic → bold` 保留。

### 2. B1【严重】`ATTR` 从未声明：折射一直在死，且每次切「动态背景」泄漏一个流体模拟器

`var ATTR = "data-dshome-dispersion";` 在 `d862487` 被误删，从 **1.43.6 到 2.0.82** 没人发现：`startGlassDispersion()` 第一行就抛，异常被 `startAmbient()` 调用处的 `catch` **静默吞掉**——折射从未挂上（四表面 `backdrop-filter` 里没有 `url(#…)`），而且返回的 disposer 永不存在：开关显示"已关闭"，全屏流体仍 60 次/秒在画，点一次多一个模拟器（实测 1 → 2 → 3；draw 调用 60 → 120 → 180）。

修法：补回声明；**帧循环自带自清理**（canvas 离开 DOM 即停）；调用处 catch 改为 `console.error` + 扫掉孤儿 canvas；新增 8 条"CSS 契约名必须已声明"的断言（`node --check` 看不见未声明标识符——这正是它藏了 19 个版本的原因）。

### 3. B5【严重】「按钮跳动」的真正根因：提示气泡被改成 `position:relative`

`LIQUID_BUBBLE` 是一个逗号列表，却被当前缀用：CSS 的前缀只约束紧邻的那**一个**分支，逗号后的分支整个在 `html[data-dshome-glass="liquid"]` 闸门外。那个分支命中了产品的**提示气泡**（`._bubble_1nw3t_1`，本来是 `position:fixed`），主题的 `position:relative` 把它变成**流内元素**：在对话框尾部行凭空占 **78px**、在消息操作栏占 **48px** → 光标下的发送/复制按钮被顶走 → hover 失效 → 提示卸载 → 按钮弹回 → 再次 hover…… 实测发送键 `left 954.6 ↔ 876.6`（周期 ~510ms）、复制键 **2.5 秒内 151 次翻转（≈60Hz）**。这就是必须"输入框里有文字"才复现的原因：提示气泡只在可发送 / hover 出动作条时存在。

修法：选择器改为**单个复合选择器**并只在 `[data-chat-flow-kind="user"|"steering"]` 容器内匹配，每处用法包 `:is(…)`（以后再多分支也逃不出闸门）；按**形状**排除提示气泡（消息气泡是 `<hash>_bubble`，提示气泡是前导下划线 `_bubble_…`）＋ `:not([role="tooltip"])`；两条本该在闸门内的暗色规则补上配方闸门。被删掉的"刚输入的消息"分支**有意不补**——那一瞬间不涂玻璃只是审美等待，会瞬移的按钮不是。

### 4. B2【中】三个产品类名已改名，补丁块被永久跳过

`pXSMma_headlineText` → `pXSMma_headline`（空态标题本该 34px 渐变字，实测停在 26px/500）、`nL4_yW_sessionLogButton` → `nL4_yW_moreButton`（标题栏 hover 展开失效）、`gdEzaW_bubble` → `Sixlwa_bubble`/`oRe1gG_bubble`（白磨砂下用户气泡 `background: rgba(0,0,0,0)`、`backdrop-filter: none`，文字直接坐在背景上）。三处都改成**按后缀匹配**，和仓库里已有的 `[class*="_fade" i]` 同一套路。

### 5. B3【中】锚点守卫只有 30 秒窗口

30 秒内锚点不出现就放弃且不再重试 → 默认折叠的侧栏、设置面板、进度面板、轨迹视图这些"点开才有"的表面**永远拿不到补丁**（实测：4s 展开有补丁、>30s 展开没有）。现在观察者活到插件结束，重查按 rAF 节流、落地即断开。

### 6. B4【低】README 勘误
「对话 / 轨迹」标签并非常驻：会话视图下默认隐藏，只有标题栏悬停或轨迹视图存在时才显示。

### 验证账
`parse-smoke`（新增）**13/13**；`bg-recipes-smoke` **73/73**（新增 9 条：8 条契约名已声明 + 1 条插值顺序）；`dstt-schema-smoke` **29/29**；`bridge-smoke` **26/26**。

**真机复核未完成**（收敛后被沙箱策略挡住：审批改为 never，起不了 headless Chrome，也不能把工作副本热替换进 profile）。装包后请确认三条：

```js
document.documentElement.hasAttribute('data-dshome-dispersion')   // 期望 true
document.querySelectorAll('svg filter').length                    // 期望 4
getComputedStyle(document.querySelector('._bubble_1nw3t_1')).position  // 期望 "fixed"
```

第三条就是「按钮跳动」是否根治的判据：在输入框里打几个字，把鼠标**停在发送键左缘**几秒——按钮不应再横向瞬移；已发送消息上悬停复制键同理。

### 退路
`@2.0.82`、`@2.0.81`。**`@2.0.83` 不可用**（激活期崩溃）。
