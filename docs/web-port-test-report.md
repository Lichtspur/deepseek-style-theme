# 移植到 dsh web + Playwright 实测报告

| 项 | 值 |
|---|---|
| 日期 | 2026-10-04 |
| 被测插件 | `2.1.90 adapt-0.2.0-rc.2`（`link:` 到工作树，非 npm 包） |
| 被测产品 | npm 包的 `@deepseek-ai/dsh` **0.2.0-rc.2**，`dsh web`，profile `isotest` |
| 环境 | 独立 `DSH_HOME`（`_compat/iso/home`）+ 独立端口 **3099**，不碰 3080 与 19387 |
| 驱动 | 真 Chrome，**headed + 持久化 profile**（`D:\DeepSeek\dsh-webtest\chrome-profile`），CDP 级真实鼠标移动 |
| 脚本 | `_compat/iso/web-hover-test.mjs`；服务脚本 `D:\DeepSeek\dsh-webtest\run-web-test.ps1` |

---

## 一、最重要的发现：桌面端与 web 端**不是同一份客户端构建**

同样是 0.2.0-rc.2，两边的 CSS Module 哈希家族不同：

| | 侧栏 | 输入卡 | 来源 |
|---|---|---|---|
| **桌面端**（`app.asar`） | `_2H3hWW_root` | `RlGAzG_card` | 随包分发的前端（nightly 通道） |
| **npm 的 dsh 0.2.0-rc.2**（web） | **`hHd-Xa_root`** | **`uV2eYG_card`** | 与 0.1.7 **同一家族** |

实测证据（web 页面里的真实类名）：

```
card    : div.uV2eYG_card.uV2eYG_cardWorkspaceTrigger
plate   : div.uV2eYG_root.uV2eYG_hero
sidebar : hHd-Xa_root hHd-Xa_quietBars
```

并且 `dsh-client-ui-conversation/lib/client.js` 里 **`uV2eYG` 出现 87 次、`RlGAzG` 0 次**；
`dsh-client-ui-sidebar` 里 **`hHd-Xa` 190 次、`_2H3hWW` 0 次**。

**三条推论：**

1. 桌面端随包的前端比 npm 上那份**新**（同一个版本号，不同的构建）。
2. **0.1.x 那套写死哈希的补丁在 web 上其实仍然有效** —— 这就是为什么 2.0.90 在 web 上好看、在桌面端全失效。
3. **2.1.0 的语义锚点在两边都命中**，这正是语义化的回报。实测 web 上的命中数：

```
侧栏外壳 1    输入卡卡片 1    _newSession 5    _scrollBody 1
_centerCol 1  _headerActions 1    _previewBadge 1    _fish 2
```

其中 `侧栏外壳` 在桌面端早期是 **0**（`aside`/`[role=navigation]` 那套认法不成立），改成
`div:has(> [class*="_logoRow"])` 之后两边都是 1 —— 那个修复是可移植的。

## 二、插件在 web 上确实活着（已确认）

- `window.__dshomeBuild` = `2.1.90 adapt-0.2.0-rc.2`
- 注入 **12 张**样式表：`theme.css` `actions.css` `glass.css` `liquid-glass.css`
  `menu-glass.css` `file-card-menu.css` `subagent-panel.css` + 5 张 `patch.*`
- 侧栏：`rgba(255,255,255,0.3)` + `blur(24px) saturate(1.75) brightness(1.05) contrast(1.02)` ← 液态配方生效
- 输入卡：`rgba(255,255,255,0.14)` + `blur(11px) saturate(1.75)…` ← 同上
- 控制台：`[dsh-deepseek-style-theme] color -> blue (valley) @ 13:29:09 (UTC+8)`
- **零**页面错误、零失败请求

## 三、两个真问题（web 上发现，桌面端可能同病）

### 3.1 `settings` 服务不可用 → DSTT 设置存不下来

宿主端日志：

```
[deepseek-style-theme] settings.register failed (DSTT mode will not persist):
TypeError: settingsCtx.settings.register is not a function
    at lib/index.js:568
```

直接向桥端点问一次，宿主端回答：

```json
{"ok": false, "error": {"code": "internal", "message": "settings service unavailable"}}
```

来源是 `dsttRead()`：

```js
const descriptor = settingsDescriptor(ctx, DSTT_SETTINGS_NS);
if (descriptor === null) return failure("internal", "settings service unavailable", {});
```

即 `settings.describe()` 里没有 `deepseek-style-theme` 这个命名空间——因为注册那一步就失败了
（`settingsCtx.settings.register` 在 0.2.0 上不是函数，设置 API 变了）。

**影响**：DSTT 面板的六个开关全部不持久化，重启回到默认值。
**旁证**：桌面端的 `C:\Users\Nove\.dsh\settings.yaml` **不存在**，isotest 家的 `settings.yaml`
**是空文件** —— 两边都没有任何 DSTT 设置落盘，说明桌面端很可能同病。
**这一条需要单独修**（找到 0.2.0 的 settings 注册 API），不在 2.1.90 已交付的范围内。

### 3.2 流体背景在 web 上没有挂载（未解释）

实测：`document.querySelectorAll('canvas').length === 0`，而画布探测显示
**`webgl2` 可用（true）**。两条挂载路径（流体 / 粒子回落）都会
`document.body.appendChild(canvas)`，所以是**根本没被调用**，而不是挂了看不见。

逐一排除：

| 检查 | 结果 |
|---|---|
| `data-dshome-bg` | `classic`（不是 `custom`，所以配方这一关通过） |
| `dsttGetAmbient()` | `dsttState.ambient !== false`，默认 `true` → 应为真 |
| `dsttState.settled` | `dsttSync` 的 `finally` 无条件置 true → 应为真 |
| 控制台错误 | **零** —— 连 `ambient background failed to mount` 都没有 |
| `__dshomeGlassProbe` / `__dshomeTilt` | **存在** → 注册在 ambient **之后**的 `startGlassExtras` 跑了 |

最后一行是关键矛盾：注册顺序在后的 effect 跑了，在前的却没产生任何痕迹。
**当前没有解释**，不编一个。下一步该做的是在页面上直接读客户端内部状态
（需要临时加一个调试出口，或把 `syncAmbient` 的判定结果打到 `window` 上）。

## 四、悬停振荡：这次没复现，但不是"没有"

- 页面停在**工作区选择**界面：`div.uV2eYG_input` 的 `contenteditable=false`、placeholder 是
  「选择一个工作区开始」，所以**灌不进字**（`typed: false`），发送按钮一直是 `disabled: true`。
- 悬停采样结果：`yAmplitude 1.5px`、`hAmplitude 3.3px` —— 量级很小，且**前提不成立**
  （用户报的是"有内容才触发"，而这次没有内容）。

**所以这次既没有复现、也不能算排除。** 要在 web 上复现，必须先选中工作区让输入框可用。

## 五、复现方法（照这个跑就有数据）

```powershell
# 1. 起隔离实例（独立 DSH_HOME + 端口 3099）
Invoke-Expression (Get-Content -Raw -Encoding utf8 'D:\DeepSeek\dsh-webtest\run-web-test.ps1')

# 2. 单独再跑一次 Playwright（服务已起时）
$out='D:\DeepSeek\dsh-webtest'
$url=(Select-String -Path "$out\server.log" -Pattern 'http://127\.0\.0\.1:3099/\?token=\S+').Matches[0].Value
cd D:\DeepSeek\PluginDeveloping\_compat\iso
node web-hover-test.mjs --url $url --label web-hover --out "$out\shots"
# 输出: $out\shots\web-hover.json 与 .png
```

脚本的三个要点（都是踩过坑的）：**headed + 持久化 profile**（看得见、登录态留在硬盘）、
**CDP 级真实鼠标移动**（合成 `mousemove` 不产生 `:hover`，上一版就是这么白测的）、
**轮询等应用真的加载完**（不靠固定等待）。

## 六、建议的下一步

1. 修 3.1（settings 注册 API）——它是 DSTT 面板能否用的前提，且桌面端可能同病。
2. 查 3.2（流体为何不挂）——在页面上把 `syncAmbient` 的判定结果暴露出来，一次就能定性。
3. 在 web 上选中工作区后重跑悬停测试——那才是能复现用户所报条件的配置。
4. 桌面端的同一批读数还需要一次重启后的 CDP 复核（`docs/composer-hover-oscillation-report.md` 第六节）。
