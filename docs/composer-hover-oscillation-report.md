# 输入框悬停自激振荡 诊断报告（挂起）

| 项 | 值 |
|---|---|
| 报告日期 | 2026-10-03 |
| 涉及版本 | DSTT `2.2.0`（工作树，link: 装进 desktop profile） |
| 产品 | `@deepseek-ai/dsh-desktop` 0.2.0-rc.2，Electron 44.0.0，Windows |
| 状态 | **未解决，用户决定先挂起**；本报告固化已确认的事实与排除项，供后续接手 |
| 优先级 | 中（纯视觉/交互抖动，不影响功能，但会自激到无法使用输入框） |

---

## 一、症状（用户原话整理）

1. 鼠标移到**发送按钮**上：输入框**大幅上移**。
2. 不是只上移一次，而是**来回跳**。用户给出的机理推断（与文件里 2.0.90 记过的 B5 事故完全一致）：

   > 鼠标放上去之后跳上去，但是整个窗口上移后鼠标还在原来的位置，所以鼠标没在发送按钮上，所以输入框就回来了，回来之后鼠标又在发送按钮上，然后又上去，从此往复，跳上跳下。

3. **触发条件（本轮新增的关键线索）：输入框为空时不触发；一旦有内容就触发。**
4. 截图里能看到同一时刻画面上出现**两个输入框**（一个在会话区顶部、一个在正常底部位置）——这是振荡中的撕裂帧，不是产品真的渲染了两份。

---

## 二、已经**排除**的原因（有证据）

### 2.1 不是主题的倾斜效果

`lib/client.js` 里的倾斜常量：

```js
const TILT_MAX = 0.03;          // 弧度，约 1.7°
const TILT_PERSPECTIVE = 800;   // px
const TILT_SCALE = 1.015;
```

以实测卡片尺寸 386×98 估算：`rotateX(1.7°)` 绕中心把上下边在 Z 方向移动约 1.5px，再经 800px 透视投影后是**亚像素级**的位移；`scale(1.015)` 让卡片宽 +5.8px、高 +1.5px。**合计只有几个像素，撑不起「大幅上移」**。

### 2.2 不是产品自己的悬停样式

实测产品输入区模块 `RlGAzG_*` 的所有 `:hover` 规则：

```
.RlGAzG_primary:hover:not(:disabled)   { background: var(--dsw-alias-button-info-hover) }
.RlGAzG_add:hover:not(:disabled)       { background: var(--dsw-alias-interactive-bg-hover-solid) }
.RlGAzG_select:hover:not(:disabled)    { background-color: var(--dsw-alias-interactive-bg-hover) }
.RlGAzG_cardWorkspaceTrigger:hover:after { color: var(--dsw-alias-state-business-primary) }
```

**只改颜色，不动几何。** 整个 `RlGAzG` 模块里带几何属性的规则（`padding` / `min-height` / `max-height` / `position` / `display`）都没有 `:hover` 触发路径。

### 2.3 不是"卡片被加了定位"（已撤销，问题仍在）

上一轮我给输入卡加的规则里带了 `position:relative`（初衷是给 `::before` 做定位锚点，后来方案不用 `::before` 了）。当时怀疑它把产品的定位方式顶掉、导致卡片回落文档流。**已删除该属性，问题依旧**——所以不是它。

撤销后卡片规则只剩颜色与模糊，不含任何几何/定位属性，并已加反向断言把它钉住：

```js
&& !/\$\{COMPOSER_PLATE\}\{[^}]*position:/.test(source)
```

---

## 三、剩余嫌疑（按可能性排序，均**未证实**）

### 嫌疑 1：tooltip 被误判成"用户气泡"，吃了 `position:relative`（最可疑）

文件里 2.0.90 的 B5 注释记的就是同一套机理：

> A second branch, meant to cover a just-typed bubble, also matched the product's TOOLTIP (`_bubble_<hash>_<n>`, `position:fixed`) … the theme's `position:relative` turned that floating tooltip into an in-flow element — 78px of width inside the composer … so hovering the send or copy button shoved the button out from under the cursor, the tooltip unmounted, the button came back, and the loop fed itself at up to 60Hz. **That WAS the user's「按钮跳动」**.

而防它的那道守卫在 2.1.0 语义化时**丢了**：

```
2.0.90:  [class*="bubble" i]:not([class*="_bubble_"]):not([role="tooltip"])   ← 按形状排掉 tooltip
2.1.0:   [class*="_bubble"]:not([role="tooltip"])                            ← 只剩角色守卫
```

本轮已把形状守卫补回（`USER_BUBBLE` 现在是
`:is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]) [class*="_bubble"]:not([class*="_bubble_"]):not([role="tooltip"])`），
**但用户复测「还在」**。

因此本嫌疑要么不成立，要么还有第二条误伤路径。需要确认的三件事（静态代码看不出来，必须真机）：

1. 发送按钮的 tooltip 实际类名是什么形状？含不含 `_bubble_`？
2. 它挂没挂 `role="tooltip"`？挂在哪一层？
3. 它是否落在 `[data-chat-flow-kind="user"|"steering"]` 容器**内部**？（三个条件缺一个，本嫌疑就不成立）

### 嫌疑 2：卡片上的 `backdrop-filter` 改变了包含块

`backdrop-filter` 非 `none` 会让元素成为 `fixed` / `absolute` 后代的**包含块**，并新建层叠上下文。当前输入卡规则里有：

```css
[data-composer-card]{background:rgba(255,255,255,.42)!important;
  -webkit-backdrop-filter:blur(28px) saturate(1.42) brightness(1.02)!important;
  backdrop-filter:blur(28px) saturate(1.42) brightness(1.02)!important; box-shadow:…}
```

若产品在卡片内部放了定位元素，它们会改以卡片为锚点。**验证方法**：临时把这两条 `backdrop-filter` 注释掉再复测；若振荡消失，即成立。

### 嫌疑 3：悬停触发的自定义属性变化导致重绘/重排

```css
html [data-dshome-spot]:hover{--dshome-glass-spec:1;}
html [data-composer-card]:hover{--dshome-glass-spec:1;--dshome-glass-sheen:.12;}
```

这两个变量被用在卡片的 `background-image`（径向高光 + 竖向光泽）里。**改自定义属性通常只触发重绘**，理论上不动布局——但"理论"在这里不算数，列出来供排除。

---

## 四、「有内容才触发」这条线索指向什么

空输入框与有内容的输入框，产品这一侧的差别是可枚举的（都来自 `RlGAzG` 模块）：

| 元素 | 空 | 有内容 |
|---|---|---|
| `.RlGAzG_placeholder` | `position:absolute; inset:4px 8px auto…`，**参与显示** | 隐藏 |
| `.RlGAzG_input` | `min-height:52px` | 随内容增高 |
| `.RlGAzG_scroll` | 不滚动 | `max-height:var(--dsh-composer-text-max-height)`、`overflow-y:auto` |
| 卡片高度 | 固定 98px（实测） | 变高，理论上可达 336px + 行高 |

**两个方向都能解释"只在有内容时发生"**：

- **方向 A（几何杠杆）**：卡片变高后，同一个 `rotateX` / `scale` 的位移量按尺寸放大；且 `.scroll` 的 `overflow-y:auto` 会在悬停/transform 时出现或消失滚动条，可能导致宽度/高度二次变化。**但 2.1 节已算出倾斜量级只有几像素，单靠它不够**，除非与滚动条出现/消失形成正反馈。
- **方向 B（误伤路径只在有内容时成立）**：某个被我们误伤的浮层（tooltip / 待发送指示 `.RlGAzG_pending`）只在有内容或只在该状态下存在。这与嫌疑 1 直接相关。

**下一步应当先量的就是这条**：分别记录"空输入框"和"有内容"两种状态下，同一悬停动作前后的卡片/输入座/输入栈盒子。

---

## 五、已做的改动与结果

| 改动 | 结果 |
|---|---|
| 撤销输入卡上的 `position:relative` | 无效，振荡仍在 |
| 补回 `USER_BUBBLE` 的 tooltip 形状守卫 | 无效，振荡仍在 |
| 加反向断言防止 `position` 溜回输入卡规则 | 已生效（自检 82/82 通过） |

**两次都没打中，所以本报告的价值在于把"已排除"钉死，避免后续重复试。**

---

## 六、怎么确认（一次操作就能定性）

`_compat/dstt-dom-report.js` 末尾已经内置了**悬停前后对比**（本轮加的）：

1. F12 → Console → 粘贴整个文件 → 回车
2. **立刻把鼠标移到发送按钮上停住**，等 4 秒
3. 控制台会打印两份读数并复制到剪贴板：`悬停前` / `悬停后`

读数包含：

| 字段 | 回答什么 |
|---|---|
| `鼠标悬停的元素` | 光标底下**实际**是哪个元素——是发送按钮，还是被我们误伤的浮层 |
| `卡片定位`（`position` / `transform` / `top` / `inset`） | 是**布局**被改，还是**位移**（transform） |
| `卡片盒子` / `输入座` / `输入栈` / `卡片父盒子` | 谁在动、动了多少像素、是不是外层被撑开 |

**建议两种状态各测一次**（空输入框 / 有内容），因为触发条件正好卡在这一点上。

若读数显示 `position` 变了 → 布局问题，查是谁的规则在改；
若只有 `transform` 变 → 位移问题，量它的量级是否与"大幅"相符；
若 `鼠标悬停的元素` 不是发送按钮 → 直接命中嫌疑 1，顺着它的类名找误伤它的规则。

---

## 七、建议的下一步（按性价比）

1. 跑第六节的两状态对比（一次粘贴 + 一次悬停，成本最低、信息量最大）。
2. 按嫌疑 2 做一次单项排除：临时注释掉卡片上的两条 `backdrop-filter`，复测。
3. 若都排除，做二分：临时把 `LIQUID_CSS` 里那条给气泡 `position:relative` 的规则停掉，复测——它是我上一轮接回来的规则之一，且是 B5 的直接成因。
4. 兜底方案（代价明确）：**去掉输入区上的悬停位移与光标高光**（`TILT_SELECTOR` 清空 + 删掉两条 `:hover` 的 `--dshome-glass-spec` 规则）。
   - 会失去：输入框随鼠标倾斜、光标跟随高光；
   - 会保留：玻璃的全部静态效果（填充、模糊、描边、投影）；
   - 换来的：不可能再有悬停自激——没有位移就没有"从光标底下跑掉"。

---

## 八、2026-10-03 复核：曾一度看似修好，随后复发

用户先报"修好了"，紧接着又报"又不行了"。这条信息很关键，它说明：

- **不是**我在此期间动过的那两处（撤销 `position:relative`、补 `USER_BUBBLE` 守卫）把它修好的——
  至少不是稳定修好。**也说明它可能是状态相关、间歇触发的**，而不是一条固定的代码路径。
- 两次报告之间我只做了三件事：§3.8（删掉两条已死的 34px 字号规则）、§3.5（删宿主端目录同步）、
  §3.2/§3.9（文件菜单改走官方 + 删掉 `watchWorkspaceMenu`）。
  其中**只有 §3.9 碰到悬停/交互路径**：`watchWorkspaceMenu` 曾经在 `document` 上挂
  `click`（capture）与 `focusin`（capture）监听，还有一个 `document.body` 全树 MutationObserver
  往每个 `[role="menu"]` 弹层里插条目。它被删掉之后确实少了一条 document 级干扰路径——
  但这不足以解释"复发"，因为删掉的东西不会自己回来。

### 因此把嫌疑重排（新的第一嫌疑）

**嫌疑 2 升为首位：`backdrop-filter` 把输入卡变成 `position:fixed` 后代的包含块。**

这条推理链与"有内容才触发"完全吻合，而且**不需要** `position:relative`，正好解释"撤掉它没用"：

1. 输入框**为空**时发送按钮是 `disabled`（`.RlGAzG_primary:disabled{opacity:.4}`），
   悬停不会弹 tooltip；
2. 输入框**有内容**时按钮可用，悬停时产品弹出自己的 tooltip —— 那是一个 `position:fixed` 的浮层；
3. 我们的卡片一旦带 `backdrop-filter`（非 `none`），按规范它就成为该后代的**包含块**，
   浮层不再是相对视口定位，而是相对卡片定位；
4. 浮层因此可能正好盖在按钮上方或旁边 → 光标被浮层接走 → 产品判定"鼠标离开了按钮"、
   收起 tooltip → 光标又落回按钮 → 再次弹出 → **自激振荡**。

第 3 条是 CSS 规范行为，不是实现怪癖；第 4 条是它的直接后果，且与用户"跳上跳下"的描述一致。

### 三秒可做的现场二分（不必重载、不必改代码）

按顺序在 DevTools 控制台各跑一行，每行跑完把鼠标放到发送按钮上试一下：

```js
// A. 一次性摘掉主题的三张玻璃表（glass.css / liquid-glass.css / menu-glass.css）
document.querySelectorAll('style[data-plugin-css*="glass"]').forEach(s => s.remove());

// B. A 有效时再细分：只摘掉卡片上的模糊（保留底色）
document.querySelector('[data-composer-card]').style.setProperty('backdrop-filter','none','important');

// C. 若 A 无效，说明与玻璃无关：停掉倾斜
document.querySelectorAll('[data-composer-card]').forEach(e => e.style.setProperty('transform','none','important'));
```

判读：

| 结果 | 结论 |
|---|---|
| A 一跑就停 | 元凶在玻璃表里；接着跑 B 细分 |
| B 一跑就停 | 就是 `backdrop-filter` 的包含块效应（新第一嫌疑成立）——修法见下 |
| A 无效、C 有效 | 是倾斜位移（但 2.1 节算过它只有几像素，需重新量） |
| 都无效 | 与玻璃和倾斜都无关，回到第六节的探针读数 |

任何一步都可以用 `Ctrl+R` 还原。

### 若 B 成立，修法与其代价

玻璃的模糊必须挂在**某个**元素上，而带 `backdrop-filter` 的元素一定会成为包含块。可选：

| 方案 | 代价 |
|---|---|
| 输入卡只保留底色、不做模糊 | 输入框变成半透明色块，**没有毛玻璃**——液态玻璃在输入区名存实亡 |
| 模糊挂到卡片的父元素（418×158 那块板） | 又回到"对话框被撑大"（用户已否掉） |
| 模糊挂到卡片的 `::after` 伪元素 | 需要卡片自身定位；若产品没给它定位，`inset:0` 会锚到别的祖先 → 位置错。需先实测卡片的 `position` |
| **接受现状、去掉悬停反应**（第七节兜底方案 4） | 失去倾斜与光标高光，玻璃静态效果全保留；**但这条对"包含块"无效**——浮层仍会被错误锚定，只是不再自激 |

**注意最后一条**：如果 B 成立，那么即使去掉悬停反应，tooltip 仍然会定位错（只是不再抖动）。
要真正修好，必须让带 `backdrop-filter` 的元素**不包含**那个 tooltip——也就是模糊不能挂在卡片或它的祖先上。
这一点需要在第六节的读数里确认 tooltip 的实际位置（它是卡片的兄弟还是后代）。
