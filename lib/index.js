// Host side of the DeepSeek-style theme plugin.
// Registers a Package-private RPC channel the browser half uses to open a
// workspace's directory in the OS file manager and bring the window to the
// foreground. The built-in host.openPath (Invoke-Item) leaves the Explorer
// window in the background when spawned from this windowless service process,
// so this plugin owns the whole "open workspace" gesture instead.
//
// Wire contract: every return is an RpcResult<T> per rpc.schema.js. Error
// codes must come from the closed enum (bad-request / internal) — an
// off-enum code would make the connection layer's serverResponseSchema.parse
// reject the frame and surface as a carrier failure instead of a clean error.
import { execFile } from "node:child_process";
import { isAbsolute } from "node:path";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

const CHANNEL = "/dshome-open-workspace";
/** Hard cap per opener process: a hung COM call must not hang the RPC forever. */
const OPEN_TIMEOUT_MS = 10000;

/**
 * Durable DSTT (DeepSeekStyleTheme) preference section, registered into the
 * host settings document exactly like the product's own namespaces
 * (ui-theme/locale/ui-conversation): the client half binds this namespace
 * through `settingsScope` and reads/writes the preference fields.
 * A single `mode` enum replaces the earlier pair of boolean switches
 * (peakPink/forceGreen), so the UI is one three-way choice with no
 * interdependent toggles:
 *   - auto  → time-sliced: green off-peak (safe), blue during peak hours;
 *   - blue  → always blue, no peak distinction;
 *   - green → always green, no peak distinction.
 */
const DSTT_SETTINGS_NS = settingsNamespace("deepseek-style-theme");
const DSTT_MODES = ["auto", "blue", "green"];
const DsttSettingsSchema = z.object({
	mode: z.union([z.const("auto"), z.const("blue"), z.const("green")]).default("auto")
});

/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(path) {
	return `'${path.replace(/'/g, "''")}'`;
}

/**
 * Open one path with Shell.Application, then focus the matching Explorer
 * window. The open step is strict: any COM failure exits the script non-zero
 * so the caller reports a real failure instead of a false success. Focusing
 * stays best-effort — a directory that opened but could not be focused is
 * still a successful open.
 */
function openExplorerForeground(path) {
	return new Promise((resolve) => {
		const script = [
			"$ErrorActionPreference = 'Stop'",
			`$p = ${powershellLiteral(path)}`,
			"$sh = New-Object -ComObject Shell.Application",
			"try { $sh.Open($p) } catch { exit 1 }",
			"Start-Sleep -Milliseconds 500",
			"$f = $false",
			"foreach ($w in @($sh.Windows())) {",
			"  try { if ($w.Document.Folder.Self.Path -ieq $p) { $null = $w.Focus(); $f = $true; break } } catch {}",
			"}",
			"if (-not $f) { $null = (New-Object -ComObject WScript.Shell).AppActivate((Split-Path $p -Leaf)) }"
		].join("; ");
		execFile("powershell.exe", ["-NoProfile", "-Command", script], { windowsHide: true, timeout: OPEN_TIMEOUT_MS }, (error) => {
			resolve(error === null || error === undefined);
		});
	});
}

/** Run a simple command and resolve with whether it exited cleanly. */
function runOpener(command, args) {
	return new Promise((resolve) => {
		execFile(command, args, { windowsHide: true, timeout: OPEN_TIMEOUT_MS }, (error) => {
			resolve(error === null || error === undefined);
		});
	});
}

/** Open a directory in the platform's default file manager. */
function openPathGeneric(path) {
	switch (process.platform) {
		case "win32":
			return openExplorerForeground(path);
		case "darwin":
			return runOpener("open", [path]);
		case "linux":
			return runOpener("xdg-open", [path]);
		default:
			return Promise.resolve(false);
	}
}

/** Uniform RpcResult failure branch. */
function failure(code, message, details) {
	return { ok: false, error: { code, message, details } };
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

/** Read the durable DSTT mode (schema default "auto" when absent). */
function dsttRead(ctx) {
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.describe !== "function") {
		return failure("internal", "settings service unavailable", {});
	}
	const descriptor = settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === String(DSTT_SETTINGS_NS));
	const mode = descriptor !== undefined && DSTT_MODES.includes(descriptor.value?.mode) ? descriptor.value.mode : "auto";
	return { ok: true, value: { mode } };
}

/** Write the durable DSTT mode through the host settings service directly. */
async function dsttWrite(ctx, mode) {
	if (!DSTT_MODES.includes(mode)) {
		return failure("bad-request", `mode must be one of ${DSTT_MODES.join("/")}`, { issues: [] });
	}
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.mutate !== "function") {
		return failure("internal", "settings service unavailable", {});
	}
	try {
		await settings.mutate(DSTT_SETTINGS_NS, [{ op: "set", path: ["mode"], value: mode }]);
	} catch (error) {
		return failure("internal", error instanceof Error ? error.message : "settings write failed", {});
	}
	return { ok: true, value: { mode } };
}

function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(DSTT_SETTINGS_NS, DsttSettingsSchema);
	});

	const connection = ctx.get("connection");
	if (connection === undefined || connection === null || connection.rpc === undefined) return;
	ctx.effect(() => connection.rpc.handle(CHANNEL, async (endpoint, payload) => {
		try {
			if (endpoint === DSTT_GET) return dsttRead(ctx);
			if (endpoint === DSTT_SET) {
				const mode = payload === null || payload === undefined || typeof payload !== "object" ? undefined : payload.mode;
				return await dsttWrite(ctx, mode);
			}
			if (endpoint !== "dshome/explorer.open") {
				return failure("bad-request", `unknown endpoint "${endpoint}"`, { issues: [] });
			}
			const path = payload === null || payload === undefined || typeof payload !== "object" ? undefined : payload.path;
			if (typeof path !== "string" || path.trim() === "" || path.indexOf("\0") !== -1 || !isAbsolute(path)) {
				return failure("bad-request", "payload.path must be a non-empty absolute path", { issues: [] });
			}
			const opened = await openPathGeneric(path);
			if (!opened) {
				return failure("internal", "the system file manager failed to open the path", {});
			}
			return { ok: true, value: { opened: true } };
		} catch (error) {
			const message = error instanceof Error ? error.message : "unexpected failure in the rpc handler";
			return failure("internal", message, {});
		}
	}, { authority: "loopback" }), "deepseek-style-theme: private rpc");
}

const inject = ["connection"];

export { apply, inject };
