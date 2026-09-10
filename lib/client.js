window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-deepseek-style-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		// ── design-standard conformance (创造模式 preset) ────────────────────
		// The product shell ships build-time hashed class names (e.g.
		// `wSkVaW_header`). They are not API and change on every product rebuild,
		// so this theme treats every rule that targets them as a guarded patch
		// layer: each block is injected only while its anchor class actually
		// exists in the DOM (a 30s wait covers late-rendered shells), and a block
		// whose anchor never appears is skipped with a one-line diagnostic
		// instead of silently shipping dead CSS.
		// Dark styling keys off our own `data-dshome-dark` attribute, driven by
		// the theme service's `active.colorScheme` — never the product's
		// attribute name — so a product-side rename cannot break dark mode.
		// UI that the product exposes through a Slot (the locale toggle) stays on
		// the Slot; only surfaces with no Slot use DOM patches.
		const PLUGIN_ID = "@dsh-external/dsh-deepseek-style-theme";

		// CORE_CSS: ours only (`:root` tokens, `html/body`, keyframes, stable
		// `[role=menu]`, `.dshome-*`). No product class names — always injected.
		// Color model: `data-dshome-color` ∈ {green(base), red(鲜红 peak), blue}
		// re-tints every var(--ds-brand*) consumer.
		const CORE_CSS = `
:root{--ds-brand:#059669;--ds-brand-deep:#047857;--ds-brand-mid:#10B981;--ds-brand-light:#34D399;--ds-glass-blur:24px}
html,body{background-color:transparent!important}
body{background:radial-gradient(1200px 700px at 12% -10%,color-mix(in srgb,var(--ds-brand) 14%,transparent),transparent 60%),radial-gradient(1000px 600px at 105% 12%,color-mix(in srgb,var(--ds-brand-light) 16%,transparent),transparent 55%),radial-gradient(900px 700px at 50% 115%,color-mix(in srgb,var(--ds-brand) 10%,transparent),transparent 60%),linear-gradient(180deg,#fbfbfd 0%,#f5f6fa 100%);background-attachment:fixed}
body[data-dshome-color=red]{--ds-brand:#F5222D;--ds-brand-deep:#CF1322;--ds-brand-mid:#FF4D4F;--ds-brand-light:#FF7875}
body[data-dshome-color=blue]{--ds-brand:#4D6BFE;--ds-brand-deep:#3A65C2;--ds-brand-mid:#4176E6;--ds-brand-light:#73A3D2}
body[data-dshome-dark]{--ds-brand:#10B981;--ds-brand-deep:#059669;--ds-brand-mid:#34D399;--ds-brand-light:#6EE7B7;background:radial-gradient(1100px 650px at 8% -8%,#0a3a28 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#0d4d35 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#06291c 0,transparent 60%),linear-gradient(180deg,#081b14 0%,#0a241a 55%,#081b14 100%);background-attachment:fixed}
body[data-dshome-dark][data-dshome-color=red]{--ds-brand:#FF4D4F;--ds-brand-deep:#F5222D;--ds-brand-mid:#FF7875;--ds-brand-light:#FFA39E;background:radial-gradient(1100px 650px at 8% -8%,#5c0f14 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#7d1a20 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#3f0a0e 0,transparent 60%),linear-gradient(180deg,#260709 0%,#330a0d 55%,#260709 100%);background-attachment:fixed}
body[data-dshome-dark][data-dshome-color=blue]{--ds-brand:#5D79FF;--ds-brand-deep:#4D6BFE;--ds-brand-mid:#7A96FF;--ds-brand-light:#9DB9FF;background:radial-gradient(1100px 650px at 8% -8%,#1a3870 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#2d5f9e 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#0d1f4a 0,transparent 60%),linear-gradient(180deg,#0a1a3a 0%,#0d1f4a 55%,#0a1a3a 100%);background-attachment:fixed}
@property --dsh-border-angle{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes dsh-border-spin{to{--dsh-border-angle:360deg}}
@keyframes dshome-view-enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes dshome-pop-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes dshome-fade-in{from{opacity:0}to{opacity:1}}
@keyframes dshome-tab-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes dshome-modal-in{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
[role=menu]{animation:dshome-pop-in .22s cubic-bezier(.2,.8,.2,1)}
.dshome-ws-open-wrap{padding:2px 0}
.dshome-ws-open{display:flex;align-items:center;gap:8px;width:100%;min-width:170px;padding:6px 10px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;font-family:inherit;text-align:left;cursor:pointer;transition:background .15s ease,color .15s ease}
.dshome-ws-open:hover{background:color-mix(in srgb,var(--ds-brand) 12%,transparent)!important;color:var(--ds-brand-deep)!important}
.dshome-ws-open-icon{display:inline-flex;flex:none;color:var(--ds-brand)}
.dshome-ws-open-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body[data-dshome-dark] .dshome-ws-open{color:#eef2ff}
body[data-dshome-dark] .dshome-ws-open:hover{background:color-mix(in srgb,var(--ds-brand) 22%,transparent)!important;color:#fff!important}
body[data-dshome-dark] .dshome-ws-open-icon{color:var(--ds-brand-light)}
.dshome-dstt{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}
.dshome-dstt h3{margin:0;font-size:16px;font-weight:500;line-height:24px;display:flex;align-items:center;gap:8px}
.dshome-dstt-tag{flex:none;border:1px solid color-mix(in srgb,var(--ds-brand) 35%,transparent);background:color-mix(in srgb,var(--ds-brand) 12%,transparent);color:var(--ds-brand);border-radius:999px;padding:1px 8px;font-size:11px;line-height:18px;font-weight:600}
body[data-dshome-dark] .dshome-dstt-tag{color:var(--ds-brand-light)}
.dshome-dstt p{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.dshome-dstt-row{display:flex;align-items:center;gap:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;background:var(--dsw-alias-bg-layer-1)}
.dshome-dstt-row-body{flex:1;min-width:0}
.dshome-dstt-row-title{font-size:14px;line-height:22px;font-weight:500}
.dshome-dstt-row-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dshome-dstt-status{flex:none;font-size:12px;line-height:18px;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px}
.dshome-dstt-status[data-peak=true]{background:color-mix(in srgb,var(--ds-brand) 14%,transparent);color:var(--ds-brand-deep);border:1px solid color-mix(in srgb,var(--ds-brand) 30%,transparent)}
.dshome-dstt-status[data-peak=false]{background:color-mix(in srgb,var(--ds-brand) 8%,transparent);color:var(--ds-brand);border:1px solid color-mix(in srgb,var(--ds-brand) 22%,transparent)}
body[data-dshome-dark] .dshome-dstt-status[data-peak=true]{color:var(--ds-brand-light)}
body[data-dshome-dark] .dshome-dstt-status[data-peak=false]{color:var(--ds-brand-light)}
.dshome-dstt-seg{display:inline-flex;align-items:center;gap:2px;flex:none;border:1px solid color-mix(in srgb,var(--ds-brand) 25%,transparent);border-radius:999px;background:color-mix(in srgb,var(--ds-brand) 8%,transparent);padding:2px}
.dshome-dstt-seg-btn{height:26px;padding:0 12px;border:none;border-radius:999px;background:transparent;color:var(--ds-brand);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;line-height:26px;transition:background .15s ease,color .15s ease}
.dshome-dstt-seg-btn:hover{background:color-mix(in srgb,var(--ds-brand) 12%,transparent)}
.dshome-dstt-seg-btn.dshome-on{background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-mid));color:#fff}
.dshome-dstt-seg-btn:disabled{opacity:.5;cursor:default}
.dshome-dstt-seg-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
`;

		// Locale toggle styling. The two header-hover dependent rules live in the
		// `.wSkVaW_root` patch block below, so the toggle stays styled (short
		// labels) even if the header class renames.
		// The product sets `corner-shape:superellipse(1.5)` on `*` (its
		// corner-shape.css), which flattens even a 999px radius into a rounded
		// rectangle; `corner-shape:round` restores true round ends here.
		// Label bloom: the short 中/E label grows into 中文/EN with an animated
		// max-width instead of the old `display` hard swap.
		const ACTIONS_CSS = `
.dshome-locale{display:inline-flex;align-items:center;height:28px;border:1px solid color-mix(in srgb,var(--ds-brand) 25%,transparent);border-radius:999px;background:color-mix(in srgb,var(--ds-brand) 8%,transparent);overflow:hidden;flex:none;corner-shape:round;transition:transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s ease,border-color .22s ease,background .22s ease}
.dshome-locale:hover{transform:translateY(-1px) scale(1.03);border-color:color-mix(in srgb,var(--ds-brand) 48%,transparent);background:color-mix(in srgb,var(--ds-brand) 14%,transparent);box-shadow:0 4px 14px color-mix(in srgb,var(--ds-brand) 26%,transparent)}
body[data-dshome-dark] .dshome-locale{border-color:color-mix(in srgb,var(--ds-brand) 35%,transparent);background:color-mix(in srgb,var(--ds-brand) 16%,transparent)}
body[data-dshome-dark] .dshome-locale:hover{border-color:color-mix(in srgb,var(--ds-brand) 55%,transparent);background:color-mix(in srgb,var(--ds-brand) 24%,transparent);box-shadow:0 4px 16px color-mix(in srgb,var(--ds-brand) 34%,transparent)}
.dshome-locale button{height:28px;padding:0 11px;border:none;background:transparent;color:var(--ds-brand);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;line-height:28px;transition:background .22s ease,color .22s ease,transform .18s cubic-bezier(.2,.8,.2,1)}
.dshome-locale button:not(.dshome-on):hover{background:color-mix(in srgb,var(--ds-brand) 14%,transparent);color:var(--ds-brand-deep)}
.dshome-locale button:active{transform:scale(.92)}
.dshome-locale button.dshome-on{background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-mid));color:#fff;animation:dshome-locale-pop .34s cubic-bezier(.2,.8,.2,1)}
@keyframes dshome-locale-pop{0%{transform:scale(.86)}60%{transform:scale(1.05)}to{transform:none}}
.dshome-locale .dshome-short,.dshome-locale .dshome-full{display:inline-block;overflow:hidden;white-space:nowrap;transition:max-width .3s cubic-bezier(.2,.8,.2,1),opacity .22s ease,transform .3s cubic-bezier(.2,.8,.2,1)}
.dshome-locale .dshome-short{max-width:2.2em;opacity:1;transform:none}
.dshome-locale .dshome-full{max-width:0;opacity:0;transform:translateX(-6px)}
body[data-dshome-dark] .dshome-locale button{color:var(--ds-brand-light)}
body[data-dshome-dark] .dshome-locale button:not(.dshome-on):hover{background:color-mix(in srgb,var(--ds-brand) 22%,transparent);color:#fff}
body[data-dshome-dark] .dshome-locale button.dshome-on{background:linear-gradient(135deg,color-mix(in srgb,var(--ds-brand) 72%,#fff),var(--ds-brand));color:#fff}
`;

		const SUBAGENT_PANEL_CSS = `
.dshome-sa{position:fixed;right:16px;bottom:16px;z-index:70;width:286px;max-width:calc(100vw - 32px);box-sizing:border-box;display:flex;flex-direction:column;gap:2px;padding:10px 12px 8px;border-radius:16px;border:1px solid rgba(255,255,255,.55);background:linear-gradient(165deg,rgba(255,255,255,.46),rgba(255,255,255,.22));box-shadow:0 12px 40px rgba(13,30,60,.14),inset 0 1px 0 rgba(255,255,255,.85),inset 0 0 0 .5px rgba(255,255,255,.5);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);font-family:inherit;transition:opacity .22s ease,transform .22s ease;animation:dshome-sa-in .3s cubic-bezier(.2,.8,.2,1)}
.dshome-sa[hidden]{display:none!important}
.dshome-sa.dshome-sa-leave{opacity:0;transform:translateY(10px);pointer-events:none}
body[data-dshome-dark] .dshome-sa{background:linear-gradient(165deg,rgba(21,42,86,.52),rgba(10,26,58,.3));border-color:color-mix(in srgb,var(--ds-brand) 24%,transparent);box-shadow:0 12px 40px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12),inset 0 0 0 .5px color-mix(in srgb,var(--ds-brand) 16%,transparent)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.dshome-sa{background:linear-gradient(165deg,rgba(255,255,255,.84),rgba(255,255,255,.68))}body[data-dshome-dark] .dshome-sa{background:linear-gradient(165deg,rgba(13,30,60,.88),rgba(10,26,58,.78))}}
@keyframes dshome-sa-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.dshome-sa-head{display:flex;flex-direction:row;align-items:center;gap:7px;min-height:26px}
.dshome-sa-pulse{position:relative;flex:none;width:8px;height:8px;border-radius:50%;background:var(--ds-brand);animation:dshome-sa-pulse 1.8s ease-out infinite}
@keyframes dshome-sa-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ds-brand) 45%,transparent)}70%{box-shadow:0 0 0 7px color-mix(in srgb,var(--ds-brand) 0%,transparent)}100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ds-brand) 0%,transparent)}}
.dshome-sa-title{flex:1;min-width:0;font-size:12.5px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshome-sa-collapse{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:none;border-radius:50%;background:rgba(255,255,255,.5);color:var(--ds-brand);cursor:pointer;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ds-brand) 18%,transparent);transition:transform .2s ease,background .15s ease}
.dshome-sa-collapse:hover{background:rgba(255,255,255,.75)}
body[data-dshome-dark] .dshome-sa-collapse{background:color-mix(in srgb,var(--ds-brand) 18%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ds-brand) 25%,transparent)}
body[data-dshome-dark] .dshome-sa-collapse:hover{background:color-mix(in srgb,var(--ds-brand) 30%,transparent)}
.dshome-sa-collapse svg{display:block}
.dshome-sa-collapsed .dshome-sa-collapse{transform:rotate(180deg)}
.dshome-sa-list{display:flex;flex-direction:column;gap:2px;max-height:312px;overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable;padding:2px 0}
.dshome-sa-collapsed .dshome-sa-list{display:none}
.dshome-sa-item{position:relative;display:flex;flex-direction:row;align-items:flex-start;gap:8px;width:100%;min-width:0;box-sizing:border-box;padding:7px 8px;border:none;border-radius:10px;background:transparent;color:inherit;font-family:inherit;text-align:left;cursor:pointer;transition:background .15s ease}
.dshome-sa-item:hover{background:linear-gradient(135deg,rgba(255,255,255,.65),rgba(255,255,255,.35));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ds-brand) 14%,transparent)}
body[data-dshome-dark] .dshome-sa-item:hover{background:linear-gradient(135deg,color-mix(in srgb,var(--ds-brand) 22%,transparent),color-mix(in srgb,var(--ds-brand) 10%,transparent));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ds-brand) 22%,transparent)}
.dshome-sa-dot{flex:none;width:6px;height:6px;margin-top:7px;border-radius:50%;background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-light));animation:dshome-sa-blink 1.2s ease-in-out infinite}
@keyframes dshome-sa-blink{0%,100%{opacity:1}50%{opacity:.35}}
.dshome-sa-stop{flex:none;width:18px;height:18px;margin-top:4px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;pointer-events:none;transition:opacity .15s ease,background .15s ease,color .15s ease}
.dshome-sa-item:hover .dshome-sa-stop,.dshome-sa-item:focus-within .dshome-sa-stop{opacity:1;pointer-events:auto}
.dshome-sa-stop:hover{background:rgba(239,68,68,.12);color:#ef4444}
body[data-dshome-dark] .dshome-sa-stop:hover{background:rgba(255,107,107,.16);color:#ff6b6b}
.dshome-sa-stop:disabled{opacity:.55;cursor:default}
.dshome-sa-stop-busy svg{animation:dshome-sa-blink .8s ease-in-out infinite}
.dshome-sa-stop-denied{background:rgba(239,68,68,.18)!important;color:#ef4444!important}
body[data-dshome-dark] .dshome-sa-stop-denied{background:rgba(255,107,107,.2)!important;color:#ff6b6b!important}
.dshome-sa-sweep{position:absolute;top:0;bottom:0;left:0;width:0;border-radius:10px;background:linear-gradient(90deg,rgba(239,68,68,.14),rgba(239,68,68,.24));pointer-events:none;z-index:0}
body[data-dshome-dark] .dshome-sa-sweep{background:linear-gradient(90deg,rgba(255,107,107,.16),rgba(255,107,107,.28))}
.dshome-sa-item>.dshome-sa-dot,.dshome-sa-item>.dshome-sa-body,.dshome-sa-item>.dshome-sa-stop{position:relative;z-index:1}
.dshome-sa-item.dshome-sa-stopping .dshome-sa-bar{background:rgba(239,68,68,.85)}
.dshome-sa-item.dshome-sa-stopping .dshome-sa-bar-fill{display:none}
body[data-dshome-dark] .dshome-sa-item.dshome-sa-stopping .dshome-sa-bar{background:rgba(255,107,107,.8)}
.dshome-sa-item.dshome-sa-stopping .dshome-sa-stop{opacity:0;pointer-events:none}
.dshome-sa-item.dshome-sa-item-exit{opacity:0;transform:translateX(8px);transition:opacity .2s ease,transform .2s ease}
.dshome-sa-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.dshome-sa-name{font-size:13px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshome-sa-meta{font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshome-sa-bar{position:relative;height:3px;border-radius:999px;background:color-mix(in srgb,var(--ds-brand) 12%,transparent);overflow:hidden}
.dshome-sa-bar-fill{position:absolute;inset:0;width:42%;border-radius:999px;background:linear-gradient(90deg,transparent,var(--ds-brand),transparent);animation:dshome-sa-slide 1.5s ease-in-out infinite}
@keyframes dshome-sa-slide{0%{transform:translateX(-110%)}100%{transform:translateX(350%)}}
@media (max-width:760px){.dshome-sa{right:10px;bottom:10px;width:min(286px,calc(100vw - 20px))}}
`;

		// PATCH_BLOCKS: every rule group that targets product build-time class
		// names. `anchor` is the class that must exist in the DOM before the
		// block is injected; each block degrades independently when its surface
		// renames in a product rebuild.
		const PATCH_BLOCKS = [
			// Frame / sidebar / details columns.
			{ anchor: ".pI_x6G_frame", css: `
.pI_x6G_frame,.pI_x6G_sidebarCol,.pI_x6G_detailsCol,.pI_x6G_centerCol{background:transparent!important}
.pI_x6G_sidebarCol{border-right:none!important}
.pI_x6G_detailsCol{border-left:none!important}
` },
			// Sidebar glass root — Apple liquid glass pane: layered translucent
			// gradient + blur/saturate/brightness/contrast + specular edges.
			{ anchor: ".hHd-Xa_root", css: `
.hHd-Xa_root{position:relative;background:transparent!important}
.hHd-Xa_root::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(255,255,255,.5);-webkit-backdrop-filter:blur(var(--ds-glass-blur));backdrop-filter:blur(var(--ds-glass-blur));border-right:1px solid rgba(0,0,0,.06);pointer-events:none}
body[data-dshome-dark] .hHd-Xa_root::before{background:rgba(10,26,58,.48);border-right:1px solid rgba(255,255,255,.08)}
.hHd-Xa_brand{color:var(--ds-brand);cursor:pointer}
body[data-dshome-dark] .hHd-Xa_brand{color:#fff}
.hHd-Xa_newSession{border:none!important;background:linear-gradient(135deg,var(--ds-brand) 0%,var(--ds-brand-mid) 100%)!important;color:#fff!important;border-radius:999px!important;box-shadow:0 4px 14px color-mix(in srgb,var(--ds-brand) 35%,transparent);transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.hHd-Xa_newSession:hover{background:linear-gradient(135deg,color-mix(in srgb,var(--ds-brand) 72%,#fff) 0%,var(--ds-brand) 100%)!important;box-shadow:0 6px 18px color-mix(in srgb,var(--ds-brand) 45%,transparent);transform:translateY(-1px)}
` },
			// Session / project rows and icon buttons.
			{ anchor: ".YDXeBa_sessionRow", css: `
.YDXeBa_sessionRow,.YDXeBa_projectRow{background:rgba(255,255,255,.35)!important;border:1px solid transparent;border-radius:10px!important;margin:1px 0;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.YDXeBa_sessionRow:hover,.YDXeBa_projectRow:hover{background:rgba(255,255,255,.6)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transform:translateX(2px)}
.YDXeBa_sessionRow.YDXeBa_selected{background:linear-gradient(135deg,color-mix(in srgb,var(--ds-brand) 16%,transparent),color-mix(in srgb,var(--ds-brand-mid) 12%,transparent))!important;border-color:color-mix(in srgb,var(--ds-brand) 25%,transparent);color:var(--ds-brand-deep)}
body[data-dshome-dark] .YDXeBa_sessionRow,body[data-dshome-dark] .YDXeBa_projectRow{background:rgba(21,42,86,.4)!important}
body[data-dshome-dark] .YDXeBa_sessionRow:hover,body[data-dshome-dark] .YDXeBa_projectRow:hover{background:rgba(30,52,100,.6)!important}
body[data-dshome-dark] .YDXeBa_sessionRow.YDXeBa_selected{background:linear-gradient(135deg,color-mix(in srgb,var(--ds-brand) 28%,transparent),color-mix(in srgb,var(--ds-brand) 20%,transparent))!important;border-color:color-mix(in srgb,var(--ds-brand) 35%,transparent);color:#eef2ff}
.YDXeBa_iconButton{transition:background .15s ease,color .15s ease,transform .15s ease,opacity .15s ease}
.YDXeBa_iconButton:hover{transform:scale(1.1)}
` },
			// Chat view: header (incl. locale hover swap), tabs, crumbs, title.
			// Hover pill upgraded to a liquid-glass capsule.
			// 0.1.5-rc.1 draws the header divider as a real `border-bottom` on
			// `.wSkVaW_header` (1.37 used an `::after` pseudo-element), so the
			// floating capsule grew a stray hairline under it. Neutralise the
			// border here and keep the legacy `::after` hide for older builds.
			// The header divider would otherwise be a 0.5px `--dsw-alias-border-l3`
			// line spanning exactly this absolutely positioned bar (24px inset).
			// `titleRow`/`titleCluster` are flattened with `display:contents`, so
			// every direct header child needs an explicit `order`; 0.1.5-rc.1 added
			// `headerCorner` (the right-sidebar expand button) and, left at the
			// default `order:0`, it tied with the tabs and landed at the far left,
			// where the first tab pill overlapped it. It now trails the utilities
			// block, i.e. sits right of the 中/EN locale toggle.
			{ anchor: ".wSkVaW_root", css: `
.wSkVaW_root{position:relative;background:transparent!important}
.wSkVaW_scrollBody{padding-top:56px}
.wSkVaW_viewArea{padding:0 18px}
.wSkVaW_viewArea{animation:dshome-view-enter .45s ease}
.wSkVaW_header{position:absolute;top:8px;left:24px;right:24px;z-index:5;min-height:36px;padding:4px 12px;display:flex;flex-direction:row;align-items:center;gap:8px;justify-content:flex-start;border:0!important;border-radius:0;background:transparent!important;transition:border-radius .3s ease}
.wSkVaW_header::before{content:"";position:absolute;inset:0;z-index:-1;background:transparent;border:1px solid transparent;border-radius:inherit;-webkit-backdrop-filter:none;backdrop-filter:none;transition:background .3s ease,border-color .3s ease,box-shadow .3s ease}
.wSkVaW_header:hover{border-radius:999px}
.wSkVaW_titleRow{display:contents}
.wSkVaW_titleCluster{display:contents}
.wSkVaW_crumbs{order:2;flex:none;min-width:0}
.wSkVaW_tabs{order:0;flex:none;align-items:center;display:none;gap:8px;margin:0;padding:0}
.wSkVaW_headerActions{order:1;flex:none;align-items:center;display:flex;gap:8px}
.wSkVaW_headerUtilities{order:3;flex:none;align-items:center;display:flex;gap:8px;margin-left:auto}
.wSkVaW_headerCorner{order:4;flex:none;align-items:center;display:flex;margin-left:0;margin-right:0}
.wSkVaW_header.dshome-swap .wSkVaW_tabs{display:flex;animation:dshome-tab-in .22s ease}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_tabs{display:flex!important}
.wSkVaW_header:hover::before{background:rgba(255,255,255,.45);border-color:rgba(0,0,0,.06);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 4px 16px rgba(0,0,0,.05)}
body[data-dshome-dark] .wSkVaW_header:hover::before{background:rgba(13,30,60,.45);border-color:rgba(255,255,255,.1);box-shadow:0 4px 20px rgba(0,0,0,.3)}
.wSkVaW_header:after{display:none!important}
.SVAs4q_label{background:color-mix(in srgb,var(--ds-brand) 10%,transparent)!important;border:1px solid color-mix(in srgb,var(--ds-brand) 22%,transparent);border-radius:999px!important;padding:0 10px!important;height:28px;line-height:26px;color:var(--ds-brand)!important}
body[data-dshome-dark] .SVAs4q_label{color:var(--ds-brand-light)!important}
.wSkVaW_tab{border:1px solid color-mix(in srgb,var(--ds-brand) 25%,transparent);background:color-mix(in srgb,var(--ds-brand) 8%,transparent);border-radius:999px;padding:5px 16px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:16px;font-weight:500;transition:color .2s ease,background .2s ease,transform .2s ease}
.wSkVaW_tab:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--ds-brand) 16%,transparent);transform:translateY(-1px)}
.wSkVaW_tab::after{display:none!important}
.wSkVaW_tabActive{background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-mid));color:#fff;border-color:transparent}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_header:hover{border-radius:0}
.wSkVaW_root:has(.fV0t5q_root) .wSkVaW_header:hover::before{background:transparent;border-color:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}
.wSkVaW_composerSeat{background:transparent!important}
.wSkVaW_header:hover .dshome-locale .dshome-short{max-width:0;opacity:0;transform:translateX(6px)}
.wSkVaW_header:hover .dshome-locale .dshome-full{max-width:3em;opacity:1;transform:none}
/* Header chips: the product's global corner-shape:superellipse(1.5) squares off
   even pill radii, so every control in the bar is restored to a true round end
   (and the session-title crumb, 12px on a 28px box, becomes a real pill). */
.wSkVaW_header .SVAs4q_label,.wSkVaW_header .cubgiG_seat,.wSkVaW_header .CAgGvG_split,.wSkVaW_header .dshome-locale,.wSkVaW_header [data-sidebar-right-expand],.wSkVaW_header .nL4_yW_sessionLogButton,.wSkVaW_header .wSkVaW_crumb{corner-shape:round}
.wSkVaW_header .wSkVaW_crumb{border-radius:999px}
/* Open-in-app split button: hover lift with a brand tint, and the chevron turns
   over while its menu is open. */
.wSkVaW_header .CAgGvG_split{transition:transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s ease,border-color .22s ease,background .22s ease}
.wSkVaW_header .CAgGvG_split:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--ds-brand) 40%,transparent);background:color-mix(in srgb,var(--ds-brand) 8%,transparent);box-shadow:0 4px 14px color-mix(in srgb,var(--ds-brand) 22%,transparent)}
.wSkVaW_header .CAgGvG_split:active{transform:translateY(0) scale(.97)}
.wSkVaW_header .CAgGvG_main,.wSkVaW_header .CAgGvG_chevron{transition:background .22s ease,color .22s ease}
.wSkVaW_header .CAgGvG_split:hover .CAgGvG_main,.wSkVaW_header .CAgGvG_split:hover .CAgGvG_chevron{background:color-mix(in srgb,var(--ds-brand) 12%,transparent);color:var(--ds-brand-deep)}
.wSkVaW_header .CAgGvG_chevron svg{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.wSkVaW_header .CAgGvG_chevron[aria-expanded=true] svg{transform:rotate(180deg)}
body[data-dshome-dark] .wSkVaW_header .CAgGvG_split:hover{border-color:color-mix(in srgb,var(--ds-brand) 52%,transparent);background:color-mix(in srgb,var(--ds-brand) 16%,transparent);box-shadow:0 4px 16px color-mix(in srgb,var(--ds-brand) 30%,transparent)}
body[data-dshome-dark] .wSkVaW_header .CAgGvG_split:hover .CAgGvG_main,body[data-dshome-dark] .wSkVaW_header .CAgGvG_split:hover .CAgGvG_chevron{background:color-mix(in srgb,var(--ds-brand) 24%,transparent);color:#fff}
` },
			// Session-log button (hover expand).
			{ anchor: ".nL4_yW_sessionLogButton", css: `
.nL4_yW_sessionLogButton{min-width:0!important;width:28px;height:28px;padding:0!important;border-radius:50%!important;border:none!important;background:color-mix(in srgb,var(--ds-brand) 8%,transparent)!important;color:var(--ds-brand)!important;overflow:hidden;transition:width .2s ease,padding .2s ease,border-radius .2s ease}
.nL4_yW_sessionLogButton span{max-width:0;opacity:0;overflow:hidden;transition:max-width .2s ease,opacity .2s ease}
.wSkVaW_header:hover .nL4_yW_sessionLogButton{width:auto;padding:0 12px!important;border-radius:18px!important}
.wSkVaW_header:hover .nL4_yW_sessionLogButton span{max-width:90px;opacity:1}
body[data-dshome-dark] .nL4_yW_sessionLogButton{color:var(--ds-brand-light)!important}
` },
			// Glass cards with spinning gradient border — upgraded to liquid glass:
			// specular top edge, saturated blur, brighter inner rim.
			{ anchor: ".uV2eYG_card", css: `
.uV2eYG_card{position:relative;background:rgba(255,255,255,.42)!important;border:1.5px solid rgba(255,255,255,.55)!important;box-shadow:0 8px 32px rgba(13,30,60,.1),inset 0 1px 1px hsla(0,0%,100%,.8);border-radius:22px!important}
body[data-dshome-dark] .uV2eYG_card{background:rgba(13,30,60,.55)!important;border:1.5px solid rgba(255,255,255,.16)!important;box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 1px 1px rgba(255,255,255,.06)}
.uV2eYG_card::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:22px;-webkit-backdrop-filter:blur(28px);backdrop-filter:blur(28px);pointer-events:none}
.uV2eYG_card::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--dsh-border-angle),color-mix(in srgb,var(--ds-brand) 0%,transparent),color-mix(in srgb,var(--ds-brand) 45%,transparent),color-mix(in srgb,var(--ds-brand-light) 20%,transparent),color-mix(in srgb,var(--ds-brand) 45%,transparent),color-mix(in srgb,var(--ds-brand) 0%,transparent));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;pointer-events:none;animation:dsh-border-spin 6s linear infinite;z-index:0}
body[data-dshome-dark] .uV2eYG_card::before{background:conic-gradient(from var(--dsh-border-angle),rgba(255,255,255,0),color-mix(in srgb,var(--ds-brand) 55%,transparent),color-mix(in srgb,var(--ds-brand-light) 25%,transparent),color-mix(in srgb,var(--ds-brand) 55%,transparent),rgba(255,255,255,0))}
.uV2eYG_card>*{position:relative;z-index:1}
.uV2eYG_primary{background:linear-gradient(135deg,var(--ds-brand) 0%,var(--ds-brand-mid) 100%)!important;border:none!important;color:#fff!important;box-shadow:0 4px 14px color-mix(in srgb,var(--ds-brand) 35%,transparent);transition:box-shadow .15s ease,transform .15s ease}
.uV2eYG_primary:hover{box-shadow:0 6px 18px color-mix(in srgb,var(--ds-brand) 45%,transparent);transform:translateY(-1px)}
` },
			// Empty-state headline + preview badge.
			{ anchor: ".pXSMma_headlineText", css: `
.pXSMma_headlineText{font-size:34px;line-height:42px;font-weight:700;letter-spacing:-.01em;background:linear-gradient(120deg,#152443 0%,var(--ds-brand-deep) 55%,var(--ds-brand) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
body[data-dshome-dark] .pXSMma_headlineText{background:linear-gradient(120deg,#fff 0%,var(--ds-brand-light) 60%,var(--ds-brand) 100%);-webkit-background-clip:text;background-clip:text}
.pXSMma_previewBadge{border-radius:999px!important;background:color-mix(in srgb,var(--ds-brand) 10%,transparent)!important;border:1px solid color-mix(in srgb,var(--ds-brand) 25%,transparent)!important;color:var(--ds-brand)!important}
.pXSMma_fish{color:var(--ds-brand)!important}
` },
			// Chat bubbles — liquid glass panes.
			{ anchor: ".gdEzaW_bubble", css: `
.gdEzaW_bubble{background:rgba(255,255,255,.6)!important;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,.05);box-shadow:0 4px 16px rgba(13,30,60,.06)}
body[data-dshome-dark] .gdEzaW_bubble{background:rgba(21,42,86,.65)!important;border:1px solid rgba(255,255,255,.1);box-shadow:0 4px 16px rgba(0,0,0,.25)}
` },
			// Trajectory view bar.
			{ anchor: ".fV0t5q_root", css: `
.fV0t5q_root{background:rgba(255,255,255,.45)!important;border-bottom:1px solid rgba(0,0,0,.06)!important}
body[data-dshome-dark] .fV0t5q_root{background:rgba(13,30,60,.45)!important;border-bottom-color:rgba(255,255,255,.08)!important}
` },
			// Timeline root/plot/span.
			{ anchor: "._1p9O6q_root", css: `
._1p9O6q_root{background:rgba(255,255,255,.3)!important;border-bottom:1px solid rgba(0,0,0,.05)!important}
._1p9O6q_plot{background:transparent!important}
body[data-dshome-dark] ._1p9O6q_root{background:rgba(13,30,60,.3)!important}
._1p9O6q_span[data-timeline-span=assistant]{background:var(--ds-brand)!important}
._1p9O6q_span[data-timeline-span=user]{background:var(--ds-brand-light)!important}
` },
			// Progress panel entrance.
			{ anchor: ".Nqubda_panel", css: `
.Nqubda_panel{animation:dshome-pop-in .25s cubic-bezier(.2,.8,.2,1)}
` },
			// Settings overlay / modal — near-opaque glass with specular edge.
			{ anchor: ".VOzbGW_panel", css: `
.VOzbGW_mask{animation:dshome-fade-in .2s ease}
.VOzbGW_panel{background:rgba(255,255,255,.97)!important;animation:dshome-modal-in .4s cubic-bezier(.2,.8,.2,1)!important}
body[data-dshome-dark] .VOzbGW_panel{background:rgba(13,30,60,.96)!important}
.VOzbGW_overlay{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;inset:0!important}
` }
		];

		/** Append a style tag; returns a disposer that removes it. */
		function injectStyle(css, label) {
			const tag = document.createElement('style');
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = PLUGIN_ID + '/' + label;
			tag.textContent = css;
			document.head.appendChild(tag);
			return () => tag.remove();
		}

		/**
		* Inject `css` only while `anchor` matches the DOM. If the anchor is
		* absent at call time, wait up to 30s for it (covers shells that render
		* after the plugin activates); if it never appears, skip the block and log
		* one diagnostic line instead of shipping dead CSS against a renamed
		* product surface. Returns a disposer for the whole install.
		*/
		function installGuarded(anchor, css) {
			let dispose = null;
			const applyNow = () => {
				if (dispose !== null) return true;
				if (document.querySelector(anchor) === null) return false;
				dispose = injectStyle(css, 'patch' + anchor);
				return true;
			};
			if (applyNow()) {
				return () => { if (dispose !== null) dispose(); };
			}
			let timer = 0;
			let mo = new MutationObserver(() => {
				if (!applyNow()) return;
				mo.disconnect();
				clearTimeout(timer);
			});
			try {
				mo.observe(document.body, { childList: true, subtree: true });
			} catch (error) {
				mo = null;
			}
			timer = setTimeout(() => {
				if (mo !== null) mo.disconnect();
				if (dispose === null) {
					console.info('[' + PLUGIN_ID + '] patch skipped: ' + anchor + ' not found in DOM (product surface renamed?)');
				}
			}, 30000);
			return () => {
				if (mo !== null) mo.disconnect();
				clearTimeout(timer);
				if (dispose !== null) dispose();
			};
		}

		/**
		* Own the light/dark marker: reflect the theme service's active color
		* scheme onto our own `data-dshome-dark` attribute, so dark styling never
		* depends on the product's attribute name. Falls back to mirroring the
		* product attribute only when the theme service or the `theme/change`
		* subscription is unavailable.
		*/
		function createDarkSync(ctx, theme) {
			const apply = () => {
				let dark = false;
				if (theme !== undefined && theme !== null && typeof theme.getTheme === 'function') {
					try {
						const snap = theme.getTheme();
						dark = snap !== undefined && snap !== null &&
							snap.active !== undefined && snap.active !== null &&
							snap.active.colorScheme === 'dark';
					} catch (error) {
						dark = false;
					}
				}
				if (!dark) dark = document.body.hasAttribute('data-ds-dark-theme');
				if (dark) document.body.setAttribute('data-dshome-dark', '');
				else document.body.removeAttribute('data-dshome-dark');
			};
			apply();
			let unsubscribe = null;
			try {
				unsubscribe = ctx.on('theme/change', apply);
			} catch (error) {
				unsubscribe = null;
			}
			let mirror = null;
			if (unsubscribe === null || theme === undefined || theme === null || typeof theme.getTheme !== 'function') {
				try {
					mirror = new MutationObserver(apply);
					mirror.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
				} catch (error) {
					mirror = null;
				}
			}
			return () => {
				if (unsubscribe !== null) unsubscribe();
				if (mirror !== null) mirror.disconnect();
			};
		}

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
			const isDark = () => document.body.hasAttribute('data-dshome-dark');
			const activeColor = () => {
				const c = document.body.getAttribute('data-dshome-color');
				return c === 'red' || c === 'blue' ? c : 'green';
			};
			let running = true;
			let rafId = 0;
			let W = 0;
			let H = 0;
			let dpr = 1;
			const COUNT = 72;
			const parts = [];

			function palette() {
				const dark = isDark();
				const color = activeColor();
				if (color === 'red') {
					return dark ? ['#ff4d4f', '#f5222d', '#ff7875', '#ffa39e', '#ffffff'] : ['#f5222d', '#ff7875', '#ff4d4f', '#ffffff'];
				}
				if (color === 'blue') {
					return dark ? ['#5d79ff', '#4d6bfe', '#8fa8ff', '#ffffff', '#9db9ff'] : ['#4d6bfe', '#73a3d2', '#9db9ff', '#ffffff'];
				}
				return dark ? ['#34d399', '#059669', '#6ee7b7', '#a7f3d0', '#ffffff'] : ['#10b981', '#6ee7b7', '#34d399', '#ffffff'];
			}

			function linkBase() {
				const dark = isDark();
				const color = activeColor();
				if (color === 'red') return dark ? 'rgba(255,77,79,' : 'rgba(245,34,45,';
				if (color === 'blue') return dark ? 'rgba(93,121,255,' : 'rgba(77,107,254,';
				return dark ? 'rgba(52,211,153,' : 'rgba(16,185,129,';
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
				const base = linkBase();
				for (let i = 0; i < parts.length; i++) {
					for (let j = i + 1; j < parts.length; j++) {
						const a = parts[i];
						const b = parts[j];
						const dx = a.x - b.x;
						const dy = a.y - b.y;
						const d2 = dx * dx + dy * dy;
						if (d2 < 14400) {
							const alpha = (1 - Math.sqrt(d2) / 120) * 0.16;
							g.strokeStyle = base + alpha + ')';
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

			const refreshColors = () => {
				const colors = palette();
				for (const p of parts) p.c = colors[(Math.random() * colors.length) | 0];
			};
			const unsubscribeColor = subscribeColor(refreshColors);

			window.addEventListener('resize', resize);
			resize();
			for (let i = 0; i < COUNT; i++) parts.push(make());
			rafId = requestAnimationFrame(step);

			return () => {
				running = false;
				cancelAnimationFrame(rafId);
				window.removeEventListener('resize', resize);
				unsubscribeColor();
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

		/**
		* Add an "Open workspace" entry to the folder row's (workspace row) three-dot
		* menu. The workspace browser renders its row menus internally with no plugin
		* slot, so the theme patches the popup DOM: it tracks the ellipsis anchor of a
		* project row, and when the portaled [role=menu] appears it inserts an item
		* that resolves the row's workspace (title match against the workspaces
		* store, DOM-order fallback) and asks the host half (connection RPC) to open
		* the workspace's directory with the OS file manager in the foreground.
		* The private host channel is the primary reveal path; `workspaces.openPath`
		* is used only when it still exists (dsh ≤0.1.1), and a failed reveal is
		* reported on the console instead of failing silently.
		*/
		function watchWorkspaceMenu(ctx) {
			let workspaces;
			try {
				workspaces = ctx.get('workspaces');
			} catch (error) {
				workspaces = undefined;
			}
			let connection;
			try {
				connection = ctx.get('connection');
			} catch (error) {
				connection = undefined;
			}
			if (workspaces === undefined || workspaces === null || workspaces.list === undefined) return () => {};

			const ROW = '.YDXeBa_projectRow';
			const ACTIONS = '.YDXeBa_rowActions';
			const LABEL = '.YDXeBa_title';
			const CLS = 'dshome-ws-open';
			const FOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';

			let label = '打开工作区';
			try {
				const locale = ctx.get('locale');
				if (locale !== undefined) {
					const active = locale.getLocale().active;
					if (active !== 'zh' && active !== 'zh-CN' && active !== 'zh-Hans') label = 'Open workspace';
				}
			} catch (error) {}

			let anchorRow = null;

			const resolveWorkspace = (row) => {
				try {
					const items = workspaces.list.getSnapshot().items;
					if (!Array.isArray(items)) return undefined;
					const titleEl = row.querySelector(LABEL);
					const labelText = titleEl === null ? '' : (titleEl.textContent || '').trim();
					if (labelText === '') return undefined;
					const byTitle = items.filter((w) => w !== null && w !== undefined && w.title === labelText);
					if (byTitle.length === 1) return byTitle[0];
					const rows = Array.from(document.querySelectorAll(ROW));
					const index = rows.indexOf(row);
					if (index === -1) return undefined;
					let ordinal = 0;
					for (let i = 0; i < index; i++) {
						const t = rows[i].querySelector(LABEL);
						const l = t === null ? '' : (t.textContent || '').trim();
						if (l !== '' && l !== 'Ungrouped') ordinal += 1;
					}
					const candidate = items[ordinal];
					return candidate === undefined || candidate === null ? undefined : candidate;
				} catch (error) {
					return undefined;
				}
			};

			const track = (target) => {
				anchorRow = null;
				if (target === null || typeof target.closest !== 'function') return;
				const button = target.closest('button');
				if (button === null) return;
				const actions = button.closest(ACTIONS);
				if (actions === null) return;
				const row = actions.closest(ROW);
				if (row === null) return;
				if (button !== actions.querySelector('button')) return;
				anchorRow = row;
			};

			const onClickCapture = (event) => track(event.target);
			const onFocusIn = (event) => track(event.target);
			document.addEventListener('click', onClickCapture, true);
			document.addEventListener('focusin', onFocusIn, true);

			const injectItem = (menu) => {
				if (menu === null || menu.querySelector('.' + CLS) !== null) return;
				const viewport = menu.querySelector('[role="presentation"]');
				if (viewport === null) return;
				const row = anchorRow;
				if (row === null || !document.contains(row)) return;
				const workspace = resolveWorkspace(row);
				if (workspace === undefined) return;

				const wrap = document.createElement('div');
				wrap.className = CLS + '-wrap';
				const item = document.createElement('button');
				item.type = 'button';
				item.className = CLS;
				item.setAttribute('role', 'menuitem');
				item.title = label;
				item.setAttribute('aria-label', label);
				const icon = document.createElement('span');
				icon.className = CLS + '-icon';
				icon.innerHTML = FOLDER_SVG;
				const text = document.createElement('span');
				text.className = CLS + '-label';
				text.textContent = label;
				item.appendChild(icon);
				item.appendChild(text);
				item.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					const path = workspace.path;
					// The host bridge is a same-origin webServer route (see bridgeCall).
					const fallback = (reason) => {
						if (typeof workspaces.openPath === 'function') {
							try {
								workspaces.openPath(path);
								return;
							} catch (error) {
								console.warn('[deepseek-style-theme] workspaces.openPath failed:', error);
							}
						}
						console.warn(
							'[deepseek-style-theme] 打开工作区失败（' + reason + '）：' +
							'私有 RPC 通道不可用，且当前 dsh 版本已移除 workspaces.openPath。' +
							'请确认插件为 1.38.4+ 并重启 dsh web（旧版宿主端因缺少 webServer 注入无法注册通道）。'
						);
					};
					Promise.resolve(bridgeCall('dshome/explorer.open', { path: path }))
						.then((result) => {
							if (result !== undefined && result !== null && result.ok === true) return;
							const detail = result !== undefined && result !== null && result.error !== undefined
								? String(result.error.message)
								: 'no result';
							fallback('bridge returned ' + detail);
						})
						.catch((error) => {
							fallback('bridge call threw: ' + (error instanceof Error ? error.message : String(error)));
						});
					try {
						document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
					} catch (error) {}
				});
				wrap.appendChild(item);
				viewport.insertBefore(wrap, viewport.firstChild);
			};

			const observer = new MutationObserver((records) => {
				for (const record of records) {
					for (const node of record.addedNodes) {
						if (!(node instanceof Element)) continue;
						if (node.matches('[role="menu"]')) {
							injectItem(node);
							continue;
						}
						node.querySelectorAll('[role="menu"]').forEach(injectItem);
					}
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });

			return () => {
				observer.disconnect();
				document.removeEventListener('click', onClickCapture, true);
				document.removeEventListener('focusin', onFocusIn, true);
			};
		}

		/**
		* "Running subagents" floating panel. While any subagent-origin session in
		* the sessions list mirror reports `running`, the panel shows every such
		* subagent with live progress: elapsed active time folded from the
		* `subagentTiming` projection (settled + open-turn span), token usage
		* folded from the `tokenUsage` projection, and an indeterminate shimmer
		* bar. Clicking a row opens that subagent session (catalog address when
		* retained, plain open otherwise). Reads only leaf fields of the live
		* list snapshot; every side effect (DOM, subscription, timers) is owned
		* by the returned disposer.
		*/
		function watchRunningSubagents(ctx) {
			let sessions;
			try {
				sessions = ctx.get('sessions');
			} catch (error) {
				sessions = undefined;
			}
			if (
				sessions === undefined || sessions === null ||
				sessions.list === undefined || sessions.list === null ||
				typeof sessions.list.getSnapshot !== 'function' ||
				typeof sessions.list.subscribe !== 'function'
			) {
				return () => {};
			}

			let locale;
			try {
				locale = ctx.get('locale');
			} catch (error) {
				locale = undefined;
			}
			let connection;
			try {
				connection = ctx.get('connection');
			} catch (error) {
				connection = undefined;
			}
			const isZh = () => {
				try {
					if (locale === undefined || locale === null || locale.getLocale === undefined) return true;
					const active = locale.getLocale().active;
					return active === 'zh' || active === 'zh-CN' || active === 'zh-Hans';
				} catch (error) {
					return true;
				}
			};

			const tokenTotal = (usage) => {
				if (usage === undefined || usage === null) return undefined;
				return (
					(Number(usage.uncachedInputTokens) || 0) +
					(Number(usage.outputTokens) || 0) +
					(Number(usage.cacheReadTokens) || 0) +
					(Number(usage.cacheWriteTokens) || 0)
				);
			};
			const formatTokens = (value) => {
				const scaled = (next) => (next >= 100 ? String(Math.round(next)) : String(Math.round(next * 10) / 10));
				if (value < 1000) return String(value);
				if (value < 1e6) return scaled(value / 1e3) + 'K';
				return scaled(value / 1e6) + 'M';
			};
			const formatDuration = (ms) => {
				const total = Math.max(0, Math.floor(ms / 1000));
				const seconds = total % 60;
				const minutes = Math.floor(total / 60) % 60;
				const hours = Math.floor(total / 3600);
				if (isZh()) {
					if (hours > 0) return hours + '小时' + String(minutes).padStart(2, '0') + '分';
					if (minutes > 0) return minutes + '分' + String(seconds).padStart(2, '0') + '秒';
					return seconds + '秒';
				}
				if (hours > 0) return hours + 'h ' + String(minutes).padStart(2, '0') + 'm';
				if (minutes > 0) return minutes + 'm ' + String(seconds).padStart(2, '0') + 's';
				return seconds + 's';
			};
			const runningTitle = (count) => (
				isZh()
					? count + ' 个子代理正在运行'
					: (count === 1 ? '1 subagent running' : count + ' subagents running')
			);

			const styleTag = document.createElement('style');
			styleTag.dataset.plugin = PLUGIN_ID;
			styleTag.dataset.pluginCss = PLUGIN_ID + '/subagent-panel.css';
			styleTag.textContent = SUBAGENT_PANEL_CSS;
			document.head.appendChild(styleTag);

			const CHEVRON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';

			const panel = document.createElement('div');
			panel.className = 'dshome-sa';
			panel.hidden = true;
			panel.setAttribute('role', 'status');
			panel.setAttribute('aria-live', 'polite');

			const head = document.createElement('div');
			head.className = 'dshome-sa-head';
			const pulse = document.createElement('span');
			pulse.className = 'dshome-sa-pulse';
			const titleEl = document.createElement('span');
			titleEl.className = 'dshome-sa-title';
			const collapseBtn = document.createElement('button');
			collapseBtn.type = 'button';
			collapseBtn.className = 'dshome-sa-collapse';
			collapseBtn.innerHTML = CHEVRON_SVG;
			head.appendChild(pulse);
			head.appendChild(titleEl);
			head.appendChild(collapseBtn);

			const listEl = document.createElement('div');
			listEl.className = 'dshome-sa-list';
			panel.appendChild(head);
			panel.appendChild(listEl);
			document.body.appendChild(panel);

			const timingOf = (s) => (
				s.projectionValues === undefined || s.projectionValues === null
					? undefined
					: s.projectionValues.subagentTiming
			);
			const startOf = (s) => {
				const t = timingOf(s);
				const since = t === undefined || t === null || t.active === undefined || t.active === null ? undefined : t.active.since;
				if (typeof since === 'number') return since;
				return typeof s.updatedAt === 'number' ? s.updatedAt : 0;
			};
			const elapsedMs = (s) => {
				const t = timingOf(s);
				if (t === undefined || t === null) return undefined;
				const settled = typeof t.settledMs === 'number' ? t.settledMs : 0;
				const since = t.active === undefined || t.active === null ? undefined : t.active.since;
				if (typeof since !== 'number') return settled;
				return settled + Math.max(0, Date.now() - since);
			};
			const metaText = (s) => {
				const parts = [];
				const elapsed = elapsedMs(s);
				if (elapsed !== undefined) parts.push((isZh() ? '已运行 ' : '') + formatDuration(elapsed));
				const tokens = tokenTotal(
					s.projectionValues === undefined || s.projectionValues === null
						? undefined
						: s.projectionValues.tokenUsage
				);
				if (tokens !== undefined) parts.push(formatTokens(tokens) + ' tok');
				if (parts.length === 0) parts.push(isZh() ? '正在运行…' : 'running…');
				return parts.join(' · ');
			};

			const runningSubagents = () => {
				try {
					const snapshot = sessions.list.getSnapshot();
					if (snapshot === undefined || snapshot === null || snapshot.byId === undefined || snapshot.byId === null) return [];
					const items = [];
					for (const key of Object.keys(snapshot.byId)) {
						const s = snapshot.byId[key];
						if (s === null || s === undefined) continue;
						if (s.running !== true || s.origin !== 'subagent') continue;
						items.push(s);
					}
					items.sort((a, b) => startOf(a) - startOf(b));
					return items;
				} catch (error) {
					return [];
				}
			};

			const openSubagent = (s) => {
				try {
					let address;
					if (typeof sessions.subagentAddress === 'function') address = sessions.subagentAddress(s.id);
					if (address !== undefined && address !== null && typeof sessions.openSubagent === 'function') sessions.openSubagent(address);
					else sessions.open(s.id);
				} catch (error) {
					try { sessions.open(s.id); } catch (inner) {}
				}
			};

			const STOP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="2"/></svg>';

			const stopTitle = () => (isZh() ? '停止此子代理' : 'Stop this subagent');

			const rows = new Map();
			const buildRow = (s) => {
				const item = document.createElement('div');
				item.className = 'dshome-sa-item';
				item.setAttribute('role', 'button');
				item.tabIndex = 0;
				const sweep = document.createElement('span');
				sweep.className = 'dshome-sa-sweep';
				item.appendChild(sweep);
				const dot = document.createElement('span');
				dot.className = 'dshome-sa-dot';
				const body = document.createElement('span');
				body.className = 'dshome-sa-body';
				const name = document.createElement('span');
				name.className = 'dshome-sa-name';
				const meta = document.createElement('span');
				meta.className = 'dshome-sa-meta';
				const bar = document.createElement('span');
				bar.className = 'dshome-sa-bar';
				const fill = document.createElement('span');
				fill.className = 'dshome-sa-bar-fill';
				bar.appendChild(fill);
				body.appendChild(name);
				body.appendChild(meta);
				body.appendChild(bar);
				item.appendChild(dot);
				item.appendChild(body);

				const stopBtn = document.createElement('button');
				stopBtn.type = 'button';
				stopBtn.className = 'dshome-sa-stop';
				stopBtn.innerHTML = STOP_SVG;
				stopBtn.title = stopTitle();
				stopBtn.setAttribute('aria-label', stopTitle());
				stopBtn.addEventListener('click', (event) => stopSubagent(s, stopBtn, event));
				item.appendChild(stopBtn);

				item.addEventListener('click', () => openSubagent(s));
				item.addEventListener('keydown', (event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openSubagent(s);
					}
				});
				return {
					root: item,
					nameEl: name,
					metaEl: meta,
					stopEl: stopBtn,
					sweepEl: sweep,
					summary: s,
					phase: 'running',
					progress: 0,
					stopStart: 0,
					completeStart: 0,
					fillFrom: 0,
					exitTimer: 0
				};
			};

			const deniedTimers = new Set();
			const flashDenied = (btn) => {
				btn.classList.add('dshome-sa-stop-denied');
				const timer = setTimeout(() => {
					deniedTimers.delete(timer);
					btn.classList.remove('dshome-sa-stop-denied');
				}, 1200);
				deniedTimers.add(timer);
			};

			const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
			/**
			* Fake stopping progress: sprint to 80% within the first second,
			* then crawl asymptotically toward 95% — never 100% on its own;
			* termination is what completes the bar.
			*/
			const stoppingProgress = (elapsedSec) => {
				if (elapsedSec <= 1) return 0.8 * easeOutCubic(elapsedSec);
				return Math.min(0.95, 0.8 + 0.15 * (1 - Math.exp(-(elapsedSec - 1) / 3)));
			};

			let sweepRaf = 0;
			const sweepTick = () => {
				const now = performance.now();
				let any = false;
				for (const row of rows.values()) {
					if (row.phase === 'stopping') {
						any = true;
						row.progress = stoppingProgress((now - row.stopStart) / 1000);
						row.sweepEl.style.width = (row.progress * 100).toFixed(2) + '%';
					} else if (row.phase === 'completing') {
						any = true;
						const t = (now - row.completeStart) / 1000;
						if (t < 0.3) {
							const k = easeOutCubic(Math.min(1, t / 0.3));
							row.progress = row.fillFrom + (1 - row.fillFrom) * k;
							row.sweepEl.style.width = (row.progress * 100).toFixed(2) + '%';
						} else if (t < 0.6) {
							row.sweepEl.style.width = '100%';
						} else {
							row.phase = 'exiting';
							row.root.classList.add('dshome-sa-item-exit');
							row.exitTimer = setTimeout(() => {
								row.root.remove();
								rows.delete(row.summary.id);
								syncTicker();
							}, 240);
						}
					}
				}
				if (any) sweepRaf = requestAnimationFrame(sweepTick);
				else sweepRaf = 0;
			};

			const hasStopping = () => {
				for (const row of rows.values()) {
					if (row.phase === 'stopping' || row.phase === 'completing' || row.phase === 'exiting') return true;
				}
				return false;
			};

			const startStopProgress = (row) => {
				row.phase = 'stopping';
				row.progress = 0;
				row.stopStart = performance.now();
				row.root.classList.add('dshome-sa-stopping');
				row.stopEl.classList.remove('dshome-sa-stop-busy');
				row.sweepEl.style.width = '0%';
				if (sweepRaf === 0) sweepRaf = requestAnimationFrame(sweepTick);
			};

			/** Undo the optimistic stopping state when the cancel call is rejected. */
			const rollbackStop = (row, btn) => {
				if (btn !== undefined && btn !== null) {
					btn.disabled = false;
					btn.classList.remove('dshome-sa-stop-busy');
					flashDenied(btn);
				}
				if (row === undefined) return;
				if (rows.get(row.summary.id) !== row) return;
				if (row.phase !== 'stopping') return;
				row.phase = 'running';
				row.progress = 0;
				row.root.classList.remove('dshome-sa-stopping');
				row.sweepEl.style.width = '0%';
			};

			const beginCompleting = (row) => {
				row.phase = 'completing';
				row.completeStart = performance.now();
				row.fillFrom = row.progress;
				if (sweepRaf === 0) sweepRaf = requestAnimationFrame(sweepTick);
			};

			/**
			* Durable parent/child address for the subagents.interrupt RPC.
			* The mode comes from the child's own identity projection; a parent id
			* is required — generic host routing rejects subagent-owned sessions,
			* so the interrupt must ride the address, not sessions.cancel.
			*/
			const addressOf = (s) => {
				const identity = s.projectionValues === undefined || s.projectionValues === null ? undefined : s.projectionValues.subagent;
				let mode = 'continuable';
				if (identity !== undefined && identity !== null && (identity.mode === 'one-shot' || identity.mode === 'continuable')) mode = identity.mode;
				if (typeof s.parentId !== 'string' || s.parentId === '') return undefined;
				return { parentSessionId: s.parentId, childSessionId: s.id, mode };
			};

			const stopSubagent = (s, btn, event) => {
				if (event !== undefined && event !== null) {
					event.preventDefault();
					event.stopPropagation();
				}
				const row = rows.get(s.id);
				if (row !== undefined && row.phase !== 'running') return;
				let face;
				try {
					const binding = sessions.binding(s.id);
					face = binding === undefined || binding === null ? undefined : binding.session;
				} catch (error) {
					face = undefined;
				}
				const address = addressOf(s);
				const api = connection === undefined || connection === null ? undefined : connection.api;
				const canInterrupt = address !== undefined && address.mode === 'continuable' && api !== undefined && api !== null && api.subagents !== undefined && api.subagents !== null && typeof api.subagents.interrupt === 'function';
				const canFaceCancel = face !== undefined && face !== null && typeof face.cancel === 'function';
				if (!canInterrupt && !canFaceCancel) {
					flashDenied(btn);
					return;
				}
				btn.disabled = true;
				// Optimistic feedback: the red line + sweep start the moment the
				// button is pressed; a rejected cancel rolls them back.
				if (row !== undefined) startStopProgress(row);
				let cancelPromise;
				try {
					cancelPromise = canInterrupt
						? Promise.resolve(api.subagents.interrupt(address))
						: Promise.resolve(face.cancel());
				} catch (error) {
					rollbackStop(row, btn);
					return;
				}
				cancelPromise.then((result) => {
					const ok = result !== undefined && result !== null && result.ok === true;
					if (!ok) rollbackStop(row, btn);
				}).catch(() => {
					rollbackStop(row, btn);
				});
			};

			let hideTimer = 0;
			const hide = () => {
				if (panel.hidden || hideTimer !== 0) return;
				panel.classList.add('dshome-sa-leave');
				hideTimer = setTimeout(() => {
					hideTimer = 0;
					panel.hidden = true;
					panel.classList.remove('dshome-sa-leave');
				}, 240);
			};

			let tickTimer = 0;
			const tick = () => {
				if (panel.hidden) return;
				for (const row of rows.values()) {
					if (row.summary.running !== true) continue;
					row.metaEl.textContent = metaText(row.summary);
				}
			};
			const syncTicker = () => {
				if (rows.size > 0 && tickTimer === 0) {
					tickTimer = setInterval(tick, 1000);
				} else if (rows.size === 0 && tickTimer !== 0) {
					clearInterval(tickTimer);
					tickTimer = 0;
				}
			};

			let collapsed = false;
			const updateCollapsed = () => {
				panel.classList.toggle('dshome-sa-collapsed', collapsed);
				const label = collapsed ? (isZh() ? '展开' : 'Expand') : (isZh() ? '收起' : 'Collapse');
				collapseBtn.setAttribute('aria-label', label);
				collapseBtn.title = label;
			};
			collapseBtn.addEventListener('click', () => {
				collapsed = !collapsed;
				updateCollapsed();
			});

			const render = () => {
				const items = runningSubagents();
				const stopping = hasStopping();
				if (items.length === 0 && !stopping) {
					titleEl.textContent = runningTitle(0);
					hide();
					return;
				}
				titleEl.textContent = items.length > 0 ? runningTitle(items.length) : (isZh() ? '正在停止子代理…' : 'Stopping subagent…');
				if (hideTimer !== 0) {
					clearTimeout(hideTimer);
					hideTimer = 0;
				}
				panel.classList.remove('dshome-sa-leave');
				panel.hidden = false;
				const seen = new Set();
				for (const s of items) {
					seen.add(s.id);
					let row = rows.get(s.id);
					if (row === undefined) {
						row = buildRow(s);
						rows.set(s.id, row);
						listEl.appendChild(row.root);
					}
					row.summary = s;
					const name = s.displayTitle || s.id;
					row.nameEl.textContent = name;
					row.root.title = name;
					row.metaEl.textContent = metaText(s);
				}
				for (const entry of Array.from(rows.entries())) {
					const id = entry[0];
					const row = entry[1];
					if (seen.has(id)) continue;
					if (row.phase === 'stopping') {
						beginCompleting(row);
						continue;
					}
					if (row.phase === 'completing' || row.phase === 'exiting') continue;
					row.root.remove();
					rows.delete(id);
				}
				syncTicker();
			};

			const unsubscribe = sessions.list.subscribe(render);
			render();
			updateCollapsed();

			return () => {
				unsubscribe();
				if (sweepRaf !== 0) cancelAnimationFrame(sweepRaf);
				if (tickTimer !== 0) clearInterval(tickTimer);
				if (hideTimer !== 0) clearTimeout(hideTimer);
				for (const row of rows.values()) {
					if (row.exitTimer !== 0) clearTimeout(row.exitTimer);
				}
				for (const timer of deniedTimers) clearTimeout(timer);
				deniedTimers.clear();
				panel.remove();
				styleTag.remove();
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

		// ── DSTT (DeepSeekStyleTheme) settings + peak-hour color driver ──────
		// The host half owns the durable `deepseek-style-theme` settings
		// namespace; the browser half reads/writes one `mode` enum over this
		// plugin's private loopback channel — the settings RPC surface only
		// serves the core's allowlisted namespaces. A shared in-memory mirror
		// feeds the event-chain clock, which checks the Beijing time once, then
		// schedules exactly the next boundary switch — vivid red (鲜红) inside a
		// peak window (Beijing 9:00–12:00, 14:00–18:00), blue or green outside
		// per mode. One-minute granularity (ceiling) per the user's rule.
		const DSTT_NS = "deepseek-style-theme";
		const DSTT_FIELD = "mode";
		const DSTT_MODES = ["peakvalley-redblue", "peakvalley-redgreen", "always-green", "always-blue"];
		const DSTT_LABELS = {
			"peakvalley-redblue": { zh: "峰谷红蓝", en: "Peak R·B" },
			"peakvalley-redgreen": { zh: "峰谷红绿", en: "Peak R·G" },
			"always-green": { zh: "常态绿", en: "Always G" },
			"always-blue": { zh: "常态蓝", en: "Always B" }
		};
		/** DSTT private-channel endpoints (host half in lib/index.js). */
		const DSTT_GET = "dstt.mode.get";
		const DSTT_SET = "dstt.mode.set";
		/** Peak windows, [startHour, endHour), judged in Beijing time (UTC+8). */
		const PEAK_RANGES = [[9, 12], [14, 18]];

		/**
		* Shared in-memory mirror of the durable DSTT mode. The settings domain's
		* RPC only serves allowlisted namespaces, so the mode travels over this
		* plugin's own loopback channel instead; every reader (the color driver,
		* the settings tab) subscribes to this mirror.
		*/
		const dsttState = { mode: "peakvalley-redblue", listeners: new Set() };
		const dsttGetMode = () => dsttState.mode;
		const dsttSubscribe = (listener) => {
			dsttState.listeners.add(listener);
			return () => dsttState.listeners.delete(listener);
		};
		const dsttNotify = () => {
			for (const listener of dsttState.listeners) {
				try { listener(); } catch (e) {}
			}
		};
		/** Path of this plugin's private host bridge (a webServer prefix route). */
		const BRIDGE_PATH = '/dshome-open-workspace';

		/**
		* Call the host bridge. The host half owns a plain `webServer` prefix route
		* (dsh 0.1.5's connection carrier cannot host this plugin's channel without
		* tripping cordis' webServer guard), reached with a same-origin fetch so the
		* browser session authenticates it like any other web-app request. Resolves
		* to the RpcResult-shaped JSON, throws on a transport failure.
		*/
		async function bridgeCall(endpoint, payload) {
			const response = await fetch(BRIDGE_PATH, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ endpoint: endpoint, payload: payload })
			});
			if (!response.ok) throw new Error('bridge http ' + response.status);
			return await response.json();
		}

		/** Pull the durable mode from the host half once. */
		async function dsttSync(ctx) {
			try {
				const result = await bridgeCall(DSTT_GET, {});
				if (result !== undefined && result !== null && result.ok === true && DSTT_MODES.includes(result.value.mode)) {
					dsttState.mode = result.value.mode;
					dsttNotify();
				}
			} catch (error) {}
		}
		/** Persist a mode choice through the host half; resolves with success. */
		async function dsttSetMode(ctx, mode) {
			if (!DSTT_MODES.includes(mode)) return false;
			try {
				const result = await bridgeCall(DSTT_SET, { mode });
				if (result !== undefined && result !== null && result.ok === true && DSTT_MODES.includes(result.value.mode)) {
					dsttState.mode = result.value.mode;
					dsttNotify();
					return true;
				}
			} catch (error) {}
			return false;
		}

		/**
		* Current time shifted onto the Beijing clock. Date#getTime() is already a
		* UTC instant, so Beijing time is exactly `now + 8h` regardless of the
		* machine's own timezone — `getTimezoneOffset()` must NOT be involved
		* (adding it double-counts on UTC+8 machines and reads the wrong hour).
		* Beijing has no DST, so the +8h shift is exact.
		*/
		function beijingNow() {
			return new Date(Date.now() + 8 * 3600000);
		}

		/** Beijing wall-clock HH:MM:SS for logs. */
		function beijingClock(bj) {
			const pad = (n) => String(n).padStart(2, '0');
			return pad(bj.getUTCHours()) + ':' + pad(bj.getUTCMinutes()) + ':' + pad(bj.getUTCSeconds()) + ' (UTC+8)';
		}

		/**
		* Round a Beijing time UP to the next whole minute (ceiling on the second
		* field). One-minute granularity: 12:59:17 reads as 13:00 → valley, and
		* the moment the wall clock hits 14:00 the red takes over; 13:59:30
		* already counts as 14:00 (inside the window) because it rounds up.
		*/
		function ceilToMinute(beijingDate) {
			const rounded = new Date(beijingDate.getTime());
			if (rounded.getUTCSeconds() > 0 || rounded.getUTCMilliseconds() > 0) {
				rounded.setUTCSeconds(0, 0);
				rounded.setUTCMinutes(rounded.getUTCMinutes() + 1);
			}
			return rounded;
		}

		/** Whether a rounded Beijing minute falls inside a peak window. Weekends
		* (Beijing Saturday/Sunday) are entirely off-peak. */
		function isPeakMinute(beijingDate) {
			const day = beijingDate.getUTCDay();
			if (day === 0 || day === 6) return false;
			const hour = beijingDate.getUTCHours();
			return PEAK_RANGES.some(([from, to]) => hour >= from && hour < to);
		}

		/** Next Beijing wall-clock occurrence of `hour` (today if still ahead, else tomorrow). */
		function nextBoundary(beijingDate, hour) {
			const next = new Date(beijingDate.getTime());
			next.setUTCHours(hour, 0, 0, 0);
			if (next.getTime() <= beijingDate.getTime()) next.setUTCDate(next.getUTCDate() + 1);
			return next;
		}

		/** The boundary that ends the peak window `beijingDate` is inside, or null. */
		function endOfWindow(beijingDate) {
			const hour = beijingDate.getUTCHours();
			for (const [from, to] of PEAK_RANGES) {
				if (hour >= from && hour < to) return nextBoundary(beijingDate, to);
			}
			return null;
		}

		/** The earliest future peak-window start, or null if none (defensive). */
		function nextStart(beijingDate) {
			const candidates = PEAK_RANGES
				.map(([from]) => nextBoundary(beijingDate, from))
				.filter((d) => d.getTime() > beijingDate.getTime())
				.sort((a, b) => a - b);
			return candidates.length === 0 ? null : candidates[0];
		}

		/** Color-change listeners (particles, UI re-render on switch). */
		const colorListeners = new Set();
		const subscribeColor = (fn) => {
			colorListeners.add(fn);
			return () => colorListeners.delete(fn);
		};
		const notifyColor = (color) => {
			for (const fn of colorListeners) {
				try { fn(color); } catch (e) {}
			}
		};
		const isTimeSliced = (mode) => mode === "peakvalley-redblue" || mode === "peakvalley-redgreen";
		const colorFor = (mode, peak) => {
			if (mode === "always-blue") return "blue";
			if (mode === "always-green") return "green";
			return peak ? "red" : (mode === "peakvalley-redgreen" ? "green" : "blue");
		};

		/**
		* Color driver — event chain, no polling. On start it checks the
		* Beijing clock once, then schedules exactly the next boundary switch:
		* inside a window → vivid red now, record the delta to the window end,
		* flip back to the valley color when it elapses; outside → valley color,
		* flip to red at the next window start. Toggling the DSTT mode
		* re-anchors immediately; closing the feature tears every timer down. A
		* `visibilitychange` re-anchors the chain from the live clock in case a
		* throttled background tab drifted.
		*/
		function watchPeakHour(ctx) {
			let chainTimer = 0;
			let stopped = false;
			let unsubscribe = null;

			const applyColor = () => {
				if (stopped) return;
				const mode = dsttGetMode();
				const peak = isTimeSliced(mode) && isPeakMinute(ceilToMinute(beijingNow()));
				const color = colorFor(mode, peak);
				if (document.body.getAttribute('data-dshome-color') !== color) {
					document.body.setAttribute('data-dshome-color', color);
					console.info('[' + PLUGIN_ID + '] color -> ' + color + (peak ? ' (peak)' : ' (valley)') + ' @ ' + beijingClock(beijingNow()));
					notifyColor(color);
				}
			};

			const schedule = (ms) => {
				if (chainTimer !== 0) {
					clearTimeout(chainTimer);
					chainTimer = 0;
				}
				// setTimeout caps near 24.8 days; the longest span here (to
				// tomorrow's first window start) is far below that. The +500ms
				// margin re-anchors cleanly across the minute boundary.
				chainTimer = setTimeout(anchor, Math.max(0, ms) + 500);
			};

			/** The single entry point: read the mode + Beijing clock, decide, schedule. */
			const anchor = () => {
				if (stopped) return;
				applyColor();
				const mode = dsttGetMode();
				if (!isTimeSliced(mode)) return;
				const now = ceilToMinute(beijingNow());
				const end = endOfWindow(now);
				if (end !== null) {
					schedule(end.getTime() - now.getTime());
				} else {
					const start = nextStart(now);
					if (start !== null) schedule(start.getTime() - now.getTime());
				}
			};

			const onVisibility = () => {
				if (!document.hidden) anchor();
			};
			document.addEventListener('visibilitychange', onVisibility);

			anchor();

			try { unsubscribe = dsttSubscribe(anchor); } catch (error) { unsubscribe = null; }

			return () => {
				stopped = true;
				if (chainTimer !== 0) clearTimeout(chainTimer);
				if (unsubscribe !== null) unsubscribe();
				document.removeEventListener('visibilitychange', onVisibility);
			};
		}

		/**
		* DSTT settings tab (title: DSTT). Renders the four-way mode picker plus
		* a live status line. Reads/writes the durable namespace through the
		* host-side RPC mirror; every subscription and timer is owned by the
		* component.
		*/
		function DsttSection(props) {
			const dstt = props.dstt;
			const locale = props.locale;
			const [mode, setMode] = React.useState(() => (dstt === undefined ? 'peakvalley-redblue' : dstt.mode()));
			const [active, setActive] = React.useState('zh');
			const [, force] = React.useReducer((x) => x + 1, 0);

			React.useEffect(() => {
				if (locale === undefined) return;
				const sync = () => {
					try { setActive(locale.getLocale().active); } catch (e) {}
				};
				sync();
				return locale.subscribe(sync);
			}, [locale]);

			React.useEffect(() => {
				if (dstt === undefined) return () => {};
				const refresh = () => {
					try { setMode(dstt.mode()); } catch (e) {}
					force();
				};
				let unsubscribe = null;
				try { unsubscribe = dstt.subscribe(refresh); } catch (e) { unsubscribe = null; }
				const unsubscribeColor = subscribeColor(() => force());
				refresh();
				const timer = setInterval(() => {
					force();
				}, 30000);
				return () => {
					clearInterval(timer);
					if (unsubscribe !== null) unsubscribe();
					unsubscribeColor();
				};
			}, [dstt]);

			const isZh = active === 'zh' || active === 'zh-CN' || active === 'zh-Hans';
			const nowMin = ceilToMinute(beijingNow());
			const peakNow = isPeakMinute(nowMin);
			const end = peakNow ? endOfWindow(nowMin) : null;
			const deltaMins = end === null ? 0 : Math.max(0, Math.round((end.getTime() - nowMin.getTime()) / 60000));
			const deltaText = deltaMins <= 0
				? ''
				: isZh
					? (deltaMins >= 60 ? Math.floor(deltaMins / 60) + '小时' + String(deltaMins % 60).padStart(2, '0') + '分' : deltaMins + '分')
					: (deltaMins >= 60 ? Math.floor(deltaMins / 60) + 'h ' + (deltaMins % 60) + 'm' : deltaMins + 'm');
			const colorNow = document.body.getAttribute('data-dshome-color') || 'green';
			const colorName = colorNow === 'red' ? (isZh ? '鲜红' : 'vivid red') : colorNow === 'blue' ? (isZh ? '蓝色' : 'blue') : (isZh ? '绿色' : 'green');
			const timeSliced = isTimeSliced(mode);
			const status = mode === 'always-blue'
				? (isZh ? '固定蓝色模式' : 'Fixed blue')
				: mode === 'always-green'
					? (isZh ? '固定绿色模式' : 'Fixed green')
					: peakNow
						? (isZh ? '高峰时段 · 鲜红' + (deltaText === '' ? '' : ' · 还剩 ' + deltaText) : 'Peak hours · vivid red' + (deltaText === '' ? '' : ' · ' + deltaText + ' left'))
						: (isZh ? '谷时段 · ' + (mode === 'peakvalley-redgreen' ? '绿色' : '蓝色') : 'Off-peak · ' + (mode === 'peakvalley-redgreen' ? 'green' : 'blue'));

			const pickMode = (next) => {
				if (dstt === undefined || next === mode) return;
				dstt.set(next);
			};

			return React.createElement('div', { className: 'dshome-dstt' },
				React.createElement('h3', null,
					'DeepSeekStyleTheme',
					React.createElement('span', { className: 'dshome-dstt-tag' }, 'DSTT')),
				React.createElement('p', null, isZh
					? '谷时段默认绿色；高峰时段（北京时间 9:00–12:00、14:00–18:00，周六周日全天非高峰）自动切换为鲜红提示。峰谷模式可选谷色为蓝或绿，常态模式全天固定。'
					: 'Off-peak green; peak hours (Beijing 9:00–12:00, 14:00–18:00, all day off-peak on weekends) switch to vivid red. Peak/valley modes pick the valley color (blue or green); always modes stay fixed all day.'),
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '主题模式' : 'Theme mode'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '峰谷红蓝 / 峰谷红绿：高峰鲜红、谷时段蓝 / 绿；常态绿 / 常态蓝：全天固定'
							: 'Peak R·B / Peak R·G: red at peak, blue/green at valley; Always G/B: fixed all day')),
					React.createElement('div', { className: 'dshome-dstt-seg', role: 'radiogroup', 'aria-label': isZh ? '主题模式' : 'Theme mode' },
						DSTT_MODES.map((m) => React.createElement('button', {
							key: m,
							type: 'button',
							role: 'radio',
							'aria-checked': mode === m,
							className: 'dshome-dstt-seg-btn' + (mode === m ? ' dshome-on' : ''),
							onClick: () => pickMode(m)
						}, isZh ? DSTT_LABELS[m].zh : DSTT_LABELS[m].en)))),
				React.createElement('div', { className: 'dshome-dstt-status', 'data-peak': timeSliced && peakNow },
					'当前：' + colorName + ' · ' + status));
		}

		function apply(ctx) {
			const stale = document.querySelector('[data-dsh-probe]');
			if (stale !== null) stale.remove();

			// Core styles (ours only) are always injected.
			ctx.effect(() => injectStyle(CORE_CSS, 'theme.css'), 'deepseek-style-theme: core css');
			ctx.effect(() => injectStyle(ACTIONS_CSS, 'actions.css'), 'deepseek-style-theme: actions css');

			const theme = ctx.get('theme');

			// DSTT: the durable mode travels over this plugin's private loopback
			// channel (the settings RPC surface only serves allowlisted
			// namespaces). Pull it once, then let the color driver and the
			// settings tab share the in-memory mirror.
			ctx.effect(() => {
				dsttSync(ctx);
			}, 'deepseek-style-theme: dstt sync');
			ctx.effect(() => watchPeakHour(ctx), 'deepseek-style-theme: color driver');

			// Dark marker: owned attribute driven by the theme service, never by
			// the product's attribute name. Must precede the patch blocks so the
			// dark selectors match from the first paint.
			ctx.effect(() => createDarkSync(ctx, theme), 'deepseek-style-theme: dark sync');

			// Guarded product-surface patches: each block activates only while
			// its anchor class exists in the DOM.
			for (const block of PATCH_BLOCKS) {
				ctx.effect(() => installGuarded(block.anchor, block.css), 'deepseek-style-theme: patch ' + block.anchor);
			}

			if (theme !== undefined) {
				const disposeTokens = theme.overrideTokens('deepseek-style-theme', {
					'--dsw-alias-bg-base': { light: '#f6f7fb', dark: '#0a1a3a' },
					'--dsw-alias-bg-layer-1': { light: 'rgba(255,255,255,0.72)', dark: 'rgba(15,32,66,0.72)' },
					'--dsw-alias-bg-layer-2': { light: 'rgba(255,255,255,0.85)', dark: 'rgba(21,42,86,0.8)' },
					'--dsw-alias-bg-overlay': { light: 'rgba(255,255,255,0.92)', dark: 'rgba(10,26,58,0.94)' },
					'--dsw-alias-border-l1': { light: 'rgba(0,0,0,0.06)', dark: 'rgba(255,255,255,0.08)' },
					'--dsw-alias-border-l2': { light: 'rgba(0,0,0,0.1)', dark: 'rgba(255,255,255,0.14)' },
					'--dsw-alias-brand-primary': { light: 'var(--ds-brand)', dark: 'color-mix(in srgb,var(--ds-brand) 72%,#fff)' },
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
			ctx.effect(() => {
				try { return watchWorkspaceMenu(ctx); } catch (error) { return () => {}; }
			}, 'deepseek-style-theme: workspace open menu');
			ctx.effect(() => {
				try { return watchRunningSubagents(ctx); } catch (error) { return () => {}; }
			}, 'deepseek-style-theme: running subagents panel');

			const slots = ctx.get('slots');
			if (slots !== undefined) {
				slots.inject('conversation.session.header.utilities', () => slots.register(
					{ name: 'conversation.session.header.utilities', id: 'deepseek-locale', order: 90 },
					() => React.createElement(LocaleToggle, { locale: ctx.get('locale') })
				));
				slots.inject('settings.section', () => slots.register({
					name: 'settings.section',
					id: 'dstt',
					order: 100,
					label: () => 'DSTT',
					inject: () => ({
						dstt: {
							mode: dsttGetMode,
							set: (mode) => dsttSetMode(ctx, mode),
							subscribe: dsttSubscribe
						},
						locale: ctx.get('locale')
					})
				}, DsttSection));
			}
		}

		exports.apply = apply;
		exports.inject = ['theme', 'slots', 'locale', 'workspaces', 'connection'];
		return module.exports;
	}
});
