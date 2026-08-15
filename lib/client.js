window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-deepseek-style-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		const THEME_CSS = `
:root{--ds-brand:#4d6bfe;--ds-brand-deep:#3a65c2;--ds-brand-mid:#4176e6;--ds-brand-light:#73a3d2;--ds-glass-blur:24px}
html,body{background-color:transparent!important}
body{background:radial-gradient(1200px 700px at 12% -10%,rgba(77,107,254,.14),transparent 60%),radial-gradient(1000px 600px at 105% 12%,rgba(115,163,210,.16),transparent 55%),radial-gradient(900px 700px at 50% 115%,rgba(77,107,254,.10),transparent 60%),linear-gradient(180deg,#fbfbfd 0%,#f5f6fa 100%);background-attachment:fixed}
body[data-ds-dark-theme]{background:radial-gradient(1100px 650px at 8% -8%,#1a3870 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#2d5f9e 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#0d1f4a 0,transparent 60%),linear-gradient(180deg,#0a1a3a 0%,#0d1f4a 55%,#0a1a3a 100%);background-attachment:fixed}
.pI_x6G_frame,.pI_x6G_sidebarCol,.pI_x6G_detailsCol,.pI_x6G_centerCol{background:transparent!important}
.pI_x6G_sidebarCol{border-right:none!important}
.pI_x6G_detailsCol{border-left:none!important}
.hHd-Xa_root{position:relative;background:transparent!important}
.hHd-Xa_root::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(255,255,255,.5);-webkit-backdrop-filter:blur(var(--ds-glass-blur));backdrop-filter:blur(var(--ds-glass-blur));border-right:1px solid rgba(0,0,0,.06);pointer-events:none}
body[data-ds-dark-theme] .hHd-Xa_root::before{background:rgba(10,26,58,.48);border-right:1px solid rgba(255,255,255,.08)}
.hHd-Xa_brand{color:var(--ds-brand);cursor:pointer}
body[data-ds-dark-theme] .hHd-Xa_brand{color:#fff}
.hHd-Xa_newSession{border:none!important;background:linear-gradient(135deg,var(--ds-brand) 0%,var(--ds-brand-mid) 100%)!important;color:#fff!important;border-radius:999px!important;box-shadow:0 4px 14px rgba(77,107,254,.35);transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.hHd-Xa_newSession:hover{background:linear-gradient(135deg,#5d79ff 0%,#4d6bfe 100%)!important;box-shadow:0 6px 18px rgba(77,107,254,.45);transform:translateY(-1px)}
.YDXeBa_sessionRow,.YDXeBa_projectRow{background:rgba(255,255,255,.35)!important;border:1px solid transparent;border-radius:10px!important;margin:1px 0;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.YDXeBa_sessionRow:hover,.YDXeBa_projectRow:hover{background:rgba(255,255,255,.6)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transform:translateX(2px)}
.YDXeBa_sessionRow.YDXeBa_selected{background:linear-gradient(135deg,rgba(77,107,254,.16),rgba(65,118,230,.12))!important;border-color:rgba(77,107,254,.25);color:var(--ds-brand-deep)}
body[data-ds-dark-theme] .YDXeBa_sessionRow,body[data-ds-dark-theme] .YDXeBa_projectRow{background:rgba(21,42,86,.4)!important}
body[data-ds-dark-theme] .YDXeBa_sessionRow:hover,body[data-ds-dark-theme] .YDXeBa_projectRow:hover{background:rgba(30,52,100,.6)!important}
body[data-ds-dark-theme] .YDXeBa_sessionRow.YDXeBa_selected{background:linear-gradient(135deg,rgba(93,121,255,.28),rgba(77,107,254,.2))!important;border-color:rgba(157,185,255,.35);color:#eef2ff}
.YDXeBa_iconButton{transition:background .15s ease,color .15s ease,transform .15s ease,opacity .15s ease}
.YDXeBa_iconButton:hover{transform:scale(1.1)}
.wSkVaW_root{position:relative;background:transparent!important}
.wSkVaW_scrollBody{padding-top:56px}
.wSkVaW_viewArea{padding:0 18px}
.wSkVaW_header{position:absolute;top:8px;left:24px;right:24px;z-index:5;min-height:36px;padding:4px 12px;display:flex;flex-direction:row;align-items:center;gap:8px;justify-content:flex-start;border-radius:0;background:transparent!important;transition:border-radius .3s ease}
.wSkVaW_header::before{content:"";position:absolute;inset:0;z-index:-1;background:transparent;border:1px solid transparent;border-radius:inherit;-webkit-backdrop-filter:none;backdrop-filter:none;transition:background .3s ease,border-color .3s ease,box-shadow .3s ease}
.wSkVaW_header:hover{border-radius:999px}
.wSkVaW_titleRow{display:contents}
.wSkVaW_titleCluster{display:contents}
.wSkVaW_crumbs{order:2;flex:none;min-width:0}
.wSkVaW_tabs{order:0;flex:none;align-items:center;display:none;gap:8px;margin:0;padding:0}
.wSkVaW_headerActions{order:1;flex:none;align-items:center;display:flex;gap:8px}
.wSkVaW_headerUtilities{order:3;flex:none;align-items:center;display:flex;gap:8px;margin-left:auto}
.wSkVaW_header.dshome-swap .wSkVaW_tabs{display:flex;animation:dshome-tab-in .22s ease}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_tabs{display:flex!important}
.wSkVaW_header:hover::before{background:rgba(255,255,255,.45);border-color:rgba(0,0,0,.06);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 4px 16px rgba(0,0,0,.05)}
body[data-ds-dark-theme] .wSkVaW_header:hover::before{background:rgba(13,30,60,.45);border-color:rgba(255,255,255,.1);box-shadow:0 4px 20px rgba(0,0,0,.3)}
.wSkVaW_header:after{display:none!important}
.SVAs4q_label{background:rgba(77,107,254,.1)!important;border:1px solid rgba(77,107,254,.22);border-radius:999px!important;padding:0 10px!important;height:28px;line-height:26px;color:var(--ds-brand)!important}
body[data-ds-dark-theme] .SVAs4q_label{color:#9db9ff!important}
.wSkVaW_tab{border:1px solid rgba(77,107,254,.25);background:rgba(77,107,254,.08);border-radius:999px;padding:5px 16px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:16px;font-weight:500;transition:color .2s ease,background .2s ease,transform .2s ease}
.wSkVaW_tab:hover{color:var(--dsw-alias-label-primary);background:rgba(77,107,254,.16);transform:translateY(-1px)}
.wSkVaW_tab::after{display:none!important}
.wSkVaW_tabActive{background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-mid));color:#fff;border-color:transparent}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_header:hover{border-radius:0}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_header:hover::before{background:transparent;border-color:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}
.nL4_yW_sessionLogButton{min-width:0!important;width:28px;height:28px;padding:0!important;border-radius:50%!important;border:none!important;background:rgba(77,107,254,.08)!important;color:var(--ds-brand)!important;overflow:hidden;transition:width .2s ease,padding .2s ease,border-radius .2s ease}
.nL4_yW_sessionLogButton span{max-width:0;opacity:0;overflow:hidden;transition:max-width .2s ease,opacity .2s ease}
.wSkVaW_header:hover .nL4_yW_sessionLogButton{width:auto;padding:0 12px!important;border-radius:18px!important}
.wSkVaW_header:hover .nL4_yW_sessionLogButton span{max-width:90px;opacity:1}
body[data-ds-dark-theme] .nL4_yW_sessionLogButton{color:#9db9ff!important}
@property --dsh-border-angle{syntax:"<angle>";initial-value:0deg;inherits:false}
.uV2eYG_card{position:relative;background:rgba(255,255,255,.42)!important;border:1.5px solid rgba(255,255,255,.55)!important;box-shadow:0 8px 32px rgba(13,30,60,.1),inset 0 1px 1px hsla(0,0%,100%,.8);border-radius:22px!important}
body[data-ds-dark-theme] .uV2eYG_card{background:rgba(13,30,60,.55)!important;border:1.5px solid rgba(255,255,255,.16)!important;box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 1px 1px rgba(255,255,255,.06)}
.uV2eYG_card::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:22px;-webkit-backdrop-filter:blur(28px);backdrop-filter:blur(28px);pointer-events:none}
.uV2eYG_card::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--dsh-border-angle),rgba(77,107,254,0),rgba(77,107,254,.45),rgba(115,163,210,.2),rgba(77,107,254,.45),rgba(77,107,254,0));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;animation:dsh-border-spin 6s linear infinite;z-index:0}
body[data-ds-dark-theme] .uV2eYG_card::before{background:conic-gradient(from var(--dsh-border-angle),rgba(255,255,255,0),rgba(93,121,255,.55),rgba(115,163,210,.25),rgba(93,121,255,.55),rgba(255,255,255,0))}
.uV2eYG_card>*{position:relative;z-index:1}
@keyframes dsh-border-spin{to{--dsh-border-angle:360deg}}
.wSkVaW_composerSeat{background:transparent!important}
.uV2eYG_primary{background:linear-gradient(135deg,var(--ds-brand) 0%,var(--ds-brand-mid) 100%)!important;border:none!important;color:#fff!important;box-shadow:0 4px 14px rgba(77,107,254,.35);transition:box-shadow .15s ease,transform .15s ease}
.uV2eYG_primary:hover{box-shadow:0 6px 18px rgba(77,107,254,.45);transform:translateY(-1px)}
.pXSMma_headlineText{font-size:34px;line-height:42px;font-weight:700;letter-spacing:-.01em;background:linear-gradient(120deg,#152443 0%,var(--ds-brand-deep) 55%,var(--ds-brand) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
body[data-ds-dark-theme] .pXSMma_headlineText{background:linear-gradient(120deg,#fff 0%,#9db9ff 60%,#73a3d2 100%);-webkit-background-clip:text;background-clip:text}
.pXSMma_previewBadge{border-radius:999px!important;background:rgba(77,107,254,.1)!important;border:1px solid rgba(77,107,254,.25)!important;color:var(--ds-brand)!important}
.pXSMma_fish{color:var(--ds-brand)!important}
.wSkVaW_viewArea{animation:dshome-view-enter .45s ease}
@keyframes dshome-view-enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.gdEzaW_bubble{background:rgba(255,255,255,.6)!important;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,.05);box-shadow:0 4px 16px rgba(13,30,60,.06)}
body[data-ds-dark-theme] .gdEzaW_bubble{background:rgba(21,42,86,.65)!important;border:1px solid rgba(255,255,255,.1);box-shadow:0 4px 16px rgba(0,0,0,.25)}
.fV0t5q_root{background:rgba(255,255,255,.45)!important;border-bottom:1px solid rgba(0,0,0,.06)!important}
body[data-ds-dark-theme] .fV0t5q_root{background:rgba(13,30,60,.45)!important;border-bottom-color:rgba(255,255,255,.08)!important}
._1p9O6q_root{background:rgba(255,255,255,.3)!important;border-bottom:1px solid rgba(0,0,0,.05)!important}
._1p9O6q_plot{background:transparent!important}
body[data-ds-dark-theme] ._1p9O6q_root{background:rgba(13,30,60,.3)!important}
._1p9O6q_span[data-timeline-span=assistant]{background:var(--ds-brand)!important}
._1p9O6q_span[data-timeline-span=user]{background:var(--ds-brand-light)!important}
.Nqubda_panel{animation:dshome-pop-in .25s cubic-bezier(.2,.8,.2,1)}
[role=menu]{animation:dshome-pop-in .22s cubic-bezier(.2,.8,.2,1)}
.VOzbGW_mask{animation:dshome-fade-in .2s ease}
.VOzbGW_panel{background:rgba(255,255,255,.97)!important;animation:dshome-modal-in .4s cubic-bezier(.2,.8,.2,1)!important}
body[data-ds-dark-theme] .VOzbGW_panel{background:rgba(13,30,60,.96)!important}
@keyframes dshome-pop-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes dshome-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dshome-tab-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes dshome-modal-in{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
.VOzbGW_overlay{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;inset:0!important}
`;

		const ACTIONS_CSS = `
.dshome-locale{display:inline-flex;align-items:center;height:28px;border:1px solid rgba(77,107,254,.25);border-radius:999px;background:rgba(77,107,254,.08);overflow:hidden;flex:none}
.dshome-locale button{height:28px;padding:0 11px;border:none;background:transparent;color:#4d6bfe;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;line-height:28px;transition:background .15s ease,color .15s ease}
.dshome-locale button.dshome-on{background:linear-gradient(135deg,#4d6bfe,#4176e6);color:#fff}
.dshome-locale .dshome-short{display:inline}
.dshome-locale .dshome-full{display:none}
.wSkVaW_header:hover .dshome-locale .dshome-short{display:none}
.wSkVaW_header:hover .dshome-locale .dshome-full{display:inline}
body[data-ds-dark-theme] .dshome-locale{border-color:rgba(157,185,255,.35);background:rgba(93,121,255,.16)}
body[data-ds-dark-theme] .dshome-locale button{color:#9db9ff}
body[data-ds-dark-theme] .dshome-locale button.dshome-on{background:linear-gradient(135deg,#5d79ff,#4d6bfe);color:#fff}
`;

		function startParticles() {
			const canvas = document.createElement('canvas');
			canvas.setAttribute('data-dsh-deepseek-canvas', '');
			const style = canvas.style;
			style.position = 'fixed';
			style.top = '0';
			style.left = '0';
			style.width = '100%';
			style.height = '100%';
			style.zIndex = '-1';
			style.pointerEvents = 'none';
			style.opacity = '0.8';
			document.body.appendChild(canvas);

			const g = canvas.getContext('2d');
			const isDark = () => document.body.hasAttribute('data-ds-dark-theme');
			let running = true;
			let rafId = 0;
			let W = 0;
			let H = 0;
			let dpr = 1;
			const COUNT = 72;
			const parts = [];

			function palette() {
				return isDark()
					? ['#4a8ac4', '#2d5f9e', '#6fa8dc', '#9db9ff', '#ffffff']
					: ['#4d6bfe', '#73a3d2', '#9db9ff', '#ffffff'];
			}

			function resize() {
				dpr = Math.min(window.devicePixelRatio || 1, 2);
				W = window.innerWidth;
				H = window.innerHeight;
				canvas.width = Math.round(W * dpr);
				canvas.height = Math.round(H * dpr);
				g.setTransform(dpr, 0, 0, dpr, 0, 0);
			}

			function make() {
				const colors = palette();
				return {
					x: Math.random() * W,
					y: Math.random() * H,
					vx: (Math.random() - 0.5) * 0.28,
					vy: (Math.random() - 0.5) * 0.28,
					r: Math.random() * 1.7 + 0.6,
					a: Math.random() * 0.55 + 0.15,
					c: colors[(Math.random() * colors.length) | 0]
				};
			}

			function step() {
				if (!running) return;
				g.clearRect(0, 0, W, H);
				const linkBase = isDark() ? 'rgba(150,185,255,' : 'rgba(77,107,254,';
				for (let i = 0; i < parts.length; i++) {
					for (let j = i + 1; j < parts.length; j++) {
						const a = parts[i];
						const b = parts[j];
						const dx = a.x - b.x;
						const dy = a.y - b.y;
						const d2 = dx * dx + dy * dy;
						if (d2 < 14400) {
							const alpha = (1 - Math.sqrt(d2) / 120) * 0.16;
							g.strokeStyle = linkBase + alpha + ')';
							g.lineWidth = 1;
							g.beginPath();
							g.moveTo(a.x, a.y);
							g.lineTo(b.x, b.y);
							g.stroke();
						}
					}
				}
				for (const p of parts) {
					p.x += p.vx;
					p.y += p.vy;
					if (p.x < -20) p.x = W + 20;
					else if (p.x > W + 20) p.x = -20;
					if (p.y < -20) p.y = H + 20;
					else if (p.y > H + 20) p.y = -20;
					g.globalAlpha = p.a;
					g.fillStyle = p.c;
					g.beginPath();
					g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
					g.fill();
				}
				g.globalAlpha = 1;
				rafId = requestAnimationFrame(step);
			}

			window.addEventListener('resize', resize);
			resize();
			for (let i = 0; i < COUNT; i++) parts.push(make());
			rafId = requestAnimationFrame(step);

			return () => {
				running = false;
				cancelAnimationFrame(rafId);
				window.removeEventListener('resize', resize);
				canvas.remove();
			};
		}

		function watchSettingsSection() {
			let lastChild = null;
			const mo = new MutationObserver(() => {
				const options = document.querySelector('.VOzbGW_options');
				if (options === null) return;
				const child = options.firstElementChild;
				if (child !== lastChild) {
					lastChild = child;
					if (child !== null) {
						child.style.animation = 'none';
						void child.offsetWidth;
						child.style.animation = 'dshome-fade-in .25s ease';
					}
				}
			});
			mo.observe(document.body, { subtree: true, childList: true });
			return () => mo.disconnect();
		}

		function watchBrandLink() {
			const onClick = (event) => {
				const brand = event.target && event.target.closest ? event.target.closest('.hHd-Xa_brand') : null;
				if (brand === null) return;
				event.preventDefault();
				event.stopPropagation();
				window.open('https://www.deepseek.com/', '_blank', 'noopener,noreferrer');
			};
			document.addEventListener('click', onClick, true);
			return () => document.removeEventListener('click', onClick, true);
		}

		function watchHeaderInteraction() {
			const EASE = 'cubic-bezier(.2,.8,.2,1)';
			const DUR = '.3s';
			const timers = [];

			const headerOf = (node) => (node && node.closest ? node.closest('.wSkVaW_header') : null);
			const isTrajectory = (header) => {
				const root = header.closest('.wSkVaW_root');
				return root !== null && root.querySelector('.fV0t5q_root') !== null;
			};

			const enter = (header) => {
				const actions = header.querySelector('.wSkVaW_headerActions');
				const crumbs = header.querySelector('.wSkVaW_crumbs');
				if (crumbs === null) return;

				const actionsFirst = actions ? actions.getBoundingClientRect() : null;
				const crumbsFirst = crumbs.getBoundingClientRect();

				header.classList.add('dshome-swap');

				const actionsFlow = actions ? actions.getBoundingClientRect() : null;
				const crumbsFlow = crumbs.getBoundingClientRect();

				if (actions && actionsFirst && actionsFlow) {
					const dx = actionsFirst.left - actionsFlow.left;
					const dy = actionsFirst.top - actionsFlow.top;
					actions.style.transition = 'none';
					actions.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
				}

				const cdx = crumbsFirst.left - crumbsFlow.left;
				const cdy = crumbsFirst.top - crumbsFlow.top;
				crumbs.style.transition = 'none';
				crumbs.style.transform = 'translate(' + cdx + 'px,' + cdy + 'px)';

				void header.offsetWidth;

				if (actions) {
					actions.style.transition = 'transform ' + DUR + ' ' + EASE;
					actions.style.transform = 'translate(0,0)';
				}
				crumbs.style.transition = 'transform ' + DUR + ' ' + EASE;
				crumbs.style.transform = 'translate(0,0)';

				const timer = setTimeout(() => {
					if (actions) { actions.style.transition = ''; actions.style.transform = ''; }
					crumbs.style.transition = '';
					crumbs.style.transform = '';
				}, 320);
				timers.push(timer);
			};

			const leave = (header) => {
				const actions = header.querySelector('.wSkVaW_headerActions');
				const crumbs = header.querySelector('.wSkVaW_crumbs');

				const actionsHover = actions ? actions.getBoundingClientRect() : null;
				const crumbsHover = crumbs ? crumbs.getBoundingClientRect() : null;

				header.classList.remove('dshome-swap');

				if (actions && actionsHover) {
					const n = actions.getBoundingClientRect();
					const dx = actionsHover.left - n.left;
					const dy = actionsHover.top - n.top;
					actions.style.transition = 'none';
					actions.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
				}

				if (crumbs && crumbsHover) {
					const n = crumbs.getBoundingClientRect();
					const cdx = crumbsHover.left - n.left;
					const cdy = crumbsHover.top - n.top;
					crumbs.style.transition = 'none';
					crumbs.style.transform = 'translate(' + cdx + 'px,' + cdy + 'px)';
				}

				void header.offsetWidth;

				if (actions) {
					actions.style.transition = 'transform ' + DUR + ' ' + EASE;
					actions.style.transform = 'translate(0,0)';
				}
				if (crumbs) {
					crumbs.style.transition = 'transform ' + DUR + ' ' + EASE;
					crumbs.style.transform = 'translate(0,0)';
				}

				const timer = setTimeout(() => {
					if (actions) { actions.style.transition = ''; actions.style.transform = ''; }
					if (crumbs) { crumbs.style.transition = ''; crumbs.style.transform = ''; }
				}, 320);
				timers.push(timer);
			};

			const over = (event) => {
				const header = headerOf(event.target);
				if (header === null || isTrajectory(header)) return;
				if (header.classList.contains('dshome-swap')) return;
				const from = event.relatedTarget;
				if (from && header.contains(from)) return;
				enter(header);
			};

			const out = (event) => {
				const header = headerOf(event.target);
				if (header === null) return;
				if (!header.classList.contains('dshome-swap')) return;
				const to = event.relatedTarget;
				if (to && header.contains(to)) return;
				leave(header);
			};

			document.addEventListener('mouseover', over);
			document.addEventListener('mouseout', out);

			return () => {
				document.removeEventListener('mouseover', over);
				document.removeEventListener('mouseout', out);
				timers.forEach((t) => clearTimeout(t));
				document.querySelectorAll('.wSkVaW_header.dshome-swap').forEach((h) => {
					h.classList.remove('dshome-swap');
					const a = h.querySelector('.wSkVaW_headerActions');
					const c = h.querySelector('.wSkVaW_crumbs');
					if (a) { a.style.transition = ''; a.style.transform = ''; }
					if (c) { c.style.transition = ''; c.style.transform = ''; }
				});
			};
		}

		function LocaleToggle(props) {
			const locale = props.locale;
			const [active, setActive] = React.useState('zh');

			React.useEffect(() => {
				if (locale === undefined) return;
				const sync = () => {
					try { setActive(locale.getLocale().active); } catch (e) {}
				};
				sync();
				return locale.subscribe(sync);
			}, [locale]);

			const pick = (id) => () => {
				if (locale === undefined) return;
				try { locale.setLocale(id); } catch (e) {}
			};

			const isZh = active === 'zh' || active === 'zh-CN' || active === 'zh-Hans';

			return React.createElement('div', { className: 'dshome-locale', role: 'group', 'aria-label': 'Language' },
				React.createElement('button', { type: 'button', className: isZh ? 'dshome-on' : '', onClick: pick('zh') },
					React.createElement('span', { className: 'dshome-full' }, '中文'),
					React.createElement('span', { className: 'dshome-short' }, '中')),
				React.createElement('button', { type: 'button', className: !isZh ? 'dshome-on' : '', onClick: pick('en') },
					React.createElement('span', { className: 'dshome-full' }, 'EN'),
					React.createElement('span', { className: 'dshome-short' }, 'E'))
			);
		}

		function apply(ctx) {
			const stale = document.querySelector('[data-dsh-probe]');
			if (stale !== null) stale.remove();

			const themeTag = document.createElement('style');
			themeTag.dataset.plugin = '@dsh-external/dsh-deepseek-style-theme';
			themeTag.dataset.pluginCss = '@dsh-external/dsh-deepseek-style-theme/theme.css';
			themeTag.textContent = THEME_CSS;
			document.head.appendChild(themeTag);

			const actionsTag = document.createElement('style');
			actionsTag.dataset.plugin = '@dsh-external/dsh-deepseek-style-theme';
			actionsTag.dataset.pluginCss = '@dsh-external/dsh-deepseek-style-theme/actions.css';
			actionsTag.textContent = ACTIONS_CSS;
			document.head.appendChild(actionsTag);

			ctx.effect(() => () => {
				themeTag.remove();
				actionsTag.remove();
			}, 'deepseek-style-theme: css');

			const theme = ctx.get('theme');
			if (theme !== undefined) {
				const disposeTokens = theme.overrideTokens('deepseek-style-theme', {
					'--dsw-alias-bg-base': { light: '#f6f7fb', dark: '#0a1a3a' },
					'--dsw-alias-bg-layer-1': { light: 'rgba(255,255,255,0.72)', dark: 'rgba(15,32,66,0.72)' },
					'--dsw-alias-bg-layer-2': { light: 'rgba(255,255,255,0.85)', dark: 'rgba(21,42,86,0.8)' },
					'--dsw-alias-bg-overlay': { light: 'rgba(255,255,255,0.92)', dark: 'rgba(10,26,58,0.94)' },
					'--dsw-alias-border-l1': { light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.08)' },
					'--dsw-alias-border-l2': { light: 'rgba(0,0,0,0.1)', dark: 'rgba(255,255,255,0.14)' },
					'--dsw-alias-brand-primary': { light: '#4d6bfe', dark: '#5d79ff' },
					'--dsw-alias-label-primary': { light: '#152443', dark: '#eef2ff' },
					'--dsw-alias-label-secondary': { light: '#3c4a63', dark: '#a9b8d8' },
					'--dsw-alias-state-error-primary': { light: '#ef4444', dark: '#ff6b6b' },
					'--dsw-alias-state-success-primary': { light: '#22c55e', dark: '#4ed17e' },
					'--dsw-alias-state-warn-primary': { light: '#f59e0b', dark: '#f7ad31' },
					'--dsw-specific-sidebar-fill': { light: 'rgba(255,255,255,0.5)', dark: 'rgba(10,26,58,0.48)' }
				});
				ctx.effect(() => disposeTokens);
			}

			ctx.effect(() => {
				try { return startParticles(); } catch (error) { return () => {}; }
			});
			ctx.effect(() => {
				try { return watchSettingsSection(); } catch (error) { return () => {}; }
			});
			ctx.effect(() => {
				try { return watchBrandLink(); } catch (error) { return () => {}; }
			});
			ctx.effect(() => {
				try { return watchHeaderInteraction(); } catch (error) { return () => {}; }
			});

			const slots = ctx.get('slots');
			if (slots !== undefined) {
				slots.inject('conversation.session.header.utilities', () => slots.register(
					{ name: 'conversation.session.header.utilities', id: 'deepseek-locale', order: 90 },
					() => React.createElement(LocaleToggle, { locale: ctx.get('locale') })
				));
			}
		}

		exports.apply = apply;
		exports.inject = ['theme', 'slots', 'locale'];
		return module.exports;
	}
});
