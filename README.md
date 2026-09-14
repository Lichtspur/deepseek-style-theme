# DeepSeek Style Theme

为 DeepSeek Harness Web GUI 复刻 DeepSeek 官网视觉的主题皮肤插件。

## 特性

- **流体粒子背景**：全屏 `<canvas>` 连线粒子，明暗两套配色
- **玻璃拟态**：侧边栏、会话卡片、输入框半透明填充 + 毛玻璃
- **明暗双主题**：深色通过 `body[data-ds-dark-theme]` 切换
- **品牌细节**：胶囊按钮、渐变主按钮、圆角卡片
- **标题栏**：默认透明，悬停变毛玻璃；栏内按钮统一为真圆角（覆盖产品全局 corner-shape:superellipse 造成的方角观感），会话标题小胶囊化
- **悬停动画**：中/E、「打开方式」、「对话 / 轨迹」标签悬停时上浮 + 品牌色辉光；中/E 短标签「中/E」平滑展开为「中文/EN」（max-width 过渡，非 display 硬切）；「打开方式」展开菜单时箭头翻转，切换标签时选中项弹出
- **DeepSeek 品牌链接**：点击侧边栏 DeepSeek 标识跳转 `https://www.deepseek.com/`
- **轨迹视图**：「对话 / 轨迹」标签常驻，可随时切回对话
- **运行中子代理面板**：有子代理启动时，右下角浮出玻璃面板，实时列出正在运行的子代理——名称、已运行时长、token 用量与流动进度条；点击条目直接跳转到该子代理会话，可折叠收起
- **跨平台**：打开工作区目录时按系统调用文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）
- **模型目录同步（1.40.0+）**：每次插件启动向 DeepSeek 端点询问一次模型列表，与 `llm-deepseek` 目录比对，**仅在漂移时改写**——「选择器里有哪些模型」由接口说了算（详见下文）
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
dsh plugin --profile web add ./releases/dsh-external-dsh-deepseek-style-theme-1.40.0.tgz
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

## 模型目录同步

DSH 的官方 DeepSeek 路由是**声明式**的：`listModels()` 只返回配置里的条目，**从不探测网关**（官方 README：「默认目录预注册…不探测网关可用性」）。所以接口上新出了模型、或下线了某个 id，选择器都不会自己变。本插件在**每次插件启动**（`dsh web` 启动 / 插件重载）时补这一次探测：

1. 读 `llm-deepseek` 设置段的 `baseURL` / `apiKeyEnv`（自定义网关同样正确）；
2. 按官方适配器的方式经 `credentials` 解析该密钥（缺失则该步跳过）；
3. `GET {baseURL}/models`（5 秒超时），取接口声明的 id 列表（保持接口顺序）；
4. 与当前目录比对：**id 列表一致就什么都不做**；有漂移才 `settings.mutate('llm-deepseek', …)` 改写 `models`。

语义与边界：

- **接口是权威**：接口不再列出的 id 会被移除，新 id 会被采纳（采用 replace 语义）。
- **能力位按 id 合并**：`/models` 只给 id，给不了 `inputModalities`、`systemPromptUpdate`、上下文窗口等元数据；已存在的条目**原样保留**（用户的改动不会被覆盖），首次见到的 id 用内置映射表补齐（`deepseek-flash` → 图像输入 + `in-history`），映射表外的 id 按纯文本采纳、显示名取 id 本身。
- **完全 best-effort**：没有 settings / 没有凭据 / 网关不可达 / 服务改名等任何异常都只是**静默跳过**，绝不影响主题本身，也绝不会写坏模型目录。
- **只在漂移时写入**：目录一致时不产生任何设置写入事件。
- 关闭方式：停用本插件即可（同步随之停用）；已写入的 `llm-deepseek.models` 段可自行删掉，DSH 会回落到内置默认目录。

## 必要权限

- **安装期**：需要修改 web profile（`~/.dsh/profiles/web/` 的 `package.json`、`dsh.profile.bundles` 装配列表与 `node_modules`）；Git 安装还需按上文授权 pnpm 执行构建脚本。
- **运行时（DSH 审批/沙箱）**：**不需要任何额外权限**——不注册工具、不执行模型调用、不请求审批或沙箱提升。它只是纯前端皮肤 + 一个受限 RPC 通道。
- **运行时的唯一出网动作**：插件启动时的**模型目录同步**（1.40.0+）会读一次 `llm-deepseek` 设置段与其中的密钥引用，并向该段的 `baseURL` 发一次 `GET /models`（5 秒超时；不填则为 `https://api.deepseek.com`）。仅在 id 列表与目录不一致时才写回 `llm-deepseek.models`；离线、无密钥或服务缺失时静默跳过。不想要这个行为的话，删掉 `lib/index.js` 里的 `startCatalogSync(settingsCtx)` 调用即可。
- **系统级副作用（唯一）**：「打开工作区目录」会调用系统文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）并在前台打开该目录。该 RPC 通道仅接受本机回环来源的请求，且只接受绝对路径。
- **数据可见性**：客户端读取会话列表元数据（标题、运行状态、token 用量）仅用于页内展示「运行中子代理」面板，不上传任何外部服务器；唯一的网络跳转是点击品牌标识时打开 `deepseek.com`（显式用户操作）。宿主端的唯一请求是上一条所述的 `GET {baseURL}/models`，只发往你配置的 DeepSeek 端点，不携带会话内容。
- **配置落盘**：DSTT 主题模式选择写入 profile 的 `settings.yaml`（`deepseek-style-theme` 段）；模型目录同步在检测到漂移时写入同一文件的 `llm-deepseek` 段。

## 卸载

```bash
dsh plugin --profile web remove @dsh-external/dsh-deepseek-style-theme
```

- 该命令移除依赖并自动从 `dsh.profile.bundles` 装配列表剔除，重启 `dsh web` 后主题完全消失。
- **卸载即净**：插件停用时，其注入的 CSS、粒子画布、运行中子代理面板、DOM 补丁与 RPC 通道全部自动移除，刷新页面即可，无需清理浏览器缓存。
- **残留清理（可选）**：若 profile 的 `cordis.patch.yml` 中有 `- id: ui-skin-deepseek-style` 残留行可手动删除；`settings.yaml` 中的 `deepseek-style-theme` 配置段亦可在设置页或直接编辑文件删除。

## 自测工具（开发用，不随包发布）

`tools/` 里的四个脚本都在本机直接跑，**不进发布产物**（`package.json` 的 `files` 只含 `lib/`、`cordis.patch.yml`、`README.md`、`LICENSE`）。前三个不需要浏览器、不需要网络；第四个需要自己起一个无头 Chrome。

| 工具 | 作用 | 运行 |
|---|---|---|
| `bridge-smoke.mjs` | 宿主端私有 RPC 通道（打开工作区）的协议、围栏与错误路径 | `node tools/bridge-smoke.mjs [已安装的 lib/index.js]` |
| `catalog-sync-smoke.mjs` | 模型目录同步的六种分支：无漂移 / 新增 / 删除 / 无密钥 / 端点故障 / 命名空间未就绪（14 项检查，全用替身，无需凭据与网络） | `node tools/catalog-sync-smoke.mjs [已安装的 lib/index.js]` |
| `catalog-sync-live.mjs` | 用**真实端点 + 真实密钥**跑一遍同步：A 场景（目录已一致）应 0 写入，B 场景（人为制造漂移）应恰好 1 次写入并复原条目；写入被拦下，不落盘 | `DEEPSEEK_API_KEY=... node tools/catalog-sync-live.mjs [--profile web] [--drift-id deepseek-v4-pro]` |
| `gui-probe.mjs` | 无头浏览器直连 CDP 量实时页面：主题注入了哪些样式与补丁块、标题栏几何与子元素 flex order、标题栏下方带边框元素与**逐行亮度扫描**（1px 横线会表现为数值尖峰）、各胶囊的 `corner-shape`、中/E 悬停前后、对话/轨迹标签、`--models` 时的模型选择器选项 | 见下 |

```bash
# gui-probe：先起一个监听 CDP 的 Chrome，再把 dsh 签名用的会话密钥放进环境变量
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\probe about:blank
set DSH_PROBE_SECRET=<$DSH_HOME/.credentials.yaml 里 client-connection/browser-session 的 secret>
node tools/gui-probe.mjs --models
# 可选：--url http://127.0.0.1:3080  --cdp http://127.0.0.1:9222
```

两个涉及密钥的工具都**只从环境变量读**，不碰凭据库，也不会把密钥打印出来；未设置时直接以 exit 2 退出并说明怎么取。

## 目录结构

```
.
├── package.json                    # dsh bundle 元数据
├── cordis.patch.yml                # insert 插件行
├── releases/                       # 发布产物（tgz 归档）
├── tools/                          # 自测工具（不随包发布）
│   ├── bridge-smoke.mjs            # 宿主端私有 RPC 通道冒烟测试
│   ├── catalog-sync-smoke.mjs      # 模型目录同步冒烟测试（六种分支）
│   ├── catalog-sync-live.mjs       # 同步的真端点/真密钥校验（写入不落盘）
│   └── gui-probe.mjs               # 实时页面的无头浏览器探测与像素扫描
└── lib/
    ├── index.js                    # host 端：打开工作区 RPC、DSTT 设置、模型目录同步
    └── client.js                   # 主题 client 端
```

## 许可

MIT

> 本插件为第三方主题皮肤，复刻 DeepSeek 官网视觉风格，与 DeepSeek（深度求索）官方无隶属关系、无背书或关联；DeepSeek 为深度求索公司的商标。
