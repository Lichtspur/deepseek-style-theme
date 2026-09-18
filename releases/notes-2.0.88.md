## v2.0.88 — 底边栏：把统计行接进对话框，合成一块玻璃板

你说「dsh-theme-mineradio 的底边栏也可以抄一下」——抄了，而且是它那套 **fused 状态**的完整结构：

| 谁 | 做什么 |
|---|---|
| 外层 `[data-dsh-inputbar]:has([data-dsh-stats])` | 唯一的边框 / 24px 圆角 / 玻璃填充 / 阴影，`z-index:8` |
| 外层 `::before` | 那就是背板模糊（`blur(28px) saturate(1.42) brightness(1.02)`，`z-index:-1`，`pointer-events:none`） |
| 里层 `[data-composer-card]` | 边框、圆角、填充、背景图、阴影、`backdrop-filter` **全部关掉**，伪元素隐藏 |
| 里层 `[data-dsh-stats]` | 变成整幅宽的下沿：`display:block; width:100%; margin:auto 0 0; min-height:24px; padding:2px 16px`，只留 `border-top` 一条发丝线 |

两条从它源码里抄来的经验照做了：**用 `z-index` 而不是 `isolation`**（`isolation` 会成为 backdrop root，把弹层的磨砂关进这条栏里），以及**里层 `backdrop-filter: none`**（否则里层模糊会和板的模糊叠两层）。深浅配色各一套。

**为什么能安全地抄**：触发条件是 `:has([data-dsh-stats])`——产品不渲染统计行时，整块规则不生效，卡片保留自己原来的玻璃。

顺带把 2.0.87 的透镜放大收进这条栏：文字改成**从左边缘**缩放（`transform-origin:left center`），常态 1.04、倾斜时 1.08。整条栏放大 12% 会明显穿出圆角，所以数值也收小了；想更明显说一声。

> 这是**技法重述**不是代码搬运：声明全部按本插件自己的 `--dshome-*` 令牌重写，没有复制 mineradio 的 `--dsh-aqua-*`；已按 MIT 记入 `THIRD-PARTY-NOTICES.md`。

### 装完验一行
```js
window.__dshomeBuild     // 期望 '2.0.88 fused-bar'
```
肉眼看：统计行（31 轮 587 步 · 243 tok/s…）应该在**卡片内部**、与卡片同宽、上沿一条细线，面板与它共用一层模糊。

### 验证账
`parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **82/82**、`dstt-schema-smoke` **29/29**、`bridge-smoke` **26/26**。**真机复核未做**（审批策略 never）。

### 退路
`@2.0.87`、`@2.0.86`。
