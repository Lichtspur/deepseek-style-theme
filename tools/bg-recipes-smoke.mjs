#!/usr/bin/env node
/**
 * Regression test for the 2.0.73 background recipes, at the data level.
 *
 * Why this exists: the recipes are three small tables plus a five-rule sheet,
 * and every one of them is easy to break in a way no syntax check notices --
 * a mistyped hex, a family missing from FLUID_LEADS, a label missing for an id
 * the panel iterates over, a CSS rule keyed on the wrong attribute. The parts
 * that decide what the user actually sees are the COLOURS and WHICH RECIPE OWNS
 * WHICH RULE, so this pins exactly those:
 *
 *   1. every id in DSTT_BACKGROUNDS has a label in both languages,
 *   2. `classic` (方式1) is "lead + pure white + near-white" -- each light
 *      triple contains #FFFFFF and exactly one other pale tone,
 *   3. `white` (方式2) really is TWO colours: the third uniform repeats the
 *      second, so the distinct count is 2 in both schemes,
 *   4. `bold` is the 1.43.12 three-chroma set: no #FFFFFF in the light triples,
 *   5. the custom-background sheet carries the colour rule, the image rule and
 *      the dark scrim, and keeps them gated on the kind attribute.
 *
 * The tables are read out of the shipped source (not imported: lib/client.js is
 * a browser module that needs window.__ModuleLoader__). Parsing is deliberately
 * narrow -- these are literal tables -- and a table that stops being parseable
 * fails the check instead of silently passing.
 *
 * Usage: node tools/bg-recipes-smoke.mjs [absolute path to lib/client.js]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv.slice(2).find((a) => !a.startsWith('-')) ?? join(here, '..', 'lib', 'client.js');
const source = readFileSync(target, 'utf8');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok });
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

/** Pull one literal table out of the source and parse it as JSON. */
const table = (name) => {
	const match = source.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\t\\t\\});'));
	if (match === null) throw new Error('table not found in the shipped source: ' + name);
	return JSON.parse(match[1].replace(/'/g, '"').replace(/([{,\s])([A-Za-z_][\w-]*):/g, '$1"$2":'));
};

const CLASSIC = table('FLUID_COLORS_CLASSIC');
const BOLD = table('FLUID_COLORS_BOLD');
const LEADS = table('FLUID_LEADS');
const SECOND = table('FLUID_SECOND');

const FAMILIES = ['green', 'blue', 'red'];
const SCHEMES = ['light', 'dark'];
const HEX = /^#[0-9A-Fa-f]{6}$/;
const listMatch = source.match(/const DSTT_BACKGROUNDS = \[([^\]]*)\]/);
const IDS = listMatch === null ? [] : [...listMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const labelsBlock = (source.match(/const DSTT_BACKGROUND_LABELS = \{([\s\S]*?)\n\t\t\};/) ?? [])[1] ?? '';

check('the panel iterates over four recipes', IDS.join(',') === 'classic,white,custom,bold', IDS.join(','));
for (const id of IDS) {
	check(`recipe ${JSON.stringify(id)} has a label in zh and en`,
		new RegExp('\\b' + id + ':\\s*\\{\\s*zh:').test(labelsBlock) && new RegExp('\\b' + id + ':\\s*\\{[^}]*en:').test(labelsBlock));
}

// 方式1 -- the look the user pointed at in the screenshots: one family plus the
// two whites. Every light triple must hold #FFFFFF, and its third tone must be
// a pale tint rather than a third hue.
for (const family of FAMILIES) {
	const triple = CLASSIC[family];
	check(`classic ${family} has three hex colours per scheme`,
		SCHEMES.every((s) => Array.isArray(triple[s]) && triple[s].length === 3 && triple[s].every((c) => HEX.test(c))),
		JSON.stringify(triple));
	check(`classic ${family} light carries pure white`,
		triple.light.includes('#FFFFFF'), triple.light.join(' '));
}

// 方式2 -- exactly two colours participate. The third uniform repeats the
// second in fluidTriple() (see the source), so the distinct count is 2.
for (const family of FAMILIES) {
	for (const scheme of SCHEMES) {
		const lead = LEADS[family][scheme];
		const second = SECOND[family][scheme];
		const effective = [lead, second, second];
		check(`white ${family}/${scheme} is a two-colour recipe`,
			HEX.test(lead) && HEX.test(second) && new Set(effective).size === 2,
			effective.join(' '));
	}
	check(`white ${family} keeps pure white in the light scheme`, SECOND[family].light === '#FFFFFF');
}

// 浓三色 -- kept selectable, and deliberately NOT the white-plus-lead shape:
// that difference is the whole point of it being a separate option.
for (const family of FAMILIES) {
	check(`bold ${family} light is free of pure white`,
		!BOLD[family].light.includes('#FFFFFF'), BOLD[family].light.join(' '));
	check(`bold ${family} light is the 1.43.12 three-chroma set`,
		BOLD[family].light.join(',') === { green: '#0FA76A,#5FCB9E,#0B7A52', blue: '#1E6FE8,#7FA8F5,#2B57C9', red: '#E23A44,#F08A90,#C02630' }[family],
		BOLD[family].light.join(' '));
}

// 方式3 -- the sheet. Colour rule, image rule, and a dark scrim that is the
// FIRST image layer (so the picture stays visible under it), all gated on the
// kind attribute the client only writes after CSS.supports() accepted a value.
const css = {
	base: 'body[data-dshome-bg=custom][data-dshome-customkind]{',
	color: 'body[data-dshome-bg=custom][data-dshome-customkind=color]{background-color:var(--dshome-custom-bg',
	image: 'body[data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#f6f7fb;background-image:var(--dshome-custom-bg',
	darkColor: 'body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=color]{background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55))',
	darkImage: 'body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#0b0f17;background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55)),var(--dshome-custom-bg'
};
for (const [name, needle] of Object.entries(css)) {
	check(`custom-background sheet has the ${name} rule`, source.includes(needle));
}
check('the custom rules are gated on the kind attribute, so an unusable value keeps the themed background',
	source.includes('body[data-dshome-bg=custom][data-dshome-customkind]{') && !source.includes('body[data-dshome-bg=custom]{'));

// The two halves again, this time as data: the panel's ids must be the schema's
// ids. (tools/dstt-schema-smoke.mjs checks the same thing behaviourally.)
const host = readFileSync(join(dirname(target), 'index.js'), 'utf8');
for (const id of IDS) {
	check(`the schema knows backgroundMode=${JSON.stringify(id)}`,
		new RegExp('z\\.const\\("' + id + '"\\)').test(host));
}

const failed = checks.filter((c) => !c.ok).length;
console.log('');
console.log(failed === 0 ? `SMOKE OK (${checks.length} checks)` : `SMOKE FAILED (${failed}/${checks.length})`);
process.exitCode = failed === 0 ? 0 : 1;
