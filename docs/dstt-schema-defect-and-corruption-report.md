# 事故报告：DSTT 取值的 schema 缺陷，与一次自伤的文件损坏

> 2026-09-15 在为 v1.43.2 发布做发布前验证时发现两件事：**作者本轮改动里有一个发布阻塞级缺陷**，
> 以及**我在验证过程中把 `lib/index.js` 写坏了**。
> 本文件同时是缺陷记录与操作事故记录。相关文档：`docs/install-incident-report.md`（发布源那次事故）、
> `CHANGELOG.md`（本版条目）、`lib/index.js:72-75`（本次被违反的那条不变量）。
> 本文件**不随包发布**（不在 `package.json` 的 `files` 白名单内）。

---

## 摘要

| # | 问题 | 严重度 | 状态 |
|---|---|---|---|
| A | `composerRefraction` 改名后，写入路径放行 `wide` 而 schema 不认 —— 用户一选「宽」，DSTT 持久化在下次启动时失效 | **发布阻塞** | 已定位、已确定修法；修法随 `lib/index.js` 重建一并落地 |
| A2 | 同一轮改名漏掉设置页的说明文案：按钮写「宽 16px」，说明仍讲「原样＝上游那张图、上下约 20px」 | 文档误导 | 已定位；宜与 A 一并修 |
| B | 我在"原地撤销修复再跑测试"时用 PowerShell 读写文件，把 `lib/index.js` 的 UTF-8 编码毁掉 | 工作区损坏 | 已用两层逆变换抢救出内容作参照；已从 HEAD 恢复文件；**作者本轮的未提交改动待重建** |

三者同源：**一次改名只改了一部分引用点**。A 是功能性后果，A2 是可读性后果，B 是我在验证 A 时自伤。

---

## A. 缺陷：取值白名单与 schema 不一致

### 现象与证据

本轮把设置取值从 `origin` 改名为 `wide`。改动同时落到两处，但**第三处漏了**：

下表描述的是**作者本轮未提交的那一版**（该版本现已不在磁盘上，见 C 节；当前磁盘上的 `lib/index.js`
是自洽的 `HEAD` 版本，见 A 节末的澄清）：

| 位置 | 改动后的值 |
|---|---|
| `lib/index.js` — `COMPOSER_REFRACTIONS`（`lib/index.js:98`，写入路径的白名单） | `["narrow", "wide", "off"]` ✅ 已改名 |
| `lib/client.js` — `DSTT_COMPOSER`（`lib/client.js:3393`，设置页按钮来源） | `["narrow", "wide", "off"]` ✅ 已改名 |
| `lib/index.js` — `DsttSettingsSchema` 的 `composerRefraction` 联合类型（`lib/index.js:102`） | `z.const("narrow") / z.const("origin") / z.const("off")` ❌ **仍是旧值** |

而这份 schema 在 `lib/index.js:657` 被注册给设置服务：

```js
settingsCtx.settings.register(DSTT_SETTINGS_NS, DsttSettingsSchema);
```

> 行号基准说明：下文行号取自**当前磁盘上的 `lib/index.js`**（= `HEAD`，38,507 字节）。
> 作者那版因注释扩写了 6 行，注册点在它那里是 663 行。按符号名查找不受影响。

用真实 Schemastery 复刻该联合类型实测（`@deepseek-ai/schemastery@3.18.2`）：

```
"narrow" -> 通过
"origin" -> 通过
"off"    -> 通过
"wide"   -> 抛错: $.composerRefraction expected "narrow" | "origin" | "off" but got "wide"
```

### 后果链条

1. 用户在 DSTT 设置页点「宽」（按钮由 `DSTT_COMPOSER.map(...)` 生成，`lib/client.js:3846`，**可达**）；
2. 客户端经私有通道发给宿主；写入路径 `dsttWrite()`（`lib/index.js:593`）在 `lib/index.js:598` 用
   `COMPOSER_REFRACTIONS.includes(...)` 判断，`wide` 在白名单内 → **写进 `settings.yaml`**；
3. 下次启动 `settings.register()`（`lib/index.js:657`）用 schema **校验已存储的文档** → 抛错；
4. 按 `lib/index.js:72-75` 的注释，这一步抛错会**直接让 DSTT 持久化失效**（不是降级，是死掉）。

**这不是新坑**：`lib/index.js:72-75` 明确写着，1.37.x 的 `auto`/`blue`/`green` 就是为同一个原因
被保留在 schema 里的 —— "otherwise register() validates the stored document and throws, killing DSTT
persistence on upgrade"。本轮改名又踩了同一条不变量。

### 连带发现：同一轮改名还有一处没跟上（文案，非功能）

按钮标签改对了，**说明文案没改**：

```js
// lib/client.js:3395-3399 —— 已更新 ✅
narrow: { zh: "窄 8px",  en: "Narrow 8px" },
wide:   { zh: "宽 16px", en: "Wide 16px" },
off:    { zh: "无",      en: "Off" }

// lib/client.js:3843-3844 —— 仍是旧的 ❌
'…窄：约 4px，四边一样宽（默认）。原样：上游那张按短边内缩的图，
 短卡片上上下约 20px、左右几乎没有。关闭：不上折射。'
```

按钮写着「宽 16px」，说明栏却把中间项描述成「原样＝上游那张图、上下约 20px」。
按作者本轮的注释，`wide` 已经是**专为 16px 带新做的一张图**，不再是上游那张共享图
（`mapComposerWide` 有自己的 `COMPOSER_WIDE_EDGE` / `COMPOSER_WIDE_SOFTNESS`）——
所以这段说明现在是**错的**，会误导用户。英文侧同一句同样过期。

严重度低于 A（不改行为、不会让 DSTT 失配），但同属"改名只改了一半"，应一并修掉。

### 为什么现有测试没抓到

`tools/bridge-smoke.mjs:52` 把 `register()` 实现成空函数：

```js
const settings = {
	register() {},
	describe() { ... },
	mutate(ns, ops) { ... },
};
```

它**从未看到过 schema**，所以 26 项全过也覆盖不到「写入路径允许的值 ⊆ schema 接受的值」这条不变量。
作者本轮的验证日志 `.tmp-inspect/sb3.log` 同样只断言了 `composerRefraction: "narrow"`。

### 修法

在联合类型里**补上 `wide`，同时保留 `origin`**：

```js
composerRefraction: z.union([
	z.const("narrow"),
	z.const("wide"),
	z.const("origin"),   // 旧 id：让本轮之前写下的设置文件仍能通过校验
	z.const("off")
]).default(COMPOSER_REFRACTION_DEFAULT)
```

两个方向都不能少：

- 只加 `wide` 而删掉 `origin` → **旧设置文件**（存着 `origin`）在升级后校验失败，同一类故障换个方向发生；
- 只留 `origin` → 本次缺陷，新值存不进去。

读侧另有一层迁移，作者已经写好（`lib/index.js:627` 一带），随重建一并落地：

```js
function dsttComposerValue(ctx) {
	...
	if (stored === "origin") return "wide";
	return COMPOSER_REFRACTIONS.includes(stored) ? stored : COMPOSER_REFRACTION_DEFAULT;
}
```

### 一个重要澄清：HEAD 本身没有这个缺陷

| 版本 | `COMPOSER_REFRACTIONS` | schema | 是否自洽 |
|---|---|---|---|
| `HEAD`（`d862487`，已提交推送） | `narrow / origin / off` | `narrow / origin / off` | ✅ 自洽 |
| 作者本轮**未提交**改动 | `narrow / **wide** / off` | `narrow / origin / off` | ❌ **缺陷在此引入** |

即：缺陷是这轮未提交的改名引入的，不是仓库历史里的既存问题。重建时必须**同时**补上改名与 schema 修复，
只做其中一件都会留下一个坏状态（只改名 → DSTT 会死；只改 schema → 「宽」这个功能是死的）。

---

## B. 操作事故：我把 `lib/index.js` 写坏了

### 我做了什么

为证明「A 的缺陷确实能被新测试抓到」，我选择**在真实文件上原地撤销修复、跑测试、再恢复**：

```powershell
$backup = Get-Content $f -Raw                                   # ← 问题所在
[System.IO.File]::WriteAllText($path, $broken, UTF8Encoding)    # ← 把损坏固化
```

`Get-Content -Raw` **未指定 `-Encoding`** 时，PowerShell 5.1 用系统 ANSI 代码页（本机 CP936）
解码 UTF-8 文件：中文被解成乱码，回写时乱码被固化为 UTF-8 —— **编码被改写了**。

我随后**又运行了一次同样的命令**（因为第一次的输出我没看全），于是叠了**两层**编码错误。

### 损坏程度

- `lib/index.js` 变成**非法 UTF-8**：第 693 行字符串的闭合引号被替换成 `?`，
  `node --check` 报 `SyntaxError: Invalid or unexpected token`；
- 5 行内容受损（均为**注释**与**一处 `console.warn` 字符串**）：
  L60、L61、L95、L210、L693。所有 `—`（em dash）变成 `??`，若干中文碎片变成 `?`；
- **逻辑代码未受影响** —— 受损处不含任何可执行语句。

### 我一度误读了证据

我报告过「撤销修复后测试退出码 1，证明测试能抓到缺陷」。**那条结论无效**：
退出码 1 来自文件损坏引发的 `SyntaxError`，不是我的断言失败。

因此必须如实记录：**新测试 `tools/dstt-schema-smoke.mjs` 只在修复后的 schema 上验证过 10/10 通过；
它「在缺陷 schema 上会失败」这一半，至今没有被有效证明过。** 两次尝试都不成立 ——
第一次是模块解析失败（我把文件复制到了没有 `node_modules` 的目录），第二次就是本次文件损坏。

### 恢复过程与结果

| 手段 | 结果 |
|---|---|
| `git stash` | 空 |
| `git fsck --lost-found` 找悬挂 blob | 无（该文件从未被 `git add` 过） |
| 编辑器 `.bak` / `~` 备份 | 无 |
| 两层 CP936 逆变换（UTF8 解码 → CP936 编码，做两次） | 中文基本还原、逻辑代码完整，但 U+FFFD 替换已破坏字节，**结果仍非法 UTF-8** |
| 最终采用 | 把还原结果存为**参照文件** `.tmp-inspect/index-author-guide.js`（38,740 字节，5 处受损），再从 `HEAD` 恢复 `lib/index.js` |

**关键性质**：那份参照文件虽然不是合法 UTF-8，但**内容可读**，因此可以当"作者改了什么"的精确指南用 ——
用它跑出的 diff 证明作者的真实改动只有 **3 处代码 + 2 段注释**，diff 里其余全部是我的破折号损坏。

---

## C. 当前状态（已实测核实）

| 对象 | 状态 |
|---|---|
| `lib/index.js` | = `HEAD`（`d862487`），38,507 字节，`node --check` 通过；取值 `narrow/origin/off`，**作者的改名不在其中** |
| `lib/client.js` | 作者的改动**完好**（`DSTT_COMPOSER = ["narrow","wide","off"]`、`origin→wide` 迁移均在）—— 我未触碰此文件 |
| `.tmp-inspect/index-author-guide.js` | 作者的 index.js + 我的 schema 修复，5 处受损，作为重建参照 |
| `package.json` | `1.43.2`（本次发布定的版本号） |
| `CHANGELOG.md` | 已加 v1.43.2 条目 |
| `tools/dstt-schema-smoke.mjs` | 新回归测试，5,939 字节，10 项 |
| `git status` | `M CHANGELOG.md`、`M lib/client.js`、`M package.json`、`?? tools/dstt-schema-smoke.mjs` |

**因此当前工作树是不一致状态**：客户端会发 `wide`，而宿主白名单不接受它。
此时发布，「对话框边缘倒影：宽」这个新功能是死的（不会崩，但选了不生效）。
这正是**不能就这么发布**的原因。

---

## D. 收尾方案

作者的 index.js 改动很小且可从参照文件逐条确定，重建路径清晰：

1. 基底用 `HEAD` 的 `lib/index.js`（正确的破折号与中文由此保全，**不采用**参照文件里受损的那部分）；
2. 按参照文件补回三处：
   - `COMPOSER_REFRACTIONS` → `["narrow", "wide", "off"]` 及其注释重写；
   - `dsttComposerValue()` 加 `if (stored === "origin") return "wide";` 及其文档注释；
   - schema 联合类型补 `z.const("wide")`（保留 `origin`）—— 即 A 的修复；
3. 修 A2：把 `lib/client.js:3843-3844` 的中英说明改成与 `wide` 实际语义一致
   （`wide` = 16px 带、专为该卡片做的图，不再是"上游那张图"）；
4. 用三个测试把关：`dstt-schema-smoke.mjs`（10 项）、`bridge-smoke.mjs`（26 项）、`catalog-sync-smoke.mjs`（27 项）；
5. 补上「缺陷 schema 会让测试失败」这一半证明 —— **用副本**验证，绝不再动真实文件；
6. 提交、发布 1.43.2。

### 更优路径（若有）

若编辑器保留了本地历史（VS Code **Timeline**、JetBrains **Local History**），可回滚到
**17:50 之前**的 `lib/index.js`，得到**逐字节一致**的原件。这严格优于重建：
参照文件里有一处中文（`// anything to show, because the card abuts the ?????bar above …`）
被 CP936 吃掉了字节，我无法 100% 确定原词。**能用原件就不该用重建。**

---

## E. 教训

1. **验证不要改动被测对象本身。** 为验证"测试能抓到缺陷"，正确做法是把待测文件**复制**到一个
   依赖可解析的独立目录再改副本；原地改真实文件把"一次只读的验证"变成了"一次有写入风险的操作"。
   事故的根因不是编码知识不足，而是这个选择。
2. **Windows PowerShell 5.1 的 `Get-Content -Raw` 默认不按 UTF-8 读。** 任何"读进来再写回去"的
   脚本都会改写非 ASCII 内容。要按字节操作就用 `[System.IO.File]::ReadAllBytes/WriteAllBytes`，
   或用 `-Encoding UTF8`，或干脆交给编辑器/git。
3. **测试桩的空白就是缺陷的藏身处。** `register() {}` 这个空实现让 schema 对测试不可见，
   两个测试套件（53 项）因此集体失明。补 `dstt-schema-smoke.mjs` 是为了把这个不变量钉住 ——
   它检查的正是"写入路径允许的值必须能被注册的 schema 校验通过"。
4. **"退出码非零"不等于"断言失败"。** 我据退出码 1 就宣布验证成立，而它来自语法错误。
   报告验证结果前必须看一眼失败的是哪一条断言。
5. **不变量在仓库里已写明，仍会被违反。** `lib/index.js:72-75` 早已记录"schema 必须接受已存储的值，
   否则 DSTT 会在升级时死掉"。同一条不变量本轮被改名再次违反 —— 说明注释挡不住它，需要可执行的检查。
6. **改名要扫全部引用点，而"取值字符串"是最容易漏的一类。** `origin → wide` 这一轮里，
   值定义改了两处、按钮标签改了一处，却漏了 schema（功能性后果）与说明文案（误导性后果）。
   这类散落的字符串字面量没有编译器保护，只能靠检查枚举：
   grep 旧值 `"origin"` 应当只在**有意兼容**的位置命中，其余一律是漏改。
   本仓库当下正是这个状态 —— `lib/index.js` 与 `lib/client.js` 里的 `"origin"` 现在**全部**是
   兼容/迁移用途，一旦出现第四处，就该问它属于哪一类。
