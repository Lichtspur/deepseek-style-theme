// Live GUI probe for the theme: measures what the running dsh web page actually
// renders, as text. It exists because the theme patches surfaces the product owns
// (hashed class names, portal-rendered menus) and their computed geometry is the
// only ground truth — a screenshot needs eyes, a report does not.
//
// What it reports:
//   * which theme style tags the page injected, and the body markers it set
//   * the conversation header: box, border, flex order of every child, and any
//     bordered element near the header's bottom edge (the stray-hairline check)
//   * a row-luminance scan of a band under the header, so a 1px line shows up as
//     a numeric contrast spike instead of needing a picture
//   * the header chips (corner-shape / radius / transitions) and the locale
//     toggle's animated label bloom, at rest and hovered
//   * the 对话 / 轨迹 tabs while the header is hovered
//   * with --models: the model selector's offered entries
//
// Usage:
//   # 1. start a headless Chrome listening on CDP (any Chrome/Chromium):
//   chrome --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\probe about:blank
//   # 2. export the browser-session secret dsh signs its cookie with:
//   #    it is the `client-connection/browser-session` record's `secret` field in
//   #    $DSH_HOME/.credentials.yaml
//   set DSH_PROBE_SECRET=<that secret>
//   node tools/gui-probe.mjs [--models] [--url http://127.0.0.1:3080] [--cdp http://127.0.0.1:9222]
//
// The secret is read from the environment only: this tool never reads the
// credential store itself, and it never prints the secret.

import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const { values } = parseArgs({
	options: {
		url: { type: 'string', default: process.env.DSH_GUI_URL ?? 'http://127.0.0.1:3080' },
		cdp: { type: 'string', default: process.env.DSH_CDP ?? 'http://127.0.0.1:9222' },
		models: { type: 'boolean', default: false },
	},
});
const ORIGIN = values.url.replace(/\/+$/, '');
const CDP_HTTP = values.cdp.replace(/\/+$/, '');
const SECRET = process.env.DSH_PROBE_SECRET;

if (typeof SECRET !== 'string' || SECRET === '') {
	console.error('gui-probe: set DSH_PROBE_SECRET (the client-connection/browser-session secret from $DSH_HOME/.credentials.yaml)');
	process.exit(2);
}

const b64url = (buffer) => Buffer.from(buffer).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');

/** Mint the browser-session cookie the way dsh-client-connection verifies it. */
function mintCookie() {
	const authority = new URL(ORIGIN).host;
	const secret = Buffer.from(SECRET.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
	const issuedAt = Date.now();
	const body = b64url(Buffer.from(JSON.stringify({ version: 1, authority, issuedAt, expiresAt: issuedAt + 86400000 }), 'utf8'));
	const signature = b64url(crypto.createHmac('sha256', secret).update(body).digest());
	return { name: 'dsh-auth-' + b64url(crypto.createHash('sha256').update(authority).digest()), value: 'v1.' + body + '.' + signature };
}

/** Minimal CDP client over the page target's own WebSocket. */
class Cdp {
	constructor(socket) {
		this.socket = socket;
		this.nextId = 0;
		this.pending = new Map();
		socket.addEventListener('message', (event) => {
			let message;
			try {
				message = JSON.parse(event.data);
			} catch {
				return;
			}
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
			}, 40000);
		});
	}

	async evaluate(expression) {
		const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
		if (result.exceptionDetails !== undefined) {
			const detail = result.exceptionDetails.exception?.description ?? JSON.stringify(result.exceptionDetails);
			throw new Error('page exception: ' + String(detail).slice(0, 300));
		}
		return result.result.value;
	}

	async mouseTo(x, y) {
		await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
	}
}

/** Open a fresh tab and talk to that page's own WebSocket (no session routing). */
async function openTarget() {
	let target = null;
	for (const method of ['PUT', 'POST']) {
		try {
			const response = await fetch(CDP_HTTP + '/json/new?about:blank', { method });
			if (response.ok) {
				target = await response.json();
				break;
			}
		} catch {
			// try the next verb, then the existing target list
		}
	}
	if (target === null) {
		const list = await (await fetch(CDP_HTTP + '/json/list')).json();
		target = list.find((entry) => entry.type === 'page') ?? null;
	}
	if (target === null || target.webSocketDebuggerUrl === undefined) throw new Error('no page target on the CDP endpoint at ' + CDP_HTTP);
	const socket = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve, { once: true });
		socket.addEventListener('error', () => reject(new Error('cdp websocket error')), { once: true });
	});
	return { cdp: new Cdp(socket), targetId: target.id };
}

// ── in-page probes ──────────────────────────────────────────────────────────

const REPORT = `(() => {
	const info = (element) => {
		if (!element) return null;
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return {
			cls: (typeof element.className === 'string' ? element.className : '').split(/\\s+/).filter(Boolean).join('.'),
			rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)],
			order: style.order, display: style.display,
			borderBottom: style.borderBottomWidth + ' ' + style.borderBottomStyle + ' ' + style.borderBottomColor,
		};
	};
	const path = (element) => {
		const parts = [];
		let node = element;
		while (node && node !== document.body && parts.length < 4) {
			const cls = (typeof node.className === 'string' ? node.className : '').split(/\\s+/).filter(Boolean);
			parts.unshift(node.tagName.toLowerCase() + (cls.length ? '.' + cls[0] : ''));
			node = node.parentElement;
		}
		return parts.join('>');
	};
	const out = { styles: [], marks: {}, header: null, children: [], lines: [] };
	for (const tag of document.querySelectorAll('style[data-plugin-css]')) {
		const label = tag.dataset.pluginCss ?? '';
		if (label.includes('deepseek-style-theme') || label === 'theme.css' || label === 'actions.css' || label === 'subagent-panel.css') out.styles.push(label.replace('@dsh-external/dsh-deepseek-style-theme/', ''));
	}
	out.marks.bodyAttrs = Array.from(document.body.attributes).map((attribute) => attribute.name).join(',');
	out.marks.sessionRows = document.querySelectorAll('[class*="sessionRow"]').length;
	const header = document.querySelector('.wSkVaW_header');
	if (header === null) return out;
	out.header = info(header);
	for (const child of header.children) out.children.push(info(child));
	const locale = header.querySelector('.dshome-locale');
	out.marks.locale = locale === null ? 'absent' : JSON.stringify(info(locale).rect);
	const corner = header.querySelector('[data-sidebar-right-expand]');
	out.marks.expandButton = corner === null ? 'absent' : JSON.stringify(info(corner).rect);
	out.marks.expandRightOfLocale = corner !== null && locale !== null
		? corner.getBoundingClientRect().left > locale.getBoundingClientRect().left
		: null;
	const bottom = out.header.rect[1] + out.header.rect[3];
	out.marks.headerBottom = Math.round(bottom);
	for (const element of document.querySelectorAll('body *')) {
		const style = getComputedStyle(element);
		const top = parseFloat(style.borderTopWidth) || 0;
		const under = parseFloat(style.borderBottomWidth) || 0;
		if (top === 0 && under === 0) continue;
		if (style.borderTopStyle === 'none' && style.borderBottomStyle === 'none') continue;
		const rect = element.getBoundingClientRect();
		if (rect.width < 240 || rect.height > 90) continue;
		if (rect.top > bottom + 30 || rect.bottom < bottom - 30) continue;
		out.lines.push({ path: path(element), rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)], border: under + ' ' + style.borderBottomStyle + ' ' + style.borderBottomColor });
	}
	return out;
})()`;

const CHIPS = `(() => {
	const read = (selector) => {
		const element = document.querySelector(selector);
		if (element === null) return null;
		const style = getComputedStyle(element);
		const rect = element.getBoundingClientRect();
		return selector + ' -> cornerShape=' + style.cornerShape + ' radius=' + style.borderRadius
			+ ' transition=' + style.transitionProperty + ' ' + style.transitionDuration
			+ ' rect=' + JSON.stringify([Math.round(rect.left), Math.round(rect.width)]);
	};
	return ['.dshome-locale', '.SVAs4q_label', '.cubgiG_seat', '.CAgGvG_split', '[data-sidebar-right-expand]', '.wSkVaW_crumb']
		.map(read).filter((line) => line !== null);
})()`;

const LOCALE_LABELS = `(() => Array.from(document.querySelectorAll('.dshome-locale button')).map((button) => {
	const parts = [button.classList.contains('dshome-on') ? 'on' : 'off'];
	for (const span of button.querySelectorAll('span')) {
		const style = getComputedStyle(span);
		parts.push(span.className + ':maxw=' + style.maxWidth + ',op=' + style.opacity);
	}
	return parts.join(' ');
}))()`;

const TABS = `(() => {
	const row = document.querySelector('.wSkVaW_tabs');
	if (row === null) return 'absent';
	return getComputedStyle(row).display + ' ' + Array.from(row.querySelectorAll('.wSkVaW_tab')).map((tab) => {
		const style = getComputedStyle(tab);
		return JSON.stringify({ label: (tab.textContent ?? '').trim().slice(0, 6), active: tab.className.includes('tabActive'), cornerShape: style.cornerShape, transition: style.transitionDuration, animation: style.animationName });
	}).join(' | ');
})()`;

const MODEL_OPEN = `(() => {
	const trigger = Array.from(document.querySelectorAll('button')).find((button) => {
		const label = (button.getAttribute('aria-label') ?? '') + ' ' + (button.getAttribute('title') ?? '');
		return label.includes('选择模型') || label.toLowerCase().includes('model');
	});
	if (trigger === undefined) return 'model trigger not found';
	const text = (trigger.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 50);
	trigger.click();
	return 'trigger: ' + text;
})()`;

const MODEL_DRILL = `(() => {
	window.__probeBefore = new Set(document.querySelectorAll('body *'));
	const cell = Array.from(document.querySelectorAll('[class*="_cell"]')).find((element) => (element.innerText || '').trim().startsWith('模型'));
	if (cell === undefined) return 'model cell not found';
	cell.click();
	return 'opened the 模型 cell';
})()`;

const MODEL_ROWS = `(() => {
	const before = window.__probeBefore ?? new Set();
	const seen = new Set();
	const rows = [];
	for (const element of document.querySelectorAll('body *')) {
		if (before.has(element)) continue;
		const rect = element.getBoundingClientRect();
		if (rect.width < 60 || rect.height < 16) continue;
		const text = (element.innerText || '').replace(/\\s+/g, ' ').trim();
		if (text === '' || text.length > 60 || seen.has(text)) continue;
		seen.add(text);
		if (element.getAttribute('role') === 'menuitem' || /_option/.test(String(element.className))) rows.push(text);
	}
	return rows;
})()`;

const PIXEL_SCAN = (top) => `(async () => {
	const source = window.__probeShot;
	if (!source) return null;
	const image = new Image();
	await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = source; });
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0);
	const data = context.getImageData(0, 0, image.width, image.height).data;
	const rows = [];
	for (let y = 0; y < image.height; y += 1) {
		let sum = 0;
		let count = 0;
		for (let x = 60; x < image.width - 60; x += 1) {
			const at = (y * image.width + x) * 4;
			sum += (data[at] + data[at + 1] + data[at + 2]) / 3;
			count += 1;
		}
		rows.push({ y: ${top} + y, average: Math.round((sum / count) * 10) / 10 });
	}
	return rows;
})()`;

const CLICK_SESSION = `(() => {
	const rows = Array.from(document.querySelectorAll('[class*="sessionRow"]')).filter((row) => {
		const text = (row.innerText || '').trim();
		return text !== '' && !text.startsWith('新会话') && !text.startsWith('进行中 新会话');
	});
	if (rows.length === 0) return 'no titled session row';
	rows[0].click();
	return 'opened: ' + (rows[0].innerText || '').replace(/\\s+/g, ' ').slice(0, 40);
})()`;

// ── drive ───────────────────────────────────────────────────────────────────

console.log('== gui-probe ==');
const cookie = mintCookie();
const { cdp, targetId } = await openTarget();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
const cookieSet = await cdp.send('Network.setCookie', { name: cookie.name, value: cookie.value, url: ORIGIN + '/', path: '/' });
console.log('cookie accepted: ' + String(cookieSet.success) + ' (' + new URL(ORIGIN).host + ')');

await cdp.send('Page.navigate', { url: ORIGIN + '/' });
for (let attempt = 0; attempt < 60; attempt += 1) {
	await delay(500);
	const state = await cdp.evaluate('document.readyState').catch(() => 'loading');
	if (state === 'complete') break;
}
await delay(7000);

for (let attempt = 0; attempt < 3; attempt += 1) {
	const children = await cdp.evaluate('document.querySelector(".wSkVaW_header") === null ? -1 : document.querySelector(".wSkVaW_header").children.length');
	if (children > 0) break;
	console.log('walk: ' + await cdp.evaluate(CLICK_SESSION));
	await delay(6000);
}

const report = await cdp.evaluate(REPORT);
console.log('\n-- theme injection --');
console.log('  body markers: ' + report.marks.bodyAttrs);
console.log('  style tags:   ' + (report.styles.length === 0 ? 'NONE (theme not loaded)' : report.styles.join(', ')));
if (report.header === null) {
	console.log('\nNO CONVERSATION HEADER — is a session open?');
} else {
	console.log('\n-- conversation header --');
	console.log('  box: ' + JSON.stringify(report.header.rect) + ' border-bottom: ' + report.header.borderBottom);
	for (const child of report.children) {
		console.log('  child order=' + child.order.padStart(3) + ' ' + (child.cls || '(none)') + ' display=' + child.display + ' rect=' + JSON.stringify(child.rect));
	}
	console.log('  locale=' + report.marks.locale + '  expand-button=' + report.marks.expandButton + '  expand-right-of-locale=' + String(report.marks.expandRightOfLocale));
	console.log('  bordered elements near the header bottom: ' + (report.lines.length === 0 ? 'none' : ''));
	for (const line of report.lines) console.log('    ' + line.path + ' rect=' + JSON.stringify(line.rect) + ' border-bottom=' + line.border);
	console.log('\n-- header chips --');
	for (const line of await cdp.evaluate(CHIPS)) console.log('  ' + line);

	console.log('\n-- locale toggle (rest -> hover) --');
	console.log('  rest:  ' + JSON.stringify(await cdp.evaluate(LOCALE_LABELS)));
	const box = await cdp.evaluate('(() => { const el = document.querySelector(".dshome-locale"); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()');
	if (box !== null) {
		await cdp.mouseTo(box.x, box.y);
		await delay(700);
		console.log('  hover: ' + JSON.stringify(await cdp.evaluate(LOCALE_LABELS)));
	}

	console.log('\n-- 对话 / 轨迹 tabs (header hovered) --');
	await cdp.mouseTo(1250, 26);
	await delay(800);
	console.log('  ' + await cdp.evaluate(TABS));

	if (values.models) {
		console.log('\n-- model selector --');
		console.log('  ' + await cdp.evaluate(MODEL_OPEN));
		await delay(900);
		console.log('  ' + await cdp.evaluate(MODEL_DRILL));
		await delay(1000);
		console.log('  offered: ' + JSON.stringify(await cdp.evaluate(MODEL_ROWS)));
	}

	try {
		const top = Math.max(0, report.marks.headerBottom - 16);
		const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: top, width: 900, height: 40, scale: 1 } });
		await cdp.evaluate('window.__probeShot = "data:image/png;base64,' + shot.data + '"; "ok"');
		const rows = await cdp.evaluate(PIXEL_SCAN(top));
		if (rows !== null) {
			const base = rows[0].average;
			console.log('\n-- row luminance under the header (a 1px line shows as a spike) --');
			for (const row of rows) {
				const delta = Math.round((row.average - base) * 10) / 10;
				if (Math.abs(delta) < 2) continue;
				console.log('  y=' + String(row.y).padStart(4) + ' average=' + String(row.average).padStart(6) + ' delta=' + String(delta).padStart(6) + '   <== contrast');
			}
		}
	} catch (error) {
		console.log('\npixel scan skipped: ' + String(error.message).slice(0, 120));
	}
}

await fetch(CDP_HTTP + '/json/close/' + targetId).catch(() => {});
cdp.socket.close();
console.log('\n== done ==');
process.exit(0);
