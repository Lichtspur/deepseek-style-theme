# Liquid glass 实现规格（2026-09-15 与用户逐条确认）

> 本文件是待实现功能的规格说明，**不随包发布**（不在 `package.json` 的 `files` 白名单内）。
> 实现完成后可删除，或把结论并进 README / CHANGELOG。

## 需求（逐条确认过，不要自行改动）

| # | 需求 | 来源 |
|---|---|---|
| 1 | 新增玻璃风格设置 `glassStyle`：`liquid`（**默认**）/ `frosted` | 「设置加一个选项，可以通过这个选项更改液态玻璃的方向（液态/白毛）」 |
| 2 | `liquid` = **Apple Liquid Glass**：边缘透镜折射 + 会流动的边缘高光 + 高通透 | 「Apple Liquid Glass（iOS 26）：透镜折射 + 会流动的边缘高光」 |
| 3 | `frosted` = **保留现在这套**白磨砂 + 蓝变光边框，一行都不改 | 「现在这套白磨砂 + 蓝变光边框也挺好看的」 |
| 4 | 上玻璃的区域：**侧边栏（只外层）**、**对话框（底部输入区）**、**标题栏**、**只有对话里用户发的消息** | 分区标注 + 「对话里用户发的消息也要液态玻璃」 |
| 5 | 侧边栏里的**会话行**：无边框、无玻璃 | 「最外面是液态玻璃，里面的小边框不用」 |
| 6 | **背景板**：不做玻璃（沿用流体背景） | 「背景无需液态玻璃」 |
| 7 | 流体**不响应任何鼠标行为**（按钮推动已在 448ff84 撤除，跟随笔刷默认关闭） | 「不要让按钮推动背景流体了」 |
| 8 | 对话框交互：**高光跟鼠标** + **边缘高光自动流动** | 「全都要」后再减去按钮推动 |

参考物：玻璃质感照 `deepseek-harness-background`；交互照 `dsh-theme-mineradio`。

## 已就位的地基（不要重写）

- `GLASS_CSS`：现有「湿玻璃」配方，用 `html .surface` 前缀提高特异性压过补丁块的 `background` 简写 + `!important`。**这套要原样保留给 `frosted`。**
- `startGlassDispersion({ hue })`：mineradio 移植的 SVG `feDisplacementMap` 色散滤镜，挂载成功时给 `<html>` 打 `data-dshome-dispersion`。现有 CSS 已用它做边缘折射（`.hHd-Xa_root::before` / `.gdEzaW_bubble` / `.VOzbGW_panel`）。
- `startSpecularParallax()` + `startSpecularSpotter()`：把 `--dshome-spec-x/y`（中心相对 -1..1）写到悬停的 `data-dshome-spot` 元素上。
- `--dshome-glass-spec`：**曾经恒为 0 导致整层高光被乘成零**，已修为悬停时置 1。不要再把它写死。
- 流体背景：`startAmbient()` → `attachFluidShader`，配色跟 DSTT 三色令牌。`attachFluidInteractions` 保留但**刻意不接线**。

## 实现要点

### A. 设置项
- host（`lib/index.js`）schema：`glassStyle: z.union([z.const("liquid"), z.const("frosted")]).default("liquid")`，照 `fluidBrush` 的既有形状。
- `dstt.mode.get` 返回它；`dstt.mode.set` 只在显式传入时写它（**不要**像 `mode` 那样强制必填）。
- 客户端 `dsttState.glassStyle` 镜像 + DSTT 面板加一行切换（照 `fluidBrush` 那一行）。
- 客户端把它写成 `<html data-dshome-glass="liquid|frosted">`，CSS 用该属性门控两层配方。

### B. 液态配方（新，`html[data-dshome-glass="liquid"]`）
- 更低不透明度的填充（比白磨砂通透）
- 极薄的 sheen（白磨砂是 `.14`，液态要明显更薄）
- **加大 `feDisplacementMap` 的 scale**，让边缘折射真的看得见（现在 scale 偏保守）
- 沿边框走一圈的**动画高光**：`conic-gradient` 或 `linear-gradient` + `@property` / `background-position` 动画，**不依赖鼠标**

### C. 区域选择器
- 侧边栏外壳 `.hHd-Xa_root::before` —— **不要**加 `.YDXeBa_sessionRow` / `.YDXeBa_projectRow`
- 对话框 `[data-composer-card]`（实测存在 1 个；`.fV0t5q_root` 实测 0 个，别用）
- 标题栏 `.wSkVaW_header::before`（注意：现在它在悬停时才出玻璃，需要改成常驻）
- 用户消息气泡 —— **待查**：用户气泡与助手气泡可能共用 `.gdEzaW_bubble`，去 DOM 里确认 role/对齐标记，只给用户那一侧上

### D. 性能红线
折射是每个元素一次滤镜采样，所以**只上这 4 个区域**，不要铺开。改完必须实测滚动帧率。

## 验收（用户明确要求）

**用多模态看图确认**，不能只靠 DOM 断言：
1. 无头 Chrome 截图 → 自己看图
2. 浅色 / 深色主题各一张
3. `liquid` / `frosted` 各一张
4. 切到 `frosted` 时，观感必须和现在**完全一致**（那是用户明确说好看的样子）

## 发布（按标准四步）

1. 升 `package.json` → 提交推送
2. `pnpm pack` → `dsh-external-dsh-deepseek-style-theme-<版本>.tgz`
3. Release 附**两个**附件：版本化文件名 + **稳定别名 `deepseek-style-theme.tgz`**
4. 条目 `tarball:` 固定写别名地址

> ⚠️ 红线：`/releases/latest/download/` 的文件名绝不能带版本号（2026-09 实测 404 事故）。

## 当前 HEAD

`448ff84`（本地，未推）——流体不再响应任何指针输入。下一个版本号：`v1.43.0`。
