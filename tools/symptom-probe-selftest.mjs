// Self-test for tools/symptom-probe.js.
//
// The symptom probe is the instrument a user pastes into their own browser on a
// machine we do not have; a paste that throws, or that returns a shape we cannot
// read, costs a whole round trip. So the probe runs here first, against a
// synthetic page that carries the same landmarks the real one does: a fixed
// WebGL2 canvas marked as ours, a hashed-looking scroll column with one child
// wider than itself (the 2.0.78 overflow), a product-shaped card and button, and
// a control that changes its transform every 60 ms so the cursor tracer has a
// moving target to find.
//
// Usage:
//   1. chrome --headless=new --remote-debugging-port=9333 --user-data-dir=%TEMP%\dsh-probe-chrome about:blank
//   2. node tools/symptom-probe-selftest.mjs [--cdp http://127.0.0.1:9333]

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { cdp: { type: 'string', default: process.env.DSH_CDP ?? 'http://127.0.0.1:9333' } } });
const CDP = values.cdp.replace(/\/+$/, '');
const PROBE = readFileSync(new URL('./symptom-probe.js', import.meta.url), 'utf8');

const checks = [];
const check = (name, ok, detail) => {
	checks.push({ name, ok: ok === true, detail: detail === undefined ? '' : String(detail) });
	console.log((ok === true ? 'ok   ' : 'FAIL ') + name + (detail === undefined ? '' : '  [' + String(detail) + ']'));
};

/** Minimal CDP client over the page target's own WebSocket. */
class Cdp {
	constructor(socket) {
		this.socket = socket;
		this.nextId = 0;
		this.pending = new Map();
		socket.addEventListener('message', (event) => {
			let message;
			try { message = JSON.parse(event.data); } catch { return; }
			const entry = message.id === undefined ? undefined : this.pending.get(message.id);
			if (entry === undefined) return;
			this.pending.delete(message.id);
			if (message.error === undefined) entry.resolve(message.result);
			else entry.reject(new Error(JSON.stringify(message.error)));
		});
	}

	send(method, params = {}) {
		const id = ++this.nextId;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.socket.send(JSON.stringify({ id, method, params }));
			setTimeout(() => {
				if (!this.pending.has(id)) return;
				this.pending.delete(id);
				reject(new Error('cdp timeout: ' + method));
			}, 30000);
		});
	}

	async evaluate(expression) {
		const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
		if (result.exceptionDetails !== undefined) {
			const detail = result.exceptionDetails.exception?.description ?? JSON.stringify(result.exceptionDetails);
			throw new Error('page exception: ' + String(detail).slice(0, 400));
		}
		return result.result.value;
	}
}

const FIXTURE = `(() => {
	document.body.style.margin = '0';
	document.body.innerHTML = '';
	const column = document.createElement('div');
	column.className = 'wSkVaW_scrollBody';
	column.style.cssText = 'width:420px;height:320px;overflow:auto;border:1px solid #ccc';
	const wide = document.createElement('div');
	wide.className = '_bubble_mock';
	wide.style.cssText = 'width:600px;height:40px;background:#eef';
	wide.textContent = 'wider than the column';
	column.appendChild(wide);
	document.body.appendChild(column);
	const card = document.createElement('div');
	card.className = 'uV2eYG_card';
	card.style.cssText = 'position:fixed;left:24px;bottom:24px;width:340px;height:64px;background:#fff';
	const primary = document.createElement('button');
	primary.className = 'uV2eYG_primary';
	primary.textContent = 'send';
	primary.style.cssText = 'position:absolute;right:12px;bottom:12px';
	card.appendChild(primary);
	document.body.appendChild(card);
	const canvas = document.createElement('canvas');
	canvas.setAttribute('data-dsh-deepseek-canvas', '');
	canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;opacity:.55';
	canvas.width = 128;
	canvas.height = 128;
	document.body.appendChild(canvas);
	const gl = canvas.getContext('webgl2');
	if (gl !== null) { gl.clearColor(0.2, 0.3, 0.4, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
	window.__fixtureGl = gl !== null;
	// Where the cursor has to be parked: inside the card AND inside the viewport.
	const rect = card.getBoundingClientRect();
	window.__fixturePoint = [Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)];
	let tick = 0;
	window.__fixtureTimer = setInterval(() => {
		tick += 1;
		card.style.transform = 'perspective(800px) rotateY(' + (tick % 2 === 0 ? '0.01' : '-0.01') + 'rad)';
	}, 60);
	return 'fixture ready';
})()`;

const opened = await fetch(CDP + '/json/new?about:blank', { method: 'PUT' }).catch(() => null);
const target = opened !== null && opened.ok ? await opened.json() : (await (await fetch(CDP + '/json/list')).json()).find((entry) => entry.type === 'page');
if (target === undefined || target === null) {
	console.error('selftest: no page target on ' + CDP);
	process.exit(2);
}
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
	socket.addEventListener('open', resolve, { once: true });
	socket.addEventListener('error', () => reject(new Error('cdp websocket error')), { once: true });
});
const cdp = new Cdp(socket);
await cdp.send('Runtime.enable');

console.log('== symptom-probe selftest ==');
check('fixture page installs', await cdp.evaluate(FIXTURE) === 'fixture ready');
check('fixture has a live WebGL2 context', await cdp.evaluate('window.__fixtureGl') === true);

const installed = await cdp.evaluate(PROBE);
check('probe installs without throwing', String(installed).includes('installed'), installed);
check('probe exposes the harness', await cdp.evaluate('Object.keys(window.__dshomeDiag).sort().join(",")') === 'ambient,clip,glass,report,run,sampler,tilt,tracer,wallpaper');

const summary = await cdp.evaluate('JSON.stringify(window.__dshomeDiag.report())');
const parsed = JSON.parse(summary);
check('report parses as JSON', parsed !== null && typeof parsed === 'object');
check('report finds our canvas', parsed.canvases.some((canvas) => canvas.ours === true && canvas.kind === 'webgl2'));
check('report reads the GPU string', typeof parsed.canvases[0]?.gpu?.renderer === 'string' && parsed.canvases[0].gpu.renderer.length > 0, parsed.canvases[0]?.gpu?.renderer);
check('report lists injected sheets', Array.isArray(parsed.sheets));
check('report resolves anchors', parsed.anchors['.uV2eYG_card'] === true && parsed.anchors['.wSkVaW_scrollBody'] === true && parsed.anchors['.Nqubda_panel'] === false);
check('report measures the wide child', parsed.scrollSurface !== null && parsed.scrollSurface.widerChildren.length === 1 && parsed.scrollSurface.overflowPx === 180, JSON.stringify(parsed.scrollSurface?.widerChildren?.[0]) + ' overflowPx=' + parsed.scrollSurface?.overflowPx);
check('report measures the flickering controls', parsed.controls.some((entry) => entry.selector === '.uV2eYG_primary' && entry.found === true && Array.isArray(entry.box)));

// The tracer follows the real pointer, so the cursor is parked over the card the
// fixture moves -- the same gesture the user is asked for ("hover the send
// button"). run() is started without awaiting so the move lands mid-trace.
await cdp.evaluate('window.__runPromise = window.__dshomeDiag.run(3).then((out) => { window.__runResult = out; return "done"; }); "started"');
const fixturePoint = await cdp.evaluate('window.__fixturePoint.join(",")');
const [fixtureX, fixtureY] = fixturePoint.split(',').map((part) => Number(part));
console.log('parking the cursor at ' + fixturePoint + ' (viewport ' + await cdp.evaluate('innerWidth + "x" + innerHeight') + ')');
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: fixtureX, y: fixtureY, buttons: 0 });
await new Promise((resolve) => setTimeout(resolve, 4200));
const runResult = await cdp.evaluate('JSON.stringify(window.__runResult === undefined ? { pending: true } : { samples: window.__runResult.watch.samples.length, events: window.__runResult.watch.events.length, fps: window.__runResult.watch.samples[0]?.fps ?? null, changes: window.__runResult.trace.changeCount, rate: window.__runResult.trace.changeRate, movedFields: [...new Set(window.__runResult.trace.changes.flatMap((entry) => (entry.levels || []).flatMap((level) => Object.keys(level.moved || {}))))].sort().join(","), reportCanvas: window.__runResult.report.canvases.length })');
const run = JSON.parse(runResult);
check('run() samples the GPU state', run.samples >= 1, 'samples=' + run.samples + ' fps=' + run.fps);
check('run() traces the moving card', run.changes > 3, 'changes=' + run.changes + ' rate=' + run.rate);
check('trace entries carry field diffs', String(run.movedFields).includes('transform'), 'fields that moved: ' + run.movedFields);

const toggles = await cdp.evaluate('JSON.stringify({ off: window.__dshomeDiag.ambient(false), hidden: document.querySelector("canvas[data-dsh-deepseek-canvas]").style.visibility, on: window.__dshomeDiag.ambient(true), shown: document.querySelector("canvas[data-dsh-deepseek-canvas]").style.visibility, glass: window.__dshomeDiag.glass(false), tag: document.querySelector("style[data-dshome-probe-glass]") !== null, glassBack: window.__dshomeDiag.glass(true), tagGone: document.querySelector("style[data-dshome-probe-glass]") === null, wallpaper: window.__dshomeDiag.wallpaper(false), tilt: window.__dshomeDiag.tilt(false), tiltRule: (document.querySelector("style[data-dshome-probe-tilt]") || {}).textContent || null, tiltBack: window.__dshomeDiag.tilt(true), tiltGone: document.querySelector("style[data-dshome-probe-tilt]") === null, clip: window.__dshomeDiag.clip(true), clipApplied: getComputedStyle(document.querySelector(".wSkVaW_scrollBody")).overflowX, clipBack: window.__dshomeDiag.clip(false), clipGone: getComputedStyle(document.querySelector(".wSkVaW_scrollBody")).overflowX })');
const toggle = JSON.parse(toggles);
check('ambient(false) hides our canvas only', toggle.off === true && toggle.hidden === 'hidden' && toggle.on === true);
check('glass(false) injects the backdrop override', toggle.glass === true && toggle.tag === true && toggle.tagGone === true);
check('tilt(false) injects the transform neutralizer', toggle.tilt === true && String(toggle.tiltRule).includes('transform:none!important') && toggle.tiltGone === true);
// `overflow-x: clip` next to the product's `overflow-y: auto` computes to
// `hidden`, not `clip` (CSS Overflow 3: clip pairs with hidden), so the check
// accepts either -- what matters is that the forced value is not the scrollable
// `auto` the column had before.
check('clip(true) actually clips the column', toggle.clip === true && (toggle.clipApplied === 'clip' || toggle.clipApplied === 'hidden') && toggle.clipGone === 'auto', 'while forced=' + toggle.clipApplied + ' after=' + toggle.clipGone);
check('wallpaper(false) is a no-op without the plugin', toggle.wallpaper === 0);

await cdp.evaluate('clearInterval(window.__fixtureTimer); "ok"');
const failed = checks.filter((entry) => entry.ok !== true);
console.log('\n' + (checks.length - failed.length) + '/' + checks.length + ' checks passed');
await fetch(CDP + '/json/close/' + target.id).catch(() => {});
socket.close();
if (failed.length !== 0) process.exitCode = 1;
