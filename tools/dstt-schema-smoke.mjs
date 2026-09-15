#!/usr/bin/env node
/**
 * Regression test for the DSTT settings schema vs. the values the write path
 * actually persists.
 *
 * Why this exists: `bridge-smoke.mjs` stubs `settings.register()` as a no-op, so
 * it never sees the registered schema. That left a hole big enough to ship a
 * release in which the write path accepted `composerRefraction: "wide"` while
 * the schema union only listed `narrow | origin | off` — the value would land in
 * settings.yaml and then `register()` would throw on the next boot, killing DSTT
 * persistence. Schemastery reports that as
 * `$.composerRefraction expected "narrow" | "origin" | "off" but got "wide"`.
 *
 * The invariant this pins down: every value the write path can persist must
 * survive validation by the schema that is registered for the same namespace.
 * Legacy ids are the one deliberate exception and are listed here too, because
 * they must keep validating for settings files written by older versions.
 *
 * Usage: node tools/dstt-schema-smoke.mjs [absolute path to lib/index.js]
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const positionals = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
const profile = process.env.DSH_PROFILE ?? 'web';
// The package was renamed from @dsh-external/... to the unscoped
// dsh-deepseek-style-theme in 1.43.1, and profiles installed before the rename
// still carry the scoped directory -- so try the new layout first, then the old
// one, rather than pointing at a path that may not exist.
const installedModule = (name) => join(home, 'profiles', profile, 'node_modules', ...name.split('/'), 'lib', 'index.js');
const target = positionals[0]
	?? [installedModule('dsh-deepseek-style-theme'), installedModule('@dsh-external/dsh-deepseek-style-theme')]
		.find((candidate) => existsSync(candidate))
	?? installedModule('dsh-deepseek-style-theme');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

const mod = await import(new URL('file://' + target).href);

let route = null;
let registered = null;
let mutated = null;

const settings = {
	register(ns, schema) {
		registered = { ns, schema };
	},
	describe() {
		return [{ ns: 'deepseek-style-theme', value: { mode: 'peakvalley-redgreen' } }];
	},
	mutate(ns, ops) {
		mutated = { ns, ops };
		return Promise.resolve();
	},
};

const makeCtx = () => ({
	settings,
	get: (name) => (name === 'settings' ? settings : undefined),
	inject: (list, callback) => callback(ctx),
	effect: (callback) => {
		const dispose = callback();
		return typeof dispose === 'function' ? dispose : () => {};
	},
	webServer: {
		register(candidate) {
			route = candidate;
			return () => {};
		},
	},
});

const ctx = makeCtx();
mod.apply(ctx);

check('a settings schema was registered for the DSTT namespace',
	registered !== null && registered.ns === 'deepseek-style-theme',
	registered === null ? 'nothing captured' : registered.ns);

if (registered === null || route === null) {
	console.log('\nSMOKE FAILED (no schema or route registered)');
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

/** Fold the recorded mutate ops over a starting document, as the service does. */
const applyOps = (start, ops) => {
	const doc = { ...start };
	for (const op of ops) {
		if (op.op !== 'set' || !Array.isArray(op.path)) continue;
		doc[op.path[0]] = op.value;
	}
	return doc;
};

/** Validate a stored document the way `register()` does on the next boot. */
const validates = (doc) => {
	try {
		registered.schema(doc);
		return { ok: true };
	} catch (error) {
		return { ok: false, why: String(error.message).split('\n')[0] };
	}
};

// The three current ids, plus the legacy id that older settings files carry.
// `mode` is always sent because the write path requires a mode to write at all.
for (const value of ['narrow', 'wide', 'off', 'origin']) {
	const res = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-blue', composerRefraction: value } });
	const wrote = mutated !== null && mutated.ops.some((op) => op.path[0] === 'composerRefraction' && op.value === value);

	// A legacy id is accepted on read but must not be written back verbatim.
	const expectedWrite = value !== 'origin';
	check(`write path ${expectedWrite ? 'persists' : 'does not persist'} composerRefraction=${JSON.stringify(value)}`,
		res.json.ok === true && wrote === expectedWrite,
		`ok=${res.json.ok} wrote=${wrote}`);

	if (!wrote) {
		// Nothing was persisted, so there is no stored document to invalidate.
		continue;
	}

	const stored = applyOps({ mode: 'always-blue' }, mutated.ops);
	const verdict = validates(stored);
	check(`a settings file holding composerRefraction=${JSON.stringify(value)} still validates`,
		verdict.ok,
		verdict.ok ? undefined : verdict.why);
}

// The default must validate too: it is what an untouched settings file resolves to.
const defaultDoc = applyOps({}, [{ op: 'set', path: ['composerRefraction'], value: registered.schema({}).composerRefraction }]);
check('the schema default validates against the schema',
	validates(defaultDoc).ok, JSON.stringify(defaultDoc));

// And the whole document the plugin would write on a normal mode change.
const normal = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', fluidBrush: false, glassStyle: 'liquid', composerRefraction: 'wide' } });
check('a full four-field write validates',
	normal.json.ok === true && validates(applyOps({}, mutated.ops)).ok,
	normal.json.ok ? undefined : JSON.stringify(normal.json.error));

// 2.0.73 background recipes: the same invariant, one field over. Every id the
// write path accepts has to survive validation, because the value lands in
// settings.yaml and `register()` re-validates it on the next boot.
for (const value of ['classic', 'white', 'custom', 'bold']) {
	const res = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', backgroundMode: value } });
	const wrote = mutated !== null && mutated.ops.some((op) => op.path[0] === 'backgroundMode' && op.value === value);
	check(`write path persists backgroundMode=${JSON.stringify(value)}`,
		res.json.ok === true && wrote,
		`ok=${res.json.ok} wrote=${wrote}`);

	if (!wrote) continue;
	const verdict = validates(applyOps({ mode: 'always-green' }, mutated.ops));
	check(`a settings file holding backgroundMode=${JSON.stringify(value)} still validates`,
		verdict.ok,
		verdict.ok ? undefined : verdict.why);
}

// An id nobody knows must be refused by the write path rather than stored and
// then blow up register() on the next boot -- the exact shape of the 1.43.2
// incident this file exists for. `mutated` is cleared first: it still holds the
// ops of the last accepted write above.
mutated = null;
const bogus = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', backgroundMode: 'nope' } });
check('write path refuses an unknown backgroundMode',
	mutated === null || mutated.ops.every((op) => op.path[0] !== 'backgroundMode'),
	mutated === null ? 'nothing was written' : JSON.stringify(mutated.ops.map((op) => op.path[0])));

// A custom background is free text, and the host normalises it before storing:
// control characters become spaces, then the result is trimmed and bounded.
const custom = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', customBackground: '  url(x.png)\n\t  ' } });
const customOp = mutated.ops.find((op) => op.path[0] === 'customBackground');
check('write path normalises customBackground',
	custom.json.ok === true && customOp !== undefined && customOp.value === 'url(x.png)',
	JSON.stringify(customOp === undefined ? null : customOp.value));
check('a settings file holding customBackground still validates',
	customOp !== undefined && validates(applyOps({ mode: 'always-green' }, mutated.ops)).ok);

// 2.0.75: the animated-background switch. Same invariant, one field over -- and
// the read path has to report it as a boolean so the panel's switch is never
// rendered from `undefined`.
mutated = null;
const ambientOff = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', ambientBackground: false } });
const ambientOp = mutated === null ? undefined : mutated.ops.find((op) => op.path[0] === 'ambientBackground');
check('write path persists ambientBackground=false',
	ambientOff.json.ok === true && ambientOp !== undefined && ambientOp.value === false,
	JSON.stringify(ambientOp === undefined ? null : ambientOp.value));
check('a settings file holding ambientBackground=false still validates',
	ambientOp !== undefined && validates(applyOps({ mode: 'always-green' }, mutated.ops)).ok);
const ambientRead = await post({ endpoint: 'dstt.mode.get', payload: {} });
check('the read path reports ambientBackground as a boolean',
	ambientRead.json.ok === true && typeof ambientRead.json.value.ambientBackground === 'boolean',
	JSON.stringify(ambientRead.json.value === undefined ? null : ambientRead.json.value.ambientBackground));

// The panel's list lives in lib/client.js and the accepted ids live in
// lib/index.js. Nothing but this check keeps the two halves in step, and an id
// the panel offers but the host refuses looks exactly like a broken setting.
const clientPath = join(dirname(target), 'client.js');
if (existsSync(clientPath)) {
	const listMatch = readFileSync(clientPath, 'utf8').match(/const DSTT_BACKGROUNDS = \[([^\]]*)\]/);
	const ids = listMatch === null ? [] : [...listMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
	check('the client lists the background recipes', ids.length > 0, ids.join(','));
	for (const id of ids) {
		const res = await post({ endpoint: 'dstt.mode.set', payload: { mode: 'always-green', backgroundMode: id } });
		check(`the host accepts the client's backgroundMode=${JSON.stringify(id)}`,
			res.json.ok === true && mutated.ops.some((op) => op.path[0] === 'backgroundMode' && op.value === id));
	}
}

await new Promise((resolve) => server.close(resolve));

const failed = checks.filter((c) => !c.ok).length;
console.log('');
console.log(failed === 0 ? `SMOKE OK (${checks.length} checks)` : `SMOKE FAILED (${failed}/${checks.length})`);
process.exitCode = failed === 0 ? 0 : 1;
