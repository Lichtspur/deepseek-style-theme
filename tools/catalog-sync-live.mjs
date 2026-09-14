// Live check for the host half's activation-time model-catalog sync.
//
// Unlike `catalog-sync-smoke.mjs` (which drives every branch with doubles), this
// runs the REAL module against the REAL endpoint with a REAL key and reports what
// the sync decided, capturing any settings write instead of performing it:
//
//   scenario A — your stored catalog as-is           → expect no write
//   scenario B — one entry removed to create drift   → expect exactly one write
//                that restores it from the endpoint with its capabilities intact
//
// Usage:
//   DEEPSEEK_API_KEY=sk-... node tools/catalog-sync-live.mjs [options]
//
//   --module <path>     host half to exercise
//                       (default: $DSH_HOME/profiles/<profile>/node_modules/
//                        @dsh-external/dsh-deepseek-style-theme/lib/index.js)
//   --settings <path>   settings document to read the catalog from
//                       (default: $DSH_HOME/settings.yaml)
//   --profile <name>    profile whose node_modules supplies js-yaml (default: web)
//   --drift-id <id>     catalog entry scenario B removes (default: deepseek-v4-pro)
//
// The key comes from the environment only: this tool never reads the harness
// credential store, and it never prints the key.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const { values } = parseArgs({
	options: {
		module: { type: 'string' },
		settings: { type: 'string' },
		profile: { type: 'string', default: 'web' },
		'drift-id': { type: 'string', default: 'deepseek-v4-pro' },
	},
});
const home = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh');
const modulePath = values.module ?? path.join(home, 'profiles', values.profile, 'node_modules', '@dsh-external', 'dsh-deepseek-style-theme', 'lib', 'index.js');
const settingsPath = values.settings ?? path.join(home, 'settings.yaml');

const key = process.env.DEEPSEEK_API_KEY;
if (typeof key !== 'string' || key === '') {
	console.error('catalog-sync-live: set DEEPSEEK_API_KEY in the environment (this tool never reads the credential store)');
	process.exit(2);
}
for (const [label, file] of [['module', modulePath], ['settings', settingsPath]]) {
	if (!fs.existsSync(file)) {
		console.error('catalog-sync-live: ' + label + ' not found at ' + file);
		process.exit(2);
	}
}

// js-yaml ships with every dsh web profile; load it from there rather than
// adding a dependency to this repository.
const require = createRequire(pathToFileURL(path.join(home, 'profiles', values.profile, 'package.json')));
let yaml;
try {
	yaml = require('js-yaml');
} catch (error) {
	console.error('catalog-sync-live: js-yaml is not resolvable from profile "' + values.profile + '"; pass --profile <name>');
	process.exit(2);
}

const mod = await import(pathToFileURL(modulePath).href);
const document = yaml.load(fs.readFileSync(settingsPath, 'utf8'));
const stored = document?.['llm-deepseek'];
if (stored === undefined || !Array.isArray(stored.models)) {
	console.error('catalog-sync-live: ' + settingsPath + ' has no llm-deepseek.models section to check');
	process.exit(2);
}

console.log('module:   ' + modulePath);
console.log('settings: ' + settingsPath);
console.log('section:  baseURL=' + String(stored.baseURL ?? '(provider default)')
	+ ' apiKeyEnv=' + String(stored.apiKeyEnv ?? '(provider default)')
	+ ' models=' + JSON.stringify(stored.models.map((entry) => entry.id)));
console.log('key:      present (' + String(key.length) + ' chars, not printed)');

/** Activate the host half against one catalog and capture (not perform) writes. */
async function scenario(label, models) {
	const writes = [];
	const section = { ...stored, models };
	const ctx = {
		settings: {
			register() {},
			describe() {
				return [
					{ ns: 'deepseek-style-theme', value: { mode: 'peakvalley-redblue' } },
					{ ns: 'llm-deepseek', value: section },
				];
			},
			mutate(ns, ops) {
				writes.push({ ns, ops });
				return Promise.resolve();
			},
		},
		webServer: { register: () => () => {} },
		inject: (_list, callback) => callback(ctx),
		get(name) {
			if (name === 'settings') return ctx.settings;
			if (name === 'credentials') return { resolve: () => Promise.resolve({ value: key }) };
			return undefined;
		},
		effect: (callback) => {
			const dispose = callback();
			return typeof dispose === 'function' ? dispose : () => {};
		},
	};
	mod.apply(ctx);
	await delay(2500);
	console.log('\n=== ' + label + ' ===');
	console.log('stored ids: ' + JSON.stringify(models.map((entry) => entry.id)));
	console.log('writes:     ' + String(writes.length));
	for (const write of writes) {
		console.log('  ' + write.ns + ' ' + JSON.stringify(write.ops[0].path) + ':');
		for (const entry of write.ops[0].value) {
			console.log('    ' + JSON.stringify({
				id: entry.id,
				name: entry.name,
				inputModalities: entry.inputModalities,
				systemPromptUpdate: entry.systemPromptUpdate,
			}));
		}
	}
	return writes.length;
}

const asIs = await scenario('A. stored catalog as-is', stored.models.map((entry) => ({ ...entry })));
const driftId = values['drift-id'];
const drifted = await scenario('B. drift: ' + driftId + ' removed', stored.models
	.filter((entry) => entry.id !== driftId)
	.map((entry) => ({ ...entry })));

const ok = asIs === 0 && drifted === 1;
console.log('\n' + (ok
	? 'LIVE CHECK OK (in-sync stays silent; drift is repaired)'
	: 'LIVE CHECK UNEXPECTED (as-is writes=' + String(asIs) + ', drift writes=' + String(drifted) + ')'));
process.exit(ok ? 0 : 1);
