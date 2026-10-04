// Host side of the DeepSeek-style theme plugin.
// Registers a Package-private RPC channel the browser half uses to open a
// workspace's directory in the OS file manager and bring the window to the
// foreground. The built-in host.openPath (Invoke-Item) leaves the Explorer
// window in the background when spawned from this windowless service process,
// so this plugin owns the whole "open workspace" gesture instead. The same
// channel carries the delivered-file gestures the browser half's card menu
// needs: open with the default application, and reveal in the file manager.
// It also owns the DSTT settings section and the desktop-wallpaper endpoint.
// 模型目录同步（1.40.0 起那套"每次启动向端点问一次模型列表、按需对齐
// llm-deepseek.models"）已在 2.2.0 整体删除：官方自带模型目录，选择器内容以官方为准。
//
// Wire contract: every return is an RpcResult<T> per rpc.schema.js. Error
// codes must come from the closed enum (bad-request / internal) — an
// off-enum code would make the connection layer's serverResponseSchema.parse
// reject the frame and surface as a carrier failure instead of a clean error.
//
// The channel is fenced exactly like the core's own /api route: a loopback
// peer, an authority this server answers on, agreement between Host and any
// provenance headers, a JSON body, and local absolute paths only — see
// isTrustedBridgeRequest. Nothing here may widen that fence without widening
// the core's.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";

// Schemastery is this bundle's only runtime dependency, and it is loaded
// defensively. `settings.register()` genuinely needs a real schema — the
// settings service calls it as a function (`resolve`) and serializes it through
// `schema.toJSON()` plus a `redactSecrets` walk inside `describe()` — so a
// hand-rolled stand-in cannot work. What it must not do is take the whole
// plugin tree down when the package is unresolvable: with an empty profile
// (`autoInstallPeers: false`) or a `link:` install whose real path sits outside
// the profile, a bare `import` here fails the loader entry and the GUI refuses
// to start at all. The guarded dynamic import converts that into one lost
// preference.
let z = null;
try {
	const schemastery = await import("@deepseek-ai/schemastery");
	const schema = schemastery.default ?? null;
	if (schema !== null && typeof schema.object === "function") z = schema;
} catch {
	// Reported once, below, where the remedy is actionable.
}
if (z === null) {
	console.warn(
		"[deepseek-style-theme] @deepseek-ai/schemastery could not be loaded, so the DSTT mode will not persist (the theme itself still works). Install it beside the plugin: dsh plugin --profile web add @deepseek-ai/schemastery@^3.18.2"
	);
}

const CHANNEL = "/dshome-open-workspace";
/** Hard cap per opener process: a hung COM call must not hang the RPC forever. */
const OPEN_TIMEOUT_MS = 10000;

/**
 * Durable DSTT (DeepSeekStyleTheme) preference section, registered into the
 * host settings document exactly like the product's own namespaces
 * (ui-theme/locale/ui-conversation): the client half binds this namespace
 * through `settingsScope` and reads/writes the preference fields.
 * A single `mode` enum drives the whole color story:
 *   - peakvalley-redblue  → vivid red (鲜红) at peak hours, blue at valley;
 *   - peakvalley-redgreen → vivid red (鲜红) at peak hours, green at valley;
 *   - always-green        → always green, no peak distinction;
 *   - always-blue         → always blue, no peak distinction.
 */
// 0.2.0 起，设置命名空间不再是插件随手注册的字符串，而是**profile 里那条插件条目的
// id**（见下面 dsttSettingsNs）。历史上有过三个名字，按"当前产品优先、旧命名兜底"
// 排列：`ui-skin-deepseek-style` 是本插件 cordis.patch.yml 里的条目 id，也是两端
// profile 实际用的 id；后两个是旧版运行时注册用的名字，留着只是为了老 profile 不至于
// 直接失去持久化。解析失败时返回 null，调用方一律回落到默认值，绝不抛。
const DSTT_SETTINGS_NS_CANDIDATES = ["ui-skin-deepseek-style", "dsh-deepseek-style-theme", "deepseek-style-theme"];
const DSTT_MODES = ["peakvalley-redblue", "peakvalley-redgreen", "always-green", "always-blue"];
const DSTT_MODE_DEFAULT = "peakvalley-redblue";
// 1.37.x persisted `auto` / `blue` / `green`. The schema still accepts them —
// otherwise register() validates the stored document and throws, killing DSTT
// persistence on upgrade — and apply() migrates them to the closest four-mode
// value right after registration.
const DSTT_LEGACY_MODES = { auto: "peakvalley-redblue", blue: "always-blue", green: "always-green" };
// Glass recipes. `liquid` is the Apple-style lens (edge refraction, a flowing
// edge highlight, high translucency); `frosted` is the white frosted pane with
// the brand-tinted shifting border this theme shipped before, kept byte for byte
// because that is the look the user picked. The client mirrors the choice onto
// <html data-dshome-glass> so one stylesheet can gate both recipes.
const GLASS_STYLES = ["liquid", "frosted"];
const GLASS_STYLE_DEFAULT = "liquid";
// How wide the composer's edge refraction is under the liquid recipe, measured
// on the top and bottom edges -- the only two where displacing the backdrop has
// anything to show, because the card abuts the 任务 bar above and the status line
// below, while left and right sit over a continuous background. `narrow` is an
// 8px band, `wide` is 16px, `off` drops the dispersion from the card entirely.
const COMPOSER_REFRACTIONS = ["narrow", "wide", "off"];
// `narrow` was the default for as long as the refraction could not mount at all
// (ATTR was missing from 1.43.6 to 2.0.82), so nobody ever saw it -- and the first
// build that mounted it (2.0.84) did not look like refraction: over a gradient
// background the tint washed the whole pane ("我的玻璃怎么变成凝胶了"), and the
// SVG filter in the backdrop chain took the blur down with it ("没有背景模糊效果").
// So the default is `off`, the two bands are there to be tried deliberately, and
// `off` now also means "do not mount the filter chain at all" (see
// startGlassExtras in lib/client.js): a feature that has never rendered for anyone
// must not be able to degrade the glass.
const COMPOSER_REFRACTION_DEFAULT = "off";
// Background recipes. `classic` is the 1.43.11 palette byte for byte -- the
// soft lead plus pure white plus a near-white tint, i.e. the look the user
// called "buttons green, background green" -- and it is the default again.
// `white` is the same soft lead with pure white only. `custom` hands the page
// background to the user's own value: the colour token then drives the brand
// tokens (the buttons) and nothing else, and a dark scrim keeps the text
// readable in the dark scheme. `bold` is the 1.43.12 three-chroma set, which
// the user asked to keep selectable.
const BACKGROUND_MODES = ["classic", "white", "custom", "bold"];
const BACKGROUND_MODE_DEFAULT = "classic";
// A custom background is an image URL or any CSS background value. The browser
// owns validity -- the client classifies colour vs image with CSS.supports()
// and falls back to the recipe's own background when nothing is usable -- so
// the host only bounds the length and strips newlines and control characters,
// which would only ever be an accident in a settings file.
const CUSTOM_BACKGROUND_MAX = 2000;
// `null` when Schemastery failed to load: registration is then skipped and the
// DSTT mode simply stops persisting instead of failing the plugin tree.
const DsttSettingsSchema = z === null ? null : z.object({
	mode: z.union([
		z.const("peakvalley-redblue"),
		z.const("peakvalley-redgreen"),
		z.const("always-green"),
		z.const("always-blue"),
		z.const("auto"),
		z.const("blue"),
		z.const("green")
	]).default(DSTT_MODE_DEFAULT).volatile(),
	// The fluid background's pointer brush writes a velocity wake into the flow
	// field wherever the cursor goes. It is both the most expensive part of the
	// simulation and the most intrusive visually, so it ships OFF; this setting
	// exists only to turn it back on.
	fluidBrush: z.boolean().default(false).volatile(),
	glassStyle: z.union([
		z.const("liquid"),
		z.const("frosted")
	]).default(GLASS_STYLE_DEFAULT).volatile(),
	// Both ids are listed on purpose, and dropping either one breaks an upgrade:
	// `wide` is what the write path accepts today, and `origin` is what a settings
	// file written before the rename holds -- register() validates the STORED
	// document, so an id the schema does not know throws there and takes DSTT
	// persistence down with it (the same trap the legacy mode ids above exist for).
	// The invariant: every value the write path allows must pass this schema.
	composerRefraction: z.union([
		z.const("narrow"),
		z.const("wide"),
		z.const("origin"),
		z.const("off")
	]).default(COMPOSER_REFRACTION_DEFAULT).volatile(),
	// The `blur()` term in every glass surface's backdrop chain. Turning it off
	// keeps the translucency, the sheen and the edge refraction and drops only
	// the frosting -- implemented as four variables driven to 0px, so nothing
	// else about the recipes moves.
	backdropBlur: z.boolean().default(true).volatile(),
	// The animated background layer itself: the WebGL2 fluid, or the 2D particle
	// field on engines without it. Off leaves the static themed background (the
	// per-colour gradients, or the user's own 自选背景) and changes nothing else.
	// It exists because some integrated GPUs render the simulation wrong -- an
	// Intel iGPU under ANGLE/D3D11 turned the noise into drifting squares even
	// after the mediump fix -- and for those machines a switch beats a fight.
	ambientBackground: z.boolean().default(true).volatile(),
	// Every id the write path accepts is listed here for the reason spelled out
	// on composerRefraction above: register() validates the stored document, so
	// an id the schema does not know throws there and takes DSTT persistence
	// down with it.
	backgroundMode: z.union([
		z.const("classic"),
		z.const("white"),
		z.const("custom"),
		z.const("bold")
	]).default(BACKGROUND_MODE_DEFAULT).volatile(),
	customBackground: z.string().default("").volatile()
});

/** Map a legacy 1.37.x mode id onto a four-mode id, or null when nothing to do. */
function migrateLegacyMode(mode) {
	return typeof mode === "string" && Object.prototype.hasOwnProperty.call(DSTT_LEGACY_MODES, mode)
		? DSTT_LEGACY_MODES[mode]
		: null;
}

/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(path) {
	return `'${path.replace(/'/g, "''")}'`;
}


/**
 * Run a simple command and resolve with whether it exited cleanly.
 * `lenient` counts a numeric exit status as success: some platform tools
 * (notably `explorer.exe`, which returns 1 after a successful `/select`) report
 * failure while having done the work, so only a spawn failure is a failure.
 */
function runOpener(command, args, lenient = false) {
	return new Promise((resolve) => {
		execFile(command, args, { windowsHide: true, timeout: OPEN_TIMEOUT_MS }, (error) => {
			if (error === null || error === undefined) {
				resolve(true);
				return;
			}
			resolve(lenient && typeof error.code === "number");
		});
	});
}

/**
 * Open one file with the OS default application. Not the same gesture as
 * opening a directory (that helper is gone with 2.2.0's "open workspace"
 * removal): on Windows `Shell.Application.Open` on a file is the
 * shell's own gesture, while `Start-Process` hands the path to the registered
 * handler, which is what "用默认应用打开" means.
 */
function openFileGeneric(path) {
	switch (process.platform) {
		case "win32":
			// `-FilePath`, not `-LiteralPath`: Start-Process has no -LiteralPath
			// parameter (Windows PowerShell 5.1 rejects it with
			// NamedParameterNotFound), so the literal quoting comes from
			// powershellLiteral alone. Start-Process resolves through
			// ShellExecute, which is what invokes the registered default handler.
			return runOpener("powershell.exe", ["-NoProfile", "-Command", `Start-Process -FilePath ${powershellLiteral(path)}`]);
		case "darwin":
			return runOpener("open", [path]);
		case "linux":
			return runOpener("xdg-open", [path]);
		default:
			return Promise.resolve(false);
	}
}

/** Reveal one file in the platform's file manager, selected where supported. */
function revealFileGeneric(path) {
	switch (process.platform) {
		case "win32":
			return runOpener("explorer.exe", ["/select," + path], true);
		case "darwin":
			return runOpener("open", ["-R", path]);
		case "linux":
			return runOpener("xdg-open", [dirname(path)]);
		default:
			return Promise.resolve(false);
	}
}

/** Uniform RpcResult failure branch. */
function failure(code, message, details) {
	return { ok: false, error: { code, message, details } };
}

/** Every settings namespace the service currently reports, or null. */
function settingsNamespaces(ctx) {
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.describe !== "function") return null;
	try {
		const descriptors = settings.describe({ redactSecrets: true });
		return Array.isArray(descriptors) ? descriptors : null;
	} catch (error) {
		return null;
	}
}

/**
 * The settings namespace this plugin's profile entry answers to, or null.
 *
 * 0.2.0 makes the namespace the *entry id* instead of a string the plugin
 * registers, so it can no longer be a compile-time constant: the id belongs to
 * the profile, and a profile is free to insert this plugin under another one.
 * Candidates are tried in order and the first one the service actually reports
 * wins. The old registered name is last on purpose -- a profile that still
 * carries it should keep persisting under it rather than silently start a
 * second, empty namespace.
 */
function dsttSettingsNs(ctx) {
	const descriptors = settingsNamespaces(ctx);
	if (descriptors === null) return null;
	for (const ns of DSTT_SETTINGS_NS_CANDIDATES) {
		if (descriptors.some((candidate) => candidate !== null && typeof candidate === "object" && String(candidate.ns) === ns)) return ns;
	}
	return null;
}

/**
 * One namespace's descriptor (resolved value plus revision), or null.
 *
 * The namespace defaults to this plugin's own, resolved on every call rather
 * than captured once: the profile patch is editable at runtime (that is what
 * the settings service writes through), so an entry can appear or move while
 * the process is up.
 */
function settingsDescriptor(ctx, ns = dsttSettingsNs(ctx)) {
	if (ns === null || ns === undefined) return null;
	const descriptors = settingsNamespaces(ctx);
	if (descriptors === null) return null;
	const descriptor = descriptors.find((candidate) => String(candidate.ns) === ns);
	if (descriptor === undefined || descriptor === null) return null;
	const value = descriptor.value;
	if (value === null || typeof value !== "object") return null;
	return { value, revision: descriptor.revision };
}

/**
 * DSTT private-channel endpoints. The settings domain's RPC surface only
 * serves namespaces in the core's hard-coded allowlist (`settings-not-exposed`
 * otherwise), so the browser half reads/writes the DSTT preference through
 * this plugin's own loopback channel, and the host half drives the settings
 * service directly — the same shape as the explorer-open RPC above.
 */
const DSTT_GET = "dstt.mode.get";
const DSTT_SET = "dstt.mode.set";
/** Delivered-file gestures for the card menu patched by the browser half. */
const FILE_OPEN = "dshome/file.open";
const FILE_REVEAL = "dshome/file.reveal";

/**
 * Desktop wallpaper, resolved by the HOST half. A page cannot ask for the system
 * wallpaper — there is no web API for it — so the browser half asks over this
 * channel, and the bytes come back as a GET on the same fenced route (a CSS
 * background image cannot carry a JSON body). Nothing about it is remote: the
 * file is read on this machine and served to this page over loopback, and the
 * endpoint takes no input at all, so the only file it can ever serve is the one
 * the host itself resolved. Nothing is uploaded anywhere.
 */
const WALLPAPER_GET = "dshome/desktop.wallpaper";
const WALLPAPER_SUBPATH = "/wallpaper";
// Re-reading means spawning PowerShell, and a page load is the only trigger, so
// a short memo keeps a burst of reloads from spawning one process each. Ten
// seconds is far below how often anyone changes their wallpaper.
const WALLPAPER_MEMO_MS = 10000;
// Refuse pathological files rather than pushing hundreds of megabytes into the
// page: a 16K wallpaper is around 20 MB, and anything past this is not one.
const WALLPAPER_MAX_BYTES = 24 * 1024 * 1024;
let wallpaperMemo = { at: 0, has: false, value: null };

/**
 * Resolve the wallpaper Windows is currently showing, or null when this is not
 * Windows or nothing could be read.
 *
 * `TranscodedWallpaper` is preferred over the registry path on purpose: Windows
 * keeps a JPEG of whatever is actually on screen there — including the
 * per-monitor crop, a slideshow frame and a solid colour — while
 * `HKCU\Control Panel\Desktop\WallPaper` can be empty (slideshow, solid colour)
 * or point at a file the user has since deleted. The solid colour, when there is
 * no image at all, comes from `HKCU\Control Panel\Colors\Background`.
 */
function readDesktopWallpaper() {
	if (process.platform !== "win32") return Promise.resolve(null);
	const script = [
		"$ErrorActionPreference = 'SilentlyContinue'",
		"$out = [ordered]@{ path = $null; source = $null; color = $null; style = 10; tile = 0 }",
		"$desk = Get-ItemProperty -LiteralPath 'HKCU:\\Control Panel\\Desktop'",
		"$transcoded = Join-Path $env:APPDATA 'Microsoft\\Windows\\Themes\\TranscodedWallpaper'",
		"if ($transcoded -and (Test-Path -LiteralPath $transcoded)) { $out.path = $transcoded; $out.source = 'transcoded' }",
		"elseif ($desk.WallPaper -and (Test-Path -LiteralPath $desk.WallPaper)) { $out.path = $desk.WallPaper; $out.source = 'registry' }",
		"if ($null -ne $desk.WallpaperStyle) { $out.style = [int]$desk.WallpaperStyle }",
		"if ($null -ne $desk.TileWallpaper) { $out.tile = [int]$desk.TileWallpaper }",
		"if (-not $out.path) { $bg = (Get-ItemProperty -LiteralPath 'HKCU:\\Control Panel\\Colors').Background; if ($bg -match '^\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)') { $out.color = ('#{0:X2}{1:X2}{2:X2}' -f [int]$Matches[1], [int]$Matches[2], [int]$Matches[3]) } }",
		"[pscustomobject]$out | ConvertTo-Json -Compress"
	].join("; ");
	return new Promise((resolve) => {
		execFile("powershell.exe", ["-NoProfile", "-Command", script], { windowsHide: true, timeout: OPEN_TIMEOUT_MS }, (error, stdout) => {
			if (error !== null && error !== undefined) {
				resolve(null);
				return;
			}
			try {
				const parsed = JSON.parse(String(stdout).trim());
				resolve(parsed !== null && typeof parsed === "object" ? parsed : null);
			} catch (parseError) {
				resolve(null);
			}
		});
	});
}

/** The memoized wallpaper reading. */
async function desktopWallpaper() {
	const now = Date.now();
	if (wallpaperMemo.has && now - wallpaperMemo.at < WALLPAPER_MEMO_MS) return wallpaperMemo.value;
	const value = await readDesktopWallpaper();
	wallpaperMemo = { at: now, has: true, value };
	return value;
}

/** Content type from the bytes first (the transcoded file has no extension), the path second. */
function wallpaperMime(data, path) {
	if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
	if (data.length > 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
	if (data.length > 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
	if (data.length > 2 && data[0] === 0x42 && data[1] === 0x4d) return "image/bmp";
	if (data.length > 4 && data.toString("ascii", 0, 4) === "GIF8") return "image/gif";
	const lower = typeof path === "string" ? path.toLowerCase() : "";
	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".bmp")) return "image/bmp";
	if (lower.endsWith(".gif")) return "image/gif";
	return "image/jpeg";
}

/** Serve the resolved wallpaper bytes, or a status that says why not. */
async function sendWallpaper(res) {
	try {
		const info = await desktopWallpaper();
		if (info === null || typeof info.path !== "string" || info.path === "") {
			res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
			res.end("no desktop wallpaper image on this machine");
			return;
		}
		const data = await readFile(info.path);
		if (data.length === 0 || data.length > WALLPAPER_MAX_BYTES) {
			res.writeHead(413, { "content-type": "text/plain; charset=utf-8" });
			res.end("wallpaper file is empty or too large to serve");
			return;
		}
		res.writeHead(200, {
			"content-type": wallpaperMime(data, info.path),
			"content-length": String(data.length),
			// No caching: the user may change their wallpaper and then reload. The
			// memo above is what keeps the PowerShell spawn off the hot path.
			"cache-control": "no-store"
		});
		res.end(data);
	} catch (error) {
		res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
		res.end("wallpaper read failed");
	}
}

/** The part of a request path that follows CHANNEL ("" for the channel itself). */
function subPathOf(req) {
	const url = typeof req.url === "string" ? req.url : "";
	const cut = url.indexOf("?");
	const pathname = cut === -1 ? url : url.slice(0, cut);
	return pathname.startsWith(CHANNEL) ? pathname.slice(CHANNEL.length) : "";
}

/**
 * Validate `payload.path` as a local absolute path, or return null. Every path
 * endpoint shares this: a relative path, an embedded NUL, a UNC share or a
 * device namespace is refused before it reaches any opener.
 */
function localPathOf(payload) {
	const path = payload === null || payload === undefined || typeof payload !== "object" ? undefined : payload.path;
	if (typeof path !== "string" || path.trim() === "" || path.indexOf("\0") !== -1 || !isAbsolute(path) || isNetworkPath(path)) return null;
	return path;
}

/**
 * Read the durable DSTT mode. Reports the schema default whenever the stored
 * value is not one of the four modes, so the reply always honors the RPC
 * contract — a legacy 1.37.x value is migrated right after registration, and
 * the client rejects any off-enum answer anyway.
 */
function dsttRead(ctx) {
	const descriptor = settingsDescriptor(ctx);
	if (descriptor === null) return failure("internal", "settings service unavailable", {});
	const stored = descriptor.value.mode;
	return {
		ok: true,
		value: {
			mode: DSTT_MODES.includes(stored) ? stored : DSTT_MODE_DEFAULT,
			fluidBrush: descriptor.value.fluidBrush === true,
			glassStyle: dsttGlassValue(ctx),
			composerRefraction: dsttComposerValue(ctx),
			backdropBlur: descriptor.value.backdropBlur !== false,
			backgroundMode: dsttBackgroundValue(ctx),
			customBackground: dsttCustomBackgroundValue(ctx),
			ambientBackground: descriptor.value.ambientBackground !== false
		}
	};
}

/**
 * Write the durable DSTT preferences through the host settings service directly.
 * `fluidBrush`, `glassStyle`, `composerRefraction`, `backgroundMode` and
 * `customBackground` are all optional: when they carry a valid value the same
 * write also sets them, so the settings panel can persist a choice without a
 * second round trip. None of them is mandatory the way `mode` is — an older
 * client that only knows about the mode keeps working.
 */
async function dsttWrite(ctx, mode, fluidBrush, glassStyle, composerRefraction, backdropBlur, backgroundMode, customBackground, ambientBackground) {
	if (!DSTT_MODES.includes(mode)) {
		return failure("bad-request", `mode must be one of ${DSTT_MODES.join("/")}`, { issues: [] });
	}
	const wantsGlass = GLASS_STYLES.includes(glassStyle);
	const wantsComposer = COMPOSER_REFRACTIONS.includes(composerRefraction);
	const wantsBackground = BACKGROUND_MODES.includes(backgroundMode);
	const wantsCustom = typeof customBackground === "string";
	const ops = [{ op: "set", path: ["mode"], value: mode }];
	if (typeof fluidBrush === "boolean") ops.push({ op: "set", path: ["fluidBrush"], value: fluidBrush });
	if (wantsGlass) ops.push({ op: "set", path: ["glassStyle"], value: glassStyle });
	if (wantsComposer) ops.push({ op: "set", path: ["composerRefraction"], value: composerRefraction });
	if (typeof backdropBlur === "boolean") ops.push({ op: "set", path: ["backdropBlur"], value: backdropBlur });
	if (wantsBackground) ops.push({ op: "set", path: ["backgroundMode"], value: backgroundMode });
	if (wantsCustom) ops.push({ op: "set", path: ["customBackground"], value: normalizeCustomBackground(customBackground) });
	if (typeof ambientBackground === "boolean") ops.push({ op: "set", path: ["ambientBackground"], value: ambientBackground });
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.mutate !== "function") {
		return failure("internal", "settings service unavailable", {});
	}
	// 命名空间是按 profile 条目 id 解析出来的，解析不到就不能硬写：写一个不存在
	// 的 ns 会被服务以 `No configurable plugin entry` 拒掉，而那时错误信息会把
	// "插件没被正确插入 profile"说成"设置写入失败"，误导排查方向。
	const ns = dsttSettingsNs(ctx);
	if (ns === null) {
		return failure("internal", `no settings entry for this plugin (tried ${DSTT_SETTINGS_NS_CANDIDATES.join(", ")})`, {});
	}
	try {
		await settings.mutate(ns, ops);
	} catch (error) {
		return failure("internal", error instanceof Error ? error.message : "settings write failed", {});
	}
	return {
		ok: true,
		value: {
			mode,
			fluidBrush: typeof fluidBrush === "boolean" ? fluidBrush === true : dsttBrushValue(ctx),
			glassStyle: wantsGlass ? glassStyle : dsttGlassValue(ctx),
			composerRefraction: wantsComposer ? composerRefraction : dsttComposerValue(ctx),
			backdropBlur: typeof backdropBlur === "boolean" ? backdropBlur : dsttBlurValue(ctx),
			backgroundMode: wantsBackground ? backgroundMode : dsttBackgroundValue(ctx),
			customBackground: wantsCustom ? normalizeCustomBackground(customBackground) : dsttCustomBackgroundValue(ctx),
			ambientBackground: typeof ambientBackground === "boolean" ? ambientBackground : dsttAmbientValue(ctx)
		}
	};
}

/**
 * The stored background recipe, defaulting to the 1.43.11 palette. A missing or
 * unrecognized value reads back as the default rather than as `undefined`, so
 * the client always gets one of the four ids it can gate its stylesheet on.
 */
function dsttBackgroundValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	const stored = descriptor === null ? undefined : descriptor.value.backgroundMode;
	return BACKGROUND_MODES.includes(stored) ? stored : BACKGROUND_MODE_DEFAULT;
}

/**
 * Normalise a custom background for storage: trimmed, single-line and
 * length-bounded. Whether the value is *usable* CSS is deliberately the
 * client's call (it asks CSS.supports), never this half's — a wrong guess here
 * would silently drop a value the browser would have accepted.
 */
function normalizeCustomBackground(value) {
	if (typeof value !== "string") return "";
	const flat = value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
	return flat.length > CUSTOM_BACKGROUND_MAX ? flat.slice(0, CUSTOM_BACKGROUND_MAX) : flat;
}

/** The stored custom background (empty string when nothing is set). */
function dsttCustomBackgroundValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	return normalizeCustomBackground(descriptor === null ? "" : descriptor.value.customBackground);
}

/** Whether the animated background layer may mount; on unless it was turned off. */
function dsttAmbientValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	return descriptor === null ? true : descriptor.value.ambientBackground !== false;
}

/** The stored backdrop-blur preference, defaulting to on. */
function dsttBlurValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	return descriptor === null ? true : descriptor.value.backdropBlur !== false;
}

/**
 * The stored composer-refraction width, defaulting to the 8px band. `origin` was
 * this option's first id: it is still accepted by the schema so a settings file
 * written before the rename keeps validating, and it reads back as `wide` so the
 * client only ever sees one id per state.
 */
function dsttComposerValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	const stored = descriptor === null ? undefined : descriptor.value.composerRefraction;
	if (stored === "origin") return "wide";
	return COMPOSER_REFRACTIONS.includes(stored) ? stored : COMPOSER_REFRACTION_DEFAULT;
}

/** The stored fluid-brush preference, defaulting to off. */
function dsttBrushValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	return descriptor === null ? false : descriptor.value.fluidBrush === true;
}

/**
 * The stored glass recipe. A missing or unrecognized value reads back as the
 * default rather than as `undefined`, so the client always gets one of the two
 * ids it can gate its stylesheet on.
 */
function dsttGlassValue(ctx) {
	const descriptor = settingsDescriptor(ctx);
	const stored = descriptor === null ? undefined : descriptor.value.glassStyle;
	return GLASS_STYLES.includes(stored) ? stored : GLASS_STYLE_DEFAULT;
}

function apply(ctx) {
	// Best-effort on purpose: dsh ships breaking changes to the settings API
	// between releases, and a throw here fails this bundle's loader entry — with
	// it the whole plugin tree, which is far worse than a theme that merely
	// loses its persistence.
	//
	// 0.2.0 removed `settings.register()` outright, so there is nothing to
	// register any more: the namespace, its shape (`Config` above) and the
	// profile entry that carries them are all owned by the product now. What is
	// left for this plugin to do at boot is notice when that wiring is missing
	// and say so once, in the loader log, instead of failing silently and
	// leaving the user to discover it as "my switches reset every restart".
	ctx.inject(["settings"], (settingsCtx) => {
		// 0.2.0 的两条时序事实，这个块长成这样全是为了它们：
		//
		//   1. 设置服务的 describe() 只列出**已经 ACTIVE**（fiber.state === 2）的条目，
		//      而本插件此刻正在自己的激活过程中，自己那条还是 LOADING。所以在这里
		//      立刻解析命名空间必然是空的 —— 那不是配置错误，是时机不到。
		//      实测证据：条目存在、runtime.Config 是 function，唯独 state === 1。
		//   2. 取值路径（settingsDescriptor / dsttSettingsNs）是惰性的，每次调用都
		//      重新解析，所以运行期的读写本来就正确。真正需要"开机做一次"的只有
		//      下面两件事：自检（没接线就要说出来）与老 mode 值迁移。
		//
		// 于是退避重试到就绪为止；到点仍没有才出声，并把服务实际提供的命名空间
		// 一并列出来 —— 少了那一行，下一个人只会看到"没有设置条目"，那句话是真的，
		// 但完全帮不上忙（这一版就是这么绕了一圈才定位到的）。
		try {
			if (DsttSettingsSchema === null) {
				console.warn("[deepseek-style-theme] DSTT settings have no schema (Schemastery is missing, see above): the mode will not persist");
				return;
			}
			let attempts = 0;
			const settle = () => {
				attempts += 1;
				const ns = dsttSettingsNs(settingsCtx);
				if (ns === null) {
					// 40 × 500ms = 20s：整棵插件树启动远用不了这么久，超过就是真没接线。
					if (attempts < 40) return;
					clearInterval(timer);
					const available = (settingsNamespaces(settingsCtx) ?? [])
						.map((row) => (row === null || typeof row !== "object" ? "?" : String(row.ns)))
						.slice(0, 12);
					console.warn(`[deepseek-style-theme] no settings entry for this plugin (tried ${DSTT_SETTINGS_NS_CANDIDATES.join(", ")}) after ${attempts} attempts: DSTT preferences will not persist. The settings service reports ${available.length} namespace(s): ${available.length === 0 ? "(none)" : available.join(", ")}`);
					return;
				}
				clearInterval(timer);
				const descriptor = settingsDescriptor(settingsCtx, ns);
				const stored = descriptor === null ? undefined : descriptor.value.mode;
				const migrated = migrateLegacyMode(stored);
				if (migrated !== null) {
					settingsCtx.settings.mutate(ns, [{ op: "set", path: ["mode"], value: migrated }])
						.then(() => console.warn(`[deepseek-style-theme] migrated DSTT mode "${stored}" -> "${migrated}"`))
						.catch(() => {});
				}
			};
			const timer = setInterval(settle, 500);
			// 这个定时器不该拖着进程不让它退出。
			if (typeof timer.unref === "function") timer.unref();
			settle();
		} catch (error) {
			console.warn("[deepseek-style-theme] DSTT settings wiring failed (the mode will not persist):", error);
		}
	});

	// The private bridge is a plain webServer prefix route. dsh 0.1.5's
	// `connection.rpc.handle()` registers its route through the *provider's* ctx,
	// so it trips cordis' guard — `cannot get property "webServer" without
	// inject` — no matter what this plugin declares in its own inject list.
	// ctx.webServer is the same mechanism the shipped plugin console uses, and
	// the browser half reaches it with a same-origin fetch.
	const webServer = ctx.webServer;
	if (webServer === undefined || webServer === null || typeof webServer.register !== "function") {
		console.warn("[deepseek-style-theme] webServer unavailable: 打开工作区与模式持久化将不可用");
		return;
	}
	const handler = async (endpoint, payload) => {
		try {
			if (endpoint === DSTT_GET) return dsttRead(ctx);
			if (endpoint === DSTT_SET) {
				const payloadObject = payload === null || payload === undefined || typeof payload !== "object" ? {} : payload;
				return await dsttWrite(ctx, payloadObject.mode, payloadObject.fluidBrush, payloadObject.glassStyle, payloadObject.composerRefraction, payloadObject.backdropBlur, payloadObject.backgroundMode, payloadObject.customBackground, payloadObject.ambientBackground);
			}
			if (endpoint === WALLPAPER_GET) {
				const info = await desktopWallpaper();
				if (info === null) return { ok: true, value: { kind: "none" } };
				if (typeof info.path === "string" && info.path !== "") {
					return {
						ok: true,
						value: {
							kind: "image",
							url: CHANNEL + WALLPAPER_SUBPATH,
							source: typeof info.source === "string" ? info.source : "unknown",
							// WallpaperStyle: 10 fill, 6 fit, 2 stretch, 0 centre, 22 span.
							style: typeof info.style === "number" ? info.style : 10,
							tile: info.tile === 1
						}
					};
				}
				if (typeof info.color === "string" && info.color !== "") {
					return { ok: true, value: { kind: "color", color: info.color } };
				}
				return { ok: true, value: { kind: "none" } };
			}
			if (endpoint === FILE_OPEN || endpoint === FILE_REVEAL) {
				const target = localPathOf(payload);
				if (target === null) {
					return failure("bad-request", "payload.path must be a non-empty absolute local path", { issues: [] });
				}
				const done = endpoint === FILE_OPEN ? await openFileGeneric(target) : await revealFileGeneric(target);
				if (!done) {
					return failure("internal", endpoint === FILE_OPEN
						? "the system failed to open the file with its default application"
						: "the system file manager failed to reveal the file", {});
				}
				return { ok: true, value: { opened: true } };
			}
			// dshome/explorer.open 已随"打开工作区"菜单一并删除（2.2.0，需求第 9 条）：
			// 那个手势改用官方的 open-in-app，本插件不再自己开文件管理器。
			return failure("bad-request", `unknown endpoint "${endpoint}"`, { issues: [] });
		} catch (error) {
			const message = error instanceof Error ? error.message : "unexpected failure in the rpc handler";
			return failure("internal", message, {});
		}
	};
	ctx.effect(() => webServer.register({
		kind: "prefix",
		path: CHANNEL,
		handler: async (req, res) => {
			if (!isTrustedBridgeRequest(req)) {
				sendJson(res, 403, failure("bad-request", "untrusted request origin: loopback and same-origin authorities only", {}));
				return;
			}
			// The wallpaper bytes ride the same fenced route as a GET: the page uses
			// that URL as a CSS background image, which cannot carry a JSON body. The
			// endpoint takes no input, so the only file it can ever serve is the one
			// the host itself resolved for the desktop -- never a path from the page.
			if (req.method === "GET" && subPathOf(req) === WALLPAPER_SUBPATH) {
				await sendWallpaper(res);
				return;
			}
			if (!isJsonRequest(req)) {
				sendJson(res, 400, failure("bad-request", "content-type must be application/json", {}));
				return;
			}
			try {
				const body = await readJsonBody(req);
				const endpoint = body === null || typeof body !== "object" ? undefined : body.endpoint;
				const payload = body === null || typeof body !== "object" ? undefined : body.payload;
				sendJson(res, 200, await handler(endpoint, payload));
			} catch (error) {
				sendJson(res, 200, failure("internal", error instanceof Error ? error.message : "bridge failure", {}));
			}
		}
	}), "deepseek-style-theme: private bridge route");
}

/** One request header, or undefined when absent (Node lowercases header names). */
function headerValue(headers, name) {
	const value = headers === undefined || headers === null ? undefined : headers[name];
	return typeof value === "string" ? value : undefined;
}

/** Whether a TCP peer address is loopback. */
function isLoopbackAddress(address) {
	const value = typeof address === "string" ? address : "";
	return value === "127.0.0.1" || value === "::1" || value.startsWith("::ffff:127.") || value.startsWith("127.");
}

/** Whether one authority's hostname names this machine's own loopback interface. */
function isLoopbackHostname(hostname) {
	const value = hostname.replace(/^\[/u, "").replace(/\]$/u, "").toLowerCase();
	return value === "localhost" || value === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u.test(value);
}

/**
 * Fence for the private bridge route, mirroring the core's own
 * `isTrustedApiRequest` (dsh-client-connection) instead of trusting the TCP peer
 * alone. The peer address is necessary but not sufficient: a cross-site
 * `fetch()` with a simple content type never triggers a preflight, so its side
 * effects run even though the page cannot read the response, and a rebinding
 * hostname resolves to 127.0.0.1 while still arriving with the attacker's name
 * in `Host`.
 *
 * So the request must also carry a loopback authority, and any browser
 * provenance headers must agree with it. A caller sending no `Origin` (curl, the
 * CLI) is allowed, exactly as the core allows it. Loopback-only is also the
 * contract the route has always had, so this narrows nothing that worked before.
 */
function isTrustedBridgeRequest(req) {
	const socket = req.socket === undefined || req.socket === null ? null : req.socket;
	if (!isLoopbackAddress(socket === null ? "" : socket.remoteAddress)) return false;
	const host = headerValue(req.headers, "host");
	if (host === undefined) return false;
	let hostUrl;
	try {
		hostUrl = new URL("http://" + host);
	} catch (error) {
		return false;
	}
	if (!isLoopbackHostname(hostUrl.hostname)) return false;
	if (headerValue(req.headers, "sec-fetch-site") === "cross-site") return false;
	const origin = headerValue(req.headers, "origin");
	if (origin === undefined) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch (error) {
		return false;
	}
}

/**
 * Whether a request body is JSON. Requiring it costs this plugin nothing (its own
 * client always sends it) and makes every cross-site attempt a non-simple
 * request, so the browser must preflight a route that never answers a preflight.
 */
function isJsonRequest(req) {
	const value = headerValue(req.headers, "content-type");
	return value !== undefined && value.split(";")[0].trim().toLowerCase() === "application/json";
}

/**
 * Whether a path addresses a network share or a device namespace. `isAbsolute`
 * is true for `\\host\share` on Windows, and opening such a path makes Windows
 * authenticate to that host — an NTLM hash leak reachable from a cross-site
 * request. The theme only ever opens local workspace directories, so the whole
 * `\\` and `//` namespace is refused.
 */
function isNetworkPath(path) {
	return path.startsWith("\\\\") || path.startsWith("//");
}

/** Read one JSON request body from the Node request stream (bounded). */
async function readJsonBody(req) {
	let raw = "";
	for await (const chunk of req) {
		raw += chunk;
		if (raw.length > 65536) throw new Error("request body too large");
	}
	return raw === "" ? null : JSON.parse(raw);
}

/** Write one JSON response. */
function sendJson(res, status, value) {
	const payload = JSON.stringify(value);
	res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
	res.end(payload);
}

// The bridge rides `webServer` (declared hard: it is core to any web realm).
// `connection` is no longer injected — dsh 0.1.5's rpc carrier cannot host this
// plugin's channel without tripping the guard described in apply().
const inject = ["webServer"];

// 0.2.0 changed how a plugin owns settings, and the change is structural rather
// than a rename. There is no `settings.register(ns, schema)` any more anywhere
// in the product; a settings namespace IS a profile entry, its id is the
// namespace, and its shape is read off `fiber.runtime.Config` -- this export.
// The service also refuses to write a field that is not marked volatile
// (`volatile` is a Schemastery method that sets meta.volatile), which is why
// every field above carries `.volatile()`: without it the section still renders
// but every write fails with "has no volatile fields". Exporting `undefined`
// when Schemastery is missing keeps the loader on "no schema" instead of
// handing it a broken one.
const Config = DsttSettingsSchema === null ? undefined : DsttSettingsSchema;

// 两处都挂：cordis 读结构的位置是 `runtime.Config`，而 `runtime` 在功能型插件上
// 可能是模块命名空间，也可能是被选中的那个函数本身。哪一种是实现细节，不值得赌，
// 所以函数上也带一份。代价是同一个对象有两个名字，改的时候两边一起改。
apply.Config = Config;

export { apply, inject, Config };
