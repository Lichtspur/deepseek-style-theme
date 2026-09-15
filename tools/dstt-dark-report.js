/**
 * DSTT 明暗诊断探针（只在控制台读，不改动页面）。
 *
 * 用法：切到「深色」后，在 GUI 里按 F12 → Console，粘贴整个文件内容回车。
 * 会打印一段 JSON：产品自己的明暗信号、我们的标记、以及浏览器算出来的真实背景色。
 * 把输出贴回来即可。
 */
(() => {
	const body = document.body;
	const html = document.documentElement;
	const cs = (el) => getComputedStyle(el);
	const bodyCs = cs(body);
	const rootCs = cs(html);

	// 1) 产品自己怎么表达明暗：属性、类、以及它给根元素设的底色令牌
	const productSignals = {
		'body[data-ds-dark-theme]': body.hasAttribute('data-ds-dark-theme'),
		'html[data-ds-dark-theme]': html.hasAttribute('data-ds-dark-theme'),
		'body[data-theme]': body.getAttribute('data-theme'),
		'html[data-theme]': html.getAttribute('data-theme'),
		'body.class': body.className.slice(0, 120),
		'html.class': html.className.slice(0, 120),
		'html style attr': (html.getAttribute('style') || '').slice(0, 120),
		'prefers-color-scheme: dark': matchMedia('(prefers-color-scheme: dark)').matches,
		'--dsw-alias-bg-base (html)': rootCs.getPropertyValue('--dsw-alias-bg-base').trim(),
		'--dsw-alias-bg-base (body)': bodyCs.getPropertyValue('--dsw-alias-bg-base').trim(),
		'--dsw-alias-label-primary (body)': bodyCs.getPropertyValue('--dsw-alias-label-primary').trim(),
		'html background-color': rootCs.backgroundColor,
		'body background-color': bodyCs.backgroundColor
	};

	// 2) 我们自己的标记与品牌色
	const ourMarkers = {
		'body[data-dshome-dark]': body.hasAttribute('data-dshome-dark'),
		'data-dshome-color': body.getAttribute('data-dshome-color'),
		'--ds-brand (body)': bodyCs.getPropertyValue('--ds-brand').trim(),
		'--ds-brand (html)': rootCs.getPropertyValue('--ds-brand').trim(),
		'body background-image': String(bodyCs.backgroundImage).slice(0, 220)
	};

	// 3) 背景到底是什么：canvas 是否在、画布中心像素是亮是暗
	const canvas = document.querySelector('[data-dsh-deepseek-canvas]');
	let canvasInfo = null;
	if (canvas !== null) {
		const gl = canvas.getContext('webgl2');
		let centre = null;
		if (gl !== null && !gl.isContextLost()) {
			const px = new Uint8Array(4);
			try {
				gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
				centre = Array.from(px);
			} catch (e) { centre = 'readPixels failed'; }
		}
		canvasInfo = { size: [canvas.width, canvas.height], z: cs(canvas).zIndex, centrePixel: centre, contextLost: gl === null ? 'no gl' : gl.isContextLost() };
	}

	// 3b) 所有背景画布（不止第一块）。「主题是否被挂载了两次」用这个一眼可辨：
	//     同一个选择器命中 2 块、或存在别的不带 data 属性的 canvas，都说明有第二份实例在画。
	const allCanvases = Array.from(document.querySelectorAll('canvas')).map((node) => {
		const style = cs(node);
		const box = node.getBoundingClientRect();
		let centre = null;
		const gl = node.getContext('webgl2');
		if (gl !== null && !gl.isContextLost()) {
			const px = new Uint8Array(4);
			try {
				gl.readPixels(Math.floor(node.width / 2), Math.floor(node.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
				centre = Array.from(px);
			} catch (e) { centre = 'readPixels failed'; }
		}
		return {
			attrs: Array.from(node.attributes).filter((a) => a.name.startsWith('data-')).map((a) => a.name),
			box: [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)],
			backing: [node.width, node.height],
			z: style.zIndex,
			centrePixel: centre
		};
	});

	// 4) 主题注入的样式表是否还在，以及明暗规则是否真的命中
	const sheets = Array.from(document.querySelectorAll('style[data-plugin-css]')).map((n) => n.dataset.pluginCss).filter((n) => n.includes('deepseek-style-theme'));
	const darkRuleMatches = Array.from(document.styleSheets).some((sheet) => {
		try { return Array.from(sheet.cssRules).some((rule) => String(rule.selectorText || '').includes('data-dshome-dark')); } catch (e) { return false; }
	});

	// 4b) 这份产物是新的还是旧的：新构建的流体参数同步函数叫 syncFluid。
	const buildProbe = (() => {
		let patched = 'unknown';
		try {
			patched = typeof window.__dshomeBuild === 'string' ? window.__dshomeBuild : 'no marker (older build)';
		} catch (e) { patched = 'error'; }
		return patched;
	})();

	const report = {
		when: new Date().toISOString(),
		productSignals,
		ourMarkers,
		canvas: canvasInfo,
		allCanvases,
		buildMarker: buildProbe,
		themeSheets: sheets,
		darkRulePresent: darkRuleMatches,
		// 结论行：背景此刻应该是深色还是浅色
		verdict: {
			productSaysDark: productSignals['--dsw-alias-bg-base (html)'],
			weSaysDark: ourMarkers['body[data-dshome-dark]'],
			bodyPaints: ourMarkers['body background-image'].slice(0, 90)
		}
	};
	console.log('%c[DSTT 诊断]', 'font-weight:bold', report);
	console.log('[DSTT 诊断] JSON:\n' + JSON.stringify(report, null, 1));

	// ---------------------------------------------------------------------
	// 可选：6 种组合的即时预览。
	// 当前运行中的插件产物还是旧的（浏览器拿到的是打包缓存里的旧 theme），
	// 背景不会跟着换色。这一段用与插件完全相同的调色板，把
	// 白蓝 / 黑蓝 / 白红 / 黑红 / 白绿 / 黑绿 依次刷到流体画布上，
	// 让你先看到应有的效果。只作用于本次会话，刷新即恢复；
	// 等插件重新挂载后由插件自己切换，就不需要这段了。
	// ---------------------------------------------------------------------
	const PALETTES = {
		light: {
			blue: ['#5E82DE', '#FFFFFF', '#D8E2FA'],
			red: ['#D4797F', '#FFFFFF', '#FAD6D8'],
			green: ['#4FBE92', '#FFFFFF', '#D6F2E4']
		},
		dark: {
			blue: ['#2C4A9E', '#050F26', '#122A5C'],
			red: ['#8E2F36', '#1A0A0D', '#40141A'],
			green: ['#1F6B4E', '#061423', '#0E3A2A']
		}
	};
	const preview = (scheme, colour) => {
		const c = document.querySelector('[data-dsh-deepseek-canvas]');
		const gl = c === null ? null : c.getContext('webgl2');
		if (gl === null || gl.isContextLost()) return 'no live webgl2 canvas';
		const program = gl.getParameter(gl.CURRENT_PROGRAM);
		if (program === null) return 'no current program';
		const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
		const triple = PALETTES[scheme][colour];
		['u_color1', 'u_color2', 'u_color3'].forEach((name, i) => {
			const loc = gl.getUniformLocation(program, name);
			if (loc !== null) { const rgb = hex(triple[i]); gl.uniform4f(loc, rgb[0], rgb[1], rgb[2], 1); }
		});
		return scheme + '/' + colour + ' -> ' + triple.join(' ');
	};
	console.log('%c[DSTT 预览] 6 种组合（只作用于本次会话，刷新恢复）', 'font-weight:bold');
	for (const scheme of ['light', 'dark']) for (const colour of ['blue', 'red', 'green']) console.log('  ' + preview(scheme, colour));
	console.log('要恢复原状：刷新页面。');
	return report;
})();
