// Every shipped and every tool file must PARSE. That sounds too obvious to need a
// script, and it is exactly why it is here: three times now a well-meaning edit has
// put prose backticks inside a template literal (a comment that says
// `something` inside a CSS or page-side string), which ends the literal and turns
// the whole file into a syntax error that only shows up when the tool is run --
// twice in lib/client.js (guarded by a bespoke scan inside bg-recipes-smoke.mjs)
// and once in tools/gui-probe.mjs, where the failure surfaced as a bare
// "SyntaxError: Unexpected identifier" from Node's module loader with no file name
// in the message.
//
// `node --check` catches it in a second, and it also type-checks nothing, so it
// stays honest: this is a parse gate, not a lint.
//
// Usage: node tools/parse-smoke.mjs      (exit 1 with the offending file listed)

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const roots = [join(root, 'lib'), join(root, 'tools')];

const collect = (dir) => {
	const found = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			found.push(...collect(full));
			continue;
		}
		if (/\.(?:js|mjs|cjs)$/.test(entry)) found.push(full);
	}
	return found;
};

const files = roots.flatMap(collect).sort();
// Encoding gate, in the same spirit as the parse gate: on 2026-09-16 a PowerShell
// `Get-Content | Set-Content` round trip on lib/client.js decoded the file as a
// legacy codepage and re-encoded it as UTF-8, turning 211 sequences -- every Chinese
// comment -- into U+FFFD mojibake. `node --check` still passed (the mangling sat
// inside comments and string literals), and the damage only surfaced when a reader
// refused the file. So: every shipped and tool file must decode as strict UTF-8 and
// carry no replacement characters.
const encodingFailures = [];
for (const file of [...files, join(root, 'README.md'), join(root, 'CHANGELOG.md'), join(root, 'package.json')]) {
	let text = '';
	try {
		text = readFileSync(file, 'utf8');
	} catch (error) {
		encodingFailures.push(relative(root, file) + ' (not valid UTF-8)');
		continue;
	}
	// A round-decoded file re-encodes the replacement character itself.
	if (text.includes('\uFFFD')) encodingFailures.push(relative(root, file) + ' (contains U+FFFD)');
}

const failures = [];
for (const file of files) {
	// `--check` on a .js file parses it as CommonJS, which is what lib/client.js is
	// (it assigns module.exports); .mjs parses as a module. Both are the modes the
	// runtime itself will use.
	const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
	if (result.error !== undefined) {
		console.error('parse-smoke: cannot spawn node --check: ' + result.error.message);
		console.error('parse-smoke: run this from a normal terminal (a confined sandbox blocks child processes)');
		process.exit(2);
	}
	if (result.status === 0) {
		console.log('ok   ' + relative(root, file));
		continue;
	}
	failures.push({ file: relative(root, file), message: String(result.stderr).split('\n').filter((line) => line.trim() !== '').slice(0, 4).join(' / ') });
}

console.log('');
if (encodingFailures.length !== 0) {
	for (const failure of encodingFailures) console.log('FAIL ' + failure);
	console.log(`PARSE FAILED (${encodingFailures.length} file(s) are not clean UTF-8)`);
	process.exitCode = 1;
} else if (failures.length === 0) {
	console.log(`PARSE OK (${files.length} files, all clean UTF-8)`);
} else {
	for (const failure of failures) console.log('FAIL ' + failure.file + '  [' + failure.message + ']');
	console.log(`PARSE FAILED (${failures.length}/${files.length})`);
	process.exitCode = 1;
}
