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
//   node tools/gui-probe.mjs [--models] [--file-card] [--url http://127.0.0.1:3080] [--cdp http://127.0.0.1:9222]
//
// The secret is read from the environment only: this tool never reads the
// credential store itself, and it never prints the secret.

import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { values } = parseArgs({
	options: {
		url: { type: 'string', default: process.env.DSH_GUI_URL ?? 'http://127.0.0.1:3080' },
		cdp: { type: 'string', default: process.env.DSH_CDP ?? 'http://127.0.0.1:9222' },
		models: { type: 'boolean', default: false },
		'file-card': { type: 'boolean', default: false },
		deliverables: { type: 'boolean', default: false },
		ambient: { type: 'boolean', default: false },
		shot: { type: 'string' },
		hover: { type: 'string' },
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

const FILE_CARD = `(async () => {
	const PROBE = 'data-dsh-probe-card';
	const clear = () => {
		for (const node of document.querySelectorAll('.dshome-file-menu,.dshome-file-menu-toast')) node.remove();
	};
	const stale = document.querySelector('[' + PROBE + ']');
	if (stale !== null) stale.remove();
	clear();

	// A delivered-file card shaped exactly like the product's own: the stable
	// [data-presented-file] wrapper plus an overlay button whose title carries the
	// absolute path (what resolveWorkspacePath() writes in the product).
	const card = document.createElement('div');
	card.setAttribute('data-presented-file', 'true');
	card.setAttribute(PROBE, 'true');
	card.style.cssText = 'position:fixed;left:20px;top:150px;width:260px;height:72px;z-index:2147483005;background:rgba(127,127,127,.12);border:1px dashed #999';
	const overlay = document.createElement('button');
	overlay.type = 'button';
	overlay.setAttribute('title', 'C:\\\\probe\\\\delivered-notes.md');
	overlay.style.cssText = 'position:absolute;inset:0;width:100%;cursor:pointer';
	let previews = 0;
	overlay.addEventListener('click', () => { previews += 1; });
	card.appendChild(overlay);
	document.body.appendChild(card);

	const styleTag = document.querySelector('style[data-plugin-css$="file-card-menu.css"]') !== null;
	const rightClick = () => {
		overlay.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 80, clientY: 190 }));
		return document.querySelector('.dshome-file-menu');
	};
	const menu = rightClick();
	const items = menu === null ? [] : Array.from(menu.querySelectorAll('.dshome-file-menu-item')).map((node) => node.textContent.trim());
	const placed = menu === null ? null : { left: menu.style.left, top: menu.style.top, role: menu.getAttribute('role') };

	// "Copy path" — the one gesture the product has no equivalent for.
	let toast = null;
	if (menu !== null && items.length === 4) {
		menu.querySelectorAll('.dshome-file-menu-item')[2].click();
		await new Promise((resolve) => setTimeout(resolve, 250));
		const node = document.querySelector('.dshome-file-menu-toast');
		toast = node === null ? null : node.textContent.trim();
	}

	// "Preview in sidebar" must drive the product's own overlay button.
	const reopened = rightClick();
	if (reopened !== null) {
		reopened.querySelectorAll('.dshome-file-menu-item')[3].click();
		await new Promise((resolve) => setTimeout(resolve, 80));
	}
	const closedAfterPick = document.querySelector('.dshome-file-menu') === null;

	// The changed-file chip surface is a different product component, anchored on
	// [data-produced-files-row]; its plain left click must open this menu and its
	// own action must survive as the preview item.
	const row = document.createElement('div');
	row.setAttribute('data-produced-files-row', 'true');
	row.setAttribute(PROBE + '-row', 'true');
	row.style.cssText = 'position:fixed;left:20px;top:280px;z-index:2147483004';
	const chip = document.createElement('button');
	chip.type = 'button';
	chip.setAttribute('title', 'C:\\\\probe\\\\produced-notes.md');
	chip.textContent = 'produced-notes.md';
	let chipOwnClicks = 0;
	chip.addEventListener('click', () => { chipOwnClicks += 1; });
	row.appendChild(chip);
	document.body.appendChild(row);
	chip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 60, clientY: 300 }));
	const chipMenu = document.querySelector('.dshome-file-menu');
	const chipItems = chipMenu === null ? [] : Array.from(chipMenu.querySelectorAll('.dshome-file-menu-item')).map((node) => node.textContent.trim());
	const chipOwnClicksBeforePick = chipOwnClicks;
	if (chipMenu !== null && chipItems.length === 4) {
		chipMenu.querySelectorAll('.dshome-file-menu-item')[3].click();
		await new Promise((resolve) => setTimeout(resolve, 80));
	}
	const closedAfterChipPick = document.querySelector('.dshome-file-menu') === null;
	row.remove();

	card.remove();
	clear();
	return {
		styleTag, menuOpened: menu !== null, items, placed, toast, previews, closedAfterPick,
		chipMenuOpened: chipMenu !== null, chipItems, chipOwnClicksBeforePick,
		chipOwnClicksAfterPick: chipOwnClicks, closedAfterChipPick
	};
})()`;

const DELIVERABLES_BEFORE = `(() => {
	const chips = Array.from(document.querySelectorAll('[data-produced-files-row] button')).map((node) => ({
		title: node.getAttribute('title'),
		text: (node.textContent || '').trim()
	}));
	const cards = Array.from(document.querySelectorAll('[data-presented-file]')).map((node) => {
		const overlay = node.querySelector('button[title]');
		return overlay === null ? null : overlay.getAttribute('title');
	});
	// Does our menu reach the changed-file chips at all? It is anchored on
	// [data-presented-file], which the product renders from a different component
	// than [data-produced-files-row].
	let rightClickOpened = null;
	const first = document.querySelector('[data-produced-files-row] button');
	if (first !== null) {
		first.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 400 }));
		rightClickOpened = document.querySelector('.dshome-file-menu') !== null;
		for (const node of document.querySelectorAll('.dshome-file-menu,.dshome-file-menu-toast')) node.remove();
	}
	return { chips, cards, rightClickOpened };
})()`;

const DELIVERABLES_CLICK = `(() => {
	const first = document.querySelector('[data-produced-files-row] button');
	if (first === null) return null;
	const before = { nodes: document.querySelectorAll('body *').length, dialogs: document.querySelectorAll('[role="dialog"],[aria-modal="true"]').length };
	window.__probeDeliverableBefore = before;
	first.click();
	return before;
})()`;

const DELIVERABLES_AFTER = `(() => {
	const before = window.__probeDeliverableBefore ?? { nodes: 0, dialogs: 0 };
	return {
		before,
		after: { nodes: document.querySelectorAll('body *').length, dialogs: document.querySelectorAll('[role="dialog"],[aria-modal="true"]').length },
		menuOpen: document.querySelector('.dshome-file-menu') !== null
	};
})()`;

const AMBIENT = `(() => {
	const canvas = document.querySelector('[data-dsh-deepseek-canvas]');
	let backend = 'no canvas';
	if (canvas !== null) {
		if (canvas.getContext('webgl2') !== null) backend = 'webgl2 (fluid)';
		else if (canvas.getContext('2d') !== null) backend = '2d (particles fallback)';
		else backend = 'canvas present, unknown context';
	}
	const glass = (selector, pseudo) => {
		const node = document.querySelector(selector);
		if (node === null) return null;
		const style = getComputedStyle(node, pseudo);
		return {
			backdrop: String(style.backdropFilter || style.webkitBackdropFilter || '').slice(0, 70),
			image: String(style.backgroundImage || '').slice(0, 70),
			shadow: String(style.boxShadow || '').slice(0, 60)
		};
	};
	return {
		backend,
		size: canvas === null ? null : [canvas.width, canvas.height],
		dispersion: document.documentElement.hasAttribute('data-dshome-dispersion'),
		glassSheet: document.querySelector('style[data-plugin-css$="glass.css"]') !== null,
		spots: document.querySelectorAll('[data-dshome-spot]').length,
		bubble: glass('.gdEzaW_bubble', null),
		sidebar: glass('.hHd-Xa_root', '::before')
	};
})()`;

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

	if (values.ambient) {
		console.log('\n-- ambient background + liquid glass --');
		const ambientPage = await cdp.evaluate(AMBIENT);
		console.log('  background backend:  ' + ambientPage.backend + (ambientPage.size === null ? '' : '  canvas=' + JSON.stringify(ambientPage.size)));
		console.log('  glass.css injected:  ' + String(ambientPage.glassSheet));
		console.log('  refraction mounted:  ' + String(ambientPage.dispersion) + ' (html[data-dshome-dispersion])');
		console.log('  specular spots:      ' + String(ambientPage.spots) + ' (marked on hover)');
		console.log('  composer glass:      ' + JSON.stringify(ambientPage.bubble));
		console.log('  sidebar glass:       ' + JSON.stringify(ambientPage.sidebar));
		// Hovering a glass surface must stamp the spot attribute and start writing
		// the two specular variables that GLASS_CSS consumes.
		await cdp.mouseTo(150, 320);
		await delay(500);
		const hovered = await cdp.evaluate(AMBIENT);
		const spec = await cdp.evaluate(`(() => {
			const node = document.querySelector('[data-dshome-spot]');
			if (node === null) return null;
			return { cls: String(node.className).slice(0, 40), x: node.style.getPropertyValue('--dshome-spec-x'), y: node.style.getPropertyValue('--dshome-spec-y') };
		})()`);
		console.log('  spots after hover:   ' + String(hovered.spots));
		console.log('  specular vars:       ' + JSON.stringify(spec));
	}

	if (values.deliverables) {
		console.log('\n-- deliverables surfaces on the real page --');
		const before = await cdp.evaluate(DELIVERABLES_BEFORE);
		console.log('  produced chips: ' + String(before.chips.length) + (before.chips.length === 0 ? '' : ' ' + JSON.stringify(before.chips.slice(0, 3))));
		console.log('  presented cards: ' + String(before.cards.length) + (before.cards.length === 0 ? '' : ' ' + JSON.stringify(before.cards.slice(0, 3))));
		console.log('  right-click on a produced chip opens our menu: ' + String(before.rightClickOpened));
		const clicked = await cdp.evaluate(DELIVERABLES_CLICK);
		if (clicked === null) {
			console.log('  (no produced chip to click)');
		} else {
			await delay(900);
			console.log('  clicking a produced chip -> ' + JSON.stringify(await cdp.evaluate(DELIVERABLES_AFTER)));
		}
	}

	if (values['file-card']) {
		console.log('\n-- delivered-file card menu (synthetic card) --');
		try {
			await cdp.send('Browser.grantPermissions', { origin: ORIGIN, permissions: ['clipboardSanitizedWrite'] });
		} catch (error) {
			console.log('  (clipboard permission not granted: ' + String(error.message).slice(0, 60) + ')');
		}
		const card = await cdp.evaluate(FILE_CARD);
		console.log('  style tag injected:   ' + String(card.styleTag));
		console.log('  right-click opened:   ' + String(card.menuOpened));
		console.log('  items:                ' + JSON.stringify(card.items));
		console.log('  placement:            ' + JSON.stringify(card.placed));
		console.log('  copy-path toast:      ' + JSON.stringify(card.toast));
		console.log('  preview clicks:       ' + String(card.previews) + ' (must be 1)');
		console.log('  closed after picking: ' + String(card.closedAfterPick));
		console.log('  -- changed-file chip ([data-produced-files-row]) --');
		console.log('  left click opened:    ' + String(card.chipMenuOpened));
		console.log('  items:                ' + JSON.stringify(card.chipItems));
		console.log('  chip own clicks:      ' + String(card.chipOwnClicksBeforePick) + ' -> ' + String(card.chipOwnClicksAfterPick) + ' (the product handler must fire exactly once, on pick)');
		console.log('  closed after picking: ' + String(card.closedAfterChipPick));
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

	if (values.shot !== undefined) {
		// A cursor is required for anything hover-driven (spot attributes, the
		// specular variables, the conversation spotlight), so --hover parks the
		// pointer before the capture.
		if (values.hover !== undefined) {
			const [hx, hy] = String(values.hover).split(',').map((part) => Number(part.trim()));
			if (Number.isFinite(hx) && Number.isFinite(hy)) {
				await cdp.mouseTo(hx, hy);
				await delay(900);
			}
		}
		const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
		const file = join(values.shot, 'gui-' + String(Date.now()) + '.png');
		writeFileSync(file, Buffer.from(shot.data, 'base64'));
		console.log('\nscreenshot: ' + file);
	}
}

await fetch(CDP_HTTP + '/json/close/' + targetId).catch(() => {});
cdp.socket.close();

console.log('\n== done ==');
// No process.exit() here: tearing the loop down under a closing websocket
// trips a libuv assertion (STATUS_STACK_BUFFER_OVERRUN) and turns a successful
// probe into a non-zero exit. The loop drains on its own once the socket is
// closed.
