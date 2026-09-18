## v2.0.85 — 对话框倾斜改成按指针几何位置判定（并让两条静默闸门可读）

你要的效果是**倾斜**（鼠标在对话框上时卡片跟着倾），这次不是别的开关牵连，是**触发方式本身太脆**。

### 问题在哪

倾斜原来必须等到一个 `pointerover`，且它的 `target` 能 `closest()` 到卡片选择器。这串假设主题自己无法验证：

- 产品把卡片换成别的节点（重渲染、portal）；
- 卡片外面套了一层 `role="button"` 或别的控件语义；
- 浮层/遮罩在事件链上挡了一层；
- 甚至只是事件顺序与 rAF 的竞争。

**而这些情况的用户可见表现完全一样：卡片纹丝不动。** 所以你三次看到的都是"效果没了"，我这边三次都查不出为什么——因为代码在"没触发"和"触发了但不该动"之间没有任何可观测的差别。

### 改法

1. **几何判定**：每个 `pointermove` 用 `spotAt()` 直接按**卡片自身的矩形**判断指针是否在卡片里，命中就倾（`controlAt()` 只留一次命中测试，用来回答"指针下是不是控件"——是控件就**冻结**当前角度，不重画不回弹）。漏掉一个事件只损失一帧，不损失效果。
2. **两条静默闸门变成可读的**：`__dshomeTilt()` 现在返回

```js
{ recipe, reducedMotion, spots, leaning, frozen, engagements, sinceRelease }
```

- `reducedMotion: true` → 系统「减少动效」把它关了（**唯一一个在任何设置里都看不见的闸门**，现在会打一行 `console.info` 说明）；
- `spots: 0` → 对话框卡片已不匹配 `TILT_SELECTOR`（产品的类名又变了，得改选择器）；
- `engagements` 会随每次倾动增长，`leaning` 反映此刻是否在倾。

没生效时先看这两个值，就不用再猜。

3. 语义不变：`scale(1.01)` 抬升、两套玻璃配方都生效、离开卡片矩形才释放、释放后 200ms 冷却、进控件冻结。

### 顺带一起留下的（不是你要的那条，但同类毛病）

光标高光与边缘折射原先挂在 `startAmbient()` 里 → **关掉「动态背景」**（集显方块那件事就是这么处理的）、选 ③ 自选背景、或机器没有 WebGL2 时，它们会跟着一起消失。现在由独立的 `startGlassExtras()` 挂载，与背景配方无关。

### 怎么验（10 秒）

把鼠标放到对话框上，控制台跑：

```js
__dshomeTilt()   // 期望：engagements 随移动增长、leaning: true、spots: 1
```

- `reducedMotion: true` → 去 Windows「辅助功能 → 视觉效果 → 动画效果」打开；
- `spots: 0` → 把那台机器上对话框卡片的类名发我（`document.querySelector('[class*="uV2eYG"],[data-composer-card]')` 的 className），我改选择器；
- `engagements` 涨但画面不动 → 说明是渲染层（transform 被合成器吃了），我换 `will-change`/图层方案。

### 验证账
`parse-smoke` **13/13**；`bg-recipes-smoke` **75/75**（新增 2 条：几何判定 + 闸门可读、高光/折射在流体层之外）；`dstt-schema-smoke` **29/29**；`bridge-smoke` **26/26**。**真机复核仍未做**（审批策略为 never，起不了 headless Chrome）。

### 退路
`@2.0.84`、`@2.0.82`。
