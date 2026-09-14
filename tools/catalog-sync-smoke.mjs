// Smoke test for the activation-time model-catalog sync (lib/index.js host half).
//
// The sync talks to three seams only — ctx.get('settings') for the catalog,
// ctx.get('credentials') for the API key, and global fetch for the endpoint — so
// every branch is reachable here without a browser, a network, or a real key.
//
// Usage:
//   node tools/catalog-sync-smoke.mjs [path/to/lib/index.js]
// The default target is the copy installed in a dsh profile — the one dsh loads,
// and the only one where @deepseek-ai/* imports resolve. It is derived from
// DSH_HOME (default ~/.dsh) and DSH_PROFILE (default web), so it works on any
// machine without editing this file.

import { setTimeout as delay } from 'node:timers/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
const profile = process.env.DSH_PROFILE ?? 'web';
const target = process.argv[2]
	?? join(home, 'profiles', profile, 'node_modules', '@dsh-external', 'dsh-deepseek-style-theme', 'lib', 'index.js');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

const mod = await import(new URL('file://' + target).href);

const CATALOG = [
	{ id: 'deepseek-flash', name: 'DeepSeek-V41-Flash', contextWindow: 1000000, inputModalities: ['text', 'image'], imagePixelBudget: 640000, imageMaxBytes: 1048576, systemPromptUpdate: 'in-history' },
	{ id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', contextWindow: 1000000, inputModalities: ['text'] },
];

/**
 * Activate the host half against one scenario.
 * @param options.mountNamespace - whether llm-deepseek is registered yet
 * @param options.models - the stored catalog the settings service reports
 * @param options.key - the credential the credentials service resolves, or null
 * @param options.respond - fetch behaviour: { status, body } or { throws: true }
 */
function activate(options = {}) {
	const settings = {
		writes: [],
		register() {},
		describe() {
			return options.mountNamespace === false
				? [{ ns: 'deepseek-style-theme', value: { mode: 'peakvalley-redblue' } }]
				: [{ ns: 'deepseek-style-theme', value: { mode: 'peakvalley-redblue' } }, { ns: 'llm-deepseek', value: { apiKeyEnv: 'DEEPSEEK_API_KEY', models: options.models ?? CATALOG } }];
		},
		mutate(ns, ops) {
			settings.writes.push({ ns, ops });
			return Promise.resolve();
		},
	};
	const credentials = {
		resolve() {
			return Promise.resolve(options.key === null ? undefined : { value: options.key ?? 'test-key' });
		},
	};
	const effects = [];
	const routes = [];
	const ctx = {
		settings,
		webServer: {
			register(route) {
				routes.push(route);
				return () => {};
			},
		},
		inject(list, callback) {
			callback(ctx);
		},
		get(name) {
			if (name === 'settings') return settings;
			if (name === 'credentials') return options.credentials === false ? undefined : credentials;
			return undefined;
		},
		effect(callback) {
			const dispose = callback();
			const disposer = typeof dispose === 'function' ? dispose : () => {};
			effects.push(disposer);
			return disposer;
		},
	};
	const calls = [];
	globalThis.fetch = (url, init) => {
		calls.push({ url, init });
		if (options.respond?.throws === true) return Promise.reject(new Error('offline'));
		const status = options.respond?.status ?? 200;
		return Promise.resolve({
			ok: status >= 200 && status < 300,
			status,
			json: () => Promise.resolve(options.respond?.body ?? { object: 'list', data: [{ id: 'deepseek-flash' }, { id: 'deepseek-v4-pro' }] }),
		});
	};
	mod.apply(ctx);
	return { settings, calls, routes, disposeAll: () => { for (const dispose of effects) dispose(); } };
}

check('exports apply/inject', typeof mod.apply === 'function' && Array.isArray(mod.inject), JSON.stringify(mod.inject));

// 1. Endpoint list equals the stored catalog: nothing is written.
{
	const run = activate();
	await delay(30);
	check('in-sync catalog is left untouched', run.settings.writes.length === 0, JSON.stringify(run.settings.writes));
	check('endpoint is asked at {baseURL}/models with the resolved key', run.calls.length === 1 && run.calls[0].url === 'https://api.deepseek.com/models' && run.calls[0].init.headers.authorization === 'Bearer test-key', JSON.stringify(run.calls[0]?.url));
	check('webServer route still registered', run.routes.length === 1 && run.routes[0].path === '/dshome-open-workspace', run.routes[0]?.path);
	run.disposeAll();
}

// 2. Drift: a new id appears and an existing one disappears.
{
	const run = activate({
		models: [...CATALOG, { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', contextWindow: 1000000, inputModalities: ['text'] }],
		respond: { body: { object: 'list', data: [{ id: 'deepseek-flash' }, { id: 'deepseek-flash-pro' }, { id: 'deepseek-v4-pro' }] } },
	});
	await delay(30);
	const write = run.settings.writes[0];
	const models = write?.ops?.[0]?.value;
	check('drift rewrites llm-deepseek.models', write?.ns === 'llm-deepseek' && write?.ops?.[0]?.op === 'set' && write?.ops?.[0]?.path?.[0] === 'models', JSON.stringify(write?.ns));
	check('endpoint order is kept and unlisted ids are dropped', JSON.stringify(models?.map((m) => m.id)) === JSON.stringify(['deepseek-flash', 'deepseek-flash-pro', 'deepseek-v4-pro']), JSON.stringify(models?.map((m) => m.id)));
	check('surviving entry keeps its capability metadata', models?.[0]?.inputModalities?.[1] === 'image' && models?.[0]?.systemPromptUpdate === 'in-history', JSON.stringify(models?.[0]?.inputModalities));
	check('known new id gets its declared name', models?.[1]?.name === 'deepseek-flash-pro', String(models?.[1]?.name));
	run.disposeAll();
}

// 3. Unknown new id: still adopted, as a text-only entry named after its id.
{
	const run = activate({ respond: { body: { object: 'list', data: [{ id: 'deepseek-flash' }, { id: 'deepseek-v4-pro' }, { id: 'deepseek-v5-turbo' }] } } });
	await delay(30);
	const models = run.settings.writes[0]?.ops?.[0]?.value;
	const added = models?.find((entry) => entry.id === 'deepseek-v5-turbo');
	check('unknown id is adopted text-only under its own id', added?.name === 'deepseek-v5-turbo' && JSON.stringify(added?.inputModalities) === JSON.stringify(['text']), JSON.stringify(added));
	run.disposeAll();
}

// 4. No credential: silent no-op, no request.
{
	const run = activate({ key: null });
	await delay(30);
	check('missing credential writes nothing and asks nothing', run.settings.writes.length === 0 && run.calls.length === 0, 'writes=' + String(run.settings.writes.length) + ' calls=' + String(run.calls.length));
	run.disposeAll();
}

// 5. Endpoint failure: silent no-op.
{
	const run = activate({ respond: { status: 503 } });
	await delay(30);
	check('endpoint failure writes nothing', run.settings.writes.length === 0, JSON.stringify(run.settings.writes));
	run.disposeAll();
}

// 6. Provider not mounted yet: retries instead of giving up, and disposal cancels.
{
	const run = activate({ mountNamespace: false });
	await delay(30);
	check('unmounted provider writes nothing', run.settings.writes.length === 0 && run.calls.length === 0, 'writes=' + String(run.settings.writes.length));
	run.disposeAll();
	await delay(2200);
	check('disposal cancels the pending retry (no late request)', run.calls.length === 0, 'calls=' + String(run.calls.length));
}

// 7. Credentials service absent entirely: falls back, still no throw.
{
	const run = activate({ credentials: false });
	await delay(30);
	check('absent credentials service degrades quietly', run.settings.writes.length === 0, JSON.stringify(run.settings.writes));
	run.disposeAll();
}

const failed = checks.filter((entry) => !entry.ok).length;
console.log(failed === 0 ? '\nSMOKE OK (' + checks.length + ' checks)' : '\nSMOKE FAILED (' + failed + '/' + checks.length + ')');
process.exit(failed === 0 ? 0 : 1);
