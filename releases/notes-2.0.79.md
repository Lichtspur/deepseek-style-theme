## v2.0.79 — 抖动后半段：我们自己的倾斜，两处收手

2.0.78 那一刀**在真机上确认有效**（新采样：`scrollWidth/clientWidth = 891/891`、`clientHeight` 恒定 842、卡片 top 不再被推 8px）。你随即说"闪得更快了"——逐帧采样把剩下的那半抓出来了，**这次是我们自己的**：

```
card=700/757 … under=div.uV2eYG_row          hovCard=1
card=700/765 … under=button.uV2eYG_primary   hovCard=1   ← scale(1.01) 把卡片从 757 推到 765
card=699/761 … under=div.wSkVaW_widthHandle  hovCard=0   ← 边缘越过指针 → 底下换成拖拽把手
card=700/757 … under=div.wSkVaW_widthHandle  hovCard=0   ← 倾斜解除、卡片缩回 → 循环
```

- 指针**静止**，卡片宽度却在 **757 ↔ 765** 反复涨落（正是 1% 放大 = 8px）；
- 翻转点上，指针底下在**对话框自己的控件**与**列的宽度拖拽把手**（`wSkVaW_widthHandle`）之间互换；
- 每次互换都会解除或重新武装倾斜，而过渡只有 0.1–0.24s —— 这就是"更快"的原因（旧那条要等滚动条与布局走一圈）。

### 改了哪两处（都在悬停倾斜里）

1. **不再抬升**：`TILT_SCALE = 1.01 → 1`。倾斜（旋转）保留——它只让画面动 ~1px；1% 放大是唯一会推动卡片边缘 8px 的部分。
2. **指针在交互控件 / 拖拽把手上时不倾斜**：新增
   `TILT_INTERACTIVE = 'button,[role="button"],a[href],input,textarea,select,[contenteditable],[class*="andle" i]'`，
   并且 **`pointerover` 与 `pointermove` 两个入口都判定**（后者必须：指针可以不动，而表面滑到控件下面）。`andle` 用子串 + 大小写不敏感匹配，覆盖 `wSkVaW_widthHandle` 这类名字，不钉死散列类。

**效果**：倾斜只在对话框的空白处触发；指针压在按钮上时，卡片一格都不动。**代价**：悬停按钮时不再有那一点点"抬起来"的立体感——正是它造成了 8Hz 抖动。

### 复验

装好后在原处移动鼠标：抖动应当消失。控制台确认 `window.__dshomeBuild` → `2.0.79 tilt-stands-down`。

若还有翻转，请再跑一次那段逐帧采样，把 `under=` 跳动的**两个元素名**发我——多半是产品自己的 `uV2eYG_trailing / JObwrW_*` 悬停态在互换位置（那属于产品侧），我按同样方法再收一轮。

### 验证账
`node --check` 两个文件；`bg-recipes-smoke` **58/58**（新增本版断言）；`dstt-schema-smoke` **29/29**；`bridge-smoke` **26/26**。

### 退路
`@2.0.78`（只断滚动条链）、`@2.0.77`（壁纸引擎提示）、`@2.0.76`（商城适配契约）。
