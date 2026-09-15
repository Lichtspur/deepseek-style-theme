# 液态玻璃：实现记录与实测备忘

> 2026-09-15 与用户逐条确认规格，同日实现并发布为 **v1.43.0**。
> 本文件是**实现记录**，不是待办；完整变更与性能数据见 `CHANGELOG.md` 的 v1.43.0 条目，用户向说明见 `README.md` 的 DSTT 设置一节。
> 本文件**不随包发布**（不在 `package.json` 的 `files` 白名单内）。

## 最终落地的需求（逐条确认过）

| # | 需求 | 落地 |
|---|---|---|
| 1 | 新增 `glassStyle`：`liquid`（默认）/ `frosted` | `lib/index.js` schema + `dstt.mode.get/set`；客户端写成 `html[data-dshome-glass]` |
| 2 | `liquid` = Apple Liquid Glass：透镜折射 + 会流动的边缘高光 + 高通透 | `LIQUID_CSS`，`feDisplacementMap` scale 104，`@property` 驱动的 conic 走边高光 |
| 3 | `frosted` = 保留现在这套，一行都不改 | 新配方整块挂在属性下；全页 1991 元素计算样式签名比对，差异 0 |
| 4 | 上玻璃的区域：侧边栏（只外层）/ 对话框 / 标题栏 / 用户消息 | 侧边栏 `.hHd-Xa_root::before`、`[data-composer-card]`、`.wSkVaW_header:hover::before`、用户气泡 |
| 5 | 侧边栏里的会话行无边框、无玻璃 | 未触碰 `.YDXeBa_sessionRow` / `.YDXeBa_projectRow` |
| 6 | 背景板不做玻璃 | 未加任何规则 |
| 7 | 流体不响应任何鼠标行为 | `attachFluidInteractions` 保留但零调用点；`fluidBrush` 默认关 |
| 8 | 对话框交互：高光跟鼠标 + 边缘高光自动流动 | 前者由 `--dshome-spec-x/y` 驱动，后者是 `dshome-liquid-sweep` 动画 |

后续追加：侧边栏右侧 22px 圆角 + 24px 独立模糊 + 白/黑蒙版；标题栏改为**圆角且仅悬停显现**（原计划是常驻，用户看图后否决）；对话框悬停倾斜（移植 mineradio）。

## 实测备忘：这些锚点是真的（2026-09-15 量过，dsh web @ 127.0.0.1:3080）

写这段是因为产品重构建会换 hash 类名，而**失效的选择器不会报错，只会静默不生效**——本轮就靠实测抓出两个死选择器。

| 锚点 | 状态 | 备注 |
|---|---|---|
| `[data-chat-flow-kind]` | **稳定，首选** | 取值实测：`user` / `steering` / `assistant-step` / `turn-process` / `tool-call` / `turn-tail` / `manual-compaction` / `context`。用户消息是 `user` **和** `steering` 两种，一份会话里可能只有 `steering` |
| `.gdEzaW_bubble` | **已死（匹配 0 个）** | 1.42.x 的玻璃配方一直挂在它上面，白挂了一版；跟随高光名单里那条也是死的 |
| `.fV0t5q_root` | **已死（匹配 0 个）** | 标题栏那两条 `:has(.fV0t5q_root)` 兜底同样是死代码 |
| `.Sixlwa_bubble` | 活的，但**不要按 hash 写选择器** | 本轮改为 `[class*="bubble" i]` + `data-chat-flow-kind` 组合 |
| `[data-composer-card]` | 活的（1 个） | 与 `.uV2eYG_card` 是**同一个元素**——旧配方因此在它身上叠了两层玻璃 |
| `.hHd-Xa_root` | 活的（侧边栏外壳） | `::before` 被配方占用，`::after` 空闲（走边高光放这） |
| `.wSkVaW_header` | 活的 | `::before` 被占用；`::after` 被**本主题自己的补丁块** `display:none!important` 关掉了 |
| `[data-composer-card]::before` | 被占用 | 品牌色 conic 变光边框（本主题补丁块写的），即用户说的「蓝变光边框」 |
| `[data-composer-card]::after` | 被占用 | 补丁块的 `blur(28px)`，是「对话框糊成一片」的元凶 |
| `.wSkVaW_widthHandle` | 活的 | 40px 宽、贯穿全高、`z-index:8`；标题栏原先在 `5`，所以标题栏里的控件点不到 |
| `<hash>_fade` | 活的（侧边栏内 1 个） | 工作区列表底部淡出，终点色是**不透明**的 `--dsw-specific-sidebar-fill`，在半透明玻璃板上会显形成亮带 |

## 性能（规格里的红线）

压测方法：复制 30 个真实气泡进会话，同一页面背靠背滚动，只换配方。

| 变体 | fps | 中位帧 | p95 |
|---|---|---|---|
| SVG `feDisplacementMap` 折射 | 62.1 | 13.9ms | 20.9ms |
| 普通 `blur()/saturate()`（无 SVG 滤镜） | 63.0 | 13.9ms | 20.9ms |
| 只留填充，不要 `backdrop-filter` | 80.2 | 13.9ms | 14.0ms |
| 白磨砂（气泡没玻璃） | 124.8 | 7.0ms | 13.9ms |

**结论：SVG 折射滤镜几乎免费，钱花在 `backdrop-filter` 这个能力上。** 所以「把气泡折射降级成普通模糊」是无效优化。决定保留现状——同屏 9～10 个玻璃气泡仍 ~60fps，而真实会话同屏用户气泡通常只有 2～5 个。

## 发布

已按标准四步发布 v1.43.0（提交推送 → `pnpm pack` → Release 附版本化 tgz + 稳定别名 `deepseek-style-theme.tgz` → 市场条目指向别名地址）。

> ⚠️ 红线：`/releases/latest/download/` 的文件名**绝不能带版本号**（2026-09 实测 404 事故）。本轮已从别名地址实际下载回来比对哈希确认。

**遗留**：`glassStyle` 与 `fluidBrush` 两个开关由 host 半边写盘，而 host 半边是 `dsh web` 进程启动时加载的，**必须重启才生效**（观感部分刷新页面即可）。
