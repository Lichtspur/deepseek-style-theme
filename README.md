# DeepSeek Style Theme

为 DeepSeek Harness Web GUI 复刻 DeepSeek 官网视觉的主题皮肤插件。

## 特性

- **流体粒子背景**：全屏 `<canvas>` 连线粒子，明暗两套配色
- **玻璃拟态**：侧边栏、会话卡片、输入框半透明填充 + 毛玻璃
- **明暗双主题**：深色通过 `body[data-ds-dark-theme]` 切换
- **品牌细节**：胶囊按钮、渐变主按钮、圆角卡片
- **标题栏**：默认透明，悬停变毛玻璃
- **DeepSeek 品牌链接**：点击侧边栏 DeepSeek 标识跳转 `https://www.deepseek.com/`
- **轨迹视图**：「对话 / 轨迹」标签常驻，可随时切回对话
- **运行中子代理面板**：有子代理启动时，右下角浮出玻璃面板，实时列出正在运行的子代理——名称、已运行时长、token 用量与流动进度条；点击条目直接跳转到该子代理会话，可折叠收起
- **跨平台**：打开工作区目录时按系统调用文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）
- **时段提示（DSTT）**：主题模式四选一——**峰谷红蓝**（高峰鲜红、谷时段蓝）/ **峰谷红绿**（高峰鲜红、谷时段绿）/ **常态绿** / **常态蓝**；高峰窗口北京时间 9:00–12:00、14:00–18:00（周六周日全天非高峰），高峰色为鲜红 `#F5222D`

## DSTT（DeepSeekStyleTheme）设置

设置页新增 **DSTT** 选项卡，提供一行四选「主题模式」（`deepseek-style-theme` 段的 `mode` 字段，持久化到 `settings.yaml`）：
- **峰谷红蓝**（默认）：高峰 = 鲜红（提示），谷时段 = 蓝色；
- **峰谷红绿**：高峰 = 鲜红（提示），谷时段 = 绿色；
- **常态绿**：始终绿色，无高峰区分；
- **常态蓝**：始终蓝色，无高峰区分。

### 高峰判定（1.37.0+）

- 固定按**北京时间（UTC+8）**判断，与机器本地时区无关；**向上取整到整分钟**（13:59:xx 视为 14:00）。
- 高峰窗口：9:00–12:00、14:00–18:00（**周六、周日全天非高峰**）。峰谷模式下高峰自动变鲜红（事件链计时：启动/切换时监测一次，记录距高峰结束的差值并计时还原谷色；非高峰则计时到下一高峰开始变红），退出高峰自动还原。
- 切换**彻底**：背景光效、按钮、输入框边框、卡片旋转描边、粒子、产品品牌 token（`--dsw-alias-brand-primary` 等）全部跟随品牌变量，无残留色。
- DSTT 面板状态行实时显示「距高峰结束还剩 X 小时 X 分」。

## 健壮性设计（1.33.1+）

产品壳的构建期 hash 类名（如 `wSkVaW_header`）不是 API，产品升级重构建后可能变化。本主题对此做了分层防护：

- **锚点守卫 CSS**：所有针对产品 hash 类名的样式拆成独立补丁块，只有对应锚点类存在于 DOM 时才注入（延迟 30s 等待晚渲染壳），锚点永久缺失时跳过该块并打一行诊断日志，而不是静默注入失效 CSS；
- **自有暗色标记**：明暗模式由主题服务的 `active.colorScheme` 驱动到自有属性 `data-dshome-dark`，不依赖产品属性名；
- **能走 Slot 的 UI 走 Slot**：语言切换注册在 `conversation.session.header.utilities`（产品公开 Slot API）；仅无 Slot 的表面（工作区行菜单）使用 DOM 补丁。

## 安装

前置要求：`node` 与 `pnpm`（`dsh plugin` 命令是 pnpm 的转发器，二者需在 PATH 中）。安装后重启 web 应用（`dsh web`）即可生效。

> **安装属性（第三方）**：本插件是第三方适配的皮肤插件，**不是 DeepSeek 官方插件**。所有安装方式（本地源码 / GitHub / 本地 tgz）默认都作为**第三方包**装入 web profile 的 `node_modules`（真实目录，`file:` 依赖）并登记进 `dsh.profile.bundles`——**绝不写入或链接官方 dsh 安装目录**（如全局 CLI 的 `node_modules`，官方升级会清空其中的第三方包）。若因旧版链式安装导致插件消失/失效，重跑一次 `dsh plugin --profile web add <源>` 即会以独立目录重建。

### 从本地源码（开发模式）

在插件源码根目录执行：

```bash
dsh plugin --profile web add .
```

### 从 GitHub（本仓库）

```bash
dsh plugin --profile web add github:Lichtspur/deepseek-style-theme
```

> 本插件是纯 JS 且 `lib/` 已提交到仓库，Git 安装**无需构建**——不会触发 pnpm 的 `prepare`/`allowBuilds` 授权流程，一次 `add` 即可生效。GitHub 安装的包同样默认落在 profile 第三方插件区（独立目录），不会进入官方 dsh 安装目录。每个版本对应的 `tgz` 归档附在 [GitHub Releases](https://github.com/Lichtspur/deepseek-style-theme/releases) 页面。

### 从本地 tgz（发布前 / 离线环境）

```bash
dsh plugin --profile web add ./releases/dsh-external-dsh-deepseek-style-theme-1.38.1.tgz
```

### 从 npm / 其他 Git 仓库

```bash
# 发布到 registry 后
dsh plugin --profile web add @dsh-external/dsh-deepseek-style-theme
# 或任意 git 仓库地址（若该仓库未提交构建产物，
# 则需其提供 prepare 脚本并按 pnpm 提示在
# ~/.dsh/profiles/<name>/pnpm-workspace.yaml 的 allowBuilds 中授权后重跑）
dsh plugin --profile web add <git-url>
```

## 必要权限

- **安装期**：需要修改 web profile（`~/.dsh/profiles/web/` 的 `package.json`、`dsh.profile.bundles` 装配列表与 `node_modules`）；Git 安装还需按上文授权 pnpm 执行构建脚本。
- **运行时（DSH 审批/沙箱）**：**不需要任何额外权限**——不注册工具、不执行模型调用、不请求审批或沙箱提升。它只是纯前端皮肤 + 一个受限 RPC 通道。
- **系统级副作用（唯一）**：「打开工作区目录」会调用系统文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）并在前台打开该目录。该 RPC 通道仅接受本机回环来源的请求，且只接受绝对路径。
- **数据可见性**：客户端读取会话列表元数据（标题、运行状态、token 用量）仅用于页内展示「运行中子代理」面板，不上传任何外部服务器；唯一的网络跳转是点击品牌标识时打开 `deepseek.com`（显式用户操作）。
- **配置落盘**：DSTT 主题模式选择写入 profile 的 `settings.yaml`（`deepseek-style-theme` 段）。

## 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-deepseek-style-theme
```

- 该命令移除依赖并自动从 `dsh.profile.bundles` 装配列表剔除，重启 `dsh web` 后主题完全消失。
- **卸载即净**：插件停用时，其注入的 CSS、粒子画布、运行中子代理面板、DOM 补丁与 RPC 通道全部自动移除，刷新页面即可，无需清理浏览器缓存。
- **残留清理（可选）**：若 profile 的 `cordis.patch.yml` 中有 `- id: ui-skin-deepseek-style` 残留行可手动删除；`settings.yaml` 中的 `deepseek-style-theme` 配置段亦可在设置页或直接编辑文件删除。

## 目录结构

```
.
├── package.json          # dsh bundle 元数据
├── cordis.patch.yml      # insert 插件行
├── releases/             # 发布产物（tgz 归档）
└── lib/
    ├── index.js          # host 端：打开工作区目录的 RPC 通道
    └── client.js         # 主题 client 端
```

## 许可

MIT

> 本插件为第三方主题皮肤，复刻 DeepSeek 官网视觉风格，与 DeepSeek（深度求索）官方无隶属关系、无背书或关联；DeepSeek 为深度求索公司的商标。
