// Smoke test for the theme's private host bridge.
//
// The host half registers an ordinary `webServer` prefix route
// (/dshome-open-workspace) and the browser half talks to it with a same-origin
// fetch. This script mounts that exact route in a real HTTP server, speaks the
// client protocol against it, and checks the fence and the error paths.
//
// Usage:
//   node tools/bridge-smoke.mjs [path/to/lib/index.js]
// The default target is the copy installed in a dsh profile — the one dsh loads,
// and the only one where @deepseek-ai/* imports resolve. It is derived from
// DSH_HOME (default ~/.dsh) and DSH_PROFILE (default web), so it works on any
// machine without editing this file.

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

// --open really hands a scratch file to the OS, which opens a window on this
// desktop; the default run never launches anything.
const { values: opts, positionals } = parseArgs({
	options: { open: { type: 'boolean', default: false } },
	allowPositionals: true,
});

const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
const profile = process.env.DSH_PROFILE ?? 'web';
const target = positionals[0]
	?? join(home, 'profiles', profile, 'node_modules', '@dsh-external', 'dsh-deepseek-style-theme', 'lib', 'index.js');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

const mod = await import(new URL('file://' + target).href);

let route = null;
let mutated = null;
const settings = {
	register() {},
	describe() {
		return [{ ns: 'deepseek-style-theme', value: { mode: 'peakvalley-redgreen' } }];
	},
	mutate(ns, ops) {
		mutated = { ns, ops };
		return Promise.resolve();
	},
};

const disposers = [];
const settingsCtx = {
	settings,
	get(name) {
		return name === 'settings' ? settings : undefined;
	},
	effect(callback) {
		const dispose = callback();
		const disposer = typeof dispose === 'function' ? dispose : () => {};
		disposers.push(disposer);
		return disposer;
	},
};

const ctx = {
	webServer: {
		register(candidate) {
			route = candidate;
			return () => {};
		},
	},
	inject(list, callback) {
		callback(settingsCtx);
	},
	get(name) {
		return name === 'settings' ? settings : undefined;
	},
	effect(callback) {
		const dispose = callback();
		const disposer = typeof dispose === 'function' ? dispose : () => {};
		disposers.push(disposer);
		return disposer;
	},
};

mod.apply(ctx);

check('exports apply/inject', typeof mod.apply === 'function' && Array.isArray(mod.inject), JSON.stringify(mod.inject));
check('bridge route registered', route !== null && route.kind === 'prefix' && route.path === '/dshome-open-workspace',
	route === null ? 'none' : route.kind + ' ' + route.path);

if (route === null) {
	console.log('\nSMOKE FAILED (no route registered)');
	process.exit(1);
}

const server = createServer((req, res) => route.handler(req, res));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port + '/dshome-open-workspace';
const post = async (body) => {
	const response = await fetch(base, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
	return { status: response.status, json: await response.json() };
};

const got = await post({ endpoint: 'dstt.mode.get', payload: {} });
check('dstt.mode.get returns the stored mode', got.status === 200 && got.json.ok === true && got.json.value.mode === 'peakvalley-redgreen',
	JSON.stringify(got.json));

const set = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-blue' } });
check('dstt.mode.set persists through settings.mutate',
	set.json.ok === true && mutated !== null && mutated.ops[0].value === 'always-blue', JSON.stringify(mutated));

const invalidMode = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'auto' } });
check('legacy/unknown mode rejected on write', invalidMode.json.ok === false && invalidMode.json.error.code === 'bad-request',
	JSON.stringify(invalidMode.json.error));

const relative = await post({ endpoint: 'dshome/explorer.open', payload: { path: 'relative/path' } });
check('relative path rejected', relative.json.ok === false && relative.json.error.code === 'bad-request',
	JSON.stringify(relative.json.error));

const unknown = await post({ endpoint: 'nope', payload: {} });
check('unknown endpoint rejected', unknown.json.ok === false && unknown.json.error.code === 'bad-request',
	JSON.stringify(unknown.json.error));

const malformed = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' });
const malformedJson = await malformed.json();
check('malformed body answered with an error result', malformedJson.ok === false, JSON.stringify(malformedJson.error));

let fencedStatus = null;
const fakeRes = { writeHead(status) { fencedStatus = status; }, end() {} };
await route.handler({ socket: { remoteAddress: '10.0.0.5' }, method: 'POST', headers: {} }, fakeRes);
check('non-loopback peer fenced with 403', fencedStatus === 403, String(fencedStatus));

// The fence beyond the peer address. These drive the handler directly because a
// real fetch cannot spoof Host/Origin the way an attacking page would.
const LOOPBACK = { remoteAddress: '127.0.0.1' };
const callHandler = async (headers, socket = LOOPBACK, body = JSON.stringify({ endpoint: 'dstt.mode.get', payload: {} })) => {
	let status = null;
	let payload = '';
	const res = { writeHead(code) { status = code; }, end(chunk) { payload = chunk ?? ''; } };
	const req = {
		socket,
		method: 'POST',
		headers,
		async *[Symbol.asyncIterator]() { yield body; },
	};
	await route.handler(req, res);
	return { status, json: payload === '' ? null : JSON.parse(payload) };
};

const noHost = await callHandler({ 'content-type': 'application/json' });
check('a request without Host is fenced', noHost.status === 403, String(noHost.status));

// DNS rebinding: loopback peer, but the authority is the attacker's name.
const rebound = await callHandler({ host: 'evil.example:3080', 'content-type': 'application/json' });
check('a rebinding Host is fenced from a loopback peer', rebound.status === 403, String(rebound.status));

// A cross-site fetch with a simple content type never preflights, so the
// provenance headers are what stop its side effects.
const crossSite = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'text/plain', 'sec-fetch-site': 'cross-site' });
check('cross-site provenance is fenced', crossSite.status === 403, String(crossSite.status));

const crossOrigin = await callHandler({ host: '127.0.0.1:3080', origin: 'http://evil.example', 'content-type': 'application/json' });
check('a mismatched Origin is fenced', crossOrigin.status === 403, String(crossOrigin.status));

const sameOriginWithPort = await callHandler({ host: '127.0.0.1:3080', origin: 'http://127.0.0.1:3080', 'content-type': 'application/json' });
check('a matching Origin passes', sameOriginWithPort.status === 200 && sameOriginWithPort.json?.ok === true, JSON.stringify(sameOriginWithPort.json));

const localhostName = await callHandler({ host: 'localhost:3080', origin: 'http://localhost:3080', 'content-type': 'application/json' });
check('localhost authority passes', localhostName.status === 200, String(localhostName.status));

const curlStyle = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' });
check('an Origin-less CLI call still passes', curlStyle.status === 200 && curlStyle.json?.ok === true, String(curlStyle.status));

const noContentType = await callHandler({ host: '127.0.0.1:3080' });
check('a non-JSON content-type is refused', noContentType.status === 400 && noContentType.json?.ok === false, JSON.stringify(noContentType.json?.error?.message));

// UNC: isAbsolute() is true for \\host\share on Windows, and opening it makes
// Windows authenticate to that host.
const unc = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
	JSON.stringify({ endpoint: 'dshome/explorer.open', payload: { path: '\\\\attacker.example\\share' } }));
check('a UNC path is refused', unc.json?.ok === false && unc.json.error.code === 'bad-request', JSON.stringify(unc.json?.error?.message));

const forwardSlashUnc = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
	JSON.stringify({ endpoint: 'dshome/explorer.open', payload: { path: '//attacker.example/share' } }));
check('a forward-slash UNC path is refused', forwardSlashUnc.json?.ok === false, JSON.stringify(forwardSlashUnc.json?.error?.message));

// The delivered-file gestures share the same validator. Only rejection is
// exercised here: accepting one would really open a window on this machine.
const fileOpenRelative = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
	JSON.stringify({ endpoint: 'dshome/file.open', payload: { path: 'notes.md' } }));
check('file.open is a known endpoint and refuses a relative path',
	fileOpenRelative.json?.ok === false && /absolute local path/u.test(String(fileOpenRelative.json?.error?.message)),
	JSON.stringify(fileOpenRelative.json?.error?.message));

const fileRevealUnc = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
	JSON.stringify({ endpoint: 'dshome/file.reveal', payload: { path: '\\\\attacker.example\\share\\notes.md' } }));
check('file.reveal is a known endpoint and refuses a UNC path',
	fileRevealUnc.json?.ok === false && /absolute local path/u.test(String(fileRevealUnc.json?.error?.message)),
	JSON.stringify(fileRevealUnc.json?.error?.message));

const fileMissing = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
	JSON.stringify({ endpoint: 'dshome/file.open', payload: {} }));
check('file.open refuses a missing path', fileMissing.json?.ok === false, JSON.stringify(fileMissing.json?.error?.message));

// A path that cannot exist reaches the real opener and must come back as a
// reported failure rather than a hang or a false success. Windows only: that is
// where the opener shells out to PowerShell.
if (process.platform === 'win32') {
	const absent = join(process.env.TEMP ?? homedir(), 'dstt-smoke-definitely-missing-' + String(process.pid) + '.md');
	const unreachable = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
		JSON.stringify({ endpoint: 'dshome/file.open', payload: { path: absent } }));
	check('file.open reports failure for a nonexistent file instead of succeeding',
		unreachable.json?.ok === false && unreachable.json?.error?.code === 'internal',
		JSON.stringify(unreachable.json?.error?.message));
}

// Regression guard for the bug this check exists because of: Start-Process has no
// -LiteralPath parameter, and Windows PowerShell rejects it with
// NamedParameterNotFound — but it also exits 1 for a missing file, so the RPC
// cannot tell the two apart. The command is asserted statically because the only
// way to run it for real is to open a window on the user's desktop.
try {
	const source = await readFile(target, 'utf8');
	check('the Windows file opener only uses Start-Process parameters that exist',
		source.includes('Start-Process -FilePath') && !source.includes('Start-Process -LiteralPath'),
		source.includes('Start-Process -LiteralPath') ? 'Start-Process -LiteralPath found' : 'Start-Process -FilePath in use');
} catch (error) {
	check('the Windows file opener only uses Start-Process parameters that exist', false, String(error.message).slice(0, 80));
}

// Opt-in: prove the happy path by really handing a file to the OS. Off by
// default because it opens a window on the desktop running this script.
if (opts.open) {
	const scratch = join(process.env.TEMP ?? homedir(), 'dstt-smoke-opened-' + String(process.pid) + '.txt');
	await writeFile(scratch, 'deepseek-style-theme bridge smoke: this file was opened by dshome/file.open.\n');
	const opened = await callHandler({ host: '127.0.0.1:3080', 'content-type': 'application/json' }, LOOPBACK,
		JSON.stringify({ endpoint: 'dshome/file.open', payload: { path: scratch } }));
	check('file.open really opens an existing file with the default app', opened.json?.ok === true,
		JSON.stringify(opened.json?.error?.message ?? opened.json?.value));
	console.log('  (a window for ' + scratch + ' should have appeared; close it when you are done)');
}

await new Promise((resolve) => server.close(resolve));
// The catalog sync schedules retries while llm-deepseek is unregistered; dispose
// them so this script neither lingers nor leaves timers behind.
for (const dispose of disposers) dispose();
const failed = checks.filter((entry) => !entry.ok).length;
console.log(failed === 0 ? '\nSMOKE OK (' + checks.length + ' checks)' : '\nSMOKE FAILED (' + failed + '/' + checks.length + ')');
process.exitCode = failed === 0 ? 0 : 1;
