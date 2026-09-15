// Smoke test for the activation-time model-catalog sync (lib/index.js host half).
//
// The sync talks to four seams only — ctx.get('settings') for the catalog and the
// policy, ctx.get('launchEnvironment') for $DEEPSEEK_BASE_URL, ctx.get('credentials')
// for the API key, and global fetch for the endpoint — so every branch is reachable
// here without a browser, a network, or a real key.
//
// Usage:
//   node tools/catalog-sync-smoke.mjs [path/to/lib/index.js]
// Pass an absolute path to test the working tree. The default target is the copy
// installed in a dsh profile — the one dsh loads, and the only one where
// @deepseek-ai/* imports resolve. It is derived from DSH_HOME (default ~/.dsh) and
// DSH_PROFILE (default web), so it works on any machine without editing this file.

import { setTimeout as delay } from 'node:timers/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
const profile = process.env.DSH_PROFILE ?? 'web';
// Renamed from the scoped @dsh-external/... to dsh-deepseek-style-theme in
// 1.43.1; profiles installed before the rename still carry the old layout, so
// try the new name first and fall back.
const installedModule = (name) => join(home, 'profiles', profile, 'node_modules', ...name.split('/'), 'lib', 'index.js');
const target = process.argv[2]
	?? [installedModule('dsh-deepseek-style-theme'), installedModule('@dsh-external/dsh-deepseek-style-theme')]
		.find((candidate) => existsSync(candidate))
	?? installedModule('dsh-deepseek-style-theme');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

const mod = await import(new URL('file://' + target).href);

const FLASH = { id: 'deepseek-flash', name: 'DeepSeek-V41-Flash', contextWindow: 1000000, inputModalities: ['text', 'image'], imagePixelBudget: 640000, imageMaxBytes: 1048576, systemPromptUpdate: 'in-history' };
const PRO = { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', contextWindow: 1000000, inputModalities: ['text'] };
const CATALOG = [FLASH, PRO];
/** Every id KNOWN_CATALOG_ENTRIES describes, i.e. what a rewrite may adopt. */
const DESCRIBABLE = ['deepseek-flash', 'deepseek-v4-pro'];
const list = (...ids) => ({ object: 'list', data: ids.map((id) => ({ id })) });

/**
 * Activate the host half against one scenario.
 * @param options.mountNamespace - whether llm-deepseek is registered yet
 * @param options.models - the stored catalog the settings service reports
 * @param options.policy - the deepseek-style-theme catalogSync value
 * @param options.baseURL - the llm-deepseek baseURL, or undefined to leave it unset
 * @param options.environment - a launchEnvironment double, or undefined for none
 * @param options.key - the credential the credentials service resolves, or null
 * @param options.conflict - make settings.mutate reject like a revision conflict
 * @param options.respond - fetch behaviour: { status, body } or { throws: true }
 */
function activate(options = {}) {
	const warnings = [];
	const infos = [];
	const settings = {
		writes: [],
		register() {},
		describe() {
			const rows = [{
				ns: 'deepseek-style-theme',
				value: { mode: 'peakvalley-redblue', catalogSync: options.policy ?? 'auto' },
				revision: 1,
			}];
			if (options.mountNamespace !== false) {
				rows.push({
					ns: 'llm-deepseek',
					value: {
						apiKeyEnv: 'DEEPSEEK_API_KEY',
						...(options.baseURL === undefined ? {} : { baseURL: options.baseURL }),
						models: options.models ?? CATALOG,
					},
					revision: 7,
				});
			}
			return rows;
		},
		mutate(ns, ops, revision) {
			if (options.conflict === true) return Promise.reject(new Error('SettingsConflictError'));
			settings.writes.push({ ns, ops, revision });
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
		inject(list_, callback) {
			callback(ctx);
		},
		get(name) {
			if (name === 'settings') return settings;
			if (name === 'launchEnvironment') return options.environment;
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
			json: () => Promise.resolve(options.respond?.body ?? list('deepseek-flash', 'deepseek-v4-pro')),
		});
	};
	const originalWarn = console.warn;
	const originalInfo = console.info;
	console.warn = (...args) => warnings.push(args.map((value) => String(value)).join(' '));
	console.info = (...args) => infos.push(args.map((value) => String(value)).join(' '));
	mod.apply(ctx);
	const written = () => settings.writes[0]?.ops?.[0]?.value;
	return {
		settings,
		calls,
		routes,
		warnings,
		infos,
		written,
		ids: () => written()?.map((entry) => entry.id),
		// The sync is asynchronous, so the console stays captured until the
		// scenario is torn down rather than only around apply().
		disposeAll: () => {
			for (const dispose of effects) dispose();
			console.warn = originalWarn;
			console.info = originalInfo;
		},
	};
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

// 2. The real reported bug: the endpoint serves both describable ids, the stored
//    catalog carries an extra id the endpoint does not list (a leftover override).
//    Every advertised id is describable, so the rewrite is allowed and the
//    leftover goes away — visibly.
{
	const run = activate({
		models: [...CATALOG, { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', contextWindow: 1000000, inputModalities: ['text'] }],
		respond: { body: list('deepseek-flash', 'deepseek-v4-pro') },
	});
	await delay(30);
	const write = run.settings.writes[0];
	check('describable drift rewrites llm-deepseek.models', write?.ns === 'llm-deepseek' && write?.ops?.[0]?.op === 'set' && write?.ops?.[0]?.path?.[0] === 'models', JSON.stringify(write?.ns));
	check('unlisted left-over id is dropped', JSON.stringify(run.ids()) === JSON.stringify(['deepseek-flash', 'deepseek-v4-pro']), JSON.stringify(run.ids()));
	check('surviving entries keep their capability metadata verbatim', run.written()?.[0]?.inputModalities?.[1] === 'image' && run.written()?.[0]?.systemPromptUpdate === 'in-history' && run.written()?.[0]?.imagePixelBudget === 640000, JSON.stringify(run.written()?.[0]?.inputModalities));
	check('the removed id is named in a warning, not dropped silently', run.warnings.some((line) => line.includes('deepseek-v4-flash')), String(run.warnings.length) + ' warning(s)');
	check('the write is pinned to the revision it read', write?.revision === 7, String(write?.revision));
	run.disposeAll();
}

// 3. A gateway in front of baseURL: it advertises ids this plugin cannot describe.
//    The stored catalog must not be rewritten to a foreign catalogue.
{
	const run = activate({
		models: CATALOG,
		respond: { body: list('deepseek-flash', 'deepseek-v4-pro', 'deepseek-v5-turbo', 'gpt-4o', 'claude-sonnet') },
	});
	await delay(30);
	check('a foreign-looking catalogue writes nothing', run.settings.writes.length === 0, JSON.stringify(run.ids()));
	check('undescribable ids are reported rather than guessed', run.warnings.some((line) => line.includes('deepseek-v5-turbo')), String(run.warnings.length) + ' warning(s)');
	check('no capability is ever invented for an unknown id', run.written() === undefined, JSON.stringify(run.written()));
	run.disposeAll();
}

// 4. Foreign catalogue that also advertises a describable id we lack: adopt that
//    one, and still remove nothing.
{
	const run = activate({
		models: [FLASH, { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', inputModalities: ['text'] }],
		respond: { body: list('deepseek-flash', 'deepseek-v4-pro', 'some-relay-only-model') },
	});
	await delay(30);
	check('append-only path adopts the describable id', JSON.stringify(run.ids()) === JSON.stringify(['deepseek-flash', 'deepseek-v4-flash', 'deepseek-v4-pro']), JSON.stringify(run.ids()));
	check('append-only path keeps the unlisted stored id', run.ids()?.includes('deepseek-v4-flash') === true, JSON.stringify(run.ids()));
	check('adopted entry carries declared capabilities', run.written()?.[2]?.name === 'DeepSeek-V4-Pro', String(run.written()?.[2]?.name));
	run.disposeAll();
}

// 5. catalogSync: "add" — never removes anything, even when it could.
{
	const run = activate({
		policy: 'add',
		models: [FLASH, { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', inputModalities: ['text'] }],
		respond: { body: list('deepseek-flash', 'deepseek-v4-pro') },
	});
	await delay(30);
	check('"add" appends without removing the unlisted entry', JSON.stringify(run.ids()) === JSON.stringify(['deepseek-flash', 'deepseek-v4-flash', 'deepseek-v4-pro']), JSON.stringify(run.ids()));
	run.disposeAll();
}

// 6. catalogSync: "off" — reports drift, writes nothing.
{
	const run = activate({ policy: 'off', models: [FLASH], respond: { body: list('deepseek-flash', 'deepseek-v4-pro') } });
	await delay(30);
	check('"off" writes nothing', run.settings.writes.length === 0, JSON.stringify(run.ids()));
	check('"off" still reports the drift', run.warnings.some((line) => line.includes('deepseek-v4-pro')), String(run.warnings.length) + ' warning(s)');
	run.disposeAll();
}

// 7. baseURL resolution follows the official adapter's order.
{
	const run = activate({ baseURL: 'https://gateway.internal/v1', environment: { get: () => ({ value: 'https://env.example/v1' }) } });
	await delay(30);
	check('the configured baseURL wins over the environment', run.calls[0]?.url === 'https://gateway.internal/v1/models', run.calls[0]?.url);
	run.disposeAll();
}
{
	const run = activate({ environment: { get: (name) => (name === 'DEEPSEEK_BASE_URL' ? { value: 'https://env.example/v1/' } : undefined) } });
	await delay(30);
	check('$DEEPSEEK_BASE_URL is honored when baseURL is unset', run.calls[0]?.url === 'https://env.example/v1/models', run.calls[0]?.url);
	run.disposeAll();
}
{
	const previous = process.env.DEEPSEEK_BASE_URL;
	process.env.DEEPSEEK_BASE_URL = 'https://ambient.example/v1';
	try {
		const run = activate({ environment: { get: () => undefined } });
		await delay(30);
		check('a present launchEnvironment that lacks the variable does not fall back to process.env', run.calls[0]?.url === 'https://api.deepseek.com/models', run.calls[0]?.url);
		run.disposeAll();
	} finally {
		if (previous === undefined) delete process.env.DEEPSEEK_BASE_URL;
		else process.env.DEEPSEEK_BASE_URL = previous;
	}
}

// 8. No credential: silent no-op, no request.
{
	const run = activate({ key: null });
	await delay(30);
	check('missing credential writes nothing and asks nothing', run.settings.writes.length === 0 && run.calls.length === 0, 'writes=' + String(run.settings.writes.length) + ' calls=' + String(run.calls.length));
	run.disposeAll();
}

// 9. Endpoint failure: silent no-op.
{
	const run = activate({ respond: { status: 503 } });
	await delay(30);
	check('endpoint failure writes nothing', run.settings.writes.length === 0, JSON.stringify(run.settings.writes));
	run.disposeAll();
}

// 10. Provider not mounted yet: retries instead of giving up, and disposal cancels.
{
	const run = activate({ mountNamespace: false });
	await delay(30);
	check('unmounted provider writes nothing', run.settings.writes.length === 0 && run.calls.length === 0, 'writes=' + String(run.settings.writes.length));
	run.disposeAll();
	await delay(2200);
	check('disposal cancels the pending retry (no late request)', run.calls.length === 0, 'calls=' + String(run.calls.length));
}

// 11. Credentials service absent entirely: falls back, still no throw.
{
	const run = activate({ credentials: false });
	await delay(30);
	check('absent credentials service degrades quietly', run.settings.writes.length === 0, JSON.stringify(run.settings.writes));
	run.disposeAll();
}

// 12. Concurrent settings edit: the write is refused and nothing is thrown.
{
	const run = activate({
		conflict: true,
		models: [...CATALOG, { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', inputModalities: ['text'] }],
		respond: { body: list('deepseek-flash', 'deepseek-v4-pro') },
	});
	await delay(30);
	check('a revision conflict is swallowed, not thrown', run.settings.writes.length === 0 && run.calls.length === 1, 'writes=' + String(run.settings.writes.length));
	run.disposeAll();
}

const failed = checks.filter((entry) => !entry.ok).length;
console.log(failed === 0 ? '\nSMOKE OK (' + checks.length + ' checks)' : '\nSMOKE FAILED (' + failed + '/' + checks.length + ')');
process.exit(failed === 0 ? 0 : 1);
