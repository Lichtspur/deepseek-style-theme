// Host side of the DeepSeek-style theme plugin.
// Registers a Package-private RPC channel the browser half uses to open a
// workspace's directory in the OS file manager and bring the window to the
// foreground. The built-in host.openPath (Invoke-Item) leaves the Explorer
// window in the background when spawned from this windowless service process,
// so this plugin owns the whole "open workspace" gesture instead. The same
// channel carries the delivered-file gestures the browser half's card menu
// needs: open with the default application, and reveal in the file manager.
// It also owns the DSTT settings section and, once per activation, aligns the
// official DeepSeek route's advisory model catalog with the ids the endpoint
// actually advertises (see the catalog-sync block below).
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
// `settingsNamespace` from @deepseek-ai/dsh-settings was deleted in dsh
// 0.1.2-alpha.1 (the settings service itself is unchanged - register /
// describe / mutate below still take the namespace string), so this is now
// a plain literal. Keep it in sync with the client half's DSTT_NS.
const DSTT_SETTINGS_NS = "deepseek-style-theme";
const DSTT_MODES = ["peakvalley-redblue", "peakvalley-redgreen", "always-green", "always-blue"];
const DSTT_MODE_DEFAULT = "peakvalley-redblue";
// 1.37.x persisted `auto` / `blue` / `green`. The schema still accepts them —
// otherwise register() validates the stored document and throws, killing DSTT
// persistence on upgrade — and apply() migrates them to the closest four-mode
// value right after registration.
const DSTT_LEGACY_MODES = { auto: "peakvalley-redblue", blue: "always-blue", green: "always-green" };
/**
 * Catalog-sync policies, most automatic first:
 *   - auto → align the catalog with the endpoint, but only while every
 *     advertised id is one this plugin can describe (see syncDeepseekCatalog);
 *   - add  → append-only: adopt newly advertised ids, remove nothing ever;
 *   - off  → probe and report drift, write nothing.
 */
const CATALOG_SYNC_POLICIES = ["auto", "add", "off"];
const CATALOG_SYNC_DEFAULT = "auto";
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
	]).default(DSTT_MODE_DEFAULT),
	catalogSync: z.union([
		z.const("auto"),
		z.const("add"),
		z.const("off")
	]).default(CATALOG_SYNC_DEFAULT),
	// The fluid background's pointer brush writes a velocity wake into the flow
	// field wherever the cursor goes. It is both the most expensive part of the
	// simulation and the most intrusive visually, so it ships OFF; this setting
	// exists only to turn it back on.
	fluidBrush: z.boolean().default(false)
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

/**
 * Open one file with the OS default application. Deliberately not
 * {@link openPathGeneric}: on Windows `Shell.Application.Open` on a file is the
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

/**
 * Advisory model-catalog sync for the official DeepSeek route.
 *
 * `dsh-llm-deepseek` deliberately never probes its gateway — `listModels()`
 * returns the declared catalog and the README states the defaults are published
 * "without probing gateway availability" — so the composer's model selector can
 * drift from what the endpoint actually serves, and nothing in the harness would
 * ever notice. On activation this plugin therefore asks the endpoint which ids
 * it advertises (the same call the Models page makes: GET {baseURL}/models) and
 * aligns `llm-deepseek.models` with the answer.
 *
 * Two properties keep that from being a liability:
 *
 *   1. It never invents capability metadata. The endpoint reports ids only, so
 *      it cannot supply `inputModalities`, `systemPromptUpdate` or a context
 *      window. Entries that already exist are preserved verbatim and new ids are
 *      filled from KNOWN_CATALOG_ENTRIES; an id this plugin cannot describe is
 *      reported rather than guessed, because a guessed entry silently downgrades
 *      a vision model to text-only.
 *   2. It only rewrites the list wholesale while every advertised id is
 *      describable. An official route advertises a handful of DeepSeek ids; an
 *      aggregating gateway in front of `baseURL` advertises its entire
 *      catalogue, and "the endpoint is authoritative" would then replace a
 *      curated two-entry catalog with hundreds of unrelated rows. A
 *      foreign-looking answer degrades to append-only plus a warning.
 *
 * Every failure mode (no settings, no credential, offline gateway, renamed
 * service, concurrent settings edit) is a no-op for the theme — a skin must
 * never be able to break the model catalog — and it only writes on real drift.
 * `catalogSync: "off"` probes and reports without ever writing.
 */
const LLM_DEEPSEEK_NS = "llm-deepseek";
/** Public endpoint; a deployment may point elsewhere through `$DEEPSEEK_BASE_URL`. */
const PUBLIC_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_BASE_URL_ENV = "DEEPSEEK_BASE_URL";
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

/** One registered namespace's descriptor (resolved value plus revision), or null. */
function settingsDescriptor(ctx, ns) {
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.describe !== "function") return null;
	let descriptors;
	try {
		descriptors = settings.describe({ redactSecrets: true });
	} catch (error) {
		return null;
	}
	if (!Array.isArray(descriptors)) return null;
	const descriptor = descriptors.find((candidate) => String(candidate.ns) === ns);
	if (descriptor === undefined || descriptor === null) return null;
	const value = descriptor.value;
	if (value === null || typeof value !== "object") return null;
	return { value, revision: descriptor.revision };
}

/** The resolved `llm-deepseek` settings section, or null while it is absent. */
function llmDeepseekSection(ctx) {
	return settingsDescriptor(ctx, LLM_DEEPSEEK_NS);
}

/** The configured catalog-sync policy, falling back to the schema default. */
function catalogSyncPolicy(ctx) {
	const descriptor = settingsDescriptor(ctx, DSTT_SETTINGS_NS);
	const policy = descriptor === null ? undefined : descriptor.value.catalogSync;
	return CATALOG_SYNC_POLICIES.includes(policy) ? policy : CATALOG_SYNC_DEFAULT;
}

/**
 * The endpoint the official adapter itself would dial, resolved in that
 * adapter's own order (`dsh-llm-deepseek` resolves `config.baseURL ??
 * launchEnvironment.get("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com"`).
 * Falling straight back to the public host would post the resolved credential to
 * api.deepseek.com on a deployment whose gateway lives behind that variable —
 * and that credential may be a gateway token, not a DeepSeek key. The service's
 * own fallback is a raw `process.env` snapshot, so consulting `process.env` only
 * while the service is absent matches the adapter exactly instead of widening
 * trust.
 */
function resolveBaseURL(ctx, section) {
	if (typeof section.baseURL === "string" && section.baseURL !== "") return section.baseURL;
	const environment = ctx.get("launchEnvironment");
	if (environment === undefined || environment === null || typeof environment.get !== "function") {
		const ambient = process.env[DEEPSEEK_BASE_URL_ENV];
		return typeof ambient === "string" && ambient !== "" ? ambient : PUBLIC_DEEPSEEK_BASE_URL;
	}
	try {
		const hit = environment.get(DEEPSEEK_BASE_URL_ENV);
		const value = hit === undefined || hit === null ? undefined : hit.value;
		if (typeof value === "string" && value !== "") return value;
	} catch (error) {
		// Fall through to the public endpoint, exactly like the adapter does.
	}
	return PUBLIC_DEEPSEEK_BASE_URL;
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

/** Whether this plugin can describe an id without inventing capability metadata. */
function isDescribable(id) {
	return Object.prototype.hasOwnProperty.call(KNOWN_CATALOG_ENTRIES, id);
}

/** The ids of a catalog array, in order, ignoring malformed entries. */
function catalogIds(entries) {
	return entries
		.map((entry) => (entry !== null && typeof entry === "object" && typeof entry.id === "string" ? entry.id : ""))
		.filter((id) => id !== "");
}

/**
 * Align the stored catalog with the endpoint's id list, preserving surviving
 * entries verbatim. Returns one of: provider-absent | no-credentials |
 * endpoint-unreachable | in-sync | updated | conflict.
 */
async function syncDeepseekCatalog(ctx) {
	const section = llmDeepseekSection(ctx);
	if (section === null) return "provider-absent";
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.mutate !== "function") return "provider-absent";
	const policy = catalogSyncPolicy(ctx);
	const baseURL = resolveBaseURL(ctx, section.value);
	const key = await resolveProviderKey(ctx, section.value.apiKeyEnv);
	if (key === null) return "no-credentials";
	let ids;
	try {
		ids = await fetchEndpointModelIds(baseURL, key);
	} catch (error) {
		return "endpoint-unreachable";
	}
	if (ids === null || ids.length === 0) return "endpoint-unreachable";
	const current = Array.isArray(section.value.models) ? section.value.models : [];
	const byId = new Map();
	for (const entry of current) {
		if (entry !== null && typeof entry === "object" && typeof entry.id === "string") byId.set(entry.id, entry);
	}
	const currentIds = catalogIds(current);
	// Advertised ids this plugin knows nothing about: reported, never guessed.
	const undescribed = ids.filter((id) => !byId.has(id) && !isDescribable(id));

	if (policy === "off") {
		const missing = ids.filter((id) => !byId.has(id));
		const stale = currentIds.filter((id) => !ids.includes(id));
		if (missing.length === 0 && stale.length === 0) return "in-sync";
		console.warn(
			`[deepseek-style-theme] model catalog drift at ${baseURL} (catalogSync is "off", nothing written) — endpoint adds: ${missing.join(", ") || "none"}; endpoint no longer lists: ${stale.join(", ") || "none"}`
		);
		return "in-sync";
	}

	// A wholesale rewrite is only safe while every advertised id is one this
	// plugin can describe; otherwise the answer looks like a gateway catalogue
	// rather than the official route, and aligning to it would replace a curated
	// catalog with unrelated rows.
	const rewrites = policy === "auto" && undescribed.length === 0;
	let models;
	if (rewrites) {
		if (currentIds.length === ids.length && currentIds.every((id, index) => id === ids[index])) return "in-sync";
		models = ids.map((id) => (byId.has(id) ? byId.get(id) : catalogEntryFor(id)));
	} else {
		const added = ids.filter((id) => !byId.has(id) && isDescribable(id));
		if (added.length === 0) {
			if (undescribed.length > 0) {
				console.warn(
					`[deepseek-style-theme] ${baseURL} advertises ${undescribed.length} model id(s) this plugin cannot describe (${undescribed.slice(0, 5).join(", ")}); leaving llm-deepseek.models untouched rather than guessing their capabilities.`
				);
			}
			return "in-sync";
		}
		models = [...current, ...added.map((id) => catalogEntryFor(id))];
	}

	const removed = currentIds.filter((id) => !models.some((entry) => entry.id === id));
	try {
		// Pinned to the revision this decision was read from: a settings edit the
		// user made in the meantime wins, and this activation simply does not sync.
		await settings.mutate(LLM_DEEPSEEK_NS, [{ op: "set", path: ["models"], value: models }], section.revision);
	} catch (error) {
		return "conflict";
	}
	if (removed.length > 0) {
		console.warn(
			`[deepseek-style-theme] model catalog synced from ${baseURL}; removed id(s) the endpoint does not list: ${removed.join(", ")}`
		);
	} else {
		console.info(`[deepseek-style-theme] model catalog synced from ${baseURL}`);
	}
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
				// "updated" already logged exactly what it changed where it changed it.
				if (outcome === "updated") return;
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
/** Delivered-file gestures for the card menu patched by the browser half. */
const FILE_OPEN = "dshome/file.open";
const FILE_REVEAL = "dshome/file.reveal";

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
	const descriptor = settingsDescriptor(ctx, DSTT_SETTINGS_NS);
	if (descriptor === null) return failure("internal", "settings service unavailable", {});
	const stored = descriptor.value.mode;
	return {
		ok: true,
		value: {
			mode: DSTT_MODES.includes(stored) ? stored : DSTT_MODE_DEFAULT,
			fluidBrush: descriptor.value.fluidBrush === true
		}
	};
}

/**
 * Write the durable DSTT preferences through the host settings service directly.
 * `fluidBrush` is optional: when it is a boolean the same write also sets it, so
 * the settings panel can persist the toggle without a second round trip.
 */
async function dsttWrite(ctx, mode, fluidBrush) {
	if (!DSTT_MODES.includes(mode)) {
		return failure("bad-request", `mode must be one of ${DSTT_MODES.join("/")}`, { issues: [] });
	}
	const ops = [{ op: "set", path: ["mode"], value: mode }];
	if (typeof fluidBrush === "boolean") ops.push({ op: "set", path: ["fluidBrush"], value: fluidBrush });
	const settings = ctx.get("settings");
	if (settings === undefined || settings === null || typeof settings.mutate !== "function") {
		return failure("internal", "settings service unavailable", {});
	}
	try {
		await settings.mutate(DSTT_SETTINGS_NS, ops);
	} catch (error) {
		return failure("internal", error instanceof Error ? error.message : "settings write failed", {});
	}
	return { ok: true, value: { mode, fluidBrush: ops.length > 1 ? fluidBrush === true : dsttBrushValue(ctx) } };
}

/** The stored fluid-brush preference, defaulting to off. */
function dsttBrushValue(ctx) {
	const descriptor = settingsDescriptor(ctx, DSTT_SETTINGS_NS);
	return descriptor === null ? false : descriptor.value.fluidBrush === true;
}

function apply(ctx) {
	// Both registrations below are best-effort on purpose: dsh ships breaking
	// changes to the settings / connection APIs between releases, and a throw
	// here fails this bundle's loader entry — with it the whole plugin tree,
	// which is far worse than a theme that merely loses its persistence.
	ctx.inject(["settings"], (settingsCtx) => {
		if (DsttSettingsSchema === null) {
			console.warn("[deepseek-style-theme] DSTT settings not registered (Schemastery is missing, see above): the mode will not persist");
		} else {
			try {
				settingsCtx.settings.register(DSTT_SETTINGS_NS, DsttSettingsSchema);
				const descriptor = settingsDescriptor(settingsCtx, DSTT_SETTINGS_NS);
				const stored = descriptor === null ? undefined : descriptor.value.mode;
				const migrated = migrateLegacyMode(stored);
				if (migrated !== null) {
					settingsCtx.settings.mutate(DSTT_SETTINGS_NS, [{ op: "set", path: ["mode"], value: migrated }])
						.then(() => console.warn(`[deepseek-style-theme] migrated DSTT mode "${stored}" -> "${migrated}"`))
						.catch(() => {});
				}
			} catch (error) {
				console.warn("[deepseek-style-theme] settings.register failed (DSTT mode will not persist):", error);
			}
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
				const payloadObject = payload === null || payload === undefined || typeof payload !== "object" ? {} : payload;
				return await dsttWrite(ctx, payloadObject.mode, payloadObject.fluidBrush);
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
			if (endpoint !== "dshome/explorer.open") {
				return failure("bad-request", `unknown endpoint "${endpoint}"`, { issues: [] });
			}
			const path = localPathOf(payload);
			if (path === null) {
				return failure("bad-request", "payload.path must be a non-empty absolute local path", { issues: [] });
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
			if (!isTrustedBridgeRequest(req)) {
				sendJson(res, 403, failure("bad-request", "untrusted request origin: loopback and same-origin authorities only", {}));
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

export { apply, inject };
