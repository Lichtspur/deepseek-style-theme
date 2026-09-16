// Symptom probe: paste into the browser console on the machine where the theme
// misbehaves, and it reports the facts a screenshot cannot. Written for the
// Intel-Arc report ("drifting squares appear about a minute after DSTT turns on,
// and the send button flickers") because that machine is not the one the theme is
// developed on: the measurement has to happen inside the affected browser.
//
// It answers, in the order that settles the most:
//   1. Did every guarded patch block LAND? The anchor classes are product
//      build-time hashes, so on a different product build the `overflow-x: clip`
//      block (2.0.78) can silently skip -- and that block IS the flicker fix.
//   2. Which layers are on the page, on which GPU, in which precision, and is a
//      WebGL context lost or erroring while the artefact is on screen.
//   3. What changes, frame by frame, under a stationary cursor: the element chain
//      from the hit target upward, its box, and its animated styles. A flicker
//      shows up as a long change log whose field diffs name the moving property.
//   4. Attribution by eye, with the suspects toggleable from the console:
//      `__dshomeDiag.tilt(false)` freezes the composer tilt, `clip(true)` forces
//      the 2.0.78 overflow fix, `ambient(false)` hides our canvas, `wallpaper(false)`
//      the wallpaper layer, `glass(false)` every backdrop-filter. "Does the flicker
//      survive without X?" then has a one-word answer instead of a theory.
//
// Usage (browser console, on the affected machine):
//   paste this file        -> prints one JSON environment report
//   __dshomeDiag.tilt(false)   -> does the button stop flickering?  (one command)
//   __dshomeDiag.run(30)       -> hover the send button while it runs; the promise
//                                 resolves to { report, watch, trace } as JSON.
//                                 `copy(JSON.stringify(...))` it, or paste the
//                                 console output back.
// Nothing here writes settings, and no permission prompt is involved.

(() => {
	'use strict';
	// The plugin's guarded anchors, verbatim, plus the suffix forms it uses for the
	// surfaces the product has renamed at least once (`_headline`, `_moreButton`,
	// user bubbles). A `false` here is the first thing to look at when a surface
	// looks unthemed: its CSS is gated on the anchor matching.
	const ANCHORS = [
		'.pI_x6G_frame', '.hHd-Xa_root', '.YDXeBa_sessionRow', '.wSkVaW_root',
		'[class*="_moreButton"]', '.uV2eYG_card', '.wSkVaW_scrollBody',
		'[class*="_headline"]',
		':is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]) [class*="bubble" i]:not([class*="_bubble_"])',
		'.fV0t5q_root', '._1p9O6q_root', '.Nqubda_panel', '.VOzbGW_panel'
	];
	const q = (selector) => document.querySelector(selector);
	const round = (value) => Math.round(value * 100) / 100;
	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const ourCanvas = () => q('canvas[data-dsh-deepseek-canvas]');
	/** A probe section that throws must cost its own section, not the report. */
	const safe = (fn, fallback) => { try { return fn(); } catch (error) { return fallback === undefined ? 'ERR:' + String(error && error.message).slice(0, 80) : fallback; } };

	/** Everything a bug report needs that is true right now. */
	const report = () => {
		const body = document.body;
		const html = document.documentElement;
		const canvases = safe(() => [...document.querySelectorAll('canvas')].map((canvas, index) => {
			const rect = canvas.getBoundingClientRect();
			const style = getComputedStyle(canvas);
			let gl = null;
			try { gl = canvas.getContext('webgl2'); } catch (error) { gl = null; }
			let gpu = null;
			if (gl !== null) {
				const debug = safe(() => gl.getExtension('WEBGL_debug_renderer_info'), null);
				gpu = {
					renderer: safe(() => (debug === null ? gl.getParameter(gl.RENDERER) : gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)), null),
					vendor: safe(() => (debug === null ? null : gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)), null),
					floatTargets: safe(() => gl.getExtension('EXT_color_buffer_float') !== null, null),
					maxTexture: safe(() => gl.getParameter(gl.MAX_TEXTURE_SIZE), null),
					lost: safe(() => gl.isContextLost(), null),
					error: safe(() => (gl.isContextLost() ? null : gl.getError()), null)
				};
			}
			return {
				index,
				ours: canvas.hasAttribute('data-dsh-deepseek-canvas'),
				kind: gpu === null ? '2d-or-none' : 'webgl2',
				cls: String(canvas.className || '').slice(0, 48),
				parent: canvas.parentElement === null ? null : canvas.parentElement.tagName + '.' + String(canvas.parentElement.className || '').slice(0, 32),
				css: [Math.round(rect.width), Math.round(rect.height)],
				buffer: [canvas.width, canvas.height],
				z: style.zIndex, opacity: style.opacity, position: style.position,
				filter: style.filter, mix: style.mixBlendMode, willChange: style.willChange,
				gpu
			};
		}), []);
		const scroll = q('.wSkVaW_scrollBody') || q('[class*="scrollBody"]');
		return {
			at: new Date().toISOString(),
			url: location.href,
			secure: window.isSecureContext,
			build: window.__dshomeBuild ?? null,
			fluidFormat: window.__dshomeFluidFormat ?? null,
			dpr: window.devicePixelRatio,
			viewport: [window.innerWidth, window.innerHeight],
			screen: [window.screen.width, window.screen.height],
			markers: {
				color: body.getAttribute('data-dshome-color'),
				dark: body.hasAttribute('data-dshome-dark'),
				bg: body.getAttribute('data-dshome-bg'),
				bgbase: body.getAttribute('data-dshome-bgbase'),
				glass: html.getAttribute('data-dshome-glass'),
				wallpaper: safe(() => body.hasAttribute('data-we-wallpaper') || q('[class*="we-layer"]') !== null, null)
			},
			// A short or partial list means a guarded block skipped on this build.
			sheets: safe(() => [...document.querySelectorAll('style[data-plugin-css]')].map((tag) => tag.dataset.pluginCss), []),
			anchors: Object.fromEntries(ANCHORS.map((anchor) => [anchor, safe(() => q(anchor) !== null, null)])),
			scrollSurface: scroll === null ? null : safe(() => ({
				cls: String(scroll.className).slice(0, 48),
				scrollW: scroll.scrollWidth, clientW: scroll.clientWidth,
				scrollH: scroll.scrollHeight, clientH: scroll.clientHeight,
				// Positive means the column itself scrolls sideways: the horizontal
				// scrollbar that steals height and flips the hover (2.0.78).
				overflowPx: scroll.scrollWidth - scroll.clientWidth,
				overflowX: getComputedStyle(scroll).overflowX,
				overflowY: getComputedStyle(scroll).overflowY,
				// The offending children, both kinds: one that overflows internally,
				// and one simply wider than the column (what the product's hover
				// affordance does to a message bubble).
				widerChildren: [...scroll.querySelectorAll('*')]
					.filter((node) => node.scrollWidth > node.clientWidth + 1 || node.getBoundingClientRect().width > scroll.clientWidth + 1)
					.slice(0, 8)
					.map((node) => ({
						tag: node.tagName,
						cls: String(node.className || '').slice(0, 40),
						sw: node.scrollWidth,
						cw: node.clientWidth,
						rectW: Math.round(node.getBoundingClientRect().width)
					}))
			}), null),
			pageOverflow: safe(() => ({ docScrollW: html.scrollWidth, docClientW: html.clientWidth }), null),
			// The surfaces a flicker report is about, measured at rest: the button
			// that jumps, the card that holds it, and the column's width handle.
			controls: safe(() => ['.uV2eYG_primary', '.uV2eYG_trailing', '.uV2eYG_card', '[data-composer-card]', '[class*="widthHandle"]']
				.map((selector) => {
					const node = q(selector);
					if (node === null) return { selector, found: false };
					const rect = node.getBoundingClientRect();
					const style = getComputedStyle(node);
					return {
						selector,
						found: true,
						cls: String(node.className || '').slice(0, 40),
						box: [round(rect.left), round(rect.top), round(rect.width), round(rect.height)],
						transform: style.transform === 'none' ? null : style.transform,
						padding: style.padding,
						border: style.borderWidth,
						willChange: style.willChange,
						transition: style.transition.slice(0, 72),
						contain: style.contain
					};
				}), []),
			canvases
		};
	};

	/** Context loss / GL errors / fps / canvas churn, sampled over `seconds`. */
	const sampler = async (seconds) => {
		const canvas = ourCanvas();
		let gl = null;
		if (canvas !== null) {
			try { gl = canvas.getContext('webgl2'); } catch (error) { gl = null; }
		}
		const events = [];
		const samples = [];
		const log = (kind, extra) => events.push(Object.assign({ t: Math.round(performance.now()), kind }, extra || {}));
		if (canvas !== null) {
			canvas.addEventListener('webglcontextlost', (event) => log('contextlost', { prevented: event.defaultPrevented }));
			canvas.addEventListener('webglcontextrestored', () => log('contextrestored'));
		}
		let frames = 0;
		const count = () => { frames += 1; requestAnimationFrame(count); };
		requestAnimationFrame(count);
		const started = performance.now();
		let lastSize = canvas === null ? null : canvas.width + 'x' + canvas.height;
		let lastError = 0;
		while (performance.now() - started < seconds * 1000) {
			// Adaptive cadence: a 90 s run has to last 90 s, not 92, because the user
			// is timing it against an artefact they are watching for.
			await wait(Math.min(2000, Math.max(200, seconds * 1000 - (performance.now() - started))));
			const elapsed = performance.now() - started;
			const sample = {
				t: Math.round(elapsed),
				fps: Math.round(frames / (elapsed / 1000)),
				hidden: document.hidden,
				focused: safe(() => document.hasFocus(), null)
			};
			if (canvas !== null) {
				sample.buffer = canvas.width + 'x' + canvas.height;
				sample.css = Math.round(canvas.clientWidth) + 'x' + Math.round(canvas.clientHeight);
				sample.visibility = canvas.style.visibility || 'visible';
				if (sample.buffer !== lastSize) { log('canvas-resize', sample); lastSize = sample.buffer; }
			}
			if (gl !== null) {
				sample.lost = safe(() => gl.isContextLost(), null);
				sample.err = sample.lost === true ? null : safe(() => gl.getError(), null);
				if (sample.lost === true) log('isContextLost', { t: sample.t });
				if (typeof sample.err === 'number' && sample.err !== 0 && sample.err !== lastError) {
					log('glError', { err: sample.err, t: sample.t });
					lastError = sample.err;
				}
			}
			samples.push(sample);
		}
		return { events, samples };
	};

	/** What sits under the cursor and what moves: compact per-field diffs. */
	const tracer = async (seconds, cap = 240) => {
		const point = { x: window.innerWidth / 2, y: window.innerHeight - 80 };
		const onMove = (event) => { point.x = event.clientX; point.y = event.clientY; };
		window.addEventListener('pointermove', onMove, { capture: true, passive: true });
		const scroll = q('.wSkVaW_scrollBody') || q('[class*="scrollBody"]');
		const fields = ['box', 'transform', 'padding', 'border', 'margin', 'opacity', 'fontSize', 'boxShadow'];
		const snapshot = () => {
			const hit = document.elementFromPoint(point.x, point.y);
			const chain = [];
			for (let node = hit, depth = 0; node !== null && depth < 6; node = node.parentElement, depth += 1) {
				const rect = node.getBoundingClientRect();
				const style = getComputedStyle(node);
				chain.push({
					cls: node.tagName + '.' + String(node.className || '').slice(0, 36),
					box: [round(rect.left), round(rect.top), round(rect.width), round(rect.height)],
					transform: style.transform === 'none' ? null : style.transform,
					padding: style.padding,
					border: style.borderWidth,
					margin: style.margin,
					opacity: style.opacity,
					fontSize: style.fontSize,
					boxShadow: style.boxShadow.slice(0, 40)
				});
			}
			const layout = scroll === null ? null : {
				sw: scroll.scrollWidth, cw: scroll.clientWidth, ch: scroll.clientHeight,
				docH: document.documentElement.clientHeight, winW: window.innerWidth
			};
			return { chain, layout };
		};
		const changes = [];
		let previous = null;
		let total = 0;
		const started = performance.now();
		await new Promise((resolve) => {
			const tick = () => {
				const now = snapshot();
				if (previous !== null) {
					const diff = { t: Math.round(performance.now() - started), at: [Math.round(point.x), Math.round(point.y)], levels: [] };
					const depth = Math.max(now.chain.length, previous.chain.length);
					for (let level = 0; level < depth; level += 1) {
						const a = previous.chain[level];
						const b = now.chain[level];
						if (a === undefined || b === undefined || a.cls !== b.cls) {
							diff.levels.push({ level, from: a === undefined ? null : a.cls, to: b === undefined ? null : b.cls });
							continue;
						}
						const moved = {};
						for (const field of fields) {
							const before = JSON.stringify(a[field]);
							const after = JSON.stringify(b[field]);
							if (before !== after) moved[field] = [a[field], b[field]];
						}
						if (Object.keys(moved).length !== 0) diff.levels.push({ level, cls: b.cls, moved });
					}
					if (previous.layout !== null && now.layout !== null && JSON.stringify(previous.layout) !== JSON.stringify(now.layout)) {
						diff.layout = [previous.layout, now.layout];
					}
					if (diff.levels.length !== 0 || diff.layout !== undefined) {
						total += 1;
						if (changes.length < cap) changes.push(diff);
					}
				}
				previous = now;
				if (performance.now() - started < seconds * 1000) requestAnimationFrame(tick);
				else resolve();
			};
			requestAnimationFrame(tick);
		});
		window.removeEventListener('pointermove', onMove, true);
		const trimmed = total > cap;
		const kept = trimmed
			? changes.slice(0, Math.round(cap / 2)).concat(changes.slice(-Math.round(cap / 2)))
			: changes;
		return {
			changeCount: total,
			changeRate: round(total / seconds),
			note: trimmed ? 'trimmed to first+last ' + cap + ' entries' : null,
			changes: kept
		};
	};

	/** Layers and behaviours on/off, so a "does it survive without X?" test is one
	* command instead of a settings round trip. `true` always means "the feature is
	* on"; every one of them is reversible and writes nothing durable. */
	const override = (attribute, css) => {
		const existing = q('style[' + attribute + ']');
		if (css === null) {
			if (existing !== null) existing.remove();
			return false;
		}
		const tag = existing === null ? document.createElement('style') : existing;
		tag.setAttribute(attribute, '');
		tag.textContent = css;
		if (existing === null) document.head.appendChild(tag);
		return true;
	};
	const ambient = (on = true) => {
		const canvas = ourCanvas();
		if (canvas === null) return false;
		canvas.style.visibility = on ? '' : 'hidden';
		return true;
	};
	const wallpaper = (on = true) => {
		const hits = [...document.querySelectorAll('[class*="we-layer"],[data-we-wallpaper]')];
		for (const node of hits) node.style.visibility = on ? '' : 'hidden';
		return hits.length;
	};
	/** backdrop-filter is the expensive, artefact-prone half of the glass recipes. */
	const glass = (on = true) => override('data-dshome-probe-glass', on ? null : '*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}');
	/**
	* The composer tilt writes an inline transform on the card, so a stylesheet
	* declaration with !important is what beats it: `tilt(false)` freezes the lean
	* without touching the plugin. If the flicker stops here, the tilt is the cause.
	*/
	const tilt = (on = true) => override('data-dshome-probe-tilt', on ? null : '[data-composer-card],.uV2eYG_card{transform:none!important}');
	/** `clip(true)` forces the 2.0.78 overflow fix, for builds where its anchor skipped.
	* Its computed value reads `hidden` rather than `clip`: CSS Overflow 3 pairs a
	* `clip` axis with the other axis's `hidden`, and the column scrolls on y. */
	const clip = (on = false) => override('data-dshome-probe-clip', on ? '[class*="scrollBody"]{overflow-x:clip!important}' : null);

	/** One command: sample the GPU state and the cursor trace at the same time. */
	const run = async (seconds = 90) => {
		const tracePromise = tracer(seconds).catch((error) => ({ error: String(error && error.message) }));
		const watch = await sampler(seconds);
		const trace = await tracePromise;
		return { report: report(), watch, trace };
	};

	const summary = report();
	console.log('%c[DSTT probe] environment', 'font-weight:bold');
	console.log(summary);
	try {
		copy(JSON.stringify(summary));
		console.log('[DSTT probe] environment JSON copied to the clipboard');
	} catch (error) { /* clipboard is best-effort */ }
	window.__dshomeDiag = { report, run, sampler, tracer, ambient, wallpaper, glass, tilt, clip };
	console.log('[DSTT probe] ready: __dshomeDiag.run(90) | .tilt(false) | .clip(true) | .ambient(false) | .wallpaper(false) | .glass(false)');
	return '[DSTT probe] installed';
})();
