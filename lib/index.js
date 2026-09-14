// Host side of the DeepSeek-style theme plugin.
// Registers a Package-private RPC channel the browser half uses to open a
// workspace's directory in the OS file manager and bring the window to the
// foreground. The built-in host.openPath (Invoke-Item) leaves the Explorer
// window in the background when spawned from this windowless service process,
// so this plugin owns the whole "open workspace" gesture instead.
// It also owns the DSTT settings section and, once per activation, aligns the
// official DeepSeek route's advisory model catalog with the ids the endpoint
// actually advertises (see the catalog-sync block below).
//
// Wire contract: every return is an RpcResult<T> per rpc.schema.js. Error
// codes must come from the closed enum (bad-request / internal) — an
// off-enum code would make the connection layer's serverResponseSchema.parse
// reject the frame and surface as a carrier failure instead of a clean error.
import { execFile } from "node:child_process";
import { isAbsolute } from "node:path";
import z from "@deepseek-ai/schemastery";

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
// `settingsNamespace` from @deepseek-ai/dsh-settings was deleted in dsh
// 0.1.2-alpha.1 (the settings service itself is unchanged - register /
// describe / mutate below still take the namespace string), so this is now
// a plain literal. Keep it in sync with the client half's DSTT_NS.
const DSTT_SETTINGS_NS = "deepseek-style-theme";
const DSTT_MODES = ["peakvalley-redblue", "peakvalley-redgreen", "always-green", "always-blue"];
// 1.37.x persisted `auto` / `blue` / `green`. The schema still accepts them —
// otherwise register() validates the stored document and throws, killing DSTT
// persistence on upgrade — and apply() migrates them to the closest four-mode
// value right after registration.
const DSTT_LEGACY_MODES = { auto: "peakvalley-redblue", blue: "always-blue", green: "always-green" };
const DsttSettingsSchema = z.object({
	mode: z.union([
		z.const("peakvalley-redblue"),
		z.const("peakvalley-redgreen"),
		z.const("always-green"),
		z.const("always-blue"),
		z.const("auto"),
		z.const("blue"),
		z.const("green")
	]).default("peakvalley-redblue")
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
 * Advisory model-catalog sync for the official DeepSeek route.
 *
 * `dsh-llm-deepseek` deliberately never probes its gateway — `listModels()`
 * returns the declared catalog and the README states the defaults are published
 * "without probing gateway availability" — so the composer's model selector can
 * drift from what the endpoint actually serves, and nothing in the harness would
 * ever notice. On activation this plugin therefore asks the endpoint which ids
 * it advertises (the same call the Models page makes: GET {baseURL}/models) and
 * rewrites `llm-deepseek.models` when — and only when — the id list differs.
 *
 * The endpoint reports ids only, so it cannot supply capability metadata (image
 * input, the in-history system-prompt mode, context window): entries that already
 * exist are preserved verbatim, ids seen for the first time are filled from
 * KNOWN_CATALOG_ENTRIES, and ids the endpoint does not list are dropped, because
 * the endpoint is the authority on which models exist.
 *
 * Every failure mode (no settings, no credential, offline gateway, renamed
 * service) is a silent no-op — a skin must never be able to break the model
 * catalog — and it only writes on real drift, so boots stay event-free.
 */
const LLM_DEEPSEEK_NS = "llm-deepseek";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";
const CATALOG_SYNC_TIMEOUT_MS = 5000;
/** Retry offsets (ms) while a boot-order prerequisite is still missing. */
const CATALOG_SYNC_RETRIES = [0, 2000, 6000, 15000];
/**
 * Outcomes worth retrying: activation order is not ours to choose, so the
 * provider may not have registered `llm-deepseek` yet and the credentials
 * service may not be reachable at the instant this plugin activates. A failed
 * or answered probe (in-sync / updated / endpoint-unreachable) is final.
 */
const CATALOG_SYNC_RETRYABLE = ["provider-absent", "no-credentials"];

/**
 * Capability metadata for ids this plugin knows by name. Only consulted for ids
 * the endpoint advertises that the stored catalog does not describe yet; an
 * existing entry is never overwritten, so a user's own edits survive.
 */
const KNOWN_CATALOG_ENTRIES = {
	"deepseek-flash": {
		name: "DeepSeek-V41-Flash",
		contextWindow: 1000000,
		inputModalities: ["text", "image"],
		imagePixelBudget: 640000,
		imageMaxBytes: 1048576,
		systemPromptUpdate: "in-history"
	},
	"deepseek-v4-pro": {
		name: "DeepSeek-V4-Pro",
		contextWindow: 1000000,
		inputModalities: ["text"]
	}
};

/** The resolved `llm-deepseek` settings section, or null while it is absent. */
function llmDeepseekSection(ctx) {
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.describe !== "function") return null;
	let descriptors;
	try {
		descriptors = settings.describe({ redactSecrets: true });
	} catch (error) {
		return null;
	}
	if (!Array.isArray(descriptors)) return null;
	const descriptor = descriptors.find((candidate) => String(candidate.ns) === LLM_DEEPSEEK_NS);
	const value = descriptor === undefined || descriptor === null ? undefined : descriptor.value;
	return value !== null && typeof value === "object" ? value : null;
}

/**
 * Resolve the provider API key the same way `dsh-llm-deepseek` does: through the
 * credentials service under the configured `apiKeyEnv`, falling back to the
 * ambient environment of the launching process.
 */
async function resolveProviderKey(ctx, apiKeyEnv) {
	const ref = typeof apiKeyEnv === "string" && apiKeyEnv !== "" ? apiKeyEnv : DEFAULT_API_KEY_ENV;
	const credentials = ctx.get("credentials");
	if (credentials !== undefined && credentials !== null && typeof credentials.resolve === "function") {
		try {
			const hit = await credentials.resolve(ref);
			if (hit !== undefined && hit !== null && typeof hit.value === "string" && hit.value !== "") return hit.value;
		} catch (error) {
			// Fall through to the ambient environment.
		}
	}
	const ambient = typeof process !== "undefined" && process.env !== undefined ? process.env[ref] : undefined;
	return typeof ambient === "string" && ambient !== "" ? ambient : null;
}

/** Ask the endpoint which model ids it advertises, in endpoint order. */
async function fetchEndpointModelIds(baseURL, key) {
	if (typeof fetch !== "function") return null;
	const url = String(baseURL).replace(/\/+$/, "") + "/models";
	const signal = typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
		? AbortSignal.timeout(CATALOG_SYNC_TIMEOUT_MS)
		: undefined;
	const response = await fetch(url, {
		headers: { authorization: "Bearer " + key, accept: "application/json" },
		...(signal === undefined ? {} : { signal })
	});
	if (!response.ok) throw new Error("endpoint answered " + String(response.status));
	const body = await response.json();
	const rows = body !== null && typeof body === "object" && Array.isArray(body.data) ? body.data : [];
	const ids = [];
	for (const row of rows) {
		const id = row !== null && typeof row === "object" && typeof row.id === "string" ? row.id.trim() : "";
		if (id !== "" && !ids.includes(id)) ids.push(id);
	}
	return ids;
}

/** One catalog entry for an id the stored catalog does not describe yet. */
function catalogEntryFor(id) {
	const known = Object.prototype.hasOwnProperty.call(KNOWN_CATALOG_ENTRIES, id) ? KNOWN_CATALOG_ENTRIES[id] : undefined;
	return known === undefined ? { id, name: id, inputModalities: ["text"] } : { id, ...known };
}

/**
 * Align the stored catalog with the endpoint's id list, preserving surviving
 * entries verbatim. Returns one of: provider-absent | no-credentials |
 * endpoint-unreachable | in-sync | updated.
 */
async function syncDeepseekCatalog(ctx) {
	const section = llmDeepseekSection(ctx);
	if (section === null) return "provider-absent";
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.mutate !== "function") return "provider-absent";
	const key = await resolveProviderKey(ctx, section.apiKeyEnv);
	if (key === null) return "no-credentials";
	const baseURL = typeof section.baseURL === "string" && section.baseURL !== "" ? section.baseURL : DEFAULT_DEEPSEEK_BASE_URL;
	let ids;
	try {
		ids = await fetchEndpointModelIds(baseURL, key);
	} catch (error) {
		return "endpoint-unreachable";
	}
	if (ids === null || ids.length === 0) return "endpoint-unreachable";
	const current = Array.isArray(section.models) ? section.models : [];
	const currentIds = current
		.map((entry) => (entry !== null && typeof entry === "object" && typeof entry.id === "string" ? entry.id : ""))
		.filter((id) => id !== "");
	if (currentIds.length === ids.length && currentIds.every((id, index) => id === ids[index])) return "in-sync";
	const byId = new Map();
	for (const entry of current) {
		if (entry !== null && typeof entry === "object" && typeof entry.id === "string") byId.set(entry.id, entry);
	}
	const models = ids.map((id) => (byId.has(id) ? byId.get(id) : catalogEntryFor(id)));
	await settings.mutate(LLM_DEEPSEEK_NS, [{ op: "set", path: ["models"], value: models }]);
	return "updated";
}

/**
 * Run the catalog sync once per activation, retrying briefly while a boot-order
 * prerequisite is still missing (the provider namespace or the credentials
 * service). Disposal cancels any pending retry.
 */
function startCatalogSync(ctx) {
	return ctx.effect(() => {
		let cancelled = false;
		let timer = null;
		const attempt = (step) => {
			if (cancelled) return;
			syncDeepseekCatalog(ctx).then((outcome) => {
				if (cancelled) return;
				if (outcome === "updated") {
					console.info("[deepseek-style-theme] model catalog synced from the provider endpoint");
					return;
				}
				if (CATALOG_SYNC_RETRYABLE.includes(outcome) && step + 1 < CATALOG_SYNC_RETRIES.length) {
					timer = setTimeout(() => attempt(step + 1), CATALOG_SYNC_RETRIES[step + 1]);
				}
			}).catch(() => {});
		};
		attempt(0);
		return () => {
			cancelled = true;
			if (timer !== null) clearTimeout(timer);
		};
	}, "deepseek-style-theme: model catalog sync");
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
	// Both registrations below are best-effort on purpose: dsh ships breaking
	// changes to the settings / connection APIs between releases, and a throw
	// here fails this bundle's loader entry — with it the whole plugin tree,
	// which is far worse than a theme that merely loses its persistence.
	ctx.inject(["settings"], (settingsCtx) => {
		try {
			settingsCtx.settings.register(DSTT_SETTINGS_NS, DsttSettingsSchema);
			const descriptor = settingsCtx.settings.describe({ redactSecrets: true })
				.find((candidate) => String(candidate.ns) === String(DSTT_SETTINGS_NS));
			const stored = descriptor === undefined || descriptor === null ? undefined : descriptor.value?.mode;
			const migrated = migrateLegacyMode(stored);
			if (migrated !== null) {
				settingsCtx.settings.mutate(DSTT_SETTINGS_NS, [{ op: "set", path: ["mode"], value: migrated }])
					.then(() => console.warn(`[deepseek-style-theme] migrated DSTT mode "${stored}" -> "${migrated}"`))
					.catch(() => {});
			}
		} catch (error) {
			console.warn("[deepseek-style-theme] settings.register failed (DSTT mode will not persist):", error);
		}
		// Activation-time, best-effort, silent unless it really changed something.
		try {
			startCatalogSync(settingsCtx);
		} catch (error) {
			console.warn("[deepseek-style-theme] catalog sync unavailable:", error);
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
	};
	ctx.effect(() => webServer.register({
		kind: "prefix",
		path: CHANNEL,
		handler: async (req, res) => {
			if (!isLoopbackAddress(req.socket === undefined || req.socket === null ? "" : req.socket.remoteAddress)) {
				sendJson(res, 403, failure("bad-request", "loopback only", {}));
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

/** Loopback-only fence for the private bridge route (same idiom as the console). */
function isLoopbackAddress(address) {
	const value = typeof address === "string" ? address : "";
	return value === "127.0.0.1" || value === "::1" || value.startsWith("::ffff:127.") || value.startsWith("127.");
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

export { apply, inject };
