# 安装事故报告：插件市场一键安装 404，与改用 npm 作为发布源

> 2026-09-15 由用户报告「另一台电脑上通过插件市场安装本主题报错」触发，同日定位、修复并决定增加 npm 发布。
> 本文件是**事故记录 + 可复用排查结论**，不是待办。发布规程见 `CHANGELOG.md` 末节，用户向安装说明见 `README.md`。
> 本文件**不随包发布**（不在 `package.json` 的 `files` 白名单内）。

---

## 1. 现象

用户在另一台电脑上通过插件市场的「一键安装」装本主题，失败：

```
Error: ERR_PNPM_TARBALL_HTTP_STATUS
  × adding a new package
  ╰─▶ Tarball server returned HTTP 404 for
      https://github.com/Lichtspur/deepseek-style-theme/releases/latest/download/
      dsh-external-dsh-deepseek-style-theme-1.39.0.tgz
dsh: pnpm failed in profile directory C:\Users\Novo\.dsh\profiles\web
```

两个可疑点：

1. 版本号 `1.39.0` 远低于当时的最新版 `1.43.1`；
2. 资产名 `dsh-external-dsh-deepseek-style-theme-1.39.0.tgz` 与仓库当时在用的稳定别名
   `deepseek-style-theme.tgz` 完全不同。

本仓库工作副本在本机，故事故可本地取证。

---

## 2. 根因

**这条 URL 的取法本身自相矛盾，必然 404。**

```
…/releases/latest/download/dsh-external-dsh-deepseek-style-theme-1.39.0.tgz
        ↑ 由 GitHub 每次请求时解析为最新 Release     ↑ 文件名却钉死了 1.39.0
```

`releases/latest` 是**重定向**，请求时解析到当前最新 Release。当时最新是 **v1.43.1**，该 Release
的附件里没有 `1.39.0` 的文件，于是 404。

这不是「资产被删了」。实测四个 URL：

| URL | HTTP | 说明 |
|---|---|---|
| `…/latest/download/deepseek-style-theme.tgz` | **206** | 稳定别名，正确取法 |
| `…/latest/download/dsh-external-dsh-deepseek-style-theme-1.39.0.tgz` | **404** | 报错这条；旧版本名 + 新版 `latest` |
| `…/latest/download/dsh-external-dsh-deepseek-style-theme-1.43.1.tgz` | **206** | 版本号与 `latest` 恰好一致时才成立 |
| `…/releases/download/v1.39.0/dsh-external-dsh-deepseek-style-theme-1.39.0.tgz` | **206** | 资产完好；换成固定 tag 即可取回 |

**结论：资产从未丢失，是引用方式错了。** 该名字在 v1.39.0 的 Release 下真实存在
（GitHub API 显示下载量 49——正是当年通过目录安装的用户）。

### 为什么只有那一台电脑报错

线上目录 `plugins.json` 里这条记录的 `tarball` 字段**当时已是空**，安装命令回退为
`github:Lichtspur/deepseek-style-theme`。目录自带的探测器
（`awesome-dsh-plugin` 的 `scripts/probe-tarballs.mjs`）专门抓这种「`/releases/latest/` +
带版本号文件名」的腐烂 URL，抓到后把该字段**摘掉**而不是让构建失败——即故障被上游自愈了。

那台电脑停在**摘除之前的目录缓存**上，所以仍拿着死 URL。

### 该 URL 是从哪来的

`.aw-work/`（`awesome-dsh-plugin` 目录仓库的工作副本）里有一条**未合入上游**的修复分支：

```
分支  update/deepseek-style-theme-tarball
提交  576fefe  "Point the tarball at a stable release alias"
改动  tarball: …/releases/latest/download/dsh-external-dsh-deepseek-style-theme-1.39.0.tgz
          → …/releases/latest/download/deepseek-style-theme.tgz
```

即：目录条目**原先登记的正是报错那条 URL**，作者已在本机改好并推到自己的 fork
（`fork/update/deepseek-style-theme-tarball`），**但从未合入 `origin/main`**。

实测三处状态并不一致，这点值得记下来：

| 位置 | 该条目的 `tarball` 字段 | 后果 |
|---|---|---|
| 上游 `origin/main` 源码 | 仍是死的 1.39.0 URL | 一旦重新构建就可能复活 |
| 线上 `plugins.json`（`updated: 2026-09-15`） | **已被摘除**（字段为空，回退 `github:` 安装） | 新用户不受影响 |
| 报错电脑上的市场缓存 | 仍是带 1.39.0 死 URL 的旧版 | **本次故障的现场** |

线上与上游源码不一致，是因为目录的探测器把这条死 URL **摘掉**了而不是让构建失败
（`probe-tarballs.mjs` 的设计：死 tarball 从站点移除，用户回退到 git 安装命令，这比把 404
交给用户要好）。**但这只是止血**：上游源码里的坏值没改，字段随时可能被探测器的某次「无法确认」
判定保留旧值而回来。

`CHANGELOG.md` 的发布流程第 4 步与紧随的警告早已规定：目录条目**只写别名地址**，且

> ⚠️ 别把版本号写进 `/releases/latest/download/` 的文件名——`latest` 指向最新 Release，
> 文件名钉死旧版本号，一发新版就 404。

所以这不是没想到的坑。**规程写对了，但没有任何机制在请求路径上校验它**：条目一旦提交，
URL 就只在提交那一刻被验证过一次，之后无人复检；而它的失效方式又是静默的——对作者而言
一切正常，只有下一个用户点安装时才炸。更要紧的是**已写好的修复停在分支上，没人合并**。

---

## 3. 修复

### 3.1 立即（那台电脑）

三条命令任选，均绕过市场缓存：

```bash
# 最省事：稳定别名，永远取最新
dsh plugin --profile web add https://github.com/Lichtspur/deepseek-style-theme/releases/latest/download/deepseek-style-theme.tgz

# 走 git 源，完全不碰 Release 资产
dsh plugin --profile web add github:Lichtspur/deepseek-style-theme

# 要固定版本、可复现：用 tag 而非 latest
dsh plugin --profile web add https://github.com/Lichtspur/deepseek-style-theme/releases/download/v1.43.1/dsh-external-dsh-deepseek-style-theme-1.43.1.tgz
```

装后重启 `dsh web`。若残留 `dsh-external-dsh-deepseek-style-theme-1.33.0` 这类**以资产文件名
命名**的目录，是更早一次同样取法留下的，清掉即可。

> 该机器的网络带 TLS 中间人代理（`github.com` 报 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`，`git` 报
> `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`），`awesome-dsh-plugin.com`
> 正常。这正好命中 README 记的坑：`github:` 安装要靠 pnpm 调 `git clone`，在此类网络必然失败。
> 因此第 2 条若失败属环境问题，改用 tgz（走 HTTPS 下载，不经 `git clone`）。

### 3.2 根治：把 npm 作为发布源

tgz 只是把 URL 写对了，仍然是「一个可能腐烂的外部引用」。改为发布到 npm：

- 市场解析顺序（`dshmarket` 的 `installTargetFor`）是 **`npm` 命中即返回，根本不看 `tarball`**，
  一举绕开所有 Release 资产 URL 的问题；
- 不走 `git clone`，绕开代理/证书问题；
- 版本、完整性校验、镜像加速都由 registry 体系负责。

**包名定为无 scope 的 `dsh-deepseek-style-theme`。** 原本的 `@dsh-external/dsh-deepseek-style-theme`
发不出去：`@dsh-external` 这个 npm scope 属于用户 `wulei1107`（下面挂着
`@dsh-external/dsh-vision-toolkit`），不是本项目的命名空间。无 scope 命名也与同类插件
（`dshmarket`、`dsh-neu-theme`）一致。

改动清单：

| 文件 | 改动 |
|---|---|
| `package.json` | `name` → `dsh-deepseek-style-theme`；补 `keywords` / `homepage` / `repository` / `bugs` |
| `cordis.patch.yml` | `name:` 同步改为 `dsh-deepseek-style-theme`（`id:` 保持 `ui-skin-deepseek-style` 不变） |
| `README.md` | 新增「从 npm」安装段与卸载命令 |
| `.aw-work/data/plugins/Lichtspur__deepseek-style-theme.yml` | 加注释：**不要手写 `npm:` 字段**（见下） |

---

## 4. 必须守住的两条不变量

这两条都是本次才摸清的，且违反后的失效方式都不直观。

### 4.1 `cordis.patch.yml` 的 `name:` 必须等于 `package.json` 的 `name`

证据链（`dsh-client-modules/lib/index.js:641-676`、`dsh-app-boot/lib/index.js:851`）：

1. bundle 的 patch 文件由**包自身**的 `dsh.bundle.patch` 字段解析（与本包 `name` 无关，故打包路径安全）；
2. patch 里 `insert` 条目的 `name:` 是**被 require 的模块说明符**——市场的 patch 写的就是包名本身
   （`name: 'dshmarket'`），`dsh-web-app` 写的是 `@deepseek-ai/dsh-*` 包名；
3. `dsh-client-modules` 拿该说明符解析并定位包的 `package.json`，再据 `dsh.client` 组装浏览器 bundle。

⇒ 包名改了而 patch 没改，模块解析不到，**插件装配失败**。

反之，以下**不需要**跟着改（改了只是徒增改动）：

- patch 的 `id:`（如 `ui-skin-deepseek-style`）——客户端 bundle 的服务路径是
  `/plugins/${entry.id}/client.js`，与包名无关；
- `lib/client.js` 里的 `@dsh-external/...` 字面量——只是客户端内部 id（写入 `dataset.plugin`、
  作注册键），不参与模块解析。

自查：

```bash
node -e "const p=require('./package.json').name,fs=require('fs');const m=fs.readFileSync('cordis.patch.yml','utf8').match(/name:\s*'([^']+)'/);console.log(p, m[1], p===m[1]?'OK':'MISMATCH')"
```

### 4.2 Release 资产引用：文件名里绝不放版本号，或干脆不放 `latest`

- **要「永远最新」** → 只写稳定别名 `…/releases/latest/download/deepseek-style-theme.tgz`；
- **要「固定可复现」** → 用 tag：`…/releases/download/v1.43.1/<版本化文件名>.tgz`。

两者混用（`latest` + 版本化文件名）在**下一个 Release 发布的那一刻**就死。

---

## 5. 一个反直觉的结论：npm 映射不用手写，写了反而非法

直觉做法是往目录条目 YAML 里加 `npm:` 字段。**这是错的**，两条证据：

1. `awesome-dsh-plugin` 的 `scripts/lib/entries.mjs` 中
   `ENTRY_KEYS = ['url','name','category','description','tarball','file']` **不含 `npm`**；
   出现未知键会直接判为校验问题。其注释写明：该字段无人读取，npm 包**从仓库自动解析**。
2. 映射实际来自 `data/npm-map.json`，由 `scripts/probe-npm.mjs` 自动填充：

```
读 raw.githubusercontent.com/<owner>/<repo>/HEAD/package.json  → 取 name
查 registry.npmjs.org/<name>                                    → 要求其 repository 指回同一仓库
两者都成立 → 才写入 npm-map.json
```

⇒ **`package.json` 里的 `repository` 字段是这条自动链路的唯一凭据**。缺了它，探测器会认为
「这个包没发布」。因此该字段不是装饰，是功能性的。

发布后**无需改任何 YAML**，维护者跑一次 `probe-npm.mjs` 即可。

---

## 6. 验证记录

改动后在本机实测（`dsh` 0.1.5-rc.1，`node` v24.16.0）：

| 项 | 命令 | 结果 |
|---|---|---|
| 打包内容 | `npm pack --dry-run` | **7 个文件 / 78.8 kB**，无临时件；`lib/` 恰好只有入库的 `index.js`、`client.js`，且无构建步骤 |
| 宿主端 RPC 桥 | `node tools/bridge-smoke.mjs lib/index.js` | **26 项全过** |
| 模型目录同步 | `node tools/catalog-sync-smoke.mjs lib/index.js` | **27 项全过** |
| 名称不变量 | 见 4.1 自查命令 | 一致 |
| 目录条目 YAML | `validateEntries(readEntries())` | `problems: (none)`，注释不影响解析 |

> 说明：`bridge-smoke` 中 `file.open reports failure for a nonexistent file instead of succeeding`
> 一项在受限环境下打出 `spawn EPERM`，这正是该用例的断言目标（失败必须如实上报），故为 PASS。

### 发布后验证（2026-09-15，包已上 npm）

`dsh-deepseek-style-theme@1.43.1` 发布成功，`dist-tags.latest` 已指向它。

| # | 验证项 | 结果 |
|---|---|---|
| 1 | registry 元数据 | `version=1.43.1`；**`repository.url` 精确匹配本仓库**（目录自动探测的唯一凭据）；`dsh.bundle.patch`、`dsh.client.platform=web`、`dependencies`/`peerDependencies` 均正确；maintainer `lichtspur` |
| 2 | tarball 字节比对 | registry 发布件 79,179 B，sha1 `a21f38e112b33646e1bd5e23f5d69c9e56334261`，**与 `dist.shasum` 完全一致**，且与本地 `npm pack` 产物逐字节相同 |
| 3 | 装配链（改名风险核心） | 见下表 |
| 4 | 用**已发布代码**跑功能测试 | `bridge-smoke` **26 项、退出码 0**；`catalog-sync-smoke` **27 项、退出码 0** |

第 3 项按真实 profile 结构搭临时现场（`node_modules/dsh-deepseek-style-theme/` + 名为
`dsh-profile-web` 的根 `package.json`），逐环节实证：

| 检查 | 结果 |
|---|---|
| A 包名 → 落盘路径 | `<profile>\node_modules\dsh-deepseek-style-theme\package.json` ✓ |
| B patch 的 `name:` 作为模块说明符解析 | → `<profile>\node_modules\dsh-deepseek-style-theme\lib\index.js` ✓ |
| C 不变量 `patch.name === package.json.name` | ✓ |
| D `dsh.bundle.patch` 声明的文件存在 | `./cordis.patch.yml` ✓ |
| E `dsh.client.platform=web` 且 `exports["./client"]` 指向的文件存在 | `./lib/client.js` ✓ |
| F 主入口 ESM 真正加载 | 导入成功，导出 `["apply","inject"]` ✓ |

> **两个测试现场的坑，记下来免得下次误判：**
> ① 临时现场根 `package.json` 若被误写成插件的 `package.json`，Node 的**自引用解析**会把包名
> 指向根目录的 `lib/index.js`（不存在），看起来像"改名把装配弄坏了"，其实是现场搭错。
> 真实 profile 根包名是 `dsh-profile-web`，不会自引用。
> ② 手工复制依赖会缺**传递依赖**（`schemastery` 需要 `@deepseek-ai/cosmokit`），于是插件报
> `schemastery could not be loaded`。这是现场缺陷而非缺陷——真实安装由 pnpm 解析完整依赖树。
> 附带确认了一件好事：该情形下插件**优雅降级并如实上报**，不崩。
> 另：`tools/*.mjs` 的第一个参数**必须是绝对路径**，相对路径会被拼成非法的
> `file://.tmp-inspect/...` 而 `ERR_MODULE_NOT_FOUND`。

### 仍未验证

- **完整 `dsh web` 启动**（含浏览器端 client bundle 实际渲染）未做：上述第 3 项验证到
  「模块解析 + 宿主入口加载 + 不变量」这一层，这是改名风险的全部所在；但把 web 应用整个拉起来
  还需占用端口、初始化完整 profile，未在本轮进行。日常使用中若发现异常，优先怀疑这一层。
- 那台报错电脑的修复命令未在故障机上复跑（本机网络环境不同）。

---

## 7. 发布步骤（维护者）

> **状态：已于 2026-09-15 完成。** `dsh-deepseek-style-theme@1.43.1` 已在 npm 上，
> `dist-tags.latest` 指向它。以下步骤供下个版本复用。

```bash
npm login --registry=https://registry.npmjs.org
npm publish --registry=https://registry.npmjs.org --use-system-ca
```

- `~/.npmrc` 指向 npmmirror，**镜像不能发布**，故必须显式指定官方源；
- `--use-system-ca` 是为带 TLS 中间人代理的环境准备的（否则
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE`）。注意 npm 11 会警告
  `Unknown cli config "--use-system-ca"`——它其实是 Node 的选项，能被透传，**该警告可忽略**；
- 首次发布用与 GitHub Release 相同的 `1.43.1` 无妨——两套版本体系互相独立；
- 已有本地 tgz 时可直接发文件、跳过打包：`npm publish dsh-deepseek-style-theme-<版本>.tgz --registry=https://registry.npmjs.org`。

**发布前先过一遍认证形态**（见下节），否则会卡在 E403 上。

发布后自查：

```bash
npm view dsh-deepseek-style-theme --registry=https://registry.npmjs.org version repository
```

### 发布时的认证坑（本次耗时最多，务必先读）

`npm login` 成功**不等于**能发布。实测连续踩到这些：

| 现象 | 真因 | 解法 |
|---|---|---|
| `E403 ... Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages` | `npm login` 写入 `~/.npmrc` 的是**网页登录会话 token**（`npm_` 前缀），npm 2026 年起限制它用于发布与账号修改 | 必须用下面的 Granular Access Token |
| 同上，且 `--otp=<真实码>` 也无效 | registry 直接返回 **403 而非 401/EOTP**，而 npm 的 `otplease` 包装器只对 `EOTP`/`E401` 提示输码 ⇒ **永远不会提示你输 OTP** | 同上；这条路是死结，别在 `--otp` 上耗时间 |
| token 生成了但仍 403 | 生成时 **Select packages 选了 `@lichtspur` 这种 scope**，而本包是**无 scope** 包，不受任何 scope 管辖 | 选 **`All packages`**（首次发布的无 scope 包在下拉里根本搜不到） |
| 表单报 `You must select at least one organization if granting organization permissions` | Organizations 一节默认是 `Read and write` 但没选组织（账号无组织） | 改成 **`No access`** |

**结论：目前唯一可行的 token 形态**（2026-09 实测）：

```
类型            Granular Access Token
Permissions     Read and write (publish and stage)
Select packages All packages            ← 无 scope 包必须选这个
Bypass 2FA      勾选                     ← 不勾就 403
Organizations   No access
Allowed IP ranges  留空（动态 IP 会让 token 突然失效）
```

**这个 token 形态有保质期**：npm 页面明示 *"Bypass-2fa token with direct-publish access are being
deprecated… will be removed in January 2027"*，官方建议改用 `Read and write (stage only)`
（上传后在网页确认发布）。**2027 年 1 月前应迁移**，否则发布流程会突然断掉。

> 另注：生成 token 的页面**只显示一次**；token 一旦贴进任何聊天/日志，立即吊销重建
> （本次发生过一次，已吊销）。`~/.npmrc` 请用编辑器改，别在终端里 `echo`，否则会留在命令历史里。

### 给已装用户的迁移提示

包名变了，市场会把它视为**另一个插件**。需先移除旧条目再装新的，否则 profile 中会同时存在两条：

```bash
dsh plugin --profile web remove @dsh-external/dsh-deepseek-style-theme
dsh plugin --profile web add dsh-deepseek-style-theme
```

---

## 8. 上游待办

线上已经摘掉了死字段，但**上游源码没改**。分支已推到 fork，缺的只是合并：

```bash
cd .aw-work
git push fork update/deepseek-style-theme-tarball   # 若 fork 上还没有
# 然后到 awesome-dsh-plugin/awesome-dsh-plugin 开 PR
```

> 本机 `git` 走 schannel，对 github.com 会以
> `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS` 失败（同样的 TLS 中间人代理问题）。
> 这条推送需在能正常访问 github.com 的环境执行，或给 git 换成 OpenSSL 后端。

`.pr-body.md` / `.pr-body2.md` / `.pr-comment.md`（均未跟踪）是此前拟好的 PR 文案，可直接复用。

**顺带一个更省事的选项**：本主题改发 npm 后，目录条目里的 `tarball:` 可以**整个删掉**。
按解析顺序（`npm` 命中即返回、不看 `tarball`），只要 npm 映射探测成功，这个字段就是死重量；
而删掉它就永久消除了 4.2 那条不变量的违反面。PR 里一并说明更佳。

---

## 9. 教训

1. **修复写完不等于问题解决。** 本次踩的坑 `CHANGELOG.md` 里早已白纸黑字警告过，而**对应的修复
   提交也早就写好并推到了 fork**——缺的是合并那一步。停在分支上的修复，对用户而言与没修无异。
   防复发该盯的是「修复到用户的链路」是否闭合，而不只是「有没有人想到」。
2. **静默失效比报错更贵的引用不要留。** 该 URL 对作者全程正常，只有用户点安装时才炸。
   改用 npm 后，引用由 registry 体系托管，不再依赖一个手工维护的字符串。
3. **命名空间是稀缺资源。** `@dsh-external` 曾长期被当作「第三方插件」的约定俗成前缀使用
   （本仓库的自测脚本、旧文档、残留目录名都带着它），但它在 npm 上**属于别人**。
   约定俗成的 scope 不是命名空间，发布前必须先确认归属。
4. **听起来对的字段可能是非法的。** 往目录条目加 `npm:` 是直觉答案，实际会被校验拒绝——
   因为该数据是自动探测出来的。改上游数据格式前，先读它的校验器。
5. **上游与线上可能不一致，排查时要分清。** 本次「上游源码仍是坏值、线上已摘除、用户缓存更旧」
   三层并存，只查其中一层都会得出错误结论。
