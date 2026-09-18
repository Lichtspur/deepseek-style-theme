# 更新日志（CHANGELOG）

版本号与 GitHub [Releases](https://github.com/Lichtspur/deepseek-style-theme/releases) 标签一一对应；每条 Release 都附**版本化 tgz** 与**稳定别名 `deepseek-style-theme.tgz`**（插件市场一键安装指向别名，永远取最新）。

安装/升级：

```bash
dsh plugin --profile web add dsh-deepseek-style-theme
```

npm 也是四者里最省事的一条：不走 `git clone`（绕开代理 / 证书问题），也不依赖 GitHub Release 资产。

> **只有这一条计入 npm 下载量。** `github:` / 本地 tgz / `file:` 都绕开 registry，装多少次都不会让 npm 的统计动一下。

纯 JS、`lib/` 已入库，git 安装无需构建授权——但它和其它非 registry 方式一样，不进统计。

---

## v2.0.89 — 2026-09-18

### dsh 0.1.5-rc.2 实测适配：这台开发机的 Chrome 终于能跑 GUI 复核了

主题在 rc.1 上做的两项适配（去掉已删除的 `dsh-client-runtime` inject、宿主端注册改 best-effort）到 rc.2 依然有效，本次**没有代码改动**——改的是「验证」这件事本身：

- 之前每版的「验证」一栏都写着**真机复核未做**（审批策略为 never，起不了 headless Chrome）；这次把测量链路搭起来了：独立 `DSH_HOME` + 独立端口装最新 dsh（0.1.5-rc.2）+ 真 Chrome 渲染 + 页内读数。
- 复核环境与结果（本机 Chrome 152，1440×900，浅色）：
  - `window.__dshomeBuild` = `2.0.89 rc2-verified`（本版新标记），`__dshomeTilt` / `__dshomeGlassProbe` / `__dshomeDispersion` / `__dshomeFluidFormat` 四个自检入口全部就位；
  - 页面标记齐备：`body[data-dshome-color=green][data-dshome-bg=white]`、`html[data-dshome-glass=liquid][data-dshome-composer=narrow][data-dshome-blur=on]`；
  - 流体画布在跑（`<canvas>` 全屏、`position:fixed`），对话框卡片拿到 `blur(11px) saturate(1.75) brightness(1.05) contrast(1.02)`；
  - **0 个未捕获异常、0 个页面级 error、0 个失败请求**；控制台只有主题自己的两行 `info` 配色日志。
- 两处环境坑记在这里，省下次重搭：Playwright 默认的 `--remote-debugging-pipe` 与 detached 启动的 Chrome 在本机沙箱里都活不过一次调用，最终用的是**同进程内拉起 Chrome + WebSocket 传输（`pipe:false`）**的 puppeteer-core 路线。

### 验证
- `parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **82/82**。
- 真机复核：**已做**（上面那套链路，最新 dsh + 真 Chrome）。

### 回退
`@2.0.88`。纯版本标记变更，行为与 2.0.88 一致。

## 未发布 — 文档修正（2026-09-17）

### 安装章节改以 npm 为准：它是唯一计入下载量的安装方式

邀请试用后 npm 侧近 7 天**零计数**（`/versions/dsh-deepseek-style-theme/last-week` 返回空）。
查下来不是包的问题，是安装章节在劝人别用 npm：

- 「从 npm」排在第 **5** 位，前面四条（`file:` / `github:` / 本地 tgz / 任意 git 源）全部绕开 registry；
- 它还压着一条 ⚠️「暂时不要用这一条」，理由是「npm 的 latest 仍是 1.43.1，1.43.3 已修复，在那之前请用 tgz 或 `github:`」。

而 npm 的发布记录显示：`1.43.1` 首发于 `2026-09-15T08:40:24Z`，`1.43.3` 于同日 `10:27:35Z` 上线——**相隔 1 小时 47 分**；
`latest` 现为 `2.0.88`。那条警告已过期两天，却一直在把读者推向不产生 registry 请求的路径。

本次改动：

- README 新增「## 安装方式」，**npm 提为第一个推荐项**，删除过期警告；
- 其余四种方式标题一律标注「不计入下载量」，让读者在选择处就看到后果；
- 改名三引用点表与 `allowBuilds` 授权说明两条**保留**（与安装源无关，仍然有效）。

### 已知残余偏差（不是本次改动能解决的）

「下载区域」为 `china` 时，市场把 npm 请求发给镜像（`mirrors.cloud.tencent.com/npm`），**不进 npm 官方日志**。
因此国内测试者即使照 npm 命令安装，也不会计入统计——国内占比越高，这个偏差越大。

### 说明

- **纯文档改动**：`lib/` 与 `cordis.patch.yml` 未变，**不占版本号**，无新 Release、无 npm 发布。
- 已在真实仓库基线（`master` 的 README，`sha256 4531bb09…`）上验证补丁干净应用且逐字节一致。

## v2.0.88 — 2026-09-16

### 抄 dsh-theme-mineradio 的「底边栏」：对话框与统计行合成一块玻璃板

用户："我觉得 dsh-theme-mineradio 的底边栏也可以抄一下"。它那套叫 **fused 状态**：一旦统计行挂上，**整个输入栏**变成一块玻璃板——边框/圆角/填充/阴影只画在外层容器上、背板模糊挂在它的 `::before`，里层的卡片与统计行全部转透明，只在接缝处留一条发丝线；作者在源码里记的两条经验也一起抄了：

- **用 `z-index` 而不是 `isolation`**：`isolation` 会同时成为 backdrop root，把弹层的磨砂限制在这条栏内；
- **里层 `backdrop-filter: none`**：否则里层自己的模糊会和玻璃板的模糊叠加成两层。

触发用 `[data-dsh-inputbar]:has([data-dsh-stats])`——产品没有渲染统计行时整块规则不生效，卡片保留自己的玻璃（这是能安全"抄"的前提）。深浅两套配色都给了；接缝用 `border-top` 一条 hairline。

同时把 2.0.87 的透镜放大收进这条栏里：文字从**左边缘**缩放（`transform-origin:left center`，1.04 常态 / 1.08 倾斜时），这样它不会溢出玻璃板的右缘——整条栏放大 12% 会明显穿出圆角，所以数值也收敛了。

> 说明：这是**技法重述**而不是代码搬运——声明是按本插件自己的 `--dshome-*` 令牌写的，未复制 mineradio 的 `--dsh-aqua-*`；已按 MIT 记入 `THIRD-PARTY-NOTICES.md`。

### 验证
- `parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **82/82**（新增：融合栏的六条结构断言）、`dstt-schema-smoke` **29/29**、`bridge-smoke` **26/26**。
- **真机复核未做**（审批策略 never）。装上后 `window.__dshomeBuild` 应为 `2.0.88 fused-bar`；统计行应在卡片**内部**、与卡片同宽，且面板与它共用一层模糊。

### 退路
`@2.0.87`、`@2.0.86`。

---

## v2.0.87 — 2026-09-16

### 三条：背景模糊为什么一直没生效、白磨砂的浅色横带、以及你要的"透镜放大"

#### 1. 「没有背景模糊效果」：我们自己有两处写法会挡掉 `backdrop-filter` 的采样

Chromium 的 `backdrop-filter` 只对**能进入 backdrop 的常规绘制内容**生效，而本主题里有两处正好把它排除掉：

- `body{...;background-attachment:fixed}`：fixed 背景在**独立的绘制阶段**上色，不参与 backdrop 采样 → 页面底色的那片渐变**模糊不到**，于是玻璃只剩半透明（用户原话"现在的效果是半透明，没有背景模糊效果"）。改法：把底色挪到 **`body::before{position:fixed;inset:0;z-index:-2}`**——同样"钉在视口"的观感，但它是普通绘制内容，会被采样；`body` 自身对主题配方改为 `background:none!important`。③ 自选背景仍保留 `background-attachment:fixed`（那是用户自己的图，语义不同）。
- `[data-composer-card]{will-change:transform}`：这个性能提示会把面板提升为独立图层，而这是另一种已知的"丢失 backdrop"路径；而且合成器在真正 transform 时本来就会提升它，提示白付了代价。

新增 **`__dshomeGlassProbe()`**：一次给出四个面的计算 `backdropFilter`、body 的 `backgroundAttachment`、`::before` 层的 position、卡片的 `willChange` 与 `backdropBlur` 设置——"为什么没模糊"不再需要猜。（真机复核仍被沙箱挡住，所以这条要靠这一行确认。）

#### 2. 白磨砂配方下工作区列表底部的浅色横带（用户截图）

产品给工作区列表底部加了一层渐隐，终点是**不透明的 sidebar 底色**；玻璃面板半透明后终点与实际背景不匹配，就在「设置」上方留出一条浅带。2.0.76 只在**液态**配方里关掉了它，用户这次用截图确认**白磨砂也一样**（"白磨砂，有这个渐变"）——白磨砂面板同样是半透明的。现在两套配方都关（`body .hHd-Xa_root [class*="_fade" i]{background-image:none!important}`）。

#### 3. 透镜放大（用户要求：「对对话窗下方文字进行放大（模拟液体放大）」）

真正的透镜会放大玻璃**后面**的内容，而 `backdrop-filter` 做不到放大（只有 blur/saturate/brightness 这类）。可行的近似是：把**紧贴面板下方**的那行状态文字（`[data-dsh-stats]`，产品标记，从未改名）放大一点——**常态 `scale(1.06)`，面板倾斜时 `scale(1.12)`**（倾斜状态由 `html[data-dshome-leaning]` 标记，由倾斜模块写入），过渡 240ms、`prefers-reduced-motion` 下不动。数值是保守起点，要更强/更弱改两个数字即可。

### 验证
- `parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **81/81**（新增：页面底色是可绘制层而非 fixed 背景、白色横带两配方都关、透镜放大与 `data-dshome-leaning` 标记）、`dstt-schema-smoke` **29/29**、`bridge-smoke` **26/26**。
- 本轮又一次踩到"CSS 注释里写反引号提前结束模板字符串"（第 4 次），被 `parse-smoke` 与仓库既有的"stray backtick"断言当场拦下——这两道门这轮已经拦了四处问题（乱码、CRLF、反引号 ×2）。

### 退路
`@2.0.86`、`@2.0.85`。

---

## v2.0.86 — 2026-09-16

### 三条：流体「大方块」的根因、玻璃变「凝胶／没模糊」、倾斜太弱

#### 1. 流体大方块：根因是 DISPLAY_SHADER 里的 sin 哈希（第三份调查，带实测）

调查用分层截图 + 参数消融定位：方块**在流体画布自己的像素里**（把画布抬到最上层仍是大片矩形，隐藏画布则背景干净），而且**与精度无关**——那台机器上 `rgba16f` 与 `highp` 都已生效，方块依旧，所以 2.0.74（精度）与 2.0.81（存储格式）两次修复都不是这个部位。

真因：`random()` 是经典的 `fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123)`，而这个着色器把噪声坐标放大到 ~2900（`uv *= ns * u_resolution`，`n2` 再乘 2），`dot()` 因此达到 ~2e5。float32 在 `sin()` 参数规约之后残留的 ~2.5e-3 误差，被 43758 这个乘数放大成 ~100 个单位 → **哈希不再是哈希**：相邻格子取到几乎相同的值，域扭曲场塌成"大片纯色平台 + 陡边界"。那台机器实测：8×8 块中块内标准差 <0.35 的**平坦块占 39.6%**，最大平台 **800×1000px**，平台边界跳变 **60–90/255**；`u_time` 再让这些边界缓慢平移，就是"大方块向左下漂"。消融数据同向：关域扭曲 jumpMax 19.60 → 11.40、冻结时间 → 13.14，而旋流迭代怎么改都无变化。

改法：把 `random()` 换成 **Dave Hoskins 的无 sin 哈希**（`fract(vec3(p.xyx) * 0.1031)` + 一次 dot + 一次乘加）——所有中间量都很小，跨 GPU 行为一致，并且**保留上游的逐像素白噪声**，而不是像 `noDistort` 那样靠删掉域扭曲来治症状。这是对上游 shader 的**第 2 处记录在案的改动**（见 `THIRD-PARTY-NOTICES.md`，与第 1 处同源：一处是 16 位中间精度塌陷，一处是 32 位参数幅值塌陷）。

#### 2. 玻璃变「凝胶」+ 没有背景模糊：折射滤镜（B1 修好后第一次真的生效）

用户截图与描述："我的玻璃怎么变成凝胶了""现在的效果是半透明，没有背景模糊效果"。两件事同一个来源：`backdrop-filter: url(#…) blur(8px) saturate(1.75)` 里，**SVG 滤镜一旦渲染失败会整条声明失效**——面板于是既没有折射也没有模糊，只剩半透明填充；再叠上滤镜内部的染色（它作用在 `|背景 − 背景左移 14px|` 上，而渐变背景——默认的 `bold` 就是——让这个差值整块面板都非零）就成了"凝胶"。

这个功能自 1.43.6 起从未挂上过，默认打开等于拿玻璃冒险，因此：

- **折射改为 opt-in**：`composerRefraction` 默认 `narrow → off`，且 `off` 意味着**整条 SVG 滤镜链不进 DOM**（四个面都保留 `blur + saturate`，开关一次管全部而不是只管对话框）；
- `TINT_OPACITY` **0.45 → 0.16**：即使主动打开折射，染色也只是提示而不是一层洗色；
- 新增 `window.__dshomeDispersion()` → `{ composer, mounted, filters, recipe }`。

#### 3. 倾斜太弱（用户反馈）

`TILT_MAX` 0.0175 → **0.03**、`TILT_SCALE` 1.01 → **1.015**。因为 2.0.85 的触发是几何判定，加强后必须防"卡片自己动出指针 → 释放 → 再进 → 再倾"的帧级回路，所以加了 `TILT_RELEASE_PAD = 8`：指针要离开卡片矩形 8px 才释放（抬升能移动的边缘不到 2px，余量充足）。

#### 4. 两道新的门（这轮自己踩的坑）

- `parse-smoke` 增加 **UTF-8 门**：一次 PowerShell `Get-Content | Set-Content` 往返把 `lib/client.js` 的 211 个中文注释写成了 U+FFFD 乱码，而 `node --check` 照样通过（损坏发生在注释与字符串里）。现在每个文件必须能严格按 UTF-8 解码且不含替换字符。
- 同一次往返把文件写成了 CRLF，令 `bg-recipes-smoke` 的一条正则失效 → 该断言改为 `\r?\n`，两种换行都接受。
- 同一轮里第三次踩到"注释里的反引号提前结束模板字符串"，`parse-smoke` 一秒抓到——这两个门就是为它们建的。

### 验证
- `parse-smoke` **13/13（全部干净 UTF-8）**、`bg-recipes-smoke` **78/78**（新增：无 sin 哈希、释放垫、折射 opt-in 链）、`dstt-schema-smoke` **29/29**、`bridge-smoke` **26/26**。
- **真机复核未做**（审批策略为 never，起不了 headless Chrome）。期望值见 `releases/notes-2.0.86.md`：`__dshomeBuild` = `2.0.86 glass-on noise-fix`、`__dshomeDispersion().mounted` 为 `false`、大方块复测的平坦块占比应 < 20%。

### 退路
`@2.0.85`、`@2.0.84`。

---

## v2.0.85 — 2026-09-16

### 对话框倾斜：触发方式改成几何判定，不再依赖 `pointerover`；两条静默闸门也暴露出来

用户第三次要这个效果：「把我的对话框随着鼠标的位置而变化的效果补回来😭」——这次确认是**倾斜**（不是光标高光/折射）。

**改了什么**

1. **触发改成按指针几何位置判定**。原来倾斜必须在 `pointerover` 里 `target.closest(TILT_SELECTOR)` 命中卡片，这串假设（产品把卡片换成别的节点、外面套一层 `role=button`、浮层/portal 挡住）主题自己无法验证，而一旦不成立，表现和"效果坏了"完全一样。现在每个 `pointermove` 都用 `spotAt()` 按**卡片自身的矩形**判定（`controlAt()` 只保留一次命中测试，用来回答"指针下是不是控件"），漏掉一个事件只损失一帧，不损失效果。
2. **两条静默闸门变成可读的**：`__dshomeTilt()` 现在报 `{ recipe, reducedMotion, spots, leaning, frozen, engagements, sinceRelease }`——
   - `reducedMotion: true` 时倾斜被系统"减少动效"关掉（**这是唯一一个在任何设置里都看不见的闸门**，现在会打一行 `console.info` 说明）；
   - `spots: 0` 表示对话框卡片已不匹配 `TILT_SELECTOR`（产品改标就得改选择器）。
   没生效时先看这两个值，就不用再猜是哪一层吃掉了效果。
3. 原有的滞回语义不变：进入控件**冻结**当前角度（不重画、不回弹、不重新武装）、离开卡片矩形才释放、释放后 200ms 冷却；抬升 `scale(1.01)`、两套玻璃配方都生效同 2.0.82。

### 顺带：光标高光/折射不再挂在流动背景上（本来是给上一条准备的，一并留下）

`startSpecularSpotter()` / `startSpecularParallax()` / `startGlassDispersion()` 原先都在 `startAmbient()` 里挂：于是**关掉「动态背景」**（集显方块那件事就是这么处理的）、选 ③ 自选背景、或机器没有 WebGL2（粒子回落在这三行之前 return）时，对话框的光标高光与边缘折射会**一起消失**。现在它们由独立的 `startGlassExtras()` 挂载，与背景配方无关。这条不是你这次要的那个效果，但同一个"效果因为别的开关而消失"的毛病。

### 验证
- `tools/parse-smoke.mjs` **13/13**；`tools/bg-recipes-smoke.mjs` **75/75**（新增 2 条：倾斜按几何判定 + 两条闸门可读、高光/折射挂在流体层之外）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **真机复核仍未做**（审批策略为 never，起不了 headless Chrome）。装包后请跑一行：把鼠标放到对话框上，`__dshomeTilt()` 的 `engagements` 应随移动增长、`leaning` 应为 `true`；若 `reducedMotion` 是 `true`，去系统「辅助功能 → 视觉效果 → 动画效果」打开即可；若 `spots` 是 `0`，把那台机器的对话框卡片类名发我。

### 退路
`@2.0.84`、`@2.0.82`。

---

## v2.0.84 — 2026-09-16

### 修 BUG-REPORT-dstt-2.0.82 的四条 + 2.0.83 的激活期崩溃

报告在 `D:\DeepSeek\Cache\dstt-bughunt-2026-09-16\BUG-REPORT-dstt-2.0.82.md`（Playwright 驱动真机 + 页面内探针，四条都带复现与代码定位）。**B5 就是用户报了四轮的「按钮跳动」**——不是我们一直追的纵向 8px，而是**横向 48–78px 瞬移**。

#### 先修 2.0.83 带进来的崩溃（并行会话的提交）

`54fa442`（tag `v2.0.83`，已推上游）把 `USER_BUBBLE` 的声明留在 `PATCH_BLOCKS` / `GLASS_CSS` **之后**，而这两个表在构建时就用 `${USER_BUBBLE}` 插值 → 工厂一跑就 `ReferenceError: Cannot access 'USER_BUBBLE' before initialization`，**整个主题不加载**（`style[data-plugin-css]` 一个都没有）。本版把声明提到两个表之前，并加了回归断言：`bg-recipes-smoke` 的"模板插值不得早于 const 声明"（已用真 bug 反向验证：把声明挪回去 → 该条 FAIL 且指名 `USER_BUBBLE`）。那条提交自带的 `DSTT_BACKGROUND_DEFAULT: classic → bold` 保留不动。

#### B1【严重】`ATTR` 从未声明 → 折射一直在死，每次切「动态背景」泄漏一个流体模拟器

`var ATTR = "data-dshome-dispersion";` 在 `d862487` 被误删，从 **v1.43.6 到 2.0.82** 无人发现：`startGlassDispersion()` 第一行就抛 `ReferenceError`，而 `startAmbient()` 在 canvas 与 rAF 都起来**之后**才走到这里，异常被 `catch (error) { dispose = () => {}; }` **静默吞掉** → 折射从未挂载（四表面 `backdrop-filter` 里没有 `url(#…)`），且**返回的 disposer 永远不存在**：开关写着"已关闭"，全屏流体仍 60 次/秒绘制，点一次多一个模拟器（实测 1→2→3，draw 调用 60→120→180）。

修法：① 补回声明（放在 FILTER_ID 一族旁）；② 流场与粒子的帧循环**自带自清理**——canvas 一离开 DOM 就停，任何"抛在半路"的挂载都不会变成后台常驻模拟器；③ 调用处 catch **不再静默**（`console.error` + 扫掉孤儿 canvas）；④ 新增 8 条"CSS 契约名必须已声明"断言（`ATTR/SPOT_ATTR/SPEC_X/SPEC_Y/FILTER_ID/TALL_FILTER_ID/COMPOSER_FILTER_ID/WIDE_FILTER_ID`）——`node --check` 看不见未声明标识符，这正是它藏了 19 个版本的原因。

#### B5【严重】提示气泡被改成 `position:relative` → 光标下的控件被顶走 → 自激

`LIQUID_BUBBLE` 是**逗号列表**却当**前缀**用：`html[data-dshome-glass="liquid"] ${LIQUID_BUBBLE}{…}`。CSS 前缀只约束紧邻的那一个分支，**逗号后的分支完全在闸门外**；那个分支 `[class*="bubble" i]:not([data-chat-flow-kind="assistant-step"] *)` 命中了产品的**提示气泡**（`._bubble_1nw3t_1`，`position:fixed`）→ 被主题的 `position:relative` 覆盖 → 浮层变流内元素，在对话框尾部行凭空占 **78px**、在消息操作栏占 **48px** → 光标下的发送/复制按钮被顶走 → hover 失效 → 提示卸载 → 按钮弹回 → 再 hover……实测发送键 `left 954.6 ↔ 876.6`（~2Hz），复制键 **2.5s 内 151 次翻转（≈60Hz）**。这也解释了"为什么必须先打字"：提示只在可发送/hover 出动作条时存在。

修法：① 改为**单个复合选择器** `USER_BUBBLE`（只在 `[data-chat-flow-kind="user"|"steering"]` 容器内），每处用法包 `:is(…)`，**未来再加分支也逃不出闸门**；② 按**形状**排除提示气泡（消息气泡 `<hash>_bubble`，提示气泡前导下划线 `_bubble_…`）＋ `:not([role="tooltip"])` 双保险；③ 两条本该在闸门内的暗色规则补上 `html[data-dshome-glass="liquid"]`（此前在白磨砂下也生效）；④ 被删掉的"刚输入的消息"分支**有意不补**：它在回合被消费前的一瞬不涂玻璃，是审美等待；会瞬移的按钮不是。

#### B2【中】三个产品 hash 类名已改名 → 三个补丁块永久跳过

`pXSMma_headlineText` → `pXSMma_headline`、`nL4_yW_sessionLogButton` → `nL4_yW_moreButton`、`gdEzaW_bubble` → `Sixlwa_bubble`/`oRe1gG_bubble`：三处改为**按后缀匹配**（`[class*="_headline"]`、`[class*="_moreButton"]`、`USER_BUBBLE`），与仓库已有的 `[class*="_fade" i]` 同一套路；用户气泡的玻璃块锚点换成 `.wSkVaW_scrollBody` —— 白磨砂下的用户气泡因此重新拿到 `rgba(255,255,255,.6)` + `blur(16px)`（此前实测 `background: rgba(0,0,0,0)` + `backdrop-filter: none`）。

#### B3【中】锚点守卫是"一次性 30 秒窗口" → 晚打开的界面永远拿不到补丁

原来 30 秒内锚点不出现就 `disconnect()` 且不再重试：实测加载后 ~4s 展开侧栏 → 补丁注入；>30s 才展开（默认就是折叠）→ **永不注入**，设置面板/进度面板/轨迹视图全在这个集合里。修法：观察者活到插件结束，代价有界（重查按 rAF 节流、落空不排下一次、块落地即 `disconnect`），15s 时打一行 `patch waiting: …` 带上全部候选锚点。

#### B4【低】README 勘误

「对话 / 轨迹」标签并非常驻：会话视图下默认 `display:none`，只有标题栏悬停（`.dshome-swap`）或轨迹视图存在时才显示。

### 验证
- **`tools/parse-smoke.mjs`（新增）13/13**：`lib/` 与 `tools/` 每个文件过 `node --check`。它抓到的第一个真问题就是本次自己造的——`tools/gui-probe.mjs` 一句注释在模板字符串里写了反引号（Node 的报错还不带文件名）。
- **`tools/bg-recipes-smoke.mjs` 73/73**（新增 9 条：8 条 CSS 契约名已声明 + 1 条插值顺序）。插值顺序那条**已用真 bug 反向验证**：`.tmp-inspect/proof-tdz.mjs` 把声明挪回原位生成 `client-tdz.js` → 该条 FAIL 且指名 `USER_BUBBLE`；修好的树 73/73。
- `tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **真机复核未完成**：收敛后被沙箱策略挡住（审批改为 never → 起不了 headless Chrome、不能把工作副本热替换进 profile）。装包后请确认三件事：`document.documentElement.hasAttribute('data-dshome-dispersion')` 应为 `true`、`document.querySelectorAll('svg filter').length` 应为 `4`、`getComputedStyle(document.querySelector('._bubble_1nw3t_1')).position` 应为 `fixed`（第三件事就是"按钮跳动"是否根治的判据：打字后把鼠标停在发送键上，按钮不应再横向瞬移）。

### 退路
`@2.0.82`（悬停放大/倾斜 + 白磨砂）、`@2.0.81`。

### 附：版本链备注
`v2.0.83`（`54fa442`，另一会话）只做了一件事——默认背景方式 `classic → bold`，并顺手把当时**未提交**的现场修复合进了同一个提交（即本版的前半部分）。它同时带进了上面那条激活期崩溃，**不要发布 2.0.83 的产物**：本版才是可用的那一版。

---

## v2.0.82 — 2026-09-15

### 修复：2.0.79 把「对话框悬停的放大 + 倾斜」修没了（本次恢复），并把横向滚动条那条修法扩到整个会话列

**用户报回**：按钮跳动的 bug 仍在，而且**鼠标放到对话框上，放大和倾斜都没了**。后者是 2.0.79 的直接后果，两条都矫枉过正：

1. `TILT_SCALE: 1.01 → 1` 去掉了抬升（= 放大）；
2. 把 `input / textarea / [contenteditable]` 也算成"不能压在动面上的控件"——**输入框几乎盖满整张卡片**，把它排除等于让倾斜在"鼠标放到对话框上"这个它唯一存在的姿势里永不触发。

两条同因：为了切断一条自激回路，把效果本身删掉了。**这是修法造成的缺陷，不是用户的错觉。**

### 改法（保留效果，切断回路）

- `TILT_SCALE` 恢复 **1.01**；
- `TILT_INTERACTIVE` 更名 `TILT_CONTROLS`，只留 `button / [role=button] / a[href] / [class*="andle" i]`——**文字录入不再挡**（倾斜是带着输入框一起动的，指针不会掉出去）；
- **滞回取代"越界即释放"**：指针进入控件时**冻结当前角度**（不重画、不回弹、不重新武装），回到卡片空白处续上，只有指针**离开卡片自己的矩形**才释放，释放后有 `TILT_COOLDOWN_MS = 200` 冷却才允许下一次进入。那条回路需要"释放"来喂它；指针静止时倾角是死的，没有反馈通路；
- **两套玻璃配方都倾斜**（用户第二条要求：「白磨砂玻璃也要有」）：原先 `paint` 与 `onOver` 各有一道"不是 `liquid` 就早退"的闸门，白磨砂用户永远看不到这个效果。闸门拆掉，并且**运动自带过渡** `TILT_TRANSITION`（值与原液态样式表里那条相同，随内联 transform 一起清掉），配方少一条 `transition: transform` 也不会变成硬跳；
- 新增诊断 `window.__dshomeTilt()` → `{ recipe, leaning, frozen, engagements, sinceRelease }`：效果"不见了"时先看 `recipe`（两套配方现在都该倾斜，`engagements` 一直是 0 才说明守卫有问题）；
- **横向裁切扩到整个会话列**：`[class*="scrollBody"]` → `[class*="scrollBody"],[class*="composerSeat"],[class*="viewArea"]`。机制只需要**一个** `overflow-y: auto` 的容器（另一轴会计算成 `auto`，于是能长出横向滚动条）+ 一个悬停变宽的子孙；首次报告点名的是消息列，但**同样的 8px 台阶可以来自对话框自己的容器**，那是 2.0.78 没覆盖到的部分。弹到 `<body>` 的浮层不受影响。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **64/64**（本版替换了 2.0.79 那条断言——它把 `TILT_SCALE = 1` 钉住了，等于把一次误修固化进回归测试；新断言钉抬升 1.01、`TILT_CONTROLS` 不含文字录入、冻结两处入口、冷却、"释放只发生在离开卡片矩形"、"两套配方都生效 + 运动自带过渡"）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **按钮跳动仍未结案**：本版把"横向滚动条"这一类的覆盖面补全，但**没有**拿到症状机器的逐帧数据。现场探针 `tools/symptom-probe.js`（19 项自测全绿）可一次给出：补丁块是否落地、每个横向溢出容器及其超宽子元素、`run(秒)` 的逐字段 diff（谁的 box/transform 在动、动了几 px、多快）、以及 `tilt(false)` / `clip(true)` / `glass(false)` 对照。

### 退路
`@2.0.81`（方块那条的治本版）、`@2.0.80`、`@2.0.78`（横向裁切的首版，注意它同时含被本版撤销的倾斜改动）。

---

## v2.0.81 — 2026-09-15

### 治本：流场从 RGBA8 换成 RGBA16F（集显"飘方块"的根因）

「集显上飘动的正方形方块」的真正来源不是精度限定符（那是 2.0.74 修的一半），而是**流场的存储精度**：四分之一分辨率的流场一直存在 **RGBA8** 纹理里，每通道 8 位。

**实测证据**（headless Chrome 跑**随包发布的同一份 GLSL**，SwiftShader/Vulkan，同一条刷子扫 60 帧后衰减 180 帧，共 240 步）：

| 存储 | R 通道 max | mean | 取值分布 |
|---|---|---|---|
| RGBA8 | 0.047 | **0.0172** | 13 级，全部落在 1/255 网格上 |
| RGBA16F | 0.0002 | **0.00002** | 连续（无网格） |

机制：`prev.r *= u_decay`（`mix(0.5, prev.gb, u_decay)` 同理）每帧被舍入到 **1/255**，于是弱值**卡住不再下降** —— 真实值已衰减到 0.0002 时，8 位场还停在 0.017（**高约 85 倍**），整片场挤在十几个台阶上。显示着色器的域扭曲把这些台阶的等值线画出来，就是你看到的方块。

### 改法

- **优先 `RGBA16F`，并且是探测出来的**：先请求 `EXT_color_buffer_float`，再用一个 4×4 的探针纹理确认 FBO 真的 complete；任一不满足就**诚实地退回 RGBA8**（不会出现"看起来支持却渲染不出"）。
- 种子改用 `clearColor(0, 0.5, 0.5, 1)` + `clear`，替掉原来的 `Uint8Array` 上传——两种格式握手方式不同、种子值相同。
- 新增诊断：`window.__dshomeFluidFormat` 报 `"rgba16f"` 或 `"rgba8"`（和构建标记一样可直接从页面读），出问题时"这台机器拿到的是哪种场"一眼可见。
- **分辨率不动**（仍是 1/4）：精度是这次的问题，提分辨率会让 GPU 开销 ×4；若将来仍有伪影，改 `width / 4` 一个常数即可。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- **对照实验**：上面那张表（构建脚本从 `lib/client.js` 里抠出真实着色器，跑在无头 Chrome 里，两种格式各 240 步后读回统计）。
- `tools/bg-recipes-smoke.mjs` **61/61**（新增本版断言：扩展请求、格式/类型三元、`__dshomeFluidFormat`、clear 种子）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **待你在集显那台复验**：`window.__dshomeFluidFormat` 若是 `rgba16f` 且方块消失，就是治本成功；若它报 `rgba8`（那台机器没有 `EXT_color_buffer_float`），方块可能仍在——**动态背景开关**仍是立刻可用的退路。

### 退路
`@2.0.80`、`@2.0.79`、`@2.0.75`（动态背景开关）。

---

## v2.0.80 — 2026-09-15

### 修复：发送按钮的跳动（我们自己的最后一条 hover 位移）

用户指出剩下的现象是**发送按钮跳动**。查下来是**我们自己的规则**：`.uV2eYG_primary:hover{…;transform:translateY(-1px)}` —— 2.0.79 只收了倾斜的 `scale(1.01)`，这条 1px 抬升还在（它来自当初给主按钮写的样式，不是产品的）。1px 的表面位移足以把 hover 交给邻居或列的宽度把手，与 2.0.79 是同一类闭环。

**改法**：`.uV2eYG_primary:hover` 只留阴影，去掉 `transform`。产品自己对这颗按钮的 hover 只改背景色，所以现在**没有任何东西会在指针底下移动它**。

### 顺带：把「反引号事故」的守卫扩到整张 CORE_CSS

这条注释里的 `translateY(-1px)` 被我用反引号包起来，**第四次**把模板字面量提前闭合（`node --check` 当场抓到）。原来的守卫只查「背景配方」那一段注释；现在改成：从 `const CORE_CSS = \`` 走到**第一个后面紧跟分号的反引号**（那才是真正的终止符），中间再出现反引号即判失败。四次里有三次是我干的，这次守卫终于覆盖全表。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **60/60**（新增：本版「只改颜色与阴影」断言、整表反引号守卫）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **待你复验**：`window.__dshomeBuild` = `2.0.80 no-hover-motion`；若发送按钮仍在跳，用逐帧采样看 `replaced=`（按钮节点是否被产品在流式期间反复重建）。

### 退路
`@2.0.79`、`@2.0.78`、`@2.0.77`。

---

## v2.0.79 — 2026-09-15

### 抖动后半段：我们自己的倾斜（`scale(1.01)` + 在控件上也倾斜）

2.0.78 的 `overflow-x: clip` **在真机上确认有效**：新采样里 `scrollWidth/clientWidth = 891/891`、`clientHeight` 恒定 **842**、卡片 top 不再被推 8px——旧的"滚动条 → 上移 8px"链条断了。用户随即反馈"闪得更快了"，逐帧采样（rAF）把剩下的那半抓了出来：

```
#8  … card=700/757 … under=div.uV2eYG_row        hovCard=1
#9  … card=700/758 … under=button.uV2eYG_primary hovCard=1
#16 … card=699/765 … under=button.uV2eYG_primary hovCard=1
#21 … card=699/761 … under=div.wSkVaW_widthHandle hovCard=0
#23 … card=700/757 … under=div.wSkVaW_widthHandle hovCard=0
#27 … card=700/757 … under=div.uV2eYG_row        hovCard=1     ← 循环
```

- **卡片宽度 757 ↔ 765**（正是 `scale(1.01)` = 757 的 1% ≈ 8px）在指针**静止**时反复涨落；
- 翻转点上指针底下在**对话框自己的控件**（`uV2eYG_primary`、`uV2eYG_trailing`、`JObwrW_*`）与**列的宽度拖拽把手**（`wSkVaW_widthHandle`）之间来回；
- 机制：倾斜把卡片边缘推出 8px → 指针底下的元素换人 → 倾斜被解除或重新武装 → 过渡只有 0.1–0.24s，所以**比被滚动条中介的那条更快**（用户感受："闪得更快了"）。

### 修法（两处，都在悬停倾斜里）

1. **不再抬升**：`TILT_SCALE = 1.01 → 1`。倾斜（两个旋转）保留——它只让画面动约 1px，而 1% 放大是唯一会推动卡片边缘 8px 的部分。
2. **指针在交互控件/拖拽把手上时不倾斜**：新增 `TILT_INTERACTIVE = 'button,[role="button"],a[href],input,textarea,select,[contenteditable],[class*="andle" i]'`，在 `pointerover` 与 `pointermove` 两个入口都判定（后者是必须的：指针可以不动而表面滑到控件下面）。`andle` 用子串匹配覆盖 `wSkVaW_widthHandle` 之类，不钉死散列类名，且大小写不敏感。

效果：倾斜只在对话框的**非控件区域**触发；指针压在按钮上时，卡片一格都不动。代价：悬停按钮时不再有那一点点"抬起来"的立体感——这正是当初造成 8Hz 抖动的那部分。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **58/58**（新增本版断言：`TILT_SCALE = 1`、两处 `closest(TILT_INTERACTIVE)`、`[class*="andle" i]`）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **待你复验**：在原处移动鼠标，抖动应当消失（`window.__dshomeBuild` = `2.0.79 tilt-stands-down`）。若仍有翻转，逐帧采样里 `under=` 会在两个元素之间跳——把那一对名字发我，多半是产品自己的 `uV2eYG_trailing / JObwrW_*` 悬停态在互换，我再按同样方法处理。

### 退路
`@2.0.78`（只断滚动条链）、`@2.0.77`、`@2.0.76`。

---

## v2.0.78 — 2026-09-15

### 修复：「悬停时按钮跳动 + 底部滑块闪」——真凶定位并断链

用户报的现象（鼠标在对话框右端移动 → 两颗按钮观感来回跳 + 底部滑块闪进闪出）这一版结案，**根因在产品侧，主题负责断链**：

**定位链（真机采样，证据登录 README 与提交信息）**：

1. 会话滚动区 `wSkVaW_scrollBody` 出现横向溢出：`scrollWidth 917 > clientWidth 891`，**溢出元素是消息行的 `span._bubble_*`** —— 产品在悬停消息时展示的操作栏把那一行撑得比列宽；
2. 横向溢出 → 生成 **8px 细横向滚动条** → 同一滚动区 `clientHeight 842 → 834`；
3. 对话框固定在该滚动区下方 → 卡片 `top 699 → 691`（−8px，与滚动区高度严格同步）；
4. 指针因此落到另一个元素 → 操作栏收起 → 滚动条消失 → 对话框落回 → 回到第 1 步：**~5Hz 两态自激**。

**排除项**（都有数据）：`transform` 不参与布局，所以我们的「对话框悬停倾斜」（±1–3px、`scale(1.01)` 使卡片 757↔765）**不可能**改变任何元素的 `contentRect`——它不是这 8px 的来源；better-sidebar 的中心列标记（`data-dsh-center-col`／`--dsh-sidebar-height`）在该页面上不存在，也已排除。

**处置**：新增守护补丁块 —— 会话滚动区 `overflow-x: clip`（锚点 `.wSkVaW_scrollBody`，规则按 `[class*="scrollBody"]` 子串匹配）。横向不再产生滚动条 → 那 8px 不存在 → 闭环断开。代码块自己的横向滚动不受影响。代价：超出列宽的部分被裁而非可滚动（聊天列里更小的恶）。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **57/57**（新增本版断言：守护块 + `overflow-x:clip`）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。
- **待你复验**：装上后在原来那两颗按钮附近移动鼠标，抖动与滑块应当消失；`window.__dshomeBuild` 应为 `2.0.78 no-sideways-scroll`。

### 退路
`@2.0.77`、`@2.0.76`、`@2.0.75`。

---

## v2.0.77 — 2026-09-15

### 商城适配：壁纸引擎在渲染时，①②/浓三色 给出「切到 ③」提示（**不自动切**）

2.0.76 留下的缺口：壁纸引擎在画壁纸时，①②/浓三色 的流体与主题底色会**盖在它的壁纸上面**（它的图层 `.we-layer{z-index:-2}` 在 body 背景之上、内容之下，而我们的流体在 `z-index:-1`）。原方案是"检测到就自动视为 ③"，按决定改成**提示**：

- DSTT 面板在 `body[data-we-wallpaper]` 存在、且当前档位不是 ③ 时，多出一行**橙色提示**（`.dshome-dstt-warn`）：写明"这一档的流体与底色会盖住它"，右侧一个「切到自选背景」按钮，点一下切到 ③。
- **绝不替用户改档位**：标记的 MutationObserver 只 `dsttNotify()`（重渲染面板），**不调用** `dsttSetBackground`。冒烟新增一条断言专门钉这个（源码里不得出现 `MutationObserver(() => dsttSetBackground`）。
- 提示随壁纸引擎启停**实时**出现/消失，无需刷新。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **56/56**（新增本版断言）；`tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**。

### 退路
`@2.0.76`、`@2.0.75`、`@2.0.74`。

---

## v2.0.76 — 2026-09-15

### 插件商城适配：与 `dsh-plugin-wallpaper-engine` / `dsh-better-sidebar` 共存

商城里的壁纸引擎与右侧栏是本主题会**重叠**的两个插件（壁纸引擎的 prerequisites 还明确要求 better-sidebar）。这一版把分工写成契约（README 新增「插件商城适配」一节，含适配清单表）：

**③ 自选背景的语义重写**（本轮核心）：

| 状态 | 背景由谁画 |
|---|---|
| ③ + 壁纸引擎正在渲染（`body[data-we-wallpaper]`） | **它**。我们流体卸载、主题底色让位、**连纯白也不画** |
| ③ + 没有壁纸引擎 | **我们**：纯白（浅色）/ 纯黑（深色） |
| ③ + 输入框填了图片 / CSS 值 / `desktop` | **我们**（若壁纸引擎在跑，它在壁纸引擎图层之下） |
| ①②/浓三色 | 我们（per-colour 渐变 + 流体），与从前一致 |

- **探测只读**：壁纸引擎渲染时会在 `body` 上置 `data-we-wallpaper`（它自己的 `ACTIVE_ATTR`），停止时移除；本插件用 MutationObserver 跟随，**不读它的设置、不写它的属性、不碰它的 DOM**。它的壁纸层是 `.we-layer{z-index:-2}`（body 背景之上、内容之下），所以"我们不画"才是正确解，而不是拿白色垫在它下面。
- **让位靠选择器，不靠 `!important`**：主题自己的四条背景规则改成带 `:not([data-dshome-bg=custom])`，进 ③ 就不匹配；壁纸引擎自己的 `body[data-we-wallpaper]` 样式因此不会被我们压掉。它管设置窗/侧栏玻璃的两个开关（`data-we-glass-window` / `data-we-sidebar-glass`）我们不插手。
- **`desktop` 变成显式取值**：留空不再等于"用本机壁纸"（2.0.75 的临时语义），留空 = **不画**（纯白/纯黑或让位）。要用本机壁纸就在 ③ 里点「桌面壁纸」按钮（写入 `desktop`），宿主端读取与铺满方式不变（`WallpaperStyle` → CSS 变量）。
- **better-sidebar 不越界**：只读 `[data-dsh-better-sidebar]` / `[data-dsh-center-col]` 作文档与自查线索，不写中心列尺寸、不动它的 tab 栏与面板内部；README 记下它与本主题「对话框悬停倾斜」的**已知交互**（它的面板宿主几何同步遇到**页面级** transform 会降级；我们的倾斜是卡片级，若同装后出现悬停抖动，按 README 的两步二分定位）。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs` **55/55**：新增「四条 `:not([data-dshome-bg=custom])` 选择器让位」「flat / none 两个基底规则」「空值不再解析为壁纸、`desktop` 是显式取值」「壁纸引擎标记就是它自己的属性且被 MutationObserver 跟随」。
- `tools/dstt-schema-smoke.mjs` **29/29**；`tools/bridge-smoke.mjs` **26/26**；壁纸端点本机端到端（2.0.75 已验，含 `spawn EPERM` 失败路径）。
- 期间冒烟**又抓到一次**「CSS 注释里写反引号把模板字面量提前闭合」（第三次，其中两次是我犯的）——守卫按预期生效。

### 退路
`@2.0.75`、`@2.0.74`、`@2.0.73`。

---

## v2.0.75 — 2026-09-15

### 新增：动态背景总开关（`ambientBackground`，默认开）

给"这层动画背景"一个直接的关断，不再只靠修着色器：

- **关掉 = 不挂载 WebGL2 流体，也不回落到粒子**（不是 CSS 把它藏起来——藏起来的画布照样在算，正是集显最受不了的）。背景只剩静态配色：①②/浓三色就是那套 CSS 底色，③ 就是你自己的图/色。
- 理由写进设置面板了：集显把流体画成方块、或风扇被它拉满时，关这个。**开关是控制器层面的**（挂载/卸载），所以关掉后 GPU 占用是零，不是"看不见但仍耗电"。
- 这一版同时保留 2.0.74 的 `mediump → highp` 修复；两者不冲突：`highp` 解决"算错"，开关解决"我不想让它算"。

### 新增：③ 自选背景留空 = 用桌面壁纸（`customBackground` 空值语义）

- **网页读不到系统壁纸**（没有任何 Web API），所以由**宿主端**读：优先 Windows 的 `TranscodedWallpaper`（当前实际显示的那张，含每屏裁切/幻灯片当前帧/纯色），退回注册表 `HKCU\Control Panel\Desktop\WallPaper`，再退回 `HKCU\Control Panel\Colors\Background` 的纯色。
- 图片经**同源围栏下的 GET 子路径**（`/dshome-open-workspace/wallpaper`）发给本页做 CSS 背景。该端点**不接受任何输入**——没有路径参数、没有查询串，所以它能供出的永远只有宿主自己解析到的那张图；`Cache-Control: no-store`，换了壁纸刷新即见。
- **铺满方式跟随 Windows 自己的 `WallpaperStyle`**（10 填充 / 22 跨屏 → `cover`，6 适应 → `contain`，2 拉伸 → `100% 100%`，0 居中 → `auto`；`TileWallpaper=1` → `repeat`），所以页面上看起来和桌面一致。
- 输入框右侧实时给状态：`桌面壁纸 · 已就绪 / 纯色 / 读取中 / 读不到桌面色 · 用主题底色`，旁边有「桌面壁纸」按钮一键切回留空。**空值/读不到都不会白屏**——退回主题底色（沿用 2.0.73 的门控：没有 `data-dshome-customkind` 那五条规则不匹配）。
- **隐私**：只在你选了 ③ 且输入框留空时读一次本机壁纸，只发给本页（回环），不上传、不缓存、不落盘。README 的隐私一节同步写明。

### 验证（本轮实际跑过的）
- `node --check lib/index.js lib/client.js` 通过。
- `tools/dstt-schema-smoke.mjs` **29/29**（新增：`ambientBackground=false` 的写入往返 + 设置文件校验 + 读取路径必须回布尔）。
- `tools/bg-recipes-smoke.mjs` **53/53**（新增：开关必须由**控制器**而非 CSS 生效、面板暴露开关、两端字段名一致、两端端点名/子路径一致、空值→壁纸分支、`WallpaperStyle` → CSS 变量、宿主不信任任何客户端路径）。
- `tools/bridge-smoke.mjs` **26/26**。
- **壁纸端点本机实测**（临时探针，起真实路由后 fetch）：`{"kind":"image","url":"/dshome-open-workspace/wallpaper","source":"transcoded","style":22,"tile":false}`，随后 `GET` 该子路径 → `200 image/jpeg 452,964 B`（JPEG 魔数校验通过）。
- 沙箱下 `spawn EPERM`（Node 抓子进程输出被拦）会被端点吞成 `ok:false`，客户端随即退回主题底色——**失败路径也验过了**。
- **未做**：集显那台装 2.0.75 后的观感复验（需要你装）。

### 退路
`@2.0.74`、`@2.0.73`、`@1.43.12`。

---

## v2.0.74 — 2026-09-15

### 修复：集显上流体背景出现「飘动的正方形方块」

**症状**：同一份代码，在另一台机器上背景不是平滑洗色，而是一块块**倾斜的方块**在飘。

**归因（在那台机器上实测到的值）**：

```
build    : 2.0.73 bg-recipes
dpr      : 1.2395833730697632
renderer : ANGLE (Intel, Intel(R) Arc(TM) 130V GPU RI (8GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)
```

- **主因是 `mediump`**：ANGLE 走 D3D11 时把 GLSL 的 `mediump float` 翻成 HLSL `min16float`，而 **Intel 核显原生就是 16 位浮点**——桌面独显普遍把 mediump 提升为 32 位，所以这台机器上独有。显示着色器的噪声是 `fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123)`，需要约 24 位尾数才读起来像噪声；16 位下哈希塌成常数平台，**噪声格点本身**就成了可见的正方形（这台机器上格子尺寸约等于屏幕宽/13）。着色器的 `uv = rotate(uv, u_rotation*.5*PI)` 让方块是斜的，`u_time` 让它飘 —— 与截图完全一致。
- **排除项**：`dpr = 1.2396` 低于画布后备尺寸的封顶 1.5，封顶没生效，不是缩放/DPR 问题。
- 另有一条有用的确认：**能看到方块说明那台机器 WebGL2 是好的**（否则会走粒子回落，画出来是圆点+连线，不是方块）。

**改法**：`precision mediump float;` → `precision highp float;`（FLOW_SHADER / DISPLAY_SHADER 各一处）。ES 3.00 强制片元着色器支持 `highp`，凡是能跑这个背景的引擎都安全；在把 mediump 提升为 32 位的 GPU 上这个改动是**空操作**（你现在这台机器观感不变）。

**署名同步**：三段 GLSL 此前写作「逐字节副本」，现在把**唯一一处改动记录在案**——`THIRD-PARTY-NOTICES.md`、README 的两处说明与 `lib/client.js` 头部注释都改了措辞，上游 MIT 归属与许可原文不变。

### 验证
- `node --check lib/index.js lib/client.js` 通过。
- `tools/bg-recipes-smoke.mjs`：**44/44**（新增一条「两个着色器都必须声明 highp，且不允许 mediump 回归」）。
- `tools/dstt-schema-smoke.mjs` **26/26**；`tools/bridge-smoke.mjs` **26/26**。
- **待复验**：在那台机器上装 2.0.74，`window.__dshomeBuild` 应为 `2.0.74 highp-noise`，方块应当消失。

### 未做（可选，等确认）
- `u_pixelRatio` 传的是**未封顶的真实 DPR**，而画布后备尺寸按**封顶 1.5** 计算 —— 在 DPR > 1.5 的机器上噪声尺度会比设计值小三分之一，也就是各机器观感略有差异。统一它会让高 DPR 机器上的噪声**变大一点**，即会改动你现在这台喜欢的样子，所以我没有动。
- npm 仍是 `1.43.12`，插件市场因此还停在旧版本（要发我就 `npm publish`）。

### 退路
`@2.0.73`（背景方式四选 + 复核修复）、`@1.43.12`（浓三色）、`@1.43.11`（柔和画布）。

---

## v2.0.73 — 2026-09-15

> 1.43.10–1.43.12 的逐版说明在 `releases/notes-1.43.*.md`（那三版是当晚的连续回滚/修复，未回填进本表）。

### 新增：背景方式四选（`backgroundMode`，默认 ①）

面板多一行「背景方式」，**切换即时生效、不用刷新**：

| id | 面板 | 流体三色（浅色 / 深色，蓝族为例） | 参与颜色数 |
|---|---|---|---|
| `classic`（默认） | ① 主色+纯白+近白 | `#5E82DE #FFFFFF #D8E2FA` / `#2C4A9E #050F26 #122A5C`（绿、红同构） | 3（同一色系，无第二种色相） |
| `white` | ② 主色+纯白 | `#5E82DE #FFFFFF #FFFFFF`（第三个 uniform 复用白；深色复用该族近黑） | **2** |
| `custom` | ③ 自选背景 | 无流体画布 | 0（背景是你自己的图或色） |
| `bold` | 浓三色 | 1.43.12 那套（均值 蓝 `67,122,226` / 红 `219,78,87` / 绿 `40,164,115`） | 3 |

- **① 为什么是默认**：用户翻出旧截图确认「按钮绿、背景绿，下午三点一切正常，好看」。要的从来不是换掉那套颜色，而是修完安装问题后冒出来的**绿蓝混色**（画布不跟令牌，1.43.12 才修掉）。所以 `classic` 逐字节取回 1.43.11 的调色板做默认；`bold` 保留可选（原话：「不好看，可以保留」）。
- **③ 自选背景**：`customBackground` 收**图片 URL 或任意 CSS 背景值**（`url(...)` / `linear-gradient(...)` / `#RRGGBB`）。**合法性由浏览器判定**（客户端 `CSS.supports`），宿主只做去空白 / 去控制字符 / 长度上限 2000 —— 宿主猜 CSS 只会把合法值误杀。
  - 颜色只驱动**按钮与品牌 token**；流体/粒子画布在 ③ 下**整体卸载**（不是藏起来），否则 0.55 的流体洗色会盖住并重新染色你的图；切回任一配色方案会自动重新挂载。
  - **深色蒙版**：`linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55))` 放在 `background-image` 的**第一层**，图仍在下面看得见；纯色背景同样压这一层。
  - **空值 / 不合法值不白屏**：五条 CSS 全部门控在 `data-dshome-customkind` 上，不匹配就退回主题自己的底色；输入框右侧实时给「可用 · 图片 / 可用 · 纯色 / 暂不可用 / 留空 = 用回默认底色」。

### 发布前复核修掉的三处（其中一个是从 1.43.6 就埋着的老雷）

一次独立复核（只读、钉在提交上）抓出两处 blocker + 一处 should-fix，都已修：

1. **`darkSync` 不在作用域里**（`lib/client.js`，继承自 1.43.6）：`startAmbient()` / `startParticles()` 都读 `darkSync`，而它当时是 `apply()` 的局部变量，两个函数根本看不到 —— 每次挂载都抛 `ReferenceError`，又被挂载处的 `try/catch` 吞掉。后果：**画布起来了但拿不到 disposer**，所以 ③ 自选背景「卸载画布」是空操作（0.55 的流体照样盖在你的图上）；无 WebGL2 的粒子回落更是「append 了但没 resize、没起动画」；深浅色订阅与令牌 MutationObserver 也从未注册（一直只靠那个 200ms 轮询撑着，所以没人发现）。修法：把 `let darkSync = null;` 提到工厂作用域（`apply()` 里只做赋值）。
2. **自选背景的「纯色」根本没画上去**：本样式表第一行就是 `html,body{background-color:transparent!important}`，作者 `!important` 压过任何非 `!important`，而我的三条 `background-color` 没带 —— 于是 ③ 选纯色时颜色静默失效，同时基规则已经把主题渐变清掉了（两个图片兜底色 `#f6f7fb` / `#0b0f17` 也一样失效）。修法：那三条 `background-color` 加 `!important`（`background-image` 不受那条规则影响，不需要）。
3. **面板自己宣传的写法被自己拒了**：占位符第一个示例是裸 URL（`https://…/bg.jpg`），但裸 URL 既不是 `<color>` 也不是 `<url>` 记号，`CSS.supports` 两边都不认 → 显示「暂不可用」且不生效。修法：新增 `normalizeBackgroundValue()`，URL 形状的值先包成 `url("…")`（转义引号/反斜杠、去掉换行）再校验与落盘。

顺带按复核意见收的小尾巴：`data-dshome-bg` 注释写错成 `<html>`（实为 `<body>`）；输入框未提交的草稿在面板卸载（Esc/关闭设置）时会丢，现在**卸载前先提交**（用 latest-ref 拿最新草稿，另加 Esc 即提交）；启动时先按默认 `classic` 挂载再拆会闪一下流体，现在**等首次持久化读取落地再挂**（新增 `dsttState.settled`）；自定义值归一化后回显的比对改为 trim 后比较；`dstt-schema-smoke` 的未知 id 断言去掉了一个恒真表达式并加了空值保护。

### 验证（本轮实际跑过的）
- `node --check lib/index.js lib/client.js` —— 两者通过。
- `tools/dstt-schema-smoke.mjs` —— **26/26 全绿**：原 10 项 + 背景字段往返 8 项 + 未知 id 拒写 + 自定义值归一化（`"  url(x.png)\n\t  "` → `"url(x.png)"`）+ 「客户端枚举 = 宿主枚举」跨文件检查。
- `tools/bg-recipes-smoke.mjs` —— **43/43 全绿**：钉住 ① 含纯白与近白、② 只有两个颜色参与、`bold` 浅色下无 `#FFFFFF`、③ 五条 CSS 规则与 kind 门控、宿主 schema 认得四个 id，**加上**上面三处修复的回归断言（`darkSync` 必须在工厂作用域且只声明一次、三条 `background-color` 必须带 `!important`、裸 URL 必须被包成 `url()`、CSS 注释里不得出现反引号）。
- `tools/bridge-smoke.mjs` —— **26/26**。
- **未做**：装进 profile 的无头像素实测（1.43.12 那种表）。需要就说一声，我把 2.0.73 装进 web profile 跑 `tools/gui-probe.mjs`。

### 退路
`@1.43.12`（浓三色为默认）、`@1.43.11`（1.43.6 基线 + 柔和画布）、`@1.43.10`（纯粒子背景）。

---

## v1.43.9 — 2026-09-15

### 回退
- **回退到 v1.41.2 的客户端**（`lib/client.js` 逐字节取自 `v1.41.2` 标签）。原因：用户反馈「背景更蓝了」。

  1.43.6/1.43.7 修的是"标记变化没人通知背景"这条链，1.43.8 又把流体调色板换成上游的高饱和 HSL 公式 —— 结果是把那层**盖在页面上的流体画布**从"淡到看不见"变成"浓到整屏蓝"。用户要的是回到 1.41 那个观感，所以直接回退。

  实测（无头浏览器，同一页面、同一 `data-dshome-color=green`，取像素）：

  | 版本 | 画布可见时的背景像素 | 读数 |
  |---|---|---|
  | 1.43.8 | 蓝通道最高（饱和蓝流体铺满） | 蓝 |
  | 回退后 | 画布已不存在（`attachFluidShader=false`、`startParticles=true`） | 跟随 `--ds-brand` 的粒子背景 |

  **代价**（明说）：流体背景、液态玻璃（`glassStyle`）、对话框边缘倒影（`composerRefraction`）、背景模糊开关、1.41 之后的标题栏/chips/子代理面板改动，在这一版里都**没有了** —— 这就是 1.41.2 的全部功能面。想换回来用 `backup-1.43.8` 标签或 `backup/1.43.8-fluid-hsl` 分支。

  版本号仍然是 1.43.9（而不是 1.41.2），这样插件商城才会把它当成一次**更新**推送下去；包内容与 v1.41.2 的 client 一致。

### 备份
- 回退前的完整状态已存档：工作区快照 `.tmp-inspect/backup-1438-<时间戳>/`（含 `BACKUP-MANIFEST.txt`）、git 分支 `backup/1.43.8-fluid-hsl`、注释标签 `backup-1.43.8`（均已推送）。npm 上 1.43.1/1.43.3/1.43.4/1.43.6/1.43.7/1.43.8 全部保留，任何一版都能装回来。

---

## v1.43.6 — 2026-09-15

### 修复
- **切「主题模式」背景不变、切深色背景还是蓝白**——两个症状同源：**背景只认 `<body>` 上的两个标记，却没有任何人在标记变化时通知它**。实测证据（无头浏览器直连实时页面，只读探测）：

  ```
  data-dshome-color   = "blue"      <- 与 :root --ds-brand(#059669) 不一致
  data-dshome-dark    = false       <- body 属性表里根本没有这个属性
  body attrs          = data-dshome-color=blue | style=--dsh-content-font-size:
  body background-img = radial-gradient(... color(srgb 0.30 0.42 1.00 / 0.14) ...)  <- 蓝白
  ```

  三条独立缺陷叠在一起：
  1. `subscribeColor` **只在颜色字符串变化时**才发通知，而它是背景重新着色的唯一入口。模式切换只要解析出同一个颜色（例：谷时段，「峰谷红蓝」与「峰谷红绿」都解析成 valley），背景就永远收不到信号。
  2. 深色标记 `data-dshome-dark` 只有**写入方**（`createDarkSync`）没有**订阅方**。`startAmbient` 里那个 `MutationObserver` 只是"再观察一次自己"，而 `createDarkSync` 不重复写同值，于是这条监听形同虚设。
  3. 启动竞态：背景在 `dsttSync`（异步 bridge）返回**之前**就挂载并按**默认模式**解析了颜色；模式到达后的 `dsttNotify` 只让设置面板重渲染（`DsttSection` 订阅了 `dsttSubscribe`），**颜色驱动**没有被重新锚定。

  **修法**——把三处缝成一条链：
  - `createDarkSync` 返回 `{ subscribe, dispose }`，写入标记后 `notifyDark()` 通知订阅者（记录 `lastDark`，同值不重复播报）；
  - `startAmbient` 收敛出**单一同步入口** `syncFluid()`：从 DOM 重新推导参数、与上次序列化结果比对后才 `setParams`；同时挂在**颜色通知**、**深色通知**、`<body data-dshome-color>` 的 `MutationObserver` 三处，谁写的标记都跟得上；每条监听单独 `try`，一条抛错不影响其余（标准 §四.8）；
  - `watchPeakHour` 在 `anchor()` 后补一次 `setTimeout(anchor, 0)`（幂等），专治启动竞态；
  - 粒子回落路径（`startParticles`）同样接上深色通知与标记观察——它的调色板也分方案，原本有同样的毛病。

### 文档
- README 新增「鸣谢」一节，点名两个上游：[dsh-theme-mineradio](https://github.com/dhicoc/dsh-theme-mineradio)（@dhicoc：流体着色器与求解器结构、玻璃折射、光标视差、悬停倾斜的来源）与 [deepseek-harness-background](https://github.com/HaoyueQin/deepseek-harness-background)（@HaoyueQin：液态玻璃技法来源）。

---

## v1.43.5 — 2026-09-15

### 修复
- **装本主题后，产品自己的「外观」开关失效——浅色/深色切不动**。用户实测定性：

  | 实验 | 结果 |
  |---|---|
  | 主题开着 | **切不动** |
  | 把标题栏 `z-index` 临时改回 5 | 仍切不动（**排除层叠**） |
  | 摘掉本主题注入的全部样式表 | **能切**（主题随之消失） |

  ⇒ **是本主题的 CSS 在挡**，不是 JS、不是层叠。

  根因是**我自己在 1.43.1 引入的**：修「浅底浅字」时，我用 `!important` 把两个文字令牌按本主题自己的标记硬写死了——

  ```
  body{--dsw-alias-label-primary:#152443!important; ...}
  body[data-dshome-dark]{--dsw-alias-label-primary:#eef2ff!important; ...}
  ```

  这两条**压过产品自己的令牌**。用户切换外观时产品换了自己的令牌，而本样式表继续画旧值——**界面看起来就是"切不动"**。这也解释了用户记得的「1.41 左右能切」：那两行是 1.43.1 才加的。

  **修法：删掉这两条声明**，把令牌的主导权交还产品。

  > 代价必须写明：「浅底浅字」那个隐患因此**重新敞开**——标记与产品方案不一致时，文字可能再次落到背景上。取舍是刻意的：**卡死的外观开关是坏掉的控制**，而浅底浅字至少在标记一致时还能读。代码里留了醒目注释，**不要再把这两条加回去**。

### 测试

`dstt-schema-smoke` 10 项、`bridge-smoke` 26 项、`catalog-sync-smoke` 27 项，全部通过。

## v1.43.4 — 2026-09-15

### 修复
- **1.43.3 修好了改名后的机器，却把改名前的机器弄坏了——同一个缺陷的反方向**。bundle 该用哪个 id 自我注册，取决于**装的那份 `cordis.patch.yml` 里 `name:` 是什么**，而改名期间它**不是一个值**：

  | 注册 id | 装在哪个包名下 | 结果 |
  |---|---|---|
  | 旧 `@dsh-external/…`（≤1.43.2） | 新名 `dsh-deepseek-style-theme` | 报错（用户那台 Novo） |
  | 新 `dsh-deepseek-style-theme`（1.43.3） | 旧名 `@dsh-external/…` | **报错（开发机，1.43.3 引入的回退）** |

  写死任一方向都必然打破另一半。**改为用同一个工厂注册两个 id**：loader 取它要的那个，另一个表项永远不会被索取。两次注册各自套 `try/catch`——万一某个 loader 对"没请求过的 id"报错，也不能把成功的那个带走。

  这样**一个文件同时适配两种挂载**，改名过渡期的这一整类故障消失。1.43.3 只修了一半，**对改名之前安装的用户是一记回退**，所以本版必须发。

## v1.43.3 — 2026-09-15

### 修复
- **【致命】1.43.1 改名漏了客户端注册 id，凡是装了新包名的 profile 主题整个加载失败**。报错原文：

  ```
  failed to import loader entry 03f7bc74 (dsh-deepseek-style-theme): client-modules:
  bundle /plugins/??...,dsh-deepseek-style-theme/client.js&rev=... loaded without
  registering "dsh-deepseek-style-theme" via __ModuleLoader__.load
  ```

  宿主按 `/plugins/<entry.id>/client.js` 组装浏览器 bundle，然后**要求该 bundle 用同一个 id 自我注册**。`lib/client.js` 顶部的 `id:` 与 `PLUGIN_ID` 当时仍是旧 scope 的 `@dsh-external/dsh-deepseek-style-theme`，于是 bundle 加载成功却什么都没注册 —— 整棵客户端半边失效。

  - 三处必须一致，现在都等于 `dsh-deepseek-style-theme`：`package.json` 的 `name`、`cordis.patch.yml` 的 `name:`、`lib/client.js` 的注册 id。
  - **`docs/install-incident-report.md` 第 4.1 节的结论需要更正**：那里写着「`lib/client.js` 里的 id 字面量只是客户端内部 id，不参与模块解析，不必跟着改」。这一条是错的 —— 它确实参与，只是**只在装了新包名的 profile 上才暴露**：开发机上仍是旧 scoped 包，bundle URL 恰好与陈旧字面量匹配，所以一直看不出来。
  - 教训与 schema 那条同源：**改名的引用点要靠检查枚举**，`grep 旧值` 应当只在有意兼容处命中。本轮 `grep '@dsh-external' lib/` 之前有 2 处，现在是 0 处。

## v1.43.2 — 2026-09-15

### 装配与发布（不改 `lib/` 一行）
- **发布到 npm 的版本与仓库源码重新对齐**。1.43.1 已发到 npm，但此后仓库又前进了 `d862487`（本轮下文的对话框折射改动）。两个安装源因此给出不同代码：npm 上那份是旧 `lib/client.js`，git 源是新的。本版把版本号推进到 1.43.2 并重新发布，使 npm 与源码一致。
  - 发布时机很重要：插件市场的目录条目一旦认到 npm 映射，`installTargetFor()` 就会**优先返回 npm 包**、不再看 `tarball`。若不在市场切源之前把 npm 补齐，用户拿到的将是旧配方。
  - 提醒：npm 的 bypass-2FA granular token 有 7 天默认有效期，且该形态官方定于 **2027 年 1 月移除**（`docs/install-incident-report.md` 第 7 节有完整对照表与迁移建议）。

### 新增与变更
- **对话框边缘折射改为可调，新增一项设置**（`composerRefraction`，默认 `narrow`）三选一：**窄 8px / 宽 16px / 无**。设置页 DSTT 里新增一行「对话框边缘倒影」，与「玻璃风格」同形。
  - 带宽**按上下边缘标定**，因为只有那两侧看得出位移：卡片上沿紧挨「任务」栏、下沿紧挨状态行，位移跨过硬边界才显形；左右背后是连续背景，同样的位移等于没变（用户已确认接受这个不对称）。
  - 两个状态各有一张**专为该卡片做的位移图**（`400x92`，垂直带 `= (edge+softness)/92 × 1.56 × 卡片高 = 1.90 × (edge+softness)`）：窄用 `1.7+2.5`，宽用 `3.4+5`。上游那两张共享图的参数（内缩 `min(w,h)*0.035`、`blur(11)`）**一个字节未动**，白磨砂因此不受影响。
- **给对话框玻璃加了真色差**：滤镜里原本那个 `feColorMatrix` + `screen` 只是给边缘**上一层颜色**，它不动通道。现在把基准位移拆成三份——**R 走 ×1.18、B 走 ×0.82、G 走中间**（`COMPOSER_ABERRATION = 0.18`），再按通道合成，红蓝边缘因此分离。`setRefraction` 同步改成给两张额外位移图带 `data-aberration` 系数一起缩放，否则运行时会把三条都写成同一个 scale、色差被抹掉。只加在对话框那两个滤镜上：它把位移次数变三倍，而共享滤镜必须保持上游原样。
- **对话框下不再画那圈自转的品牌色 conic 环**（`.uV2eYG_card::before`，原来在 `inset:-1px` 处）。它紧贴卡片自己那条 1.5px 白边，两条边叠在一起被读成"红线外面还有一层白边"。
- **对话框自己的 1.5px 白边在液态下改为透明**（只改颜色、不改宽度，否则盒子缩 3px、里面控件全部位移）。液态的边缘回到内嵌发丝环 + 顶部内高光 + 折射。
- **自转扫边高光只保留在侧边栏**。对话框与消息气泡上的那条被反馈为"一圈白描边"而不是"光在玻璃边缘走"——小胶囊上它读不出流光。

### 修复
- **【明暗标记】两次把两个信号的可靠性搞反了，已恢复出厂优先级并在两种模式下实测**。明暗标记由两个信号推导，本轮先后试过两种"改进"，各自踩中一个信号的毛病，都由用户现场读数定位：

  | 信号 | 实测行为 |
  |---|---|
  | 主题服务 `theme.getTheme().active.colorScheme` | **在深色页面上报 `light`** —— 不可靠 |
  | `body[data-ds-dark-theme]` | 深色 `true`、浅色 `false`，两次都对 —— 可靠 |
  | `getComputedStyle(html).colorScheme` | 深色 `"dark"`、浅色 `"light"`，两次都对 —— 可靠（产品写在 `<html style>` 上的实时声明） |

  - 改成**属性优先** → 浅色模式被画成深色；
  - 改成**服务优先且属性仅在服务不可用时兜底** → 深色模式被画成浅色（服务谎报 light，兜底根本不执行）。

  恢复为出厂那句 `if (!dark) dark = 属性`——服务说 light 时由属性纠正。用户随后给出两种模式的四元读数（见上表），确认两种模式**均已正确**。这段逻辑自此不再改动，两个反例已写进代码注释。
  - 注意：这**不是**回退"浅底浅字"的修复。那次真正的修法是把 label token 声明在本主题自己的标记下、让背景与文字永远同侧；把属性提权只是治标，撤回它不影响那个修复。
- **【发布阻塞】设置取值白名单与 schema 不一致**：本轮把 `origin` 改名 `wide` 时，改到了写入路径的白名单（`COMPOSER_REFRACTIONS`）与设置页按钮来源（`DSTT_COMPOSER`），**漏了注册给设置服务的 schema 联合类型**。后果链条是：白名单放行 `wide` → 写进 `settings.yaml` → **下次启动 `register()` 校验已存文档时抛错 → DSTT 持久化整个死掉**（不是降级）。这正是 `lib/index.js` 里 1.37.x 那批遗留 mode id 存在的原因，同一轮又踩了一遍。
  - 修法两个方向都不能少：schema **补上 `wide` 同时保留 `origin`**。只加 `wide` 会让旧设置文件（存着 `origin`）在升级后校验失败；只留 `origin` 就是本次缺陷、新值存不进去。读侧另有一层迁移（`dsttComposerValue` 把 `origin` 读成 `wide`）。
  - **新增 `tools/dstt-schema-smoke.mjs`（10 项）**把这个不变量钉住：写入路径允许的每个值都必须能被注册的 schema 校验通过，遗留 id 是唯一例外。
- **设置里选「宽」会立刻弹回「窄」**：客户端在桥接请求回来后，拿 host 回执里的值**覆盖**了用户的选择。host 会接受调用但存不下这个字段（schema 校验失败），回执里就是它读到的默认值，客户端照单全收 → 属性被写回。改为**回执只用于确认，绝不写回镜像**；另给「本次会话里用户点过的字段」加同步豁免，防止后续同步再盖回去。症状由用户提供的证据定位：`data-dshome-composer` 仍是 `narrow`，且"跳回去太快了"——快得正好一个网络往返。
- **对话框设置的说明文案没跟着改名走**（按钮写「宽 16px」，说明仍讲「原样＝上游那张图、上下约 20px」），中英两侧都已改正——`wide` 现在是专为该卡片做的 16px 带，不再是上游那张共享图。
- **排队中的消息气泡没有玻璃**：一条在 agent 还在干活时打进去的消息，会在被这一轮消费**之前**就画到对话里，而那一刻它不在任何 `data-chat-flow-kind` 容器内——两个锚定选择器都落空，于是它裸着，直到被接手才上玻璃。改为取所有气泡、排除属于 `assistant-step` 的那些（那是唯一不该上玻璃的地方）。
- **回复正文会整段消失，只剩工具卡片**（用户报告："看不到你给我发的内容，只有你的操作"）。根因是**两个信号各管一半**：页面背景由本主题**自己的** `body[data-dshome-dark]` 标记画（浅色一套渐变、深色一套渐变），而消息文字的颜色来自**产品**的 `--dsw-alias-label-primary` 令牌。两者一旦不一致——标记是从主题服务推导出来的，会漏掉一次方案切换——就变成浅色页面上写浅色字：**所有没有自带背景的段落全部消失，而工具卡片因为自带底色照常可读**，正好就是"只有你的操作"。
  - 复现方式：在深色页面上抹掉本主题的标记，正文立刻变成近白色叠在近白色背景上。
  - 修法两条：①把这两个 label 令牌**同时声明在本主题自己的标记下**，让背景与文字由同一个信号决定（取值与 `theme.overrideTokens()` 已装的一致，因此正常页面上重绘结果完全相同）；②`createDarkSync` **总是**监听产品自己的 `data-ds-dark-theme`，而不再只在主题服务缺失时才监听，并把产品属性作为优先判据——这样漏掉一次 `theme/change` 也能自愈，而不是一直错到下次刷新。
- 这个缺陷同时解释了本轮开头那次"发消息后没有任何回复"的报告：症状相同，只是当时没能复现出来——它在我的探测浏览器里一直是正常的，因为那边的两个信号恰好一致。

### 测试
三个套件全过：`dstt-schema-smoke` **10 项**、`bridge-smoke` **26 项**、`catalog-sync-smoke` **27 项**。

`dstt-schema-smoke` 这次同时补上了一直缺的那半证明——**它能抓到缺陷 schema**。做法不需要改动被测文件：把测试指向**尚未更新的 profile 安装副本**（那里的 schema 还是旧的 `narrow|origin|off`），它如实报出

```
FAIL  a settings file holding composerRefraction="wide" still validates
      [$.composerRefraction expected "narrow" | "origin" | "off" but got "wide"]
SMOKE FAILED (2/10)
```

装上新代码后同一测试 10/10。原始输出留在 `.tmp-inspect/evidence-defective-schema-caught.log`。

### 未验证
- **本轮所有视觉改动都没能在无头浏览器里复核**：Chrome 起得来（`/json/version` 有响应），但 CDP 的 WebSocket 一直不回应 `Page.enable`，新起的实例一律如此（`--remote-allow-origins=*`、换 profile、分离进程、后台任务都试过）。因此 8px/16px 的带宽、±18% 的色差都是**按几何算出来、按代码写进去**的，没有一张截图佐证。
- `lib/index.js` 的文件损坏事故（PowerShell `Get-Content -Raw` 按 CP936 解码 UTF-8 并回写）与恢复过程见 `docs/dstt-schema-defect-and-corruption-report.md` 第 B 节；本轮已从 `HEAD` 重建，两个半边均通过 UTF-8 无替换字符校验。

### 装配与发布（不改 `lib/` 一行）
- **包名改为无 scope 的 `dsh-deepseek-style-theme` 并发布到 npm**。原因是插件市场的目录条目登记了一条「`/releases/latest/` + 写死版本号」的 release 资产 URL，`latest` 一走动就 404，用户一键安装失败；而市场解析安装源时 **`npm` 命中即返回、根本不看 `tarball`**，改发 npm 可一举绕开这类 URL 腐烂，同时免去 `github:` 安装要走的 `git clone`（企业 TLS 代理下必失败）。
  - 原包名 `@dsh-external/dsh-deepseek-style-theme` **发不出去**：`@dsh-external` 这个 npm scope 属于他人（`wulei1107`），不是本项目命名空间。这也是仓库里 `.gitignore` 至今留着 `dsh-external-*/` 的历史原因。
  - **`cordis.patch.yml` 的 `name:` 已同步改为 `dsh-deepseek-style-theme`**。它是 Loader 用来解析模块的说明符，与 `package.json` 的 `name` 必须严格一致，否则插件装配失败；而 `id: ui-skin-deepseek-style` 与 `lib/client.js` 里的 id 字面量与之无关，未改动。
  - `package.json` 补 `keywords` / `homepage` / `repository` / `bugs`。其中 **`repository` 是功能性的**：市场目录的 npm 映射由 `awesome-dsh-plugin` 的 `probe-npm.mjs` 自动探测，它以该字段指回本仓库作为唯一凭据。
  - 归档文件名随之变化：1.44.0 起为 `dsh-deepseek-style-theme-<版本>.tgz`（取自 `package.json` 的 `name`）。
  - 完整取证、根因与未验证项：`docs/install-incident-report.md`。

## v1.43.0 — 2026-09-15

### 新增
- **玻璃风格二选一**（`glassStyle`，默认 `液态`）：DSTT 设置页新增一行「液态 / 白磨砂」，经私有通道落盘，客户端把选择写成 `html[data-dshome-glass]`，样式表据此门控两套配方。
  - **液态**＝ Apple Liquid Glass 方向：填充 `rgb(255 255 255 / .14)`（白磨砂是 `.42`）、顶部光泽 `.07`（白磨砂 `.14`），背板链改为 `saturate(1.75)` 让身后颜色发亮；共用的 `feDisplacementMap` 改走 **104** 的 scale（白磨砂保持 60）；边框上跑一圈自走的 `conic-gradient` 高光（`@property` 注册 `<angle>`，不依赖鼠标）；对话框悬停时高光跟鼠标。
  - **白磨砂**＝ 1.42.x 那套，**一行未改**。新配方整块挂在 `html[data-dshome-glass="liquid"]` 下，已用**全页 1991 个元素的计算样式签名**验证：切到白磨砂时新样式表贡献为零（差异数 0）。
- **上玻璃的四处区域**（按反馈确认）：侧边栏外壳（**只做最外层**，里面的会话行不加边框/玻璃）、对话框、标题栏（**圆角 + 仅悬停时显现**，不是常驻）、**用户消息气泡**。背景板不做玻璃。
- **侧边栏**：右侧 22px 圆角 + 发丝描边，24px 独立模糊（比其余表面重，用来和对话界面分界），另加一层蒙版提亮——浅色是白色 `.18`，夜间是黑色 `.22`。
- **对话框悬停交互**：移植 `dsh-theme-mineradio` 的 `startSpotlight` tilt 分支——光标落在对话框上时 `scale(1.01)` 微微抬起，并朝光标所在的一侧倾斜（`TILT_MAX 0.0175rad` / `perspective 800px`），松手写回中性变换、240ms 后清掉内联属性，由 CSS transition 收尾。仅作用于对话框，且仅在液态配方下生效。

### 修复
- **用户消息气泡在 `steering` 流上完全没有玻璃**：产品把「回合开头的消息」标成 `data-chat-flow-kind="user"`，把「运行中插话」标成 `"steering"`，实测一份会话里可以**只有** steering 气泡——原先只按 `user` 锚定，于是整页气泡一个都没命中。选择器改为 `:is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"])`。
- **对话框的背板被模糊了两次**：补丁块给 `.uV2eYG_card::after` 单独加了 `blur(28px)`，而卡片本身也在玻璃名单里，两层叠加把面板糊成一片。液态下卡片元素本身就是玻璃，冗余层直接关掉。
- **深色模式下对话框的填充被旧补丁块顶回去**：`body[data-dshome-dark] .uV2eYG_card`（0,2,1）与 `html[attr] [data-composer-card]`（0,2,1）打平，而补丁块是**懒注入**（晚于本样式表），源码顺序判它赢。所有液态选择器多加一级 `body` 拆开平局。
- **标题栏里的控件点不到**：产品的列宽拖拽条 `.wSkVaW_widthHandle` 是 40px 宽、贯穿全高的 `z-index:8`，而标题栏在 `5`——光标一进标题栏就变成 `col-resize`。标题栏提到 `9`；拖拽条在标题栏盒子之外（y<8 / y>46）仍可正常抓取。
- **侧边栏底部多出一条亮带**（设置行上方）：产品用一层 `<hash>_fade` 渐变把工作区列表淡出，终点色是 `--dsw-specific-sidebar-fill` 这个**不透明**色（配它自己的侧边栏底色）。半透明玻璃板上这层终点色对不上背后的东西，于是显形成一条带子。液态下这层渐变去掉（限定在侧边栏内）。
- **明暗切换后背景不重新着色**：流体的调色板是按明暗方案选的，但只在挂载时算过一次，页面从浅色切到深色后流场仍是亮的那套。补一个 `data-dshome-dark` 的 `MutationObserver`。
- **`.gdEzaW_bubble` 早就失效了**：产品重构建换了 hash，这个选择器在新壳上一个元素都不匹配（实测 0 个），跟随高光名单里那条一直是死的；换成按产品的 `data-chat-flow-kind` 锚定。

### 工具
- `gui-probe` 新增 `--glass`（逐面报告计算样式，以及 `::before`/`::after` 是否已被产品占用）、`--messages`（气泡按类名分组 + `data-chat-flow-kind` 取值表，role 判定靠它）、`--pre <文件>` / `--pre-arg`（截图前先跑一段页面侧表达式，用于拍「配方 × 明暗」矩阵）。表达式一律走文件：PowerShell 传内联参数会按空格切开并吃掉引号。

### 性能实测（规格里的红线：改完必须实测滚动帧率）

四个区域里只有**用户气泡**是「数量不定的元素」，所以压测就压它：把真实的气泡节点复制 30 份塞进会话（走的还是产品自己的 markup，选择器命中方式与长会话完全一致），在同一个页面里背靠背跑滚动，只换配方。

| 变体 | fps | 中位帧 | p95 | >32ms | 同屏气泡 |
|---|---|---|---|---|---|
| A 当前（SVG `feDisplacementMap` 折射） | 62.1 | 13.9ms | 20.9ms | 0 | 9 |
| B 换成普通 `blur()/saturate()`（不带 SVG 滤镜） | 63.0 | 13.9ms | 20.9ms | 1 | 9 |
| C 只留填充，完全不要 `backdrop-filter` | 80.2 | 13.9ms | 14.0ms | 0 | 10 |
| D 白磨砂（气泡压根没玻璃） | 124.8 | 7.0ms | 13.9ms | 0 | 9 |

两个结论和一个决定：

- **规格里担心的那件事不成立。**「折射是每个元素一次滤镜采样」——A 与 B 只差 0.9fps（噪声级），**SVG 滤镜本身几乎不花钱**，钱花在 `backdrop-filter` 这个能力上（C 对比 B：去掉背板过滤直接多 17fps）。
- 所以「把气泡的折射降级成普通模糊」是**无效优化**，省不下来；要省只能整个去掉背板过滤，那样 0.14 的填充挡不住背后高对比的流体，文字可读性会掉。
- **决定：保持现状。** 同屏 9～10 个玻璃气泡时仍是 ~60fps（p95 20.9ms，无一帧超过 32ms），而真实会话里同屏用户气泡通常是 2～5 个；无压测时液态与白磨砂完全同速（94.4 / 94.6 fps），说明侧边栏 + 对话框 + 标题栏那三处基本免费。这个数字是在无头 Chrome（软件合成）里测的，真实 GPU 合成只会更快。

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
2. `pnpm pack` 出 `dsh-deepseek-style-theme-<版本>.tgz`（文件名取自 `package.json` 的 `name`；1.43.1 前因包名带 scope 而形如 `dsh-external-dsh-deepseek-style-theme-<版本>.tgz`）；
3. 发 GitHub Release，**同时附两个附件**：版本化文件名 + **稳定别名** `deepseek-style-theme.tgz`；
4. 市场/列表条目里的 `tarball:` 只写别名地址（`…/releases/latest/download/deepseek-style-theme.tgz`），此后升版本无需改动条目；
5. 发布到 npm：`npm publish --registry=https://registry.npmjs.org`（本机 `~/.npmrc` 指向镜像，镜像不能发布，故须显式指定官方源）。

> ⚠️ 别把版本号写进 `/releases/latest/download/` 的文件名——`latest` 指向最新 Release，文件名钉死旧版本号，一发新版就 404。

**两条不变量**（违反后失效方式都不直观，详见 `docs/install-incident-report.md`）：

- `cordis.patch.yml` 的 `name:` **必须等于** `package.json` 的 `name`。前者是 Loader 用来解析模块的说明符，写错则插件装配失败；而 `id:` 与 `lib/client.js` 里的 id 字面量与之无关，不必跟着改。
- Release 资产引用二选一：要「永远最新」只写稳定别名（文件名**不含**版本号）；要「固定可复现」就用 `/releases/download/v<版本>/…`。**两者不可混用**。

**npm 映射是自动探测的，不要手写。** 市场目录条目的 `npm` 字段由 `awesome-dsh-plugin` 的 `scripts/probe-npm.mjs` 自动写入 `data/npm-map.json`：它读仓库 HEAD 的 `package.json` 取包名，再要求 npm 上该包的 `repository` 指回本仓库。所以 `package.json` 的 `repository` 字段是功能性的，不能省；往条目 YAML 里手写 `npm:` 反而会被 `entries.mjs` 判为非法键。

**发布前先确认 npm 认证形态**（2026-09 实测，`npm login` 成功 ≠ 能发布）：

| 项 | 取值 |
|---|---|
| 类型 | Granular Access Token |
| Permissions | `Read and write (publish and stage)` |
| Select packages | **`All packages`**（本包无 scope，选 `@lichtspur` 之类的 scope 等于没授权） |
| Bypass 2FA | **勾选**（不勾必 E403；且 registry 返 403 而非 401，npm 永远不会提示输 OTP） |
| Organizations | `No access`（否则表单校验不过） |
| Allowed IP ranges | 留空 |

> ⚠️ **该 token 形态有保质期**：npm 明示 *"Bypass-2fa token with direct-publish access … will be removed in January 2027"*，官方建议改用 `Read and write (stage only)`（上传后在网页确认发布）。**2027 年 1 月前须迁移**。
