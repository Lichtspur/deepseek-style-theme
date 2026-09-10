// Smoke test for the theme's private host bridge.
//
// The host half registers an ordinary `webServer` prefix route
// (/dshome-open-workspace) and the browser half talks to it with a same-origin
// fetch. This script mounts that exact route in a real HTTP server, speaks the
// client protocol against it, and checks the fence and the error paths.
//
// Usage:
//   node tools/bridge-smoke.mjs [path/to/lib/index.js]
// Defaults to the copy installed in the web profile (which is the one dsh loads,
// and the only one where @deepseek-ai/* imports resolve).

import { createServer } from 'node:http';

const target = process.argv[2]
	?? 'C:/Users/Nove/.dsh/profiles/web/node_modules/@dsh-external/dsh-deepseek-style-theme/lib/index.js';

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

const ctx = {
	webServer: {
		register(candidate) {
			route = candidate;
			return () => {};
		},
	},
	inject(list, callback) {
		callback({ settings });
	},
	get(name) {
		return name === 'settings' ? settings : undefined;
	},
	effect(callback) {
		const dispose = callback();
		return typeof dispose === 'function' ? dispose : () => {};
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
await route.handler({ socket: { remoteAddress: '10.0.0.5' }, method: 'POST' }, fakeRes);
check('non-loopback request fenced with 403', fencedStatus === 403, String(fencedStatus));

await new Promise((resolve) => server.close(resolve));
const failed = checks.filter((entry) => !entry.ok).length;
console.log(failed === 0 ? '\nSMOKE OK (' + checks.length + ' checks)' : '\nSMOKE FAILED (' + failed + '/' + checks.length + ')');
process.exitCode = failed === 0 ? 0 : 1;
