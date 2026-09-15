# DeepSeek Style Theme【在抢修】

为 DeepSeek Harness Web GUI 复刻 DeepSeek 官网视觉的主题皮肤插件。

## 特性

- **流体流动背景（1.42.0+）**：全屏 WebGL2 双通道流体模拟——四分之一分辨率的流场（衰减 + 带速度的指针笔刷，两个 framebuffer 乒乓）被全分辨率的域扭曲噪声渲染器采样，带旋流迭代与三色柔性混合；按钮悬停会轻推流场、点击则荡开涟漪。配色跟随 DSTT 三色令牌（峰谷红 / 谷时蓝 / 常态绿）实时重新着色，无需重挂。**无 WebGL2 时自动回落到原来的粒子背景**（粒子实现完整保留）
- **液态玻璃（1.42.0+）**：一套「湿玻璃」配方——半透明填充 + 顶部最亮、约 38% 处消失的竖向光泽渐变 + 统一的 `blur() saturate() brightness() contrast()` 背板链 + 内嵌顶部高光与发丝描边，悬停只提亮填充；所有旋钮都是 `--dshome-glass-*` 变量。**折射**（SVG `feDisplacementMap`）只加在少数大面积上（侧边栏 / 输入框 / 设置模态框）：它仅 Chromium 支持，且每个元素一次滤镜采样
- **鼠标跟随的对话窗光斑（1.42.0+）**：光标在对话窗（消息区与输入框）上移动时，窗口上有一团跟随鼠标的柔光；它用 `background-attachment: fixed` 锚在视口上，所以滚动不会把光斑一起拖走，也不需要覆盖层元素。悬停玻璃面时另有一层随光标偏移的高光（`--dshome-spec-x/y`）
- **玻璃拟态**：侧边栏、会话卡片、输入框半透明填充 + 毛玻璃
- **明暗双主题**：深色通过 `body[data-ds-dark-theme]` 切换
- **品牌细节**：胶囊按钮、渐变主按钮、圆角卡片
- **标题栏**：默认透明，悬停变毛玻璃；栏内按钮统一为真圆角（覆盖产品全局 corner-shape:superellipse 造成的方角观感），会话标题小胶囊化
- **悬停动画**：中/E、「打开方式」、「对话 / 轨迹」标签悬停时上浮 + 品牌色辉光；中/E 短标签「中/E」平滑展开为「中文/EN」（max-width 过渡，非 display 硬切）；「打开方式」展开菜单时箭头翻转，切换标签时选中项弹出
- **DeepSeek 品牌链接**：点击侧边栏 DeepSeek 标识跳转 `https://www.deepseek.com/`
- **轨迹视图**：「对话 / 轨迹」标签常驻，可随时切回对话
- **运行中子代理面板**：有子代理启动时，右下角浮出玻璃面板，实时列出正在运行的子代理——名称、已运行时长、token 用量与流动进度条；点击条目直接跳转到该子代理会话，可折叠收起
- **跨平台**：打开工作区目录时按系统调用文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）
- **模型目录同步（1.40.0+）**：每次插件启动向 DeepSeek 端点询问一次模型列表，与 `llm-deepseek` 目录比对后按需对齐——「选择器里有哪些模型」由接口说了算，但**绝不臆造能力位、绝不清空你的条目**，移除项会逐个记日志；可用 `catalogSync: auto | add | off` 控制（详见下文）
- **交付文件菜单（1.41.0+，1.41.2 起覆盖两处）**：回复末尾的**「本轮文件改动」条目左键点击**即弹出玻璃拟态操作菜单，**交付文件卡片右键**弹出同一菜单——**用默认应用打开 / 打开所在文件夹 / 复制路径 / 打开预览**（卡片上显示为「在侧边栏预览」）；产品自己的下拉菜单里也补上它唯一缺的「复制路径」。产品原本的左键动作被保留成菜单项，不会被丢掉
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
- **能走 Slot 的 UI 走 Slot**：语言切换注册在 `conversation.session.header.utilities`（产品公开 Slot API）；仅无 Slot 的表面（工作区行菜单、交付文件卡片）使用 DOM 补丁。
- **逐层降级而不是整块失效**（1.42.0+）：背景先探测 WebGL2，拿不到就用粒子实现（`startParticles` 完整保留），着色器编译/链接失败同样返回空操作句柄而不是抛错；折射滤镜只在引擎真的支持 SVG `backdrop-filter` 时才挂 `data-dshome-dispersion`，其余浏览器静默保留普通毛玻璃；连 `backdrop-filter` 都不支持时由 `@supports not (...)` 回落为不透明填充。

### `dsh.client.inject` 的语义：加载顺序，不是 import

`package.json` 的 `dsh.client.inject` 声明了三个产品包，但 `lib/client.js` 里**没有** `import`、也**没有** `export`——它是 `module.exports = function (ctx) {...}` 的工厂形式，由 `window.__ModuleLoader__.load()` 注册。这条声明的作用是**加载顺序**：`dsh-client-modules` 的浏览器端会在本插件的 factory 运行**之前**先把这三个 bundle 注册进来（`arriveGraphRow`），于是工厂里 `ctx.get('theme' | 'locale' | 'connection')` 必定拿得到服务。

它**不是**模块图依赖——模块图的边是 `dsh.client.external`（`orderByModuleGraph` 只读 `external`）。因此：

- 不要为了这条声明去 `import` 这些包，那是另一套机制；
- 目标包不存在时会被静默跳过，不会卡住启动；
- 但它确实有用：把「factory 里要用到的服务」列全，就不必自己写等待逻辑。

## 安装

前置要求：`node` 与 `pnpm`（`dsh plugin` 命令只是 pnpm 的转发器，二者需在 PATH 中）。安装后重启 web 应用（`dsh web`）即可生效。

> **安装属性（第三方）**：本插件是第三方适配的皮肤插件，**不是 DeepSeek 官方插件**。所有安装方式（本地源码 / GitHub / 本地 tgz）默认都作为**第三方包**装入 web profile 的 `node_modules`（真实目录，`file:` 依赖）并登记进 `dsh.profile.bundles`——**绝不写入或链接官方 dsh 安装目录**（如全局 CLI 的 `node_modules`，官方升级会清空其中的第三方包）。若因旧版链式安装导致插件消失/失效，重跑一次 `dsh plugin --profile web add <源>` 即会以独立目录重建。

### 先读：四个高频坑

| 你看到的 | 真正的原因 | 正确做法 |
|---|---|---|
| 装完 `dsh web` 直接崩：`Cannot find package '@deepseek-ai/schemastery'` | 用 `link:` 装了（见下条） | 改用 `file:` |
| 同上 | 1.40.0 及更早把 `schemastery` 声明为 **peer**，而 profile 模板下发的是 `autoInstallPeers: false`，peer 永远不会被安装 | 升到 1.41.0（它是正式依赖，会被自动装上），或手动补装 |
| `add .` 装完反而解析不到依赖 | `.` 会被展开成**你当前所在目录的绝对路径**；源码在 profile 之外时这正好落成 `link:` | 不要用 `.`，用下面的 `file:` 写法 |
| `github:` 安装报 TLS / 证书错误 | pnpm 需要执行 `git clone`，带 TLS 中间人代理的环境必然失败 | 改用本地 tgz 或本地目录 |

**为什么 `link:` 一定不行**：`link:` 落成 junction / symlink，而 Node 的 ESM 解析是**从文件的真实路径**向上找 `node_modules`。真实路径在 profile 之外时，就永远走不到 `profiles/<name>/node_modules`，插件的依赖会全部解析失败——**即使那些依赖已经装在 profile 里**。`file:` 会把源码拷进 profile，是唯一稳妥的做法。

**Windows 上不要用 `inject:`**：`inject:D:\...` 会因为盘符里的 `:` 被 pnpm 当成 registry 协议分隔符，去 registry 找一个名叫 `inject:D:\...` 的包并拿到 404。Windows 一律用 `file:`。

### 从本地源码（开发模式）

```bash
# 源码放哪个稳定目录都行（file: 会把它拷进 profile）
dsh plugin --profile web add file:D:\plugins\dsh-deepseek-style-theme
```

> 不要 `cd` 进插件源码再执行 `add .`——`.` 会展开成调用目录的绝对路径，落成 `link:`，于是踩中上面的坑。

### 从 GitHub（本仓库）

```bash
dsh plugin --profile web add github:Lichtspur/deepseek-style-theme
```

> 本插件是纯 JS 且 `lib/` 已提交到仓库，Git 安装**无需构建**——不会触发 pnpm 的 `prepare`/`allowBuilds` 授权流程，一次 `add` 即可生效。GitHub 安装的包同样默认落在 profile 第三方插件区（独立目录），不会进入官方 dsh 安装目录。每个版本对应的 `tgz` 归档附在 [GitHub Releases](https://github.com/Lichtspur/deepseek-style-theme/releases) 页面。

> **代理 / 企业网络**：`github:` 安装要靠 pnpm 调 `git clone`，在带 TLS 中间人证书审计的网络里会以证书错误失败——Windows 上是 `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030e)`，改用 OpenSSL 后端后变成 `unable to get local issuer certificate (20)`。报错信息只看得到 TLS，很容易误判成插件的问题。这类环境请直接用下面的 **tgz** 或本地目录安装。

### 从本地 tgz（推荐用于代理 / 离线环境）

```bash
dsh plugin --profile web add ./releases/dsh-external-dsh-deepseek-style-theme-1.41.0.tgz
```

`releases/` 下的归档随每个 Release 发布，既不依赖 git 也不依赖 registry，在受限网络里最省事。

### 从 npm / 其他 Git 仓库

```bash
# 发布到 registry 后
dsh plugin --profile web add @dsh-external/dsh-deepseek-style-theme
# 或任意 git 仓库地址（若该仓库未提交构建产物，
# 则需其提供 prepare 脚本并按 pnpm 提示在
# ~/.dsh/profiles/<name>/pnpm-workspace.yaml 的 allowBuilds 中授权后重跑）
dsh plugin --profile web add <git-url>
```

### 依赖是怎么解析的（排错用）

- 1.41.0 起 `@deepseek-ai/schemastery` 是本插件的 **`dependencies`**（唯一运行时依赖），`dsh plugin add` 会把它一起装进 profile 的 `node_modules`。`@deepseek-ai/cordis` 只声明为 peer：插件并不 `import` 它，运行时由宿主提供。
- 它失败时**不会**再拖垮整棵插件树：`lib/index.js` 用受保护的动态 `import()` 加载 schemastery，拿不到就只丢一行警告、DSTT 模式不再持久化，主题其余部分照常工作（1.41.0 起）。
- 不要指望 `.dsh-module-fallback/node_modules` 帮忙补依赖：在**从未装过依赖**的 profile 里它一直是空的，bundle 实际是从 CLI 安装目录（如全局 npm 的 `node_modules`）解析的。所以插件依赖必须真的装在 profile 里。

## 模型目录同步

DSH 的官方 DeepSeek 路由是**声明式**的：`listModels()` 只返回配置里的条目，**从不探测网关**（官方 README：「默认目录预注册…不探测网关可用性」）。所以接口上新出了模型、或下线了某个 id，选择器都不会自己变。本插件在**每次插件启动**（`dsh web` 启动 / 插件重载）时补这一次探测：

1. 读 `llm-deepseek` 设置段的 `baseURL` / `apiKeyEnv`（自定义网关同样正确）；
2. `baseURL` 未配置时，按官方适配器的顺序回落：`launchEnvironment` 的 `$DEEPSEEK_BASE_URL` → 公开端点 `https://api.deepseek.com`；
3. 按官方适配器的方式经 `credentials` 解析该密钥（缺失则该步跳过）；
4. `GET {baseURL}/models`（5 秒超时），取接口声明的 id 列表（保持接口顺序）；
5. 与当前目录比对并决定是否写入。

### 写入语义（1.41.0 起收紧）

- **只增补已知能力位的 id**：接口只给 id，给不了 `inputModalities`、`systemPromptUpdate`、上下文窗口。已存在的条目**原样保留**（用户的改动不会被覆盖）；新 id 只有在内置映射表里有（`deepseek-flash`、`deepseek-v4-pro`）才会被采纳，**映射表外的 id 只报告、不采纳**——凭空造一个 `inputModalities: ["text"]` 的条目会把一个视觉模型悄悄降级成纯文本，这是 1.40.0 的缺陷。
- **只有「接口声明的每个 id 都能描述」时才整表对齐**（`auto`）：此时接口没列出的存量 id 会被移除，且**在日志里逐个点名**。官方路由只声明几个 DeepSeek id；若 `baseURL` 指向聚合网关，它会声明整个模型库，此时整表对齐会把你的目录替换成几百条无关条目——所以这种「看起来不是官方目录」的回答会退化成**只追加、不删除**并打一行警告。
- **并发安全**：写入带 `expectedRevision`。你在设置页同时改了模型配置的话，你的改动赢，这次启动的同步直接放弃（下次启动再试）。
- **完全 best-effort**：没有 settings / 没有凭据 / 网关不可达 / 服务改名 / 版本冲突等任何异常都不会抛出，绝不影响主题本身，也绝不会写坏模型目录。
- **只在需要时写入**：目录一致时不产生任何设置写入事件。

### 开关

本插件自己的设置段提供 `catalogSync`（默认 `auto`）：

```yaml
deepseek-style-theme:
  mode: peakvalley-redblue
  catalogSync: auto   # auto | add | off
```

| 值 | 行为 |
|---|---|
| `auto`（默认） | 可描述时整表对齐（含移除接口不再列出的 id，并记日志）；否则只追加 |
| `add` | **永不删除**，只追加新增的已知 id |
| `off` | 只探测并在日志里报告漂移，**不写任何设置** |

想彻底关掉：设 `catalogSync: off`（仍会探测一次并打日志），或停用本插件。已写入的 `llm-deepseek.models` 段可自行删掉，DSH 会回落到内置默认目录。

## 必要权限

- **安装期**：需要修改 web profile（`~/.dsh/profiles/web/` 的 `package.json`、`dsh.profile.bundles` 装配列表与 `node_modules`）；Git 安装还需按上文授权 pnpm 执行构建脚本。
- **运行时（DSH 审批/沙箱）**：**不需要任何额外权限**——不注册工具、不执行模型调用、不请求审批或沙箱提升。它只是纯前端皮肤 + 一个受限 RPC 通道。
- **运行时的唯一出网动作**：插件启动时的**模型目录同步**（1.40.0+）会读一次 `llm-deepseek` 设置段与其中的密钥引用，并向该段的 `baseURL` 发一次 `GET /models`（5 秒超时）。`baseURL` 未配置时按官方适配器的顺序回落（`$DEEPSEEK_BASE_URL` → `https://api.deepseek.com`），**不会**在自定义网关部署下把密钥发去公开端点。仅在需要时写回 `llm-deepseek.models`；离线、无密钥或服务缺失时静默跳过。开关见上文 `catalogSync`。
- **系统级副作用**：「打开工作区目录」会调用系统文件管理器（Windows Explorer / macOS Finder / Linux 默认文件管理器）并在前台打开该目录。交付文件卡片的操作菜单另有三个动作：`dshome/file.open` 用系统默认应用打开该文件（Windows `Start-Process`、macOS `open`、Linux `xdg-open`）、`dshome/file.reveal` 在文件管理器中**定位**该文件（Windows `explorer /select`、macOS `open -R`、Linux 打开所在目录）、「复制路径」纯前端写剪贴板、不经过宿主端。前两者与「打开工作区」走同一条通道、同一套围栏，同样只接受本机绝对路径。
- **私有 RPC 通道的围栏**（1.41.0 起与 dsh 核心 `/api` 同一套判定）：只接受
  1. **回环对端**（`127.0.0.1` / `::1`）——该通道一直如此；
  2. `Host` 为回环权威（`127.x` / `[::1]` / `localhost`），挡掉 DNS rebinding；
  3. `Sec-Fetch-Site` 非 `cross-site`，且 `Origin` 存在时必须与 `Host` 同源——挡掉跨站 `fetch`（简单请求不触发预检，副作用仍会执行）；
  4. `Content-Type: application/json`——让跨站尝试必须预检，而本路由从不回应预检；
  5. `payload.path` 必须是**本机绝对路径**：相对路径、含 NUL、UNC（`\\host\share`、`//host/share`）一律拒绝。UNC 会让 Windows 向该主机做认证，可被用来外带 NTLM 哈希。
- **数据可见性**：客户端读取会话列表元数据（标题、运行状态、token 用量）仅用于页内展示「运行中子代理」面板，不上传任何外部服务器；唯一的网络跳转是点击品牌标识时打开 `deepseek.com`（显式用户操作）。宿主端的唯一请求是上一条所述的 `GET {baseURL}/models`，只发往你配置的 DeepSeek 端点，不携带会话内容。
- **配置落盘**：DSTT 主题模式与同步开关写入 profile 的 `settings.yaml`（`deepseek-style-theme` 段）；模型目录同步在需要时写入同一文件的 `llm-deepseek` 段（带乐观锁，不覆盖你并发的修改）。

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
| `bridge-smoke.mjs` | 宿主端私有 RPC 通道：协议、错误路径，以及完整围栏（非回环对端 / 缺 `Host` / DNS rebinding / 跨站来源 / `Origin` 不匹配 / 非 JSON 类型 / UNC 路径 / `file.*` 端点识别与校验，24 项检查；加 `--open` 为 25 项，会真的用系统默认应用打开一个临时文件，**会在桌面弹出窗口**，默认不启用） | `node tools/bridge-smoke.mjs [已安装的 lib/index.js] [--open]` |
| `catalog-sync-smoke.mjs` | 模型目录同步的全部分支：一致 / 可描述漂移 / 聚合网关目录 / 只追加 / `off` / baseURL 解析顺序 / 无密钥 / 端点故障 / 命名空间未就绪 / 版本冲突（27 项检查，全用替身，无需凭据与网络） | `node tools/catalog-sync-smoke.mjs [已安装的 lib/index.js]` |
| `catalog-sync-live.mjs` | 用**真实端点 + 真实密钥**跑一遍同步：A 场景（目录已一致）应 0 写入，B 场景（人为制造漂移）应恰好 1 次写入并复原条目；写入被拦下，不落盘 | `DEEPSEEK_API_KEY=... node tools/catalog-sync-live.mjs [--profile web] [--drift-id deepseek-v4-pro]` |
| `gui-probe.mjs` | 无头浏览器直连 CDP 量实时页面：主题注入了哪些样式与补丁块、标题栏几何与子元素 flex order、标题栏下方带边框元素与**逐行亮度扫描**（1px 横线会表现为数值尖峰）、各胶囊的 `corner-shape`、中/E 悬停前后、对话/轨迹标签、`--models` 时的模型选择器选项、`--file-card` 时合成两张交付表面并验证左键/右键菜单（条目、定位、复制提示、预览转发、选中后关闭）、`--deliverables` 时报告真实页面上两处交付表面的存在情况与点击后果、`--ambient` 时报告背景到底是流体还是粒子回落、折射是否挂上、玻璃配方是否生效，并悬停一次验证 `--dshome-spec-x/y` 真的在写、`--shot <目录>` 时落一张全页截图 | 见下 |

```bash
# gui-probe：先起一个监听 CDP 的 Chrome，再把 dsh 签名用的会话密钥放进环境变量
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\probe about:blank
set DSH_PROBE_SECRET=<$DSH_HOME/.credentials.yaml 里 client-connection/browser-session 的 secret>
node tools/gui-probe.mjs --models --file-card
# 可选：--url http://127.0.0.1:3080  --cdp http://127.0.0.1:9222
```

两个涉及密钥的工具都**只从环境变量读**，不碰凭据库，也不会把密钥打印出来；未设置时直接以 exit 2 退出并说明怎么取。

## 目录结构

```
.
├── package.json                    # dsh bundle 元数据
├── cordis.patch.yml                # insert 插件行
├── THIRD-PARTY-NOTICES.md          # 第三方许可原文（mineradio / harness-background）
├── releases/                       # 发布产物（tgz 归档）
├── tools/                          # 自测工具（不随包发布）
│   ├── bridge-smoke.mjs            # 宿主端私有 RPC 通道冒烟测试
│   ├── catalog-sync-smoke.mjs      # 模型目录同步冒烟测试（六种分支）
│   ├── catalog-sync-live.mjs       # 同步的真端点/真密钥校验（写入不落盘）
│   └── gui-probe.mjs               # 实时页面的无头浏览器探测与像素扫描
└── lib/
    ├── index.js                    # host 端：打开工作区 / 交付文件 RPC、DSTT 设置、模型目录同步
    └── client.js                   # 主题 client 端（含流体背景、液态玻璃、交付文件卡片菜单）
```

## 许可

MIT

### 第三方代码与署名

本插件的流体着色器、玻璃折射滤镜与光标视差**移植自 [dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio) v2.3.8**（MIT，Copyright (c) 2026 John Wu）——三段 GLSL 是上游的**逐字节副本**，只改了命名与外部依赖。液态玻璃配方则**仿照 [deepseek-harness-background](https://github.com/HaoyueQin/deepseek-harness-background) 的玻璃样式**（MIT，Copyright (c) 2026 HaoyueQin），是按本插件选择器与 `--dshome-glass-*` 变量对该技法的重新表达，未复制其源码。

两份完整许可原文见 `THIRD-PARTY-NOTICES.md`，随包发布，再分发时必须保留。

> 另一条需知的来源链：上游注明其流体着色器本身是 deepseek.com 站点 bundle 中 `ds-join-shader-bg` 的逐字移植。该来源说明为上游所写，记录于此以便审计。

> 本插件为第三方主题皮肤，复刻 DeepSeek 官网视觉风格，与 DeepSeek（深度求索）官方无隶属关系、无背书或关联；DeepSeek 为深度求索公司的商标。
