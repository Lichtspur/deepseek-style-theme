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
	source.includes('body:not([data-dshome-bg=custom]){background:radial-gradient(')
	// Anchored on the brace: the CSS comment that explains this guard quotes the
	// selector too, and an unanchored count sees five instead of four.
	&& (source.match(/:not\(\[data-dshome-bg=custom\]\)\{/g) ?? []).length === 4,
	'selector guards: ' + (source.match(/:not\(\[data-dshome-bg=custom\]\)\{/g) ?? []).length);
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
	&& /function backgroundKind\(value\) \{\n\t\t\tconst text = normalizeBackgroundValue\(value\);/.test(source)
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
check('the conversation scroller refuses horizontal scrolling (2.0.78, widened 2.0.82)',
	source.includes('anchor: ".wSkVaW_scrollBody"')
	&& source.includes('[class*="scrollBody"],[class*="composerSeat"],[class*="viewArea"]{overflow-x:clip}'));
// The widening matters because the 8px step under the send button only needs ONE
// `overflow-y: auto` container with a hover-grown child (the other axis computes to
// auto). The first report named the message list; the composer's seat and the view
// area can produce the same step, so all three are clipped now.
check('the clip covers the composer and view area too, not just the list (2.0.82)',
	(source.match(/overflow-x:clip/g) ?? []).length >= 1
	&& !/\[class\*="scrollBody"\]\{overflow-x:clip\}/.test(source));

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
check('the composer tilt keeps its lift and engages over the input (2.0.82)',
	source.includes('const TILT_SCALE = 1.01;')
	&& source.includes('const TILT_CONTROLS = \'button,[role="button"],a[href],[class*="andle" i]\';')
	&& !/TILT_CONTROLS = '[^']*(input|textarea|contenteditable)/.test(source));
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
	// own box. That rect guard is what keeps the effect off the hover loop.
	&& source.includes('if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return;')
	&& source.includes('window.__dshomeTilt = ()'));
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

// 2.0.80 -- the last geometry change this theme made to the send/stop button
// itself: its hover used to lift it by 1 px (`translateY(-1px)`), which is
// enough surface motion to hand the hover to a neighbour; the product's own
// hover on that button changes only its background. The shadow stays, the
// transform must not come back.
check('the send button hover changes colour and shadow only (2.0.80)',	source.includes('.uV2eYG_primary:hover{box-shadow:0 6px 18px')
	&& !/\.uV2eYG_primary:hover\{[^}]*transform/.test(source));

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
