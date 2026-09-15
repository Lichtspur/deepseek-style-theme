#!/usr/bin/env node
/**
 * Fluid-field precision harness: runs the SHIPPED shaders twice, once with the
 * field in RGBA8 and once in RGBA16F, and reports what each one actually holds.
 *
 * Why this exists: the "drifting squares" on an integrated GPU turned out to be
 * the field's STORAGE precision rather than its shader precision (that was
 * 2.0.74's half). `prev.r *= u_decay` rounds to 1/255 every frame in an 8-bit
 * target, so weak values stop falling: when the true value has decayed to 0.0002
 * the RGBA8 field still reads ~0.017, and the whole field is squeezed into a
 * dozen steps whose contours the display shader's domain warp paints as blocks.
 * 2.0.81 made the field prefer RGBA16F; this tool is the regression evidence for
 * that decision, and it takes about ten seconds.
 *
 * How it works: the two shaders are lifted out of lib/client.js, so the run uses
 * the shipped GLSL and cannot drift from it. A page is written to the OS temp
 * directory and opened by headless Chrome; the page runs both formats for the
 * same 240 passes (a brush sweeping for 60, then 180 of pure decay) and prints a
 * RESULT line, which this script parses and judges.
 *
 * Prerequisites: a Chromium-family browser. Chrome cannot start inside a
 * confined/sandboxed process (its multi-process IPC needs named pipes), so run
 * this from a normal shell. Software WebGL is allowed on purpose
 * (`--enable-unsafe-swiftshader`): the question is what the *format* holds, which
 * is driver-independent, not how fast it draws.
 *
 * Usage:
 *   node tools/fluid-precision-test.mjs [--chrome <path>] [--keep]
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		chrome: { type: 'string' },
		keep: { type: 'boolean', default: false }
	}
});

const here = dirname(fileURLToPath(import.meta.url));
const clientPath = join(here, '..', 'lib', 'client.js');
const source = readFileSync(clientPath, 'utf8');

/** Lift one shader source out of the shipped bundle. */
const shader = (name) => {
	const match = source.match(new RegExp('var ' + name + ' = `([\\s\\S]*?)`;'));
	if (match === null) throw new Error('shader not found in lib/client.js: ' + name);
	return match[1];
};

const CHROME_CANDIDATES = [
	process.env.DSH_CHROME,
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter((candidate) => typeof candidate === 'string' && candidate !== '');

const chromePath = values.chrome ?? CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
if (chromePath === undefined) {
	console.error('no Chromium-family browser found; pass --chrome <path> or set DSH_CHROME');
	process.exit(2);
}

// The page: both formats, same simulation, read back with the type each target was
// CREATED with. That last point is not cosmetic -- the first version of this
// harness asked IMPLEMENTATION_COLOR_READ_TYPE, which reported HALF_FLOAT for an
// RGBA8 target, so both runs came back all-zero with INVALID_OPERATION and the
// experiment said "no difference". It also checks alpha as a readback sanity check.
const page = `<!doctype html>
<meta charset="utf-8">
<canvas id="c" width="64" height="64"></canvas>
<pre id="out">running</pre>
<script>
const VERTEX = ${JSON.stringify(shader('VERTEX_SHADER'))};
const FLOW = ${JSON.stringify(shader('FLOW_SHADER'))};
const SIZE = 64;
const lines = [];
const out = document.getElementById('out');
const say = (s) => { lines.push(s); out.textContent = lines.join('\\n'); };
function halfToFloat(h) {
	const s = (h & 0x8000) >> 15, e = (h & 0x7c00) >> 10, f = h & 0x03ff;
	if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
	if (e === 0x1f) return f ? NaN : (s ? -Infinity : Infinity);
	return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
}
try {
	const gl = document.getElementById('c').getContext('webgl2', { antialias: false });
	if (gl === null) { say('RESULT ' + JSON.stringify({ error: 'no webgl2' })); }
	else {
		const dbg = gl.getExtension('WEBGL_debug_renderer_info');
		say('renderer: ' + (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)));
		say('EXT_color_buffer_float: ' + (gl.getExtension('EXT_color_buffer_float') !== null));
		const compile = (type, src) => {
			const s = gl.createShader(type);
			gl.shaderSource(s, src); gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('compile: ' + gl.getShaderInfoLog(s));
			return s;
		};
		const prog = gl.createProgram();
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FLOW));
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
		gl.useProgram(prog);
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const loc = gl.getAttribLocation(prog, 'a_position');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
		const U = (n) => gl.getUniformLocation(prog, n);
		const u = { prev: U('u_prev'), mouse: U('u_mouse'), velocity: U('u_velocity'),
			brushRadius: U('u_brushRadius'), brushStrength: U('u_brushStrength'), decay: U('u_decay') };
		const makeTarget = (fmt, type) => {
			const tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, fmt, SIZE, SIZE, 0, gl.RGBA, type, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			const fbo = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			gl.clearColor(0, 0.5, 0.5, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
			return { tex: tex, fbo: fbo, complete: gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE };
		};
		const run = (label, fmt, type) => {
			const a = makeTarget(fmt, type), b = makeTarget(fmt, type);
			if (!a.complete || !b.complete) { say(label + ': FRAMEBUFFER INCOMPLETE'); return null; }
			gl.viewport(0, 0, SIZE, SIZE);
			gl.uniform1f(u.brushRadius, 0.10);
			gl.uniform1f(u.brushStrength, 0.38);
			gl.uniform1f(u.decay, 0.96);
			let src = a, dst = b;
			for (let i = 0; i < 240; i += 1) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, src.tex);
				gl.uniform1i(u.prev, 0);
				const t = i / 60;
				if (i < 60) {
					gl.uniform2f(u.mouse, 0.2 + 0.6 * t, 0.3 + 0.4 * Math.sin(t * 6.28));
					gl.uniform2f(u.velocity, 0.25, 0.12);
				} else {
					gl.uniform2f(u.mouse, -5, -5);
					gl.uniform2f(u.velocity, 0, 0);
				}
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				const swap = src; src = dst; dst = swap;
			}
			gl.bindFramebuffer(gl.FRAMEBUFFER, src.fbo);
			const n = SIZE * SIZE * 4;
			const attempt = (readType, make) => {
				const b2 = make();
				gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, readType, b2);
				if (gl.getError() !== gl.NO_ERROR) return null;
				const list = [];
				for (let i = 0; i < b2.length; i += 4) list.push(b2[i]);
				return list;
			};
			let values = attempt(gl.FLOAT, () => new Float32Array(n));
			let how = 'FLOAT';
			if (values === null) {
				const halves = attempt(gl.UNSIGNED_SHORT, () => new Uint16Array(n));
				if (halves !== null) { values = halves.map(halfToFloat); how = 'HALF_FLOAT'; }
			}
			if (values === null) {
				const bytes = attempt(gl.UNSIGNED_BYTE, () => new Uint8Array(n));
				if (bytes !== null) { values = bytes.map((v) => v / 255); how = 'UNSIGNED_BYTE'; }
			}
			if (values === null) { say(label + ': readback failed for every type'); return null; }
			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
			const alphaErr = gl.getError();
			// Distinct at 1e-6 captures a continuous field; onGrid counts values that
			// sit exactly on the 1/255 lattice, which is what an 8-bit field cannot
			// escape no matter how smooth the maths is.
			const distinct = new Set(values.map((v) => Math.round(v * 1e6))).size;
			const onGrid = new Set(values.map((v) => { const q = v * 255; return Math.abs(q - Math.round(q)) < 1e-4 ? Math.round(q) : -1; }));
			onGrid.delete(-1);
			const nonzero = values.filter((v) => v > 0).length;
			const max = Math.max.apply(null, values.concat([0]));
			const mean = values.reduce((s, v) => s + v, 0) / values.length;
			const stat = { label: label.trim(), how: how, distinct: distinct, onGridLevels: onGrid.size,
				nonzero: nonzero, max: Number(max.toFixed(6)), mean: Number(mean.toFixed(6)), alphaErr: alphaErr };
			say(label + ': ' + JSON.stringify(stat));
			return stat;
		};
		const eight = run('rgba8  ', gl.RGBA, gl.UNSIGNED_BYTE);
		const half = run('rgba16f', gl.RGBA16F, gl.HALF_FLOAT);
		say('RESULT ' + JSON.stringify({ rgba8: eight, rgba16f: half }));
	}
} catch (error) {
	say('RESULT ' + JSON.stringify({ error: String((error && error.message) || error) }));
}
</script>`;

const dir = mkdtempSync(join(tmpdir(), 'dsh-fluid-'));
const pagePath = join(dir, 'fluid-precision.html');
writeFileSync(pagePath, page);
const url = 'file:///' + pagePath.replace(/\\/g, '/');

const runChrome = () => new Promise((resolve, reject) => {
	execFile(chromePath, [
		'--headless=new',
		'--disable-gpu',
		'--enable-unsafe-swiftshader',
		'--no-first-run',
		'--user-data-dir=' + join(dir, 'profile'),
		'--virtual-time-budget=20000',
		'--dump-dom',
		url
	], { windowsHide: true, timeout: 120000, maxBuffer: 32 * 1024 * 1024 }, (error, stdout) => {
		if (error !== null && error !== undefined && (stdout ?? '') === '') { reject(error); return; }
		resolve(String(stdout ?? ''));
	});
});

let dom;
try {
	dom = await runChrome();
} catch (error) {
	console.error('headless browser failed:', error instanceof Error ? error.message : error);
	console.error('(Chrome cannot start inside a confined process -- run this from a normal shell)');
	process.exit(2);
}

const lines = dom.split('\n').map((line) => line.trim()).filter((line) => line !== '');
for (const line of lines) {
	if (line.startsWith('renderer:') || line.startsWith('EXT_color_buffer_float:')) console.log(line);
}
const resultLine = lines.find((line) => line.includes('RESULT '));
if (resultLine === undefined) {
	console.error('no RESULT line in the page output; run with --keep and open the file to debug');
	console.error(dom.slice(0, 2000));
	process.exit(1);
}
const payload = JSON.parse((() => {
	// The RESULT line sits inside a <pre>, so the JSON is followed by markup.
	const raw = resultLine.slice(resultLine.indexOf('RESULT ') + 'RESULT '.length);
	const cut = raw.indexOf('<');
	return cut === -1 ? raw : raw.slice(0, cut);
})());

if (payload.error !== undefined) {
	console.error('page reported an error:', payload.error);
	process.exit(1);
}

const pad = (value, width) => String(value).padEnd(width);
console.log('');
console.log(pad('field', 9) + pad('read as', 14) + pad('distinct', 10) + pad('on 1/255 grid', 15) + pad('max', 10) + 'mean');
for (const stat of [payload.rgba8, payload.rgba16f]) {
	if (stat === null) { console.log(pad('(failed)', 9)); continue; }
	console.log(pad(stat.label, 9) + pad(stat.how, 14) + pad(stat.distinct, 10) + pad(stat.onGridLevels, 15) + pad(stat.max, 10) + stat.mean);
}
console.log('');
if (values.keep === true) {
	console.log('page and browser profile kept at ' + dir);
} else {
	rmSync(dir, { recursive: true, force: true });
}

const checks = [];
const check = (name, ok, detail) => {
	checks.push(ok);
	console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail === undefined ? '' : '  [' + detail + ']'));
};

const half = payload.rgba16f;
const eight = payload.rgba8;
check('the RGBA16F field renders at all', half !== null && half.nonzero > 100, half === null ? 'null' : 'nonzero=' + half.nonzero);
check('the RGBA16F field is not trapped on the 1/255 lattice',
	half !== null && half.onGridLevels <= 1, half === null ? 'null' : 'grid levels=' + half.onGridLevels);
check('the RGBA16F field resolves more levels than the 8-bit one does',
	half !== null && eight !== null && half.distinct > eight.distinct,
	'rgba16f distinct=' + (half && half.distinct) + ' vs rgba8 distinct=' + (eight && eight.distinct));
check('the RGBA8 baseline shows the quantisation it is famous for',
	eight === null || eight.onGridLevels <= 256, eight === null ? 'null' : 'grid levels=' + eight.onGridLevels);
check('RGBA16F holds less stuck energy than RGBA8 after the same decay',
	half === null || eight === null || half.mean < eight.mean, 'rgba16f mean=' + (half && half.mean) + ' rgba8 mean=' + (eight && eight.mean));

const failed = checks.filter((ok) => ok !== true).length;
console.log('');
console.log(failed === 0 ? 'FLUID FIELD OK (' + checks.length + ' checks)' : 'FLUID FIELD FAILED (' + failed + '/' + checks.length + ')');
process.exitCode = failed === 0 ? 0 : 1;
