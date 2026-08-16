// Host side of the DeepSeek-style theme plugin.
// Registers a Package-private RPC channel the browser half uses to open a
// workspace's directory in the OS file manager and bring the window to the
// foreground. The built-in host.openPath (Invoke-Item) leaves the Explorer
// window in the background when spawned from this windowless service process,
// so this plugin owns the whole "open workspace" gesture instead.
import { execFile } from "node:child_process";

const CHANNEL = "/dshome-open-workspace";

/** PowerShell single-quoted literal (doubles embedded quotes). */
function powershellLiteral(path) {
	return `'${path.replace(/'/g, "''")}'`;
}

/** Open one path with Shell.Application, then focus the matching Explorer window. */
function openExplorerForeground(path) {
	return new Promise((resolve) => {
		const script = [
			`$p = ${powershellLiteral(path)}`,
			"$sh = New-Object -ComObject Shell.Application",
			"$sh.Open($p)",
			"Start-Sleep -Milliseconds 500",
			"$f = $false",
			"foreach ($w in @($sh.Windows())) {",
			"  try { if ($w.Document.Folder.Self.Path -ieq $p) { $null = $w.Focus(); $f = $true; break } } catch {}",
			"}",
			"if (-not $f) { $null = (New-Object -ComObject WScript.Shell).AppActivate((Split-Path $p -Leaf)) }"
		].join("; ");
		execFile("powershell.exe", ["-NoProfile", "-Command", script], { windowsHide: true }, (error) => {
			resolve(error === null || error === undefined);
		});
	});
}

function apply(ctx) {
	const connection = ctx.get("connection");
	if (connection === undefined || connection === null || connection.rpc === undefined) return;
	ctx.effect(() => connection.rpc.handle(CHANNEL, async (endpoint, payload) => {
		if (endpoint !== "dshome/explorer.open") {
			return { ok: false, error: { code: "unknown-endpoint", message: `unknown endpoint "${endpoint}"`, details: {} } };
		}
		const path = payload === null || payload === undefined || typeof payload !== "object" ? undefined : payload.path;
		if (typeof path !== "string" || path === "") {
			return { ok: false, error: { code: "invalid-payload", message: "payload.path must be a non-empty string", details: {} } };
		}
		const opened = await openExplorerForeground(path);
		if (!opened) {
			return { ok: false, error: { code: "internal", message: "powershell.exe failed to open the path", details: {} } };
		}
		return { ok: true, value: { opened: true } };
	}, { authority: "loopback" }), "deepseek-style-theme: explorer-open rpc");
}

const inject = ["connection"];

export { apply, inject };
