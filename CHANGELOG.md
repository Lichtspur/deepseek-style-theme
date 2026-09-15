# 更新日志（CHANGELOG）

版本号与 GitHub [Releases](https://github.com/Lichtspur/deepseek-style-theme/releases) 标签一一对应；每条 Release 都附**版本化 tgz** 与**稳定别名 `deepseek-style-theme.tgz`**（插件市场一键安装指向别名，永远取最新）。

安装/升级：

```bash
dsh plugin --profile web add github:Lichtspur/deepseek-style-theme
```

纯 JS、`lib/` 已入库，git 安装无需构建授权。

---

## v1.42.1 — 2026-09-15

### 变更
- **流体跟随笔刷改为默认关闭**：光标的移动会把速度写进流场，在背景上拖出一条跟随的尾迹。它既是整个模拟里最贵的一部分，也是视觉上最打扰的一项，因此默认关闭。
- 新增设置项 **DSTT → 流体跟随笔刷**（`deepseek-style-theme.fluidBrush`，默认 `false`）：开启后光标才重新搅动流场。开关会经私有通道与模式一起落盘；**改完刷新页面生效**（监听器在挂载时决定是否绑定）。
- 关闭时**根本不绑定 `mousemove`**，而不是把强度设成 0——省掉的就是那部分开销。
- `dstt.mode.get` / `dstt.mode.set` 现在同时承载 `fluidBrush`：`set` 只在显式传入布尔值时才写这一项，不传则只改模式。

### 工具
- `bridge-smoke` 24 → 26 项：覆盖 `fluidBrush` 的同写与省略行为。

## v1.42.0 — 2026-09-15

### 新增
- **流体流动背景**：全屏 WebGL2 双通道流体模拟替代粒子背景——四分之一分辨率流场（衰减 + 带速度的指针笔刷，两个 framebuffer 乒乓）由全分辨率域扭曲噪声渲染器采样，带旋流迭代与三色柔性混合；按钮悬停轻推流场、点击荡开涟漪。配色跟随 DSTT 三色令牌（峰谷红 / 谷时蓝 / 常态绿）实时重新着色，无需重挂。
- **液态玻璃**：半透明填充 + 顶部最亮、约 38% 处消失的竖向光泽渐变 + 统一的 `blur() saturate() brightness() contrast()` 背板链 + 内嵌顶部高光与发丝描边，悬停只提亮填充；旋钮统一为 `--dshome-glass-*`。
- **折射**：SVG `feDisplacementMap` 色散滤镜，仅加在少数大面积上（侧边栏 / 输入框 / 设置模态框）。
- **鼠标跟随高光**：光标在输入框 `[data-composer-card]` 与消息气泡上移动时高光随光标偏移（`--dshome-spec-x/y`）。

### 变更
- 粒子背景保留为**降级路径**：探测不到 WebGL2 时自动回落到粒子实现；着色器编译/链接失败返回空操作句柄而非抛错。
- 对话消息区与中栏**不再是**光标跟随面：横跨大片空白的光斑会读成一块白斑在背景上滑动（按反馈调整）。

### 许可
- 新增 `THIRD-PARTY-NOTICES.md`：流体着色器 / 折射滤镜 / 光标视差移植自 [dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio) v2.3.8（MIT, Copyright (c) 2026 John Wu），三段 GLSL 为逐字节副本；液态玻璃配方仿照 [deepseek-harness-background](https://github.com/HaoyueQin/deepseek-harness-background)（MIT, Copyright (c) 2026 HaoyueQin）。两份许可原文随包发布，再分发必须保留。

## v1.41.2 — 2026-09-15

### 修复
- **交付文件菜单「点了没反应」**：v1.41.0 的菜单只挂在 `[data-presented-file]`（`PresentedFileCard`）上，而用户实际点击的「本轮文件改动」来自 `ProducedFiles` → `[data-produced-files-row]`，在该行上 `closest('[data-presented-file]')` 恒为 `null`，菜单不出现、点击看似无效。
- 菜单现在**同时挂在两个表面**，各自解析其代表的文件；「本轮文件改动」条目**左键单击**弹菜单，交付文件卡片保留左键预览、改用右键弹菜单。
- 产品原有动作**保留为菜单项**，用重入标志回放其点击，避免合成点击再次进入捕获处理器形成死循环；预览项按表面分别叫「打开预览」「在侧边栏预览」。

### 工具
- `gui-probe --file-card` 覆盖两个表面。
- 新增 `gui-probe --deliverables`：报告真实页面上两处交付表面的存在情况与点击改动条目的实际行为。

## v1.41.1 — 2026-09-14

### 修复
- **Windows「用默认应用打开」必定失败**：`Start-Process` 没有 `-LiteralPath` 参数（PowerShell 5.1 报 `NamedParameterNotFound`），改用 `-FilePath`；参数名错误与文件不存在此前都是 exit 1，RPC 层分不出来，故未被测出。
- `bridge-smoke` 增加该类错误的守卫：断言不存在的文件经 RPC 报失败、静态断言命令只用存在的参数，并新增可选的 `--open` 检查（默认关闭，会在桌面弹窗）。

### 安全
- 移除 `[data-dsh-probe]` 的无差别删除（探针只清理自己创建的元素）。
- 标注文件内仅有的 5 处 `innerHTML`（只赋值模块级/调用点的 SVG 常量），并在文件头写明规则：来自页面的数据（会话标题、文件路径、工作区名）必须走 `textContent`/`title`/`setAttribute`。

### 自测
- `bridge-smoke` 22 → 24 项（含 `--open` 为 25 项）；`catalog-sync-smoke` 27 项无回归。

## v1.41.0 — 2026-09-14

### 修复
- **安装不再开箱即崩**：`@deepseek-ai/schemastery` 从 `peerDependencies` 移到 `dependencies`——profile 模板下发 `autoInstallPeers: false`，peer 永不安装，空 profile 装完 `dsh web` 会以 `Cannot find package '@deepseek-ai/schemastery'` 直接失败。
- schemastery 改为**受保护的动态 import**：解析不到时只丢一行警告、DSTT 模式不再持久化，**不再拖垮整棵插件树**（此前表现为 GUI 完全起不来）。
- README 安装章节重写：`file:` 与 `link:` 的差别、`add .` 为何落成 `link:`、Windows 上 `inject:` 为何不可用（盘符 `:` 被 pnpm 当作协议分隔符）、企业 TLS 代理下 `github:` 安装必然失败（改用 tgz）、依赖解析路径。

### 安全（私有 RPC 通道围栏，对齐 dsh 核心）
- 对端必须回环，**且** `Host` 必须是回环权威（挡 DNS rebinding）。
- 拒绝 `Sec-Fetch-Site: cross-site`；`Origin` 存在时必须与 `Host` 同源（挡跨站 `fetch`）。
- 要求 `Content-Type: application/json`（跨站只能走预检，而该路由从不回应预检）。
- 拒绝 UNC / 设备路径（`isAbsolute()` 对 `\\host\share` 为真，打开它会触发 Windows 外带 NTLM 哈希）。

### 新增
- **模型目录同步**（`deepseek-style-theme.catalogSync`：`auto`/`add`/`off`）：仅在 id 列表确实不同时改写 `llm-deepseek.models`；绝不臆造能力位；聚合网关下退化为只追加不删除；移除的 id 逐个点名；写入带 `expectedRevision`（并发的用户修改获胜）。
- **交付文件卡片菜单**（玻璃拟态）：用默认应用打开 / 打开所在文件夹 / 复制路径 / 在侧边栏预览；产品自带下拉菜单补上缺的「复制路径」；卡片左键保持产品原本的侧边栏预览不被覆盖。

### 工具
- `bridge-smoke` 9 → 22 项；`catalog-sync-smoke` 14 → 27 项；`gui-probe` 新增 `--file-card`。

## v1.40.0 — 2026-09-14

### 新增
- 激活时向 `GET {baseURL}/models` 同步官方 DeepSeek 模型目录（`baseURL`/`apiKeyEnv` 读自 `llm-deepseek` 设置段，密钥经 credentials 服务解析，与适配器一致），仅在 id 列表变化时改写 `llm-deepseek.models`。
- 失败的每一种情形（无设置、无密钥、离线、服务改名）都是**静默 no-op**。

### 工具
- `tools/catalog-sync-smoke.mjs` 覆盖六个分支（14 项检查）。

## v1.39.0 — 2026-09-11

### 变更
- 「对话 / 轨迹」视图标签改为真正的圆头胶囊（此前仍带产品的 `corner-shape: superellipse(1.5)`）；悬停品牌辉光上浮、按下下沉、切换视图时弹一下。

## v1.38.9 — 2026-09-11

### 变更
- 头部控件恢复真圆角：agent-preset 标签、中/E、open-in-app 分体按钮、侧边栏展开器、会话标题面包屑（12px 圆角变真胶囊）。
- 中/E 悬停上浮 + 品牌辉光，短标签经 `max-width` 动画展开为「中文 / EN」。
- open-in-app 分体按钮悬停上浮、按下弹动、菜单打开时箭头翻转。

## v1.38.8 — 2026-09-11

### 修复
- dsh 0.1.5-rc.1 把会话头分隔线画成真实 `border-bottom`（1.37 为 `::after`），主题胶囊下方残留 1px 细线 → 归零 border，并保留旧版 `::after` 兼容。
- 右侧边栏展开器（headerCorner slot 新增）被 `display:contents` 压到 flex `order:0` 挤到最左 → `order:4` 归位到语言切换右侧。

## v1.38.7 — 2026-09-10

### 变更
- 私有 RPC 通道改挂在 webServer 路由 + fetch 客户端；新增 bridge 冒烟测试。

## v1.38.6 — 2026-09-10

### 修复
- 通过 `ctx.connection` 读取连接，使私有通道绑定本插件自己的 `ctx`（修 webServer inject 守卫）。

## v1.38.5 — 2026-09-10

### 修复
- 打开/显示工作区失败时给出真实原因（dsh 0.1.5 移除了 `openPath`）。

## v1.38.4 — 2026-09-10

### 变更
- 为私有 RPC 通道注入 webServer。
- 接受并迁移旧版 DSTT 模式取值。

## v1.38.3 — 2026-09-10

### 兼容
- 适配 dsh 0.1.5-rc.1：移除已被删除的 `dsh-client-runtime` inject；host 端注册改为 best-effort。

## v1.38.2 — 2026-09-06

### 修复
- `@deepseek-ai/dsh-settings` 的 `settingsNamespace` 在 dsh 0.1.2-alpha.1 被删除 → host 端改用字符串字面量（与 client 端 `DSTT_NS` 保持一致），修复新版 dsh 上**安装即报错**的问题。

## v1.38.1 — 2026-08-29

### 新增
- 周末（北京时间周六/周日）全天视为谷时段；仅工作日按 9:00–12:00、14:00–18:00 判峰。

## v1.38.0 — 2026-08-27

### 新增
- **DSTT 四模式**：峰谷红蓝（默认，高峰鲜红 `#F5222D`、谷时段蓝）/ 峰谷红绿（高峰鲜红、谷时段绿）/ 常态绿 / 常态蓝。
- 高峰判定升级为 `data-dshome-color` 颜色属性模型（green / red / blue），切换无残留色。

### 变更
- **Apple 液态玻璃**质感升级：侧边栏、旋转描边卡片、聊天气泡、设置弹层（分层半透明渐变 + 饱和模糊 + 高光边缘）。

## v1.37.3 — 2026-08-26（首个公开发布）

- 流体粒子背景（明暗两套配色）、玻璃拟态侧边栏 / 会话卡片 / 输入框 + 毛玻璃标题栏、明暗双主题（`data-dshome-dark`）。
- **运行中子代理面板**：名称、已运行时长、token 用量、流动进度条，点击跳转会话，可折叠。
- **DSTT 时段提示**：分时段（高峰 9:00–12:00、14:00–18:00，北京时间）/ 常态蓝 / 常态绿。
- 打开工作区目录（跨平台调用系统文件管理器）、DeepSeek 品牌链接、「对话 / 轨迹」标签常驻。
- **锚点守卫 CSS**：产品构建期 hash 类名变化时跳过失效补丁块并打一行诊断日志，不静默注入坏样式。
- 仓库公开、发布首个 tgz 归档。

## 更早版本（仓库公开前的本地迭代）

- **v1.37.0**：DSTT 首次引入（高峰/非高峰时段配色）；高峰判定固定按北京时间（UTC+8）并向上取整到整分钟。
- **v1.33.1–v1.37.2**：健壮性分层防护——锚点守卫 CSS、自有暗色标记 `data-dshome-dark`、能走 Slot 的 UI 一律走公开 Slot API（仅无 Slot 的表面用 DOM 补丁）；跨平台打开目录；运行中子代理面板成形。
- **v1.30–v1.33.0**：主题雏形（粒子背景、玻璃拟态、明暗双主题）与插件 bundle 形态（`dsh.bundle` + `cordis.patch.yml`）。

---

## 发布流程（维护者自查）

1. 改 `package.json` 的 `version` → 提交推送；
2. `pnpm pack` 出 `dsh-external-dsh-deepseek-style-theme-<版本>.tgz`；
3. 发 GitHub Release，**同时附两个附件**：版本化文件名 + **稳定别名** `deepseek-style-theme.tgz`；
4. 市场/列表条目里的 `tarball:` 只写别名地址（`…/releases/latest/download/deepseek-style-theme.tgz`），此后升版本无需改动条目。

> ⚠️ 别把版本号写进 `/releases/latest/download/` 的文件名——`latest` 指向最新 Release，文件名钉死旧版本号，一发新版就 404。
