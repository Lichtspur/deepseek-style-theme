#!/usr/bin/env node
/**
 * Regression test for the 2.0.73 background recipes, at the data level.
 *
 * Why this exists: the recipes are three small tables plus a five-rule sheet,
 * and every one of them is easy to break in a way no syntax check notices --
 * a mistyped hex, a family missing from FLUID_LEADS, a label missing for an id
 * the panel iterates over, a CSS rule keyed on the wrong attribute. The parts
 * that decide what the user actually sees are the COLOURS and WHICH RECIPE OWNS
 * WHICH RULE, so this pins exactly those:
 *
 *   1. every id in DSTT_BACKGROUNDS has a label in both languages,
 *   2. `classic` (方式1) is "lead + pure white + near-white" -- each light
 *      triple contains #FFFFFF and exactly one other pale tone,
 *   3. `white` (方式2) really is TWO colours: the third uniform repeats the
 *      second, so the distinct count is 2 in both schemes,
 *   4. `bold` is the 1.43.12 three-chroma set: no #FFFFFF in the light triples,
 *   5. the custom-background sheet carries the colour rule, the image rule and
 *      the dark scrim, and keeps them gated on the kind attribute.
 *
 * The tables are read out of the shipped source (not imported: lib/client.js is
 * a browser module that needs window.__ModuleLoader__). Parsing is deliberately
 * narrow -- these are literal tables -- and a table that stops being parseable
 * fails the check instead of silently passing.
 *
 * Usage: node tools/bg-recipes-smoke.mjs [absolute path to lib/client.js]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv.slice(2).find((a) => !a.startsWith('-')) ?? join(here, '..', 'lib', 'client.js');
const source = readFileSync(target, 'utf8');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

/** Pull one literal table out of the source and parse it as JSON. */
const table = (name) => {
	const match = source.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\t\\t\\});'));
	if (match === null) throw new Error('table not found in the shipped source: ' + name);
	return JSON.parse(match[1].replace(/'/g, '"').replace(/([{,\s])([A-Za-z_][\w-]*):/g, '$1"$2":'));
};

const CLASSIC = table('FLUID_COLORS_CLASSIC');
const BOLD = table('FLUID_COLORS_BOLD');
const LEADS = table('FLUID_LEADS');
const SECOND = table('FLUID_SECOND');

const FAMILIES = ['green', 'blue', 'red'];
const SCHEMES = ['light', 'dark'];
const HEX = /^#[0-9A-Fa-f]{6}$/;
const listMatch = source.match(/const DSTT_BACKGROUNDS = \[([^\]]*)\]/);
const IDS = listMatch === null ? [] : [...listMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const labelsBlock = (source.match(/const DSTT_BACKGROUND_LABELS = \{([\s\S]*?)\n\t\t\};/) ?? [])[1] ?? '';

check('the panel iterates over four recipes', IDS.join(',') === 'classic,white,custom,bold', IDS.join(','));
for (const id of IDS) {
	check(`recipe ${JSON.stringify(id)} has a label in zh and en`,
		new RegExp('\\b' + id + ':\\s*\\{\\s*zh:').test(labelsBlock) && new RegExp('\\b' + id + ':\\s*\\{[^}]*en:').test(labelsBlock));
}

// 方式1 -- the look the user pointed at in the screenshots: one family plus the
// two whites. Every light triple must hold #FFFFFF, and its third tone must be
// a pale tint rather than a third hue.
for (const family of FAMILIES) {
	const triple = CLASSIC[family];
	check(`classic ${family} has three hex colours per scheme`,
		SCHEMES.every((s) => Array.isArray(triple[s]) && triple[s].length === 3 && triple[s].every((c) => HEX.test(c))),
		JSON.stringify(triple));
	check(`classic ${family} light carries pure white`,
		triple.light.includes('#FFFFFF'), triple.light.join(' '));
}

// 方式2 -- exactly two colours participate. The third uniform repeats the
// second in fluidTriple() (see the source), so the distinct count is 2.
for (const family of FAMILIES) {
	for (const scheme of SCHEMES) {
		const lead = LEADS[family][scheme];
		const second = SECOND[family][scheme];
		const effective = [lead, second, second];
		check(`white ${family}/${scheme} is a two-colour recipe`,
			HEX.test(lead) && HEX.test(second) && new Set(effective).size === 2,
			effective.join(' '));
	}
	check(`white ${family} keeps pure white in the light scheme`, SECOND[family].light === '#FFFFFF');
}

// 浓三色 -- kept selectable, and deliberately NOT the white-plus-lead shape:
// that difference is the whole point of it being a separate option.
for (const family of FAMILIES) {
	check(`bold ${family} light is free of pure white`,
		!BOLD[family].light.includes('#FFFFFF'), BOLD[family].light.join(' '));
	check(`bold ${family} light is the 1.43.12 three-chroma set`,
		BOLD[family].light.join(',') === { green: '#0FA76A,#5FCB9E,#0B7A52', blue: '#1E6FE8,#7FA8F5,#2B57C9', red: '#E23A44,#F08A90,#C02630' }[family],
		BOLD[family].light.join(' '));
}

// 方式3 -- the sheet. Colour rule, image rule, and a dark scrim that is the
// FIRST image layer (so the picture stays visible under it), all gated on the
// kind attribute the client only writes after CSS.supports() accepted a value.
const css = {
	base: 'body[data-dshome-bg=custom]{background-image:none',
	color: 'body[data-dshome-bg=custom][data-dshome-customkind=color]{background-color:var(--dshome-custom-bg',
	image: 'body[data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#f6f7fb!important;background-image:var(--dshome-custom-bg',
	darkColor: 'body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=color]{background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55))',
	darkImage: 'body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#0b0f17!important;background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55)),var(--dshome-custom-bg'
};
for (const [name, needle] of Object.entries(css)) {
	check(`custom-background sheet has the ${name} rule`, source.includes(needle));
}
check('③ stands our own themed backgrounds down by SELECTOR, not by !important',
	// 2.0.87 moved the wash from the body to a fixed pseudo-element (so that
	// backdrop-filter can sample it): the guard is still a selector, four themed
	// rules still carry it, and the body itself now paints nothing for these recipes.
	source.includes('body:not([data-dshome-bg=custom])::before{content:"";position:fixed;')
	&& source.includes('body:not([data-dshome-bg=custom]){background:none!important}')
	&& (source.match(/:not\(\[data-dshome-bg=custom\]\)::before\{/g) ?? []).length === 4,
	'::before guards: ' + (source.match(/:not\(\[data-dshome-bg=custom\]\)::before\{/g) ?? []).length);
check('③ has a flat base and a paint-nothing base (2.0.76)',
	source.includes('body[data-dshome-bg=custom][data-dshome-bgbase=flat]{background-color:#ffffff}')
	&& source.includes('body[data-dshome-dark][data-dshome-bg=custom][data-dshome-bgbase=flat]{background-color:#000000}')
	&& source.includes('body[data-dshome-bg=custom][data-dshome-bgbase=none]{background-color:transparent}'));

// 2.0.73 regression: the sheet opens with `html,body{background-color:transparent!important}`,
// and an author-important declaration beats any non-important one no matter how
// specific. Without !important on these three, the user's colour (and the two
// fallback colours) painted nothing while the base rule above had already
// stripped the themed gradients -- the colour silently did nothing.
for (const needle of [
	'customkind=color]{background-color:var(--dshome-custom-bg,transparent)!important}',
	'customkind=image]{background-color:#f6f7fb!important',
	'[data-dshome-customkind=image]{background-color:#0b0f17!important'
]) {
	check('custom background colours out-rank the sheet transparent !important',
		source.includes(needle), needle.slice(0, 46));
}

// 2.0.73 regression: startAmbient()/startParticles() read `darkSync`, so the
// binding must live at FACTORY scope -- as a local of apply() the read threw
// ReferenceError, the mount's try/catch swallowed it, and no disposer was ever
// returned: ③ kept the fluid canvas painting over the user's background, and the
// particle fallback was appended but never sized or animated. Factory scope is
// exactly two tabs here; a second declaration would be a different bug.
check('darkSync is declared at factory scope, not inside apply()',
	/^\t\tlet darkSync = null;$/m.test(source) && !/^\t\t\tlet darkSync = null;$/m.test(source));
check('darkSync is declared exactly once', (source.match(/\blet darkSync\b/g) ?? []).length === 1);

// 2.0.73 regression: the panel's own placeholder offers a bare URL first, and a
// bare URL is neither a <color> nor a <url> token -- it has to be wrapped into
// url("...") before anything probes or stamps it.
check('bare URLs are normalised into a url() token before use',
	source.includes('function normalizeBackgroundValue')
	// `\r?\n`: the blob is LF, but a checkout with core.autocrlf=true writes CRLF,
	// and this assertion has to hold in both trees (it failed on exactly that
	// difference the first time a checkout rewrote the working copy).
	&& /function backgroundKind\(value\) \{\r?\n\t\t\tconst text = normalizeBackgroundValue\(value\);/.test(source)
	&& source.includes("'url(\"' + text.replace(/[\\\\\"]/g"));

// Twice now a comment in this CSS block has been written with a backtick in it,
// which closes the CORE_CSS template literal early and turns the rest of the
// sheet into JavaScript. `node --check` catches the fallout, but only after the
// fact and with a confusing message; the file is a template literal, so the rule
// is simply: no backticks in here.
const commentStart = source.indexOf('/* ── background recipe');
const commentEnd = source.indexOf('*/', commentStart);
check('the background-recipe CSS comment holds no backtick',
	commentStart > -1 && commentEnd > commentStart && !source.slice(commentStart, commentEnd).includes('`'));

// The same trap, generalised (2.0.80). A backtick written inside ANY comment of
// the sheet closes the CORE_CSS template early and turns the rest of it into
// JavaScript; that has now happened four times (three of them mine), and the
// per-comment guard above only covered one block. Walking from the opening
// backtick to the FIRST backtick followed by a semicolon finds the intended
// terminator (a stray one inside prose is followed by a letter or a bracket), and
// anything stray in between is counted and fails the check.
const CORE_OPEN = 'const CORE_CSS = `';
const coreOpen = source.indexOf(CORE_OPEN);
let coreTerminator = -1;
if (coreOpen !== -1) {
	for (let i = coreOpen + CORE_OPEN.length; i < source.length; i += 1) {
		if (source[i] === '`' && source.slice(i, i + 2) === '`;') { coreTerminator = i; break; }
	}
}
const coreStray = coreTerminator === -1
	? -1
	: (source.slice(coreOpen + CORE_OPEN.length, coreTerminator).match(/`/g) ?? []).length;
check('the CORE_CSS template literal closes where it should: no stray backtick',
	coreTerminator !== -1 && coreStray === 0, 'stray backticks before the terminator: ' + coreStray);

// 2.0.74: `mediump` made the display shader's sin-hash noise collapse into
// visible drifting squares on GPUs that implement 16-bit floats for real (an
// Intel Arc iGPU under ANGLE/D3D11 becomes HLSL min16float, while desktop
// discrete GPUs promote mediump to 32 bits and never showed it). WebGL2
// guarantees highp in fragment shaders, so both shaders must ask for it and no
// mediump declaration may come back.
check('both fluid shaders declare highp, and no mediump returns',
	(source.match(/^precision highp float;$/gm) ?? []).length === 2 && !/^precision mediump float;$/m.test(source),
	'highp declarations: ' + (source.match(/^precision highp float;$/gm) ?? []).length
	+ ', mediump declarations: ' + (source.match(/^precision mediump float;$/gm) ?? []).length);
// Both halves are anchored to line start on purpose: the header comment in
// lib/client.js quotes both spellings while explaining the change, and an
// unanchored search counts those quotes as declarations.

// 2.0.75 -- the switch that turns the animated layer off entirely. It has to be
// the ambient CONTROLLER that honours it (not a CSS hide): a hidden canvas would
// keep simulating, which is exactly what an iGPU cannot afford. And the setting
// only exists if the host schema knows it.
const hostSource = readFileSync(join(dirname(target), 'index.js'), 'utf8');
check('the schema knows ambientBackground and defaults it on',
	/z\.boolean\(\)\.default\(true\)/.test(hostSource) && hostSource.includes('ambientBackground'));
check('the ambient controller gates on the setting, not on CSS',
	/dsttGetAmbient\(\) && dshomeBackground\(\) !== 'custom'/.test(source));
check('the panel exposes an ambient switch', source.includes('setAmbient: (next) => dsttSetAmbient(ctx, next)'));
check('the client sends the field the host stores',
	source.includes('ambientBackground: dsttState.ambient') && hostSource.includes('payloadObject.ambientBackground'));

// 2.0.75/2.0.76 -- the Windows wallpaper, now behind an EXPLICIT `desktop` value
// rather than an empty box (an empty box means paint-nothing, per the 2.0.76
// marketplace-adaptation semantics). The page cannot read the system wallpaper,
// so the plumbing is: host endpoint (JSON status), a raw-bytes sub-path, and a
// client that only ever points CSS at that sub-path.
check('both halves name the same wallpaper endpoint',
	source.includes('"dshome/desktop.wallpaper"') && hostSource.includes('"dshome/desktop.wallpaper"'));
check('both halves name the same wallpaper sub-path',
	source.includes('"/wallpaper"') && hostSource.includes('"/wallpaper"'));
check('the empty box paints nothing of ours, and `desktop` is the explicit opt-in',
	/const wantsDesktop = stored\.toLowerCase\(\) === 'desktop'/.test(source)
	&& source.includes("pluginPaints ? 'none' : 'flat'"));
check('the wallpaper-plugin marker is the plugin\'s own attribute',
	source.includes('const WE_ACTIVE_ATTR = "data-we-wallpaper"')
	&& source.includes('attributeFilter: [WE_ACTIVE_ATTR]'));

// 2.0.77: while the wallpaper engine renders, ①②/浓三色 keep their fluid and
// themed background -- which would sit on top of the engine's layer -- so the
// panel PROMPTS a switch to ③ instead of performing one. That was an explicit
// product decision (提示而不是自动切换), so nothing in the marker or ambient
// plumbing may call the setter by itself.
check('①②/浓三色 + wallpaper engine prompts a switch to ③, never switches itself (2.0.77)',
	source.includes("pluginPaints && backgroundNow !== 'custom'")
	&& source.includes("onClick: () => pickBackground('custom')")
	&& !/MutationObserver\(\(\) => dsttSetBackground/.test(source));

// 2.0.78 -- the jitter + bottom-slider loop, root-caused on the live page: the
// product's hover affordance on a message lays its row out wider than the column
// (scrollWidth 917 vs clientWidth 891) -> an 8 px horizontal scrollbar -> the
// scroll body's content box loses 8 px (842 -> 834) -> the composer pinned below
// shifts up 8 px -> the pointer lands on another element -> the affordance closes
// -> and back, at ~5 Hz. The theme's share of the fix is to refuse horizontal
// scrolling in that column; the anchor keeps it honest if the class is rehashed.
// 2.1.0 起插件只保留语义写法，这套「拒绝横向滚动」的补丁连同哈希锚点一起移除了。
// 这条检查改为守住那个决定本身：源码里不该再出现写死哈希的横向裁剪规则。
check('the horizontal-overflow patch stays removed with the hash anchors (2.1.0)',
	!/overflow-x:clip/.test(source));
// The widening matters because the 8px step under the send button only needs ONE
// `overflow-y: auto` container with a hover-grown child (the other axis computes to
// auto). The first report named the message list; the composer's seat and the view
// area can produce the same step, so all three are clipped now.
check('the clip stays gone together with the hash anchors (2.1.0)',
	!/\[class\*="scrollBody"\]\{overflow-x:clip\}/.test(source));

// 2.0.79 chased the second half of the jitter by removing the tilt's lift and by
// listing text entry as an interactive control. 2.0.82 reverts BOTH, and this
// assertion is deliberately replaced rather than extended: the old one pinned
// `TILT_SCALE = 1`, which enshrined a mis-fix. The reason is the input: it covers
// the card, so excluding it meant the tilt stopped engaging for the very gesture it
// exists for -- reported as "鼠标放在对话框，放大和倾斜没了" -- and the lift left
// with it. What guards the loop now is hysteresis, which removes the feedback path
// without removing the effect: entering a control FREEZES the lean (no repaint, no
// release, no re-arm), it resumes on the card body, and it is released only when the
// pointer leaves the card's own box, plus a cooldown before the next engagement.
// The loop needed that release to feed it; a lean held still under a stationary
// pointer cannot feed anything.
check('the composer tilt keeps its lift and engages over the input (2.0.82, lift raised 2.0.86)',
	source.includes('const TILT_SCALE = 1.015;')
	&& source.includes('const TILT_MAX = 0.03;')
	&& source.includes('const TILT_CONTROLS = \'button,[role="button"],a[href],[class*="andle" i]\';')
	&& !/TILT_CONTROLS = '[^']*(input|textarea|contenteditable)/.test(source));
// 2.0.86: engagement is geometric, so the lean's own movement could hand the card
// back and forth under a stationary pointer (out -> release -> in -> engage, at frame
// rate). The release pad is the hysteresis that closes that path, and it is what lets
// the lean be 1.7x stronger than upstream's conservative default.
check('the geometric tilt has a release pad (2.0.86)',
	source.includes('const TILT_RELEASE_PAD = 8;')
	&& (source.match(/TILT_RELEASE_PAD/g) ?? []).length >= 3);
// 2.0.86: the SVG refraction chain is opt-in and must be absent from the DOM when the
// setting is `off`. Two measured failures came from mounting it: the tint washed the
// whole pane over a gradient background ("玻璃怎么变成凝胶了"), and a `url()` that
// fails to render invalidates the whole `backdrop-filter` declaration, so the pane
// lost its BLUR ("没有背景模糊效果"). A decorative filter must never be able to cost
// a surface its glass.
check('the refraction chain only mounts when the setting asks for it (2.0.86)',
	source.includes("const dispersion = dsttGetComposer() === 'off'")
	&& source.includes('? { setTint() {}, setRefraction() {}, dispose() {} }')
	&& source.includes('window.__dshomeDispersion = () =>')
	&& source.includes('var TINT_OPACITY = 0.16;'));
// The recipe gate is gone on purpose: the tilt used to return early unless the
// glass was `liquid`, which made the effect invisible on the white frosted recipe
// ("白磨砂玻璃也要有"). Because the liquid sheet was the only place carrying
// `transition: transform`, the motion now carries its own transition -- a recipe
// can no longer lose the easing, and it is removed with the inline transform.
check('the composer tilt runs under both glass recipes (2.0.82)',
	!source.includes("if (dsttGetGlass() !== 'liquid') return;")
	&& !source.includes("if (dsttGetGlass() !== 'liquid') {")
	&& source.includes('const TILT_TRANSITION = ')
	&& source.includes('spot.style.transition = TILT_TRANSITION;')
	&& (source.match(/removeProperty\('transition'\)/g) ?? []).length >= 2);
check('entering a control freezes the composer tilt instead of releasing it (2.0.82)',
	source.includes('const TILT_COOLDOWN_MS = 200;')
	&& source.includes('let frozen = false;')
	&& source.includes('if (frozen) return;')
	&& source.includes('if (current !== spot || frozen) return;')
	&& (source.match(/frozen = true;/g) ?? []).length >= 2
	// The release survives in exactly one place: the pointer leaving the card's
	// own box (plus the release pad). That guard is what keeps the effect off the
	// hover loop.
	&& source.includes('if (event.clientX >= g.left - TILT_RELEASE_PAD && event.clientX <= g.right + TILT_RELEASE_PAD')
	&& source.includes('window.__dshomeTilt = ()'));

// The hover loop, third round. 2.0.79 damped it by dropping TILT_SCALE to 1;
// restoring the 1.015 lift brought it back -- damping was never the fix.
// `getBoundingClientRect()` INCLUDES the transform this effect writes, so
// normalising the cursor against it is a feedback path: the scale resizes the
// rect -> the rect normalises the offset -> the offset picks the angle -> the
// angle moves the rect. On the short composer that is a pixel or two and
// invisible; on a card grown to its max-height by a long draft it is ~10px of
// visible flapping at a few Hz. The fix measures with quantities a transform
// cannot move -- the rect's CENTRE (invariant under a transform about the
// centre, because under `perspective()` the centre plane sits at z=0) and
// `offsetWidth`/`offsetHeight` (never include transforms) -- so nothing reads
// last frame's transform and there is no loop left to damp.
// Pinned here precisely because no smoke can grow a composer to 336px.
check('the composer tilt measures the layout box, not its own transform (2.1.90)',
	source.includes('const spotGeometry = (spot, rect) => {')
	&& source.includes('const halfW = spot.offsetWidth / 2;')
	&& source.includes('const halfH = spot.offsetHeight / 2;')
	&& source.includes('const cx = rect.left + rect.width / 2;')
	&& source.includes("spot.style.transformOrigin = g.halfW + 'px ' + g.halfH + 'px';")
	&& source.includes('(clientX - g.cx) / (g.halfW * 2)')
	// The old shape must be gone: no transform-origin off the scaled rect, and no
	// half-range clamp normalised by it. (`rect.*` legitimately survives elsewhere
	// -- the fluid canvas and the specular UV map -- so these are matched as the
	// exact tilt expressions, not as "any rect use".)
	&& !source.includes('spot.style.transformOrigin = (rect.width / 2)')
	&& !source.includes('(clientX - rect.left) / rect.width - 0.5')
	&& !source.includes('(clientY - rect.top) / rect.height - 0.5'));
// 标题栏（需求第 9 条 + "另有"：功能对官方，风格/玻璃/按钮/悬停按原来的）。
// 这里守的是一个实测踩过的坑：产品的标题栏元素是 <header>，不是 <div>。选择器一旦
// 写成 `:is(div):has(...)`，整块 28 条规则会**一条都不匹配** —— 而需求对视觉的判据是
// "用户肉眼看得到"，代码里有规则不算数，所以这种失效在自检里必须能被抓住。
// 同时守住 §3.7：切换归官方，我们那个 watchHeaderInteraction 接管必须不在了。
check('the header patch matches by structure and not by tag name (2.1.90 §2.4)', 
	source.includes(':has(> [class*="_headerLeading"]):has([class*="_headerActions"])')
	&& !source.includes(':is(div):has(> [class*="_headerLeading"]')
	// 悬浮胶囊三件套：定位、压在列宽抓手之上的 z-index、悬停才出的玻璃
	&& source.includes('top:8px;left:24px;right:24px;z-index:9')
	&& source.includes(':hover{border-radius:999px}')
	&& source.includes('backdrop-filter:blur(20px)')
	// 压平两层包装，否则标签页留在第二行、胶囊变成两行高的块
	&& source.includes('> :is([class*="_headerLeading"]){display:contents}')
	&& source.includes(':is([class*="_titleRow"],[class*="_titleCluster"]){display:contents}')
	// 标签页"悬停才出现"由纯 CSS 驱动，而不是那个已被删掉的 JS 类
	&& source.includes(':hover :is([class*="_tabs"]){display:flex')
	&& !source.includes('watchHeaderInteraction')
	// 落在"JS 用法"上，不落在词本身：注释里提到这个名字是好事（它解释了为什么这里
	// 由纯 CSS 驱动），不该被判成残留。
	&& !source.includes("classList.add('dshome-swap')")
	&& !source.includes("classList.contains('dshome-swap')")
	&& !source.includes("classList.remove('dshome-swap')"));
// 表格的滚动容器：产品给它的是 `border-radius:999px` + `overflow:auto`。999px 的半径
// 在一个 824×226 的盒子上每边要吃约 113px，而 auto 就在那条弧线上裁 —— 宽表格的左右
// 两端会被**自己的容器**裁没（不是被浮层盖住）。实测：`<table>` 本身 radius=0px /
// overflow=visible，问题全在它父层 `_tableScroll_* _tableFill_*` 上。
// 改成 8px 是**我们主动覆盖产品的设计**，不在《逐项决定》11 条内，由用户点名选择（甲）。
// 断言它，是因为它属于"产品换做法时不会跟着变"的那一类，得能被看见。
check('the markdown table scroll container is not a pill (2.1.90, user-chosen)', 
	source.includes(':is([class*="_tableScroll"]){border-radius:8px!important}')
	&& source.includes('{ anchor: \'[class*="_tableScroll"], [class*="_scrollBody"]\''));
// 2.0.85 -- engagement is geometric. It used to require a `pointerover` whose
// target sat inside the card, which is a chain of assumptions about product markup
// the theme cannot verify (a wrapper with role=button, a swapped-in card node, an
// overlay), and getting it wrong looks exactly like a broken effect. `spotAt()`
// decides from the card's own rectangle now; `controlAt()` is the only hit test
// left, and only to answer "is this a control". The two silent gates are also
// reported from the page: `reducedMotion` (an OS setting that looks like a bug) and
// `spots` (0 when the composer markup no longer matches TILT_SELECTOR).
check('the composer tilt engages by geometry and reports its gates (2.0.85)',
	source.includes('const spotAt = (clientX, clientY) =>')
	&& source.includes('const controlAt = (clientX, clientY) =>')
	&& (source.match(/controlAt\(event\.clientX, event\.clientY\)/g) ?? []).length >= 2
	&& source.includes('reducedMotion: reduced')
	&& source.includes('spots: document.querySelectorAll(TILT_SELECTOR).length')
	&& source.includes('composer tilt disabled: the system asks for reduced motion'));

// ── 2.0.83: the two load-time hazards `node --check` cannot see ───────────────
// B1 of the 2026-09-16 report: `var ATTR = "data-dshome-dispersion";` was deleted
// by accident in d862487, and the file kept shipping for nineteen versions with an
// undeclared ATTR. Reading an undeclared identifier is not a syntax error, and the
// throw it caused was swallowed by the ambient mount -- so the refraction never
// mounted anywhere AND the 动态背景 toggle lost its disposer. Every name the ported
// header block advertises as one the shipped CSS must match is pinned here.
for (const name of ['ATTR', 'SPOT_ATTR', 'SPEC_X', 'SPEC_Y', 'FILTER_ID', 'TALL_FILTER_ID', 'COMPOSER_FILTER_ID', 'WIDE_FILTER_ID']) {
	check(`the CSS contract name ${name} is declared (2.0.83)`,
		new RegExp('^\\s*(?:var|const|let)\\s+' + name + '\\s*=', 'm').test(source));
}
// The other half of the same class: interpolating a `const` that is declared
// further down. `${USER_BUBBLE}` inside PATCH_BLOCKS threw "Cannot access
// 'USER_BUBBLE' before initialization" the moment the factory ran, and because
// that happens before any style tag is injected, the WHOLE theme vanished from the
// page rather than one block. `${…}` is the sharp edge specifically: unlike a
// reference inside a function body (evaluated only when called, so a later
// declaration is fine), an interpolation is evaluated while the table around it is
// being built and cannot wait.
const declaredAt = new Map();
for (const match of source.matchAll(/^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm)) {
	if (!declaredAt.has(match[1])) declaredAt.set(match[1], match.index);
}
const earlyInterpolations = [];
for (const match of source.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g)) {
	const at = declaredAt.get(match[1]);
	if (at === undefined || at < match.index) continue;
	// Prose counts too, and prose is where this check has already fired once: a
	// comment explaining the guard wrote the literal interpolation and tripped it.
	// A match after a `//` on its own line, or on a line starting with `*`, is text.
	const lineStart = source.lastIndexOf('\n', match.index) + 1;
	const line = source.slice(lineStart, match.index);
	if (line.includes('//') || /^\s*\*/.test(line)) continue;
	earlyInterpolations.push(match[1]);
}
check('no template interpolation reads a const before its declaration (2.0.83)',
	earlyInterpolations.length === 0,
	[...new Set(earlyInterpolations)].slice(0, 4).join(', '));

// 2.0.85 -- the cursor-following glass extras must NOT live inside the fluid layer.
// They were mounted from startAmbient(), which tied the dialog's specular highlight
// and its edge refraction to the flow field: turning 「动态背景」 off (exactly what the
// iGPU squares forced the user to do), choosing ③ 自选背景, or landing on an engine
// without WebGL2 (the particle fallback returns before them) silently removed both.
// Reported as "把我的对话框随着鼠标位置而变化的效果补回来".
const ambientBody = source.slice(source.indexOf('function startAmbient()'), source.indexOf('function startGlassExtras()'));
check('the cursor-following glass extras mount outside the fluid layer (2.0.85)',
	ambientBody.length > 0
	&& !/startSpecularSpotter|startSpecularParallax|startGlassDispersion/.test(ambientBody)
	&& source.includes('function startGlassExtras()')
	&& source.includes('return startGlassExtras();'));

// 2.0.86 -- the fluid's 大方块 root cause (the 2026-09-16 fluid report, measured on an
// Intel Arc 130V): DISPLAY_SHADER's classic sin hash is evaluated at ~1e5, where
// float32 argument reduction leaves ~2.5e-3 of error that the 43758x multiplier turns
// into ~100 units -- the hash stops hashing, neighbouring cells collapse onto the same
// value, and the warp field becomes flat plateaus with hard edges (39.6% of 8x8 blocks
// flat, largest plateau 800x1000px, 60-90/255 jumps). The sin-free hash keeps every
// intermediate small. Pinned here because the deviation is easy to "restore" by
// accident while porting upstream again.
check('the display shader uses a sin-free hash (2.0.86)',
	source.includes('float random(vec2 st) {')
	&& source.includes('vec3 p3 = fract(vec3(st.xyx) * 0.1031);')
	&& source.includes('p3 += dot(p3, p3.yzx + 33.33);')
	// The old form must be gone from the SHADER; the two comments that explain it
	// are allowed to name it.
	&& !/float random\(vec2 st\) \{ return fract\(sin\(dot/.test(source)
	&& !source.includes('* 43758.5453123);'));

// 2.0.87 -- "没有背景模糊效果": two of this theme's own declarations were the suspects,
// and both are gone now. A body background with `background-attachment: fixed` is painted
// in its own phase and is NOT part of what Chromium samples for `backdrop-filter`, so
// every pane over the page wash was blurring nothing; the wash lives on a fixed
// pseudo-element instead. And `will-change: transform` on the pane promoted it, which is
// the other known way to lose the backdrop (the compositor promotes a transformed element
// on its own anyway, so the hint cost the effect it was meant to smooth).
check('the page wash is a paintable layer, not a fixed-attachment background (2.0.87)',
	// The THEMED rules lost the fixed attachment; the ③ custom rule keeps it on
	// purpose (the user's own picture is meant to be viewport-fixed).
	!source.includes('#f5f6fa 100%);background-attachment:fixed')
	&& !source.includes('#081b14 100%);background-attachment:fixed')
	&& source.includes('body:not([data-dshome-bg=custom])::before{content:"";position:fixed;inset:0;z-index:-2;')
	&& source.includes('body:not([data-dshome-bg=custom]){background:none!important}')
	&& !source.includes('will-change:transform')
	&& source.includes('window.__dshomeGlassProbe = () =>'));
// The lens touch the user asked for ("对对话窗下方文字进行放大（模拟液体放大）"): the stats
// line under the composer is scaled a little, and further while the pane leans.
// 2.0.87 also ungates the workspace-list fade: the user sent a screenshot of the light
// band above 设置 under 白磨砂 ("白磨砂，有这个渐变") -- the frosted pane is translucent
// too, so the product's opaque end stop mismatches there exactly as it did under liquid.
check('the workspace-list fade patch stays gone with the hash anchors (2.1.0)',
	!/body \.hHd-Xa_root \[class\*="_fade" i\]\{/.test(source));
check('the line under the composer carries the lens touch (2.0.87)',
	source.includes("const LEAN_ATTR = 'data-dshome-leaning';")
	&& source.includes('document.documentElement.setAttribute(LEAN_ATTR,')
	&& source.includes('document.documentElement.removeAttribute(LEAN_ATTR)'));
// 2.1.90 改了落点，而且是**用户实测驱动**的：融合板要求把玻璃画在"能同时框住输入卡
// 与统计行"的那一层上，但在 0.2.0 上那一层是卡片的父元素——实测 418×158（左右各多
// 16px 内边距、下面多出统计行所在的 dock 386×56），用户看到的是「对话框被撑大了」，
// 连鼠标随动的倾斜也摊到那一大块上。
// 现在玻璃落在卡片自己身上（386×98，与产品同尺寸），并且**不改产品的圆角/边框/
// 内边距**——尺寸与位置一个像素都不动。代价：统计行不再并进这块玻璃板。
// 这条检查守的是"输入区有玻璃、且没被改尺寸或定位"，不是某个具体层名。
// `position` 那条反向断言是 2026-10-03 的教训：给卡片加 position:relative（当时是为了
// 给 ::before 做定位锚点，后来方案不用 ::before 了）会顶掉产品自己的定位方式，
// 用户看到的是「鼠标放到发送按钮上，输入框大幅上移」。玻璃只许改颜色与模糊。
check('the composer glass sits on the card itself and never resizes or repositions it (2.1.90)',
	source.includes('anchor: "[data-composer-card]"')
	&& source.includes("const COMPOSER_PLATE = '[data-composer-card]';")
	&& source.includes('${COMPOSER_PLATE}{background:rgba(255,255,255,.42)!important;')
	&& !/\$\{COMPOSER_PLATE\}\{[^}]*position:/.test(source)
	&& !/:where\(div\):has\(> \[data-composer-card\]\)/.test(source)
	&& !/\[data-composer-stats\]\{transform:scale\(1\.04\)\}/.test(source));

// 2.0.80 -- the last geometry change this theme made to the send/stop button
// itself: its hover used to lift it by 1 px (`translateY(-1px)`), which is
// enough surface motion to hand the hover to a neighbour; the product's own
// hover on that button changes only its background. The shadow stays, the
// transform must not come back.
check('the send-button theme styling stays removed with the hash anchors (2.1.0)',
	!/\.uV2eYG_primary/.test(source)
	&& !/_primary:hover\{[^}]*transform/.test(source));

// 2.0.81 -- the flow field's storage precision, which is the "drifting squares"
// root cause on the iGPU. Measured in headless Chrome running the SHIPPED GLSL:
// after the same 240 passes the RGBA8 field sat at mean 0.0172 spread over 13
// levels of the 1/255 grid, while RGBA16F decayed to mean 0.00002 continuously --
// i.e. eight bits per channel holds energy at quantization levels ~85x the true
// value, and those plateaus are what the domain warp paints as blocks. The change
// probes the capability instead of assuming it, and keeps RGBA8 as the fallback.
check('the flow field prefers half floats and falls back honestly (2.0.81)',
	source.includes('EXT_color_buffer_float')
	&& source.includes('const fieldFormat = floatField ? gl.RGBA16F : gl.RGBA;')
	&& source.includes('const fieldType = floatField ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;')
	&& source.includes('__dshomeFluidFormat')
	&& source.includes('gl.clearColor(0, 0.5, 0.5, 1)'));
check('the wallpaper sizing follows WallpaperStyle through CSS variables',
	source.includes("setProperty('--dshome-custom-size'") && source.includes('--dshome-custom-size,cover')
	&& source.includes('--dshome-custom-repeat,no-repeat'));
check('the host resolves the wallpaper without trusting any client path',
	hostSource.includes('WALLPAPER_SUBPATH') && hostSource.includes('readDesktopWallpaper')
	&& !/sendWallpaper\(res, *[a-zA-Z]/.test(hostSource));

// The two halves again, this time as data: the panel's ids must be the schema's
// ids. (tools/dstt-schema-smoke.mjs checks the same thing behaviourally.)
const host = readFileSync(join(dirname(target), 'index.js'), 'utf8');
for (const id of IDS) {
	check(`the schema knows backgroundMode=${JSON.stringify(id)}`,
		new RegExp('z\\.const\\("' + id + '"\\)').test(host));
}

const failed = checks.filter((c) => !c.ok).length;
console.log('');
console.log(failed === 0 ? `SMOKE OK (${checks.length} checks)` : `SMOKE FAILED (${failed}/${checks.length})`);
process.exitCode = failed === 0 ? 0 : 1;
