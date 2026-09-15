// The loader requires this bundle to register itself under the id the host asked
// for, and that id is the package NAME of whichever copy is installed -- which is
// not one value during a rename. The package moved from
// @dsh-external/dsh-deepseek-style-theme to the unscoped dsh-deepseek-style-theme
// in 1.43.1, so a profile installed before the rename asks for the old id and one
// installed after asks for the new one. A single hard-coded literal therefore
// breaks whichever half it does not match, and BOTH directions were hit for real,
// one machine each:
//
//   literal old, install new -> "loaded without registering \"dsh-deepseek-style-theme\""
//   literal new, install old -> "loaded without registering \"@dsh-external/...\""
//
// So register under BOTH ids with the same factory: the loader finds the one it
// wants and the other entry is simply never asked for. The registrations are
// guarded individually because a loader might reject an id it did not request,
// and that must not take the working one down with it.
const dshDeepseekStyleThemeFactory = (require) => {
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
		//
		// Markup sinks: `innerHTML` appears exactly five times in this file and
		// every one of them assigns a module-level or call-site `const` SVG
		// literal. It is this file's only markup sink, so anything derived from
		// page data — session titles, file paths, workspace names — must go
		// through `textContent`/`title`/`setAttribute`, never `innerHTML`. An
		// interpolated value there would be DOM XSS.
		const PLUGIN_ID = "dsh-deepseek-style-theme";

		// ─── fluid background + liquid-glass refraction ───────────────────────
		// Ported from dsh-theme-mineradio v2.3.8 (MIT, Copyright (c) 2026 John Wu).
		// See the licence header on the block below; the notice must be preserved.
		// ─────────────────────────────────────────────────────────────────────────────
		// deepseek-style-theme — fluid shader + glass dispersion port
		//
		// The fluid shader (GLSL programs, the WebGL2 ping-pong fluid solver, the
		// pointer/click interaction feeds) and the glass chromatic-dispersion filter
		// plus the specular-highlight cursor parallax below are ported from
		// `dsh-theme-mineradio` v2.3.8 — MIT, Copyright (c) 2026 John Wu.
		// The upstream MIT licence notice MUST be preserved wherever this code ships.
		//
		// Only naming and external dependencies were adapted; the three GLSL shader
		// sources (VERTEX_SHADER / FLOW_SHADER / DISPLAY_SHADER) are copies of
		// upstream, including `#version 300 es` and every in-shader comment, with
		// ONE recorded deviation (2.0.74): `precision mediump float;` became
		// `precision highp float;` in FLOW_SHADER and DISPLAY_SHADER.
		//
		// Why, with the measurements: on an Intel Arc 130V iGPU under ANGLE/D3D11
		// (vs_5_0 ps_5_0) the user saw large tilted squares drifting over the
		// background instead of a smooth wash. ANGLE translates `mediump` to HLSL
		// `min16float`, and Intel's iGPUs implement 16-bit floats natively -- unlike
		// desktop discrete GPUs, which promote mediump to 32-bit and therefore
		// never showed the artifact. The display shader's noise is
		// `fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123)`, which needs
		// roughly 24 bits of mantissa to read as noise; at 16 bits the hash
		// collapses into constant plateaus on the noise lattice, and the lattice
		// cell (~screen/13 here) becomes the visible square. The rotation uniform
		// tilts those cells and u_time slides them, which is exactly what was
		// photographed. WebGL2 (ES 3.00) guarantees highp in fragment shaders, so
		// this is safe on every engine that can run this background at all, and on
		// GPUs that promoted mediump anyway it changes nothing. See
		// THIRD-PARTY-NOTICES.md for the same deviation stated for auditors.
		//
		// External dependencies found in the upstream module and what was done:
		//
		//   INLINED VERBATIM (they sit outside the ported ranges upstream and are
		//   small pure helpers the ported code cannot run without):
		//     • `uv(canvas, clientX, clientY)`          — upstream fluid-interactions.ts
		//                                                 line 916, used by
		//                                                 attachFluidInteractions.
		//     • `hslToRgb01(h, s, l)`                    — upstream glass-dispersion.ts
		//                                                 line 2409, used by tintMatrix.
		//     • `filterMarkup(id, refractId, tintId, map)` — upstream glass-dispersion.ts
		//                                                 line 2443, used by
		//                                                 startGlassDispersion to build
		//                                                 the SVG <filter> pair.
		//     • `closestSpot(target)`, `visualRect(spot)`,
		//       `inside(visual, clientX, clientY)`        — upstream spot-core.ts
		//                                                 lines 1711-1732, used by
		//                                                 startSpecularParallax.
		//
		//   CONSTANTS TAKEN FROM ADJACENT UPSTREAM DECLARATIONS (needed to make the
		//   requested subset self-contained; upstream declares them beside it):
		//     • TINT_ID / REFRACT_ID / TALL_FILTER_ID / TALL_TINT_ID /
		//       TALL_REFRACT_ID / DEFAULT_REF_SCALE / EDGE_DX / TINT_SAT / TINT_LIGHT
		//       — values unchanged, only FILTER_ID's value renamed.
		//     • SPOT_ATTR / SPOT_SELECTOR (upstream spot-core.ts lines 1707-1710)
		//       — renamed to the `dshome-` prefix.
		//
		//   RENAMED (no longer refers to the upstream plugin):
		//     • FILTER_ID            "mineradio-glass-dispersion" → "dshome-glass-dispersion"
		//     • every other SVG filter/tint/refract id → "dshome-glass-dispersion-*"
		//     • ATTR                 "data-dsh-dispersion"        → "data-dshome-dispersion"
		//     • SPOT_ATTR            "data-dsh-aqua-spot"         → "data-dshome-spot"
		//     • SPEC_X / SPEC_Y      --dsh-aqua-spec-x/y          → --dshome-spec-x/y
		//     • console tags         "ui-aqua fluid shader" / "ui-aqua fluid link" →
		//                            "deepseek-style-theme fluid shader" /
		//                            "deepseek-style-theme fluid link"
		//
		//   DELIBERATELY NOT PORTED (upstream settings/theme-store/React layer). Each
		//   was replaced by a parameter or a local default:
		//     • `this.settings.dispersionHue` (dispersionTintHue()) — upstream read the
		//       user's hue knob and an extracted-wallpaper hue. REPLACED by the `hue`
		//       argument of startGlassDispersion({ hue }), defaulting to the upstream
		//       default DEFAULT_TINT_HUE = 44. The caller owns the hue source.
		//     • `this.settings.dispersionRefract` — upstream called
		//       handle.setRefraction(n) on every settings change. The caller now calls
		//       the returned handle's setRefraction(n) itself.
		//     • `this.settings.fluidHue` / `fluidDepth` / `rainbow` / `stationOffset`
		//       and the helper `fluidToneColors()` (upstream line 125) plus
		//       `HUE_BASE` — NONE of these are ported. attachFluidShader takes a
		//       complete params object; SITE_FLUID_PARAMS is exported as the upstream
		//       default (its own three palette colours), so the caller supplies its
		//       own palette by spreading SITE_FLUID_PARAMS and overriding color1..3.
		//     • `this.settings.audioReact` / the mic analyser (createAudioReactivity)
		//       — not ported. The audio coupling survives as the ported handle method
		//       `setAudioLow(level)`; the caller feeds it, or ignores it.
		//     • upstream's React component and the `[data-dsh-aqua-fluid-canvas]` /
		//       `[data-dsh-aqua-ambient]` mount lookups — the caller passes the canvas
		//       element and the { main, mainCanvas } handle explicitly.
		//
		// DOM hooks the ported code still reads (product/platform markup, intentionally
		// NOT renamed): `[data-composer-card]` and `[data-dsh-stats]` inside
		// visualRect(), and the `button` closest-match in attachFluidInteractions.
		//
		// Indentation note: this fragment is tab-indented at a base of 2 tabs to match
		// the target factory body. Line indentation INSIDE the three GLSL template
		// literals is string data and was left exactly as upstream, per the verbatim
		// requirement; tab-indenting those lines would have altered the shipped shader
		// text.
		// ─────────────────────────────────────────────────────────────────────────────

		var SITE_FLUID_PARAMS = {
			mouseRadius: 0.22,
			mouseStrength: 1.1,
			decay: 0.96,
			distortBoost: 1.35,
			noiseBoost: 0,
			swirlBoost: 0.45,
			speed: 14,
			distortion: 20,
			swirl: 12,
			swirlIterations: 8,
			scale: 0.5,
			rotation: -5,
			proportion: 50,
			softness: 100,
			shapeScale: 10,
			offsetX: 0,
			offsetY: 65,
			color1: "#8AA3D6",
			color2: "#FFFFFF",
			color3: "#FFFFFF"
		};
		var VERTEX_SHADER = `#version 300 es
in vec4 a_position;
out vec2 vUv;
void main() {
  vUv = a_position.xy * 0.5 + 0.5;
  gl_Position = a_position;
}
`;
		var FLOW_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D u_prev;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_brushRadius;
uniform float u_brushStrength;
uniform float u_decay;
out vec4 fragColor;

void main() {
  vec4 prev = texture(u_prev, vUv);

  prev.r *= u_decay;
  prev.gb = mix(vec2(0.5), prev.gb, u_decay);

  float dist = distance(vUv, u_mouse);

  float influence = exp(-dist * dist / (u_brushRadius * u_brushRadius * 0.5));
  influence = max(0.0, influence - 0.01);

  float speed = length(u_velocity);
  float presenceStrength = u_brushStrength * 0.3;
  float velBonus = min(speed * 3.0, 0.7) * u_brushStrength;
  float totalStrength = presenceStrength + velBonus;

  prev.r = max(prev.r, influence * totalStrength);
  float blendAmt = influence * min(totalStrength, 0.4) * 0.3;
  prev.g = mix(prev.g, clamp(u_velocity.x * 2.0 + 0.5, 0.0, 1.0), blendAmt);
  prev.b = mix(prev.b, clamp(u_velocity.y * 2.0 + 0.5, 0.0, 1.0), blendAmt);

  fragColor = prev;
}
`;
		var DISPLAY_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1, u_color2, u_color3;
uniform float u_colorCount;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
uniform vec2 u_offset;
uniform sampler2D u_flowmap;
uniform float u_distortBoost;
uniform float u_noiseBoost;
uniform float u_swirlBoost;
out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) { return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }
float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
float noise(vec2 st) {
  vec2 i = floor(st); vec2 f = fract(st);
  float a = random(i), b = random(i + vec2(1,0)), c = random(i + vec2(0,1)), d = random(i + vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

vec3 blend_multi(float mixer, float softness) {
  float edge = 1.0 - softness;
  vec3 col = u_color1.rgb;
  if (u_colorCount > 1.5) { col = mix(col, u_color2.rgb, smoothstep(0.0 + 0.35*edge, 0.7 - 0.35*edge, mixer)); }
  if (u_colorCount > 2.5) { col = mix(col, u_color3.rgb, smoothstep(0.3 + 0.35*edge, 1.0 - 0.35*edge, mixer)); }
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float ns = .0005 + .006 * u_scale;
  uv -= .5; uv *= (ns * u_resolution); uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio; uv += .5; uv += u_offset;

  vec2 fragUV = gl_FragCoord.xy / u_resolution.xy;
  vec4 flow = texture(u_flowmap, fragUV);
  float influence = flow.r;
  vec2 flowDir = (flow.gb - 0.5) * 2.0;

  float n1 = noise(uv + t), n2 = noise(uv*2. - t);
  float angle = n1 * TWO_PI;

  float totalDistortion = u_distortion + influence * u_distortBoost;
  uv.x += 4. * totalDistortion * n2 * cos(angle);
  uv.y += 4. * totalDistortion * n2 * sin(angle);

  uv += flowDir * influence * 0.15;

  if (influence > 0.001) {
    float localNoise = noise(uv * 2.0 + t * 1.5);
    uv += influence * u_noiseBoost * vec2(cos(localNoise * TWO_PI), sin(localNoise * TWO_PI));
  }

  float iters = ceil(clamp(u_swirlIterations, 1., 30.));
  float swirlAmt = clamp(u_swirl, 0., 2.) + influence * u_swirlBoost;
  for (float i = 1.; i <= 30.0; i++) {
    if (i > iters) break;
    uv.x += swirlAmt / i * cos(t + i*1.5*uv.y);
    uv.y += swirlAmt / i * cos(t + i*1.*uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  vec2 cuv = uv * (.5 + 3.5 * u_shapeScale);
  float shape = .5 + .5 * sin(cuv.x) * cos(cuv.y);
  float mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  vec3 col = blend_multi(mixer, clamp(u_softness, 0., 1.));
  fragColor = vec4(col, 1.0);
}
`;
		function hexToRgb(value) {
			const hex = value.replace("#", "");
			return [
				parseInt(hex.slice(0, 2), 16) / 255,
				parseInt(hex.slice(2, 4), 16) / 255,
				parseInt(hex.slice(4, 6), 16) / 255
			];
		}
		function attachFluidShader(canvas, params) {
			const gl = canvas.getContext("webgl2", {
				alpha: true,
				premultipliedAlpha: false,
				powerPreference: "low-power"
			});
			if (gl === null) {
				return {
					setParams: () => {
					},
					stir: () => {
					},
					setAudioLow: () => {
					},
					setRunning: () => {
					},
					dispose: () => {
					}
				};
			}
			const compile = (type, source) => {
				const shader = gl.createShader(type);
				if (shader === null) return null;
				gl.shaderSource(shader, source);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					console.error("deepseek-style-theme fluid shader:", gl.getShaderInfoLog(shader));
					return null;
				}
				return shader;
			};
			const link = (fragment) => {
				const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
				const frag = compile(gl.FRAGMENT_SHADER, fragment);
				if (vertex === null || frag === null) return null;
				const program = gl.createProgram();
				if (program === null) return null;
				gl.attachShader(program, vertex);
				gl.attachShader(program, frag);
				gl.linkProgram(program);
				if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
					console.error("deepseek-style-theme fluid link:", gl.getProgramInfoLog(program));
					return null;
				}
				return program;
			};
			const flowProgram = link(FLOW_SHADER);
			const displayProgram = link(DISPLAY_SHADER);
			if (flowProgram === null || displayProgram === null) {
				return {
					setParams: () => {
					},
					stir: () => {
					},
					setAudioLow: () => {
					},
					setRunning: () => {
					},
					dispose: () => {
					}
				};
			}
			const flow = {
				prev: gl.getUniformLocation(flowProgram, "u_prev"),
				mouse: gl.getUniformLocation(flowProgram, "u_mouse"),
				velocity: gl.getUniformLocation(flowProgram, "u_velocity"),
				brushRadius: gl.getUniformLocation(flowProgram, "u_brushRadius"),
				brushStrength: gl.getUniformLocation(flowProgram, "u_brushStrength"),
				decay: gl.getUniformLocation(flowProgram, "u_decay")
			};
			const display = {
				time: gl.getUniformLocation(displayProgram, "u_time"),
				pixelRatio: gl.getUniformLocation(displayProgram, "u_pixelRatio"),
				resolution: gl.getUniformLocation(displayProgram, "u_resolution"),
				scale: gl.getUniformLocation(displayProgram, "u_scale"),
				rotation: gl.getUniformLocation(displayProgram, "u_rotation"),
				offset: gl.getUniformLocation(displayProgram, "u_offset"),
				color1: gl.getUniformLocation(displayProgram, "u_color1"),
				color2: gl.getUniformLocation(displayProgram, "u_color2"),
				color3: gl.getUniformLocation(displayProgram, "u_color3"),
				colorCount: gl.getUniformLocation(displayProgram, "u_colorCount"),
				proportion: gl.getUniformLocation(displayProgram, "u_proportion"),
				softness: gl.getUniformLocation(displayProgram, "u_softness"),
				shape: gl.getUniformLocation(displayProgram, "u_shape"),
				shapeScale: gl.getUniformLocation(displayProgram, "u_shapeScale"),
				distortion: gl.getUniformLocation(displayProgram, "u_distortion"),
				swirl: gl.getUniformLocation(displayProgram, "u_swirl"),
				swirlIterations: gl.getUniformLocation(displayProgram, "u_swirlIterations"),
				flowmap: gl.getUniformLocation(displayProgram, "u_flowmap"),
				distortBoost: gl.getUniformLocation(displayProgram, "u_distortBoost"),
				noiseBoost: gl.getUniformLocation(displayProgram, "u_noiseBoost"),
				swirlBoost: gl.getUniformLocation(displayProgram, "u_swirlBoost")
			};
			const quadBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
			const bindQuad = (program) => {
				const position = gl.getAttribLocation(program, "a_position");
				gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
				gl.enableVertexAttribArray(position);
				gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
			};
			const makeTarget = (width2, height2, initial2) => {
				const tex = gl.createTexture();
				if (tex === null) throw new Error("deepseek-style-theme fluid: texture allocation failed");
				gl.bindTexture(gl.TEXTURE_2D, tex);
				if (initial2 !== void 0) {
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width2, height2, 0, gl.RGBA, gl.UNSIGNED_BYTE, initial2);
				} else {
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width2, height2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
				}
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				const fbo = gl.createFramebuffer();
				gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				return { fbo, tex };
			};
			let width = 0;
			let height = 0;
			let flowWidth = 0;
			let flowHeight = 0;
			let flip = false;
			let current = { ...params };
			let audioLow = 0;
			const pointer = { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5, vx: 0, vy: 0, svx: 0, svy: 0 };
			const dprCap = Math.min(window.devicePixelRatio || 1, 1.5);
			width = Math.round(canvas.clientWidth * dprCap);
			height = Math.round(canvas.clientHeight * dprCap);
			canvas.width = width;
			canvas.height = height;
			flowWidth = Math.round(width / 4);
			flowHeight = Math.round(height / 4);
			const initial = new Uint8Array(flowWidth * flowHeight * 4);
			for (let i = 0; i < flowWidth * flowHeight; i += 1) {
				initial[4 * i] = 0;
				initial[4 * i + 1] = 128;
				initial[4 * i + 2] = 128;
				initial[4 * i + 3] = 255;
			}
			let targetA = makeTarget(flowWidth, flowHeight, initial);
			let targetB = makeTarget(flowWidth, flowHeight, initial);
			const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
			const ua = navigator;
			const windows = ua.userAgentData ? ua.userAgentData.platform === "Windows" : navigator.userAgent.includes("Windows");
			const onMouseMove = (event) => {
				const rect = canvas.getBoundingClientRect();
				pointer.x = (event.clientX - rect.left) / rect.width;
				pointer.y = 1 - (event.clientY - rect.top) / rect.height;
			};
			// Local adaptation: upstream always feeds the cursor into the flow field
			// (except on touch and Windows). DSTT gates it behind its own
			// `fluidBrush` setting, which ships OFF — the brush is the most
			// expensive part of the simulation and leaves a visible wake trailing
			// the pointer across the whole background.
			if (!coarse && !windows && params.mouseFeed !== false) window.addEventListener("mousemove", onMouseMove);
			const start = performance.now();
			let raf = 0;
			let running = false;
			let previous = 0;
			const step = 1e3 / 30;
			const frame = (now) => {
				raf = requestAnimationFrame(frame);
				if (now - previous < step) return;
				previous = now - (now - previous) % step;
				const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
				const nextWidth = Math.round(canvas.clientWidth * ratio);
				const nextHeight = Math.round(canvas.clientHeight * ratio);
				if (nextWidth > 0 && nextHeight > 0 && (nextWidth !== width || nextHeight !== height)) {
					width = nextWidth;
					height = nextHeight;
					canvas.width = width;
					canvas.height = height;
				}
				const p = current;
				const s = pointer;
				s.svx *= 0.94;
				s.svy *= 0.94;
				s.smoothX += (s.x - s.smoothX) * 0.12;
				s.smoothY += (s.y - s.smoothY) * 0.12;
				s.svx += ((s.x - s.smoothX) * 0.5 - s.svx) * 0.15;
				s.svy += ((s.y - s.smoothY) * 0.5 - s.svy) * 0.15;
				const read = flip ? targetA : targetB;
				const write = flip ? targetB : targetA;
				flip = !flip;
				gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
				gl.viewport(0, 0, flowWidth, flowHeight);
				gl.useProgram(flowProgram);
				bindQuad(flowProgram);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, read.tex);
				gl.uniform1i(flow.prev, 0);
				gl.uniform2f(flow.mouse, s.smoothX, s.smoothY);
				gl.uniform2f(flow.velocity, s.svx, s.svy);
				gl.uniform1f(flow.brushRadius, p.mouseRadius);
				gl.uniform1f(flow.brushStrength, p.mouseStrength);
				gl.uniform1f(flow.decay, p.decay);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.viewport(0, 0, width, height);
				gl.useProgram(displayProgram);
				bindQuad(displayProgram);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, write.tex);
				gl.uniform1i(display.flowmap, 0);
				const time = (performance.now() - start) * 1e-3 * (p.speed * (1 + audioLow * 1.3) / 100);
				gl.uniform1f(display.time, time);
				gl.uniform1f(display.pixelRatio, window.devicePixelRatio || 1);
				gl.uniform2f(display.resolution, width, height);
				gl.uniform1f(display.scale, p.scale);
				gl.uniform1f(display.rotation, p.rotation / 90);
				gl.uniform2f(display.offset, p.offsetX / 100, p.offsetY / 100);
				const c1 = hexToRgb(p.color1 || "#2E58A4");
				const c2 = hexToRgb(p.color2 || "#D2E2EE");
				const c3 = hexToRgb(p.color3 || "#FFFFFF");
				gl.uniform4f(display.color1, c1[0], c1[1], c1[2], 1);
				gl.uniform4f(display.color2, c2[0], c2[1], c2[2], 1);
				gl.uniform4f(display.color3, c3[0], c3[1], c3[2], 1);
				gl.uniform1f(display.colorCount, 3);
				gl.uniform1f(display.proportion, p.proportion / 100);
				gl.uniform1f(display.softness, p.softness / 100);
				gl.uniform1f(display.shape, 0);
				gl.uniform1f(display.shapeScale, p.shapeScale / 100);
				gl.uniform1f(display.distortion, p.distortion / 100);
				gl.uniform1f(display.swirl, p.swirl / 50);
				gl.uniform1f(display.swirlIterations, p.swirlIterations);
				gl.uniform1f(display.distortBoost, p.distortBoost * (1 + audioLow * 0.85));
				gl.uniform1f(display.noiseBoost, p.noiseBoost);
				gl.uniform1f(display.swirlBoost, p.swirlBoost * (1 + audioLow * 0.6));
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			};
			const handle = {
				setParams: (next) => {
					current = { ...next };
					if (!running) {
						frame(performance.now());
						cancelAnimationFrame(raf);
					}
				},
				stir: (x, y, vx, vy) => {
					pointer.x += (x - pointer.x) * 0.35;
					pointer.y += (y - pointer.y) * 0.35;
					pointer.svx += (vx - pointer.svx) * 0.3;
					pointer.svy += (vy - pointer.svy) * 0.3;
				},
				setAudioLow: (level) => {
					audioLow = Math.max(0, Math.min(1, level));
				},
				setRunning: (on) => {
					if (on) {
						if (running) return;
						running = true;
						previous = 0;
						raf = requestAnimationFrame(frame);
						return;
					}
					if (!running) return;
					running = false;
					cancelAnimationFrame(raf);
				},
				dispose: () => {
					cancelAnimationFrame(raf);
					window.removeEventListener("mousemove", onMouseMove);
				}
			};
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				frame(performance.now());
				cancelAnimationFrame(raf);
				return handle;
			}
			running = true;
			raf = requestAnimationFrame(frame);
			return handle;
		}

		// Inlined from upstream `src/client/fluid-interactions.ts` (line 916):
		// canvas-relative pointer position, flipped to GL bottom-left origin.
		function uv(canvas, clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			return {
				x: rect.width <= 0 ? 0.5 : (clientX - rect.left) / rect.width,
				y: rect.height <= 0 ? 0.5 : 1 - (clientY - rect.top) / rect.height
			};
		}
		function attachFluidInteractions(targets) {
			const { main, mainCanvas } = targets;
			const lastStir = /* @__PURE__ */ new WeakMap();
			const ripples = /* @__PURE__ */ new Set();
			const stirButton = (button, strength) => {
				const now = performance.now();
				const previous = lastStir.get(button) ?? 0;
				if (now - previous < 160) return;
				lastStir.set(button, now);
				const rect = button.getBoundingClientRect();
				const point = uv(mainCanvas, rect.left + rect.width / 2, rect.top + rect.height / 2);
				main.stir(point.x, point.y, 0, -strength);
			};
			const ripple = (cx, cy) => {
				const rect = mainCanvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;
				const ux = (cx - rect.left) / rect.width;
				const uy = 1 - (cy - rect.top) / rect.height;
				const start = performance.now();
				const duration = 1500;
				const maxRadius = 120;
				const count = 8;
				const step = () => {
					const t = performance.now() - start;
					if (t > duration) return;
					const k = t / duration;
					const radius = maxRadius * k * k;
					const strength = 0.05 * (1 - k);
					const spin = 0.4 * k;
					for (let i = 0; i < count; i += 1) {
						const angle = i / count * Math.PI * 2 + spin;
						const px = ux + radius * Math.cos(angle) / rect.width;
						const py = uy + radius * Math.sin(angle) / rect.height;
						main.stir(px, py, Math.cos(angle) * strength, -Math.sin(angle) * strength);
					}
					const id2 = requestAnimationFrame(step);
					ripples.add(id2);
				};
				const id = requestAnimationFrame(step);
				ripples.add(id);
			};
			const onPointerOver = (event) => {
				const button = event.target?.closest?.("button");
				if (button !== void 0 && button !== null) stirButton(button, 0.04);
			};
			const onClick = (event) => {
				const button = event.target?.closest?.("button");
				if (button === void 0 || button === null) return;
				const now = performance.now();
				const previous = lastStir.get(button) ?? 0;
				if (now - previous < 500) return;
				lastStir.set(button, now);
				const rect = button.getBoundingClientRect();
				ripple(rect.left + rect.width / 2, rect.top + rect.height / 2);
			};
			document.addEventListener("pointerover", onPointerOver, { capture: true });
			document.addEventListener("click", onClick, { capture: true });
			return () => {
				for (const id of ripples) cancelAnimationFrame(id);
				ripples.clear();
				document.removeEventListener("pointerover", onPointerOver, { capture: true });
				document.removeEventListener("click", onClick, { capture: true });
			};
		}

		// ── glass chromatic dispersion ───────────────────────────────────────
		var FILTER_ID = "dshome-glass-dispersion";
		var TINT_ID = "dshome-glass-dispersion-tint";
		var REFRACT_ID = "dshome-glass-dispersion-refract";
		var TALL_FILTER_ID = "dshome-glass-dispersion-tall";
		var TALL_TINT_ID = "dshome-glass-dispersion-tall-tint";
		var TALL_REFRACT_ID = "dshome-glass-dispersion-tall-refract";
		// Two composer filters: `narrow` (an 8px band) and `wide` (16px).
		//
		// The band is sized by what the user can actually SEE, which is the top and
		// bottom edges: the card's top abuts the 任务 bar and its bottom abuts the
		// status line, so displacing the backdrop across those hard edges shows,
		// while left and right sit over a continuous background where the same
		// displacement changes nothing. The user accepted that asymmetry ("允许左右
		// 无反射"), so these maps are tuned for the VERTICAL band and the horizontal
		// one is left wherever it lands.
		//
		// Vertical band on screen = (edge + softness) / mapHeight * 1.56 * cardHeight
		// -- the filter region is 156% of the surface's height (see filterMarkup) --
		// so at the upstream 400x92 aspect and a 112px-tall card that is 1.90x the
		// map inset: 1.7 + 2.5 gives 8px, 3.4 + 5 gives 16px.
		var COMPOSER_FILTER_ID = "dshome-glass-dispersion-composer";
		var COMPOSER_TINT_ID = "dshome-glass-dispersion-composer-tint";
		var COMPOSER_REFRACT_ID = "dshome-glass-dispersion-composer-refract";
		var WIDE_FILTER_ID = "dshome-glass-dispersion-composer-wide";
		var WIDE_TINT_ID = "dshome-glass-dispersion-composer-wide-tint";
		var WIDE_REFRACT_ID = "dshome-glass-dispersion-composer-wide-refract";
		var COMPOSER_MAP_W = 400;
		var COMPOSER_MAP_H = 92;
		var COMPOSER_MAP_RADIUS = 50;
		var COMPOSER_MAP_EDGE = 1.7;
		var COMPOSER_MAP_SOFTNESS = 2.5;
		var COMPOSER_WIDE_EDGE = 3.4;
		var COMPOSER_WIDE_SOFTNESS = 5;
		// Chromatic aberration, composer filters only. 0.18 splits the base
		// displacement into three: red at 118%, blue at 82%, green in the middle,
		// which is what makes a lens edge fringe instead of merely tinting. Kept to
		// the two composer filters because it triples the displacement passes, and
		// because the shared filters have to keep upstream's exact shape for the
		// frosted recipe.
		var COMPOSER_ABERRATION = 0.18;
		var DEFAULT_REF_SCALE = 60;
		// The liquid recipe drives the same feDisplacementMap harder: at 60 the
		// bend is there but only just legible once the blur sits on top of it, and
		// "you can see the edge refract" is the whole point of that recipe. Kept as
		// a separate constant so the frosted recipe keeps receiving 60.
		var LIQUID_REF_SCALE = 104;
		var EDGE_DX = -14;
		var TINT_OPACITY = 0.45;
		var TINT_SAT = 0.85;
		var TINT_LIGHT = 0.6;
		var DEFAULT_TINT_HUE = 44;
		// Upstream derives the inset from the map's SHORT side (7% of it, halved),
		// which is only uniform if the map is square. The composer passes `edge`
		// instead: one absolute inset for both axes, which comes out uniform as
		// long as the map's aspect matches the filter region's (see COMPOSER_MAP_*).
		// Defaults reproduce upstream's numbers exactly, so the frosted recipe's
		// map stays byte for byte what it was.
		function buildDisplacementMapDataUrl(width = 400, height = 92, radius = 50, edge = null, softness = 11) {
			const w = Math.max(240, Math.round(width));
			const h = Math.max(48, Math.round(height));
			const r = Math.max(12, Math.round(radius));
			const inset = edge === null ? Math.min(w, h) * 0.035 : Math.max(0, edge);
			const innerW = Math.max(1, w - inset * 2);
			const innerH = Math.max(1, h - inset * 2);
			const svg2 = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glass-x" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#f00"/></linearGradient><linearGradient id="glass-y" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#00f"/></linearGradient></defs><rect x="0" y="0" width="${w}" height="${h}" fill="#000"/><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#glass-x)"/><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#glass-y)" style="mix-blend-mode:screen"/><rect x="${inset.toFixed(2)}" y="${inset.toFixed(2)}" width="${innerW.toFixed(2)}" height="${innerH.toFixed(2)}" rx="${r}" fill="hsl(0 0% 50% / 1)" style="filter:blur(${softness})"/></svg>`;
			return `data:image/svg+xml,${encodeURIComponent(svg2)}`;
		}
		// Inlined from upstream `src/client/glass-dispersion.ts` (line 2409) —
		// required by tintMatrix below.
		function hslToRgb01(h, s, l) {
			const hue = (h % 360 + 360) % 360 / 360;
			if (s === 0) return [l, l, l];
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			const channel = (t) => {
				let tt = t;
				if (tt < 0) tt += 1;
				if (tt > 1) tt -= 1;
				if (tt < 1 / 6) return p + (q - p) * 6 * tt;
				if (tt < 1 / 2) return q;
				if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
				return p;
			};
			return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
		}
		function tintMatrix(hue, opacity) {
			const [r, g, b] = hslToRgb01(hue, TINT_SAT, TINT_LIGHT);
			const lr = (0.2126 * opacity).toFixed(4);
			const lg = (0.7152 * opacity).toFixed(4);
			const lb = (0.0722 * opacity).toFixed(4);
			return `0 0 0 0 ${r.toFixed(4)}  0 0 0 0 ${g.toFixed(4)}  0 0 0 0 ${b.toFixed(4)}  ${lr} ${lg} ${lb} 0 0`;
		}
		function supportsSvgBackdropFilter() {
			try {
				const ua = navigator.userAgent || "";
				if (/Safari/.test(ua) && !/Chrome/.test(ua) || /Firefox/.test(ua)) return false;
				const div = document.createElement("div");
				div.style.backdropFilter = `url(#${FILTER_ID})`;
				return div.style.backdropFilter !== "";
			} catch {
				return false;
			}
		}
		// Inlined from upstream `src/client/glass-dispersion.ts` (line 2443) —
		// builds the wide/tall SVG <filter> pair startGlassDispersion injects.
		//
		// `aberration` (0 = off, upstream's shape byte for byte) adds true
		// chromatic aberration: the backdrop is displaced TWICE MORE at slightly
		// different scales, and the result is assembled channel by channel -- R
		// from the stronger displacement, B from the weaker, G from the base. That
		// is what puts a red/blue fringe on a real lens edge; the tinted
		// difference-blend below is only a colour wash and does not separate
		// channels at all.
		//
		// The two extra maps carry a data-aberration factor so setRefraction() can
		// rescale them in step with the base one instead of flattening all three
		// to the same value.
		function filterMarkup(id, refractId, tintId, map, aberration = 0) {
			const chromatic = aberration <= 0 ? '' :
				`<feDisplacementMap data-aberration="${(1 + aberration).toFixed(3)}" in="SourceGraphic" in2="map" scale="${DEFAULT_REF_SCALE}" xChannelSelector="R" yChannelSelector="B" result="refractR"></feDisplacementMap>` +
				`<feDisplacementMap data-aberration="${(1 - aberration).toFixed(3)}" in="SourceGraphic" in2="map" scale="${DEFAULT_REF_SCALE}" xChannelSelector="R" yChannelSelector="B" result="refractB"></feDisplacementMap>` +
				`<feColorMatrix in="refracted" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="onlyG"></feColorMatrix>` +
				`<feColorMatrix in="refractR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="onlyR"></feColorMatrix>` +
				`<feColorMatrix in="refractB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="onlyB"></feColorMatrix>` +
				`<feBlend in="onlyG" in2="onlyR" mode="screen" result="rgMerge"></feBlend>` +
				`<feBlend in="rgMerge" in2="onlyB" mode="screen" result="aberrated"></feBlend>`;
			const merged = chromatic === '' ? 'refracted' : 'aberrated';
			return `<filter id="${id}" color-interpolation-filters="sRGB" x="-12%" y="-28%" width="124%" height="156%"><feImage href="${map}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"></feImage><feDisplacementMap id="${refractId}" in="SourceGraphic" in2="map" scale="${DEFAULT_REF_SCALE}" xChannelSelector="R" yChannelSelector="B" result="refracted"></feDisplacementMap>${chromatic}<feOffset in="${merged}" dx="${EDGE_DX}" dy="0" result="shifted"></feOffset><feBlend in="shifted" in2="${merged}" mode="difference" result="edgeDiff"></feBlend><feColorMatrix id="${tintId}" in="edgeDiff" type="matrix" values="${tintMatrix(DEFAULT_TINT_HUE, TINT_OPACITY)}" result="edgeTint"></feColorMatrix><feBlend in="${merged}" in2="edgeTint" mode="screen" result="output"></feBlend><feGaussianBlur in="output" stdDeviation="0.5"></feGaussianBlur></filter>`;
		}
		/**
		 * Mount the two SVG backdrop filters and set `ATTR` on <html> so the
		 * stylesheet can opt surfaces into the dispersion. Returns a handle whose
		 * `setTint(hue)` / `setRefraction(scale)` accept values from the caller
		 * (upstream read them from its own settings store).
		 * @param {{ hue?: number, refraction?: number }} [options]
		 * @returns {{ setTint: (hue: number) => void, setRefraction: (scale: number) => void, dispose: () => void }}
		 */
		function startGlassDispersion(options) {
			const hue = options !== undefined && typeof options.hue === "number" ? options.hue : DEFAULT_TINT_HUE;
			const root = document.documentElement;
			if (root.hasAttribute(ATTR) || document.getElementById(FILTER_ID) !== null) {
				return { setTint() {
				}, setRefraction() {
				}, dispose() {
				} };
			}
			if (!supportsSvgBackdropFilter()) {
				return { setTint() {
				}, setRefraction() {
				}, dispose() {
				} };
			}
			const mapWide = buildDisplacementMapDataUrl(400, 92, 50);
			const mapTall = buildDisplacementMapDataUrl(92, 400, 50);
			const mapComposer = buildDisplacementMapDataUrl(COMPOSER_MAP_W, COMPOSER_MAP_H, COMPOSER_MAP_RADIUS, COMPOSER_MAP_EDGE, COMPOSER_MAP_SOFTNESS);
			const mapComposerWide = buildDisplacementMapDataUrl(COMPOSER_MAP_W, COMPOSER_MAP_H, COMPOSER_MAP_RADIUS, COMPOSER_WIDE_EDGE, COMPOSER_WIDE_SOFTNESS);
			const markup = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;overflow:hidden"><defs>` + filterMarkup(FILTER_ID, REFRACT_ID, TINT_ID, mapWide) + filterMarkup(TALL_FILTER_ID, TALL_REFRACT_ID, TALL_TINT_ID, mapTall) + filterMarkup(COMPOSER_FILTER_ID, COMPOSER_REFRACT_ID, COMPOSER_TINT_ID, mapComposer, COMPOSER_ABERRATION) + filterMarkup(WIDE_FILTER_ID, WIDE_REFRACT_ID, WIDE_TINT_ID, mapComposerWide, COMPOSER_ABERRATION) + `</defs></svg>`;
			const container = document.createElement("div");
			container.setAttribute("aria-hidden", "true");
			container.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
			container.innerHTML = markup;
			document.body.appendChild(container);
			const tint = container.querySelectorAll("feColorMatrix");
			const refract = container.querySelectorAll("feDisplacementMap");
			root.setAttribute(ATTR, "");
			const handle = {
				setTint(nextHue) {
					const values = tintMatrix(nextHue, TINT_OPACITY);
					tint.forEach((node) => node.setAttribute("values", values));
				},
				setRefraction(scale) {
					// The aberration maps are the same displacement at a slightly
					// different scale, so they carry a factor and are rescaled in step;
					// flattening them all to one value would erase the fringing.
					const base = Math.max(0, Math.min(140, Number(scale) || 0));
					refract.forEach((node) => {
						const factor = Number(node.getAttribute("data-aberration"));
						const value = Number.isFinite(factor) && factor > 0 ? base * factor : base;
						node.setAttribute("scale", String(Math.max(0, Math.min(140, value))));
					});
				},
				dispose() {
					root.removeAttribute(ATTR);
					container.remove();
				}
			};
			if (options !== undefined && typeof options.refraction === "number") handle.setRefraction(options.refraction);
			handle.setTint(hue);
			return handle;
		}

		// ── specular-highlight cursor parallax ───────────────────────────────
		// SPOT_ATTR / SPEC_X / SPEC_Y/ SPOT_SELECTOR renamed to the `dshome-`
		// prefix. The caller decides which elements carry `data-dshome-spot`;
		// declare them as `data-dshome-spot` in the stylesheet/DOM layer.
		var SPOT_ATTR = "data-dshome-spot";
		var SPOT_SELECTOR = `[${SPOT_ATTR}]`;
		var SPEC_X = "--dshome-spec-x";
		var SPEC_Y = "--dshome-spec-y";
		// Inlined from upstream `src/client/spot-core.ts` (lines 1711-1713).
		function closestSpot(target) {
			return target instanceof Element ? target.closest(SPOT_SELECTOR) : null;
		}
		// Inlined from upstream `src/client/spot-core.ts` (lines 1717-1729). The
		// `[data-composer-card]` / `[data-dsh-stats]` selectors are product markup
		// and are deliberately left unrenamed; a mount that lacks them simply
		// falls back to the spot's own border box.
		function visualRect(spot) {
			if (spot.querySelector("[data-composer-card]") !== null) {
				const card = spot.querySelector("[data-composer-card]");
				const r0 = card.getBoundingClientRect();
				const stats = spot.querySelector("[data-dsh-stats]");
				if (stats === null) return r0;
				const r1 = stats.getBoundingClientRect();
				const left = Math.min(r0.left, r1.left);
				const top = Math.min(r0.top, r1.top);
				return new DOMRect(left, top, Math.max(r0.right, r1.right) - left, Math.max(r0.bottom, r1.bottom) - top);
			}
			return spot.getBoundingClientRect();
		}
		// Inlined from upstream `src/client/spot-core.ts` (lines 1730-1732).
		function inside(visual, clientX, clientY) {
			return clientX >= visual.left && clientX <= visual.right && clientY >= visual.top && clientY <= visual.bottom;
		}
		/**
		 * Write normalised cursor coordinates into `--dshome-spec-x` /
		 * `--dshome-spec-y` on the hovered `[data-dshome-spot]` element.
		 * @returns {() => void} disposer that detaches every listener and clears vars.
		 */
		function startSpecularParallax() {
			let current = null;
			let visual = null;
			let raf = 0;
			const clear = () => {
				if (current === null) return;
				current.style.removeProperty(SPEC_X);
				current.style.removeProperty(SPEC_Y);
				current = null;
				visual = null;
			};
			const paint = (clientX, clientY) => {
				if (raf !== 0) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					if (current === null || visual === null) return;
					if (!inside(visual, clientX, clientY)) {
						clear();
						return;
					}
					const sx = Math.min(1, Math.max(-1, (clientX - visual.left) / visual.width * 2 - 1));
					const sy = Math.min(1, Math.max(-1, (clientY - visual.top) / visual.height * 2 - 1));
					current.style.setProperty(SPEC_X, sx.toFixed(4));
					current.style.setProperty(SPEC_Y, sy.toFixed(4));
				});
			};
			const onMove = (event) => {
				const spot = closestSpot(event.target);
				if (spot === null || spot !== current) return;
				paint(event.clientX, event.clientY);
			};
			const onOver = (event) => {
				const spot = closestSpot(event.target);
				if (spot === null) return;
				const rect = visualRect(spot);
				if (!inside(rect, event.clientX, event.clientY)) return;
				current = spot;
				visual = rect;
				paint(event.clientX, event.clientY);
			};
			const onOut = (event) => {
				const spot = closestSpot(event.target);
				if (spot === null || spot !== current) return;
				if (visual !== null && inside(visual, event.clientX, event.clientY)) return;
				clear();
			};
			document.addEventListener("pointermove", onMove, { passive: true });
			document.addEventListener("pointerover", onOver, { passive: true });
			document.addEventListener("pointerout", onOut, { passive: true });
			return () => {
				document.removeEventListener("pointermove", onMove);
				document.removeEventListener("pointerover", onOver);
				document.removeEventListener("pointerout", onOut);
				if (raf !== 0) cancelAnimationFrame(raf);
				clear();
			};
		}

		// ─────────────────────────────────────────────────────────────────────────────
		// PUBLIC API exposed by this fragment (all declarations are inert until called;
		// nothing here runs at load time):
		//
		//   SITE_FLUID_PARAMS : object
		//     Upstream's default fluid parameter set (mouse radius/strength, decay,
		//     distortion, swirl, scale, offsets and three palette colours). Spread it
		//     and override `color1`/`color2`/`color3` (and any knob) to theme the
		//     fluid: `{ ...SITE_FLUID_PARAMS, color1: '#8AA3D6' }`.
		//
		//   attachFluidShader(canvas, params) -> handle
		//     canvas: HTMLCanvasElement in the DOM and sized by CSS. params: a full
		//     parameter object (see SITE_FLUID_PARAMS). Returns:
		//       setParams(next)        -> void  swap params; repaints once if paused
		//       stir(x, y, vx, vy)     -> void  inject a velocity impulse at uv (0..1)
		//       setAudioLow(level)     -> void  0..1 audio boost for speed/boost knobs
		//       setRunning(on)         -> void  start/stop the rAF loop
		//       dispose()              -> void  cancel rAF + drop the mousemove listener
		//     Degrades to no-op methods when WebGL2 is unavailable or a shader fails to
		//     compile/link. Never throws for that reason.
		//
		//   attachFluidInteractions({ main, mainCanvas }) -> dispose
		//     Wires document-level pointerover/click capture so hovering a <button>
		//     nudges the fluid and clicking one emits a ripple. `main` is the handle
		//     from attachFluidShader; `mainCanvas` is the same canvas element passed
		//     there. Returns a () => void that cancels in-flight ripples and detaches
		//     both listeners.
		//
		//   startGlassDispersion(options?) -> { setTint(hue), setRefraction(scale), dispose() }
		//     options: { hue?: number, refraction?: number } — both optional.
		//     `hue` (default 44) tints the dispersion edge; `refraction` (default 60,
		//     clamped 0..140) is the displacement scale. Injects one hidden <svg> with
		//     a wide and a tall filter and sets `data-dshome-dispersion` on <html> so
		//     CSS can apply `backdrop-filter: url(#dshome-glass-dispersion)`. Returns
		//     no-op methods (idempotent, safe to call twice) when the document already
		//     has one or the engine does not support SVG backdrop filters.
		//
		//   startSpecularParallax() -> dispose
		//     Tracks the cursor over any element carrying `data-dshome-spot` and
		//     writes normalised -1..1 coordinates to `--dshome-spec-x` /
		//     `--dshome-spec-y` on that element each animation frame. Requires the
		//     caller to mark spot elements with `data-dshome-spot` (SPOT_ATTR) and to
		//     consume the two custom properties in CSS. Returns a () => void that
		//     detaches all three document listeners, cancels the pending frame and
		//     clears both properties.
		//
		//   hexToRgb(value) -> [r, g, b] (0..1)   — internal helper, exported for reuse.
		//   buildDisplacementMapDataUrl(w?, h?, r?) -> string  — SVG data URL.
		//   tintMatrix(hue, opacity) -> string     — feColorMatrix values string.
		//   supportsSvgBackdropFilter() -> boolean — engine capability probe.
		//   FILTER_ID / TALL_FILTER_ID / ATTR / SPOT_ATTR / SPEC_X / SPEC_Y — the
		//     ids and attribute/var names the shipped CSS must match.
		//
		// Typical mount:
		//   const fluid = attachFluidShader(canvas, { ...SITE_FLUID_PARAMS, color1: c1 });
		//   const stopInteractions = attachFluidInteractions({ main: fluid, mainCanvas: canvas });
		//   const dispersion = startGlassDispersion({ hue: 44, refraction: 60 });
		//   const stopParallax = startSpecularParallax();
		// Typical dispose: stopParallax(); dispersion.dispose(); stopInteractions(); fluid.dispose();
		// ─────────────────────────────────────────────────────────────────────────────

		// CORE_CSS: ours only (`:root` tokens, `html/body`, keyframes, stable
		// `[role=menu]`, `.dshome-*`). No product class names — always injected.
		// Color model: `data-dshome-color` ∈ {green(base), red(鲜红 peak), blue}
		// re-tints every var(--ds-brand*) consumer.
		const CORE_CSS = `
:root{--ds-brand:#059669;--ds-brand-deep:#047857;--ds-brand-mid:#10B981;--ds-brand-light:#34D399;--ds-glass-blur:24px}
html,body{background-color:transparent!important}
/* THE LABEL TOKENS ARE NOT PINNED HERE, AND MUST NOT BE AGAIN.
   A previous attempt at the invisible-text bug declared
   body{--dsw-alias-label-primary:...!important} under our own scheme marker,
   so that background and text could never end up on opposite sides. It did fix
   that, and it broke something worse: those !important declarations outrank the
   PRODUCT's tokens, so when the user switched appearance the product changed its
   own tokens and this stylesheet kept painting the old ones. The UI looked like
   the switch was dead.
   Measured on the real page: with the theme's style tags removed the switch
   works, with them present it does not, and reverting the header z-index changes
   nothing -- i.e. it is this sheet, and it is these declarations.
   The invisible-text hazard stays open on purpose. A stuck appearance switch is
   a broken control; near-white text on a near-white page at least still reads
   once the marker agrees. Do not re-add these two rules. */
body:not([data-dshome-bg=custom]){background:radial-gradient(1200px 700px at 12% -10%,color-mix(in srgb,var(--ds-brand) 14%,transparent),transparent 60%),radial-gradient(1000px 600px at 105% 12%,color-mix(in srgb,var(--ds-brand-light) 16%,transparent),transparent 55%),radial-gradient(900px 700px at 50% 115%,color-mix(in srgb,var(--ds-brand) 10%,transparent),transparent 60%),linear-gradient(180deg,#fbfbfd 0%,#f5f6fa 100%);background-attachment:fixed}
body[data-dshome-color=red]{--ds-brand:#F5222D;--ds-brand-deep:#CF1322;--ds-brand-mid:#FF4D4F;--ds-brand-light:#FF7875}
body[data-dshome-color=blue]{--ds-brand:#4D6BFE;--ds-brand-deep:#3A65C2;--ds-brand-mid:#4176E6;--ds-brand-light:#73A3D2}
body[data-dshome-dark]{--ds-brand:#10B981;--ds-brand-deep:#059669;--ds-brand-mid:#34D399;--ds-brand-light:#6EE7B7}
body[data-dshome-dark]:not([data-dshome-bg=custom]){background:radial-gradient(1100px 650px at 8% -8%,#0a3a28 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#0d4d35 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#06291c 0,transparent 60%),linear-gradient(180deg,#081b14 0%,#0a241a 55%,#081b14 100%);background-attachment:fixed}
body[data-dshome-dark][data-dshome-color=red]{--ds-brand:#FF4D4F;--ds-brand-deep:#F5222D;--ds-brand-mid:#FF7875;--ds-brand-light:#FFA39E}
body[data-dshome-dark][data-dshome-color=red]:not([data-dshome-bg=custom]){background:radial-gradient(1100px 650px at 8% -8%,#5c0f14 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#7d1a20 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#3f0a0e 0,transparent 60%),linear-gradient(180deg,#260709 0%,#330a0d 55%,#260709 100%);background-attachment:fixed}
body[data-dshome-dark][data-dshome-color=blue]{--ds-brand:#5D79FF;--ds-brand-deep:#4D6BFE;--ds-brand-mid:#7A96FF;--ds-brand-light:#9DB9FF}
body[data-dshome-dark][data-dshome-color=blue]:not([data-dshome-bg=custom]){background:radial-gradient(1100px 650px at 8% -8%,#1a3870 0,transparent 62%),radial-gradient(950px 600px at 104% 10%,#2d5f9e 0,transparent 58%),radial-gradient(800px 600px at 50% 118%,#0d1f4a 0,transparent 60%),linear-gradient(180deg,#0a1a3a 0%,#0d1f4a 55%,#0a1a3a 100%);background-attachment:fixed}
/* ── background recipe: 自选背景 ─────────────────────────────────────────
   The custom value never enters this sheet. It arrives as the custom property
   --dshome-custom-bg on <body>, and only after the client's CSS.supports()
   accepted it -- with no data-dshome-customkind attribute these rules do not
   match at all and the recipe's own background stays, so a bad URL cannot
   blank the page. Layer order does the dark scrim: the scrim is the FIRST
   image in the list, so the picture stays visible underneath it. These five
   rules sit after the per-colour body rules above on purpose: same
   specificity, later wins. No backticks in this comment, and none below:
   everything here lives inside a template literal.
   ③ stands down from every background of ours: the per-colour rules above carry
   :not([data-dshome-bg=custom]) for exactly that reason, so nothing here has to
   fight them -- or the wallpaper plugin's own body rules -- with !important.
   What remains is a base layer plus two mutually exclusive bases the client
   picks: FLAT paints pure white in the light scheme and pure black in the dark
   one, which is what ③ shows while nothing else is painting; NONE paints
   nothing at all, which is what it picks while dsh-plugin-wallpaper-engine is
   rendering its own layer (body[data-we-wallpaper]; its .we-layer sits at
   z-index -2, above anything we could put on body). An explicit user value wins
   over both through the kind rules below.
   The three background-COLOR declarations carry !important on purpose: the
   first rule of this sheet sets background-color transparent with !important,
   and an author-important declaration beats any non-important one no matter how
   specific it is -- without it the user's colour (and the two fallback colours)
   silently painted nothing. Image declarations need no !important: that rule
   does not touch background-image. */
body[data-dshome-bg=custom]{background-image:none;background-position:center;background-size:var(--dshome-custom-size,cover);background-repeat:var(--dshome-custom-repeat,no-repeat);background-attachment:fixed}
body[data-dshome-bg=custom][data-dshome-bgbase=flat]{background-color:#ffffff}
body[data-dshome-dark][data-dshome-bg=custom][data-dshome-bgbase=flat]{background-color:#000000}
body[data-dshome-bg=custom][data-dshome-bgbase=none]{background-color:transparent}
body[data-dshome-bg=custom][data-dshome-customkind=color]{background-color:var(--dshome-custom-bg,transparent)!important}
body[data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#f6f7fb!important;background-image:var(--dshome-custom-bg,none)}
body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=color]{background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55))}
body[data-dshome-dark][data-dshome-bg=custom][data-dshome-customkind=image]{background-color:#0b0f17!important;background-image:linear-gradient(rgb(0 0 0/.55),rgb(0 0 0/.55)),var(--dshome-custom-bg,none)}
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
.dshome-dstt-input-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.dshome-dstt-input{flex:1;min-width:0;height:30px;box-sizing:border-box;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;line-height:28px}
.dshome-dstt-input:focus{outline:none;border-color:color-mix(in srgb,var(--ds-brand) 45%,transparent)}
.dshome-dstt-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dshome-dstt-input-state{flex:none;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.dshome-dstt-input-state[data-ok=true]{color:var(--ds-brand)}
.dshome-dstt-input-state[data-ok=false]{color:var(--dsw-alias-state-error-primary)}
.dshome-dstt-seg-row{margin-top:8px;flex-wrap:wrap}
.dshome-dstt-warn{border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 10%,transparent)}
.dshome-dstt-warn .dshome-dstt-row-title{color:var(--dsw-alias-state-warn-primary)}
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
/* Header z-index: the product's column-resize grips (.wSkVaW_widthHandle) are
   40px-wide full-height strips at z-index 8, while this bar sat at 5 — so the
   cursor anywhere inside the title bar's own box turned into col-resize and the
   bar's controls were unreachable. 9 puts the bar above the grips; the grips
   stay grabbable everywhere the bar is not (above y=8, below y=46). */
.wSkVaW_header{position:absolute;top:8px;left:24px;right:24px;z-index:9;min-height:36px;padding:4px 12px;display:flex;flex-direction:row;align-items:center;gap:8px;justify-content:flex-start;border:0!important;border-radius:0;background:transparent!important;transition:border-radius .3s ease}
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
.wSkVaW_tab{border:1px solid color-mix(in srgb,var(--ds-brand) 25%,transparent);background:color-mix(in srgb,var(--ds-brand) 8%,transparent);border-radius:999px;corner-shape:round;padding:5px 16px;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:16px;font-weight:500;transition:color .22s ease,background .22s ease,border-color .22s ease,box-shadow .24s ease,transform .24s cubic-bezier(.2,.8,.2,1)}
.wSkVaW_tab:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--ds-brand) 16%,transparent);border-color:color-mix(in srgb,var(--ds-brand) 42%,transparent);box-shadow:0 4px 12px color-mix(in srgb,var(--ds-brand) 22%,transparent);transform:translateY(-1px)}
.wSkVaW_tab:active{transform:translateY(0) scale(.96)}
.wSkVaW_tab::after{display:none!important}
.wSkVaW_tabActive{background:linear-gradient(135deg,var(--ds-brand),var(--ds-brand-mid));color:#fff;border-color:transparent;box-shadow:0 3px 10px color-mix(in srgb,var(--ds-brand) 26%,transparent);animation:dshome-tab-pop .34s cubic-bezier(.2,.8,.2,1)}
.wSkVaW_tabActive:hover{color:#fff}
body[data-dshome-dark] .wSkVaW_tab{border-color:color-mix(in srgb,var(--ds-brand) 32%,transparent);background:color-mix(in srgb,var(--ds-brand) 14%,transparent)}
body[data-dshome-dark] .wSkVaW_tab:hover{background:color-mix(in srgb,var(--ds-brand) 24%,transparent);box-shadow:0 4px 14px color-mix(in srgb,var(--ds-brand) 34%,transparent)}
body[data-dshome-dark] .wSkVaW_tabActive{box-shadow:0 3px 12px color-mix(in srgb,var(--ds-brand) 40%,transparent)}
@keyframes dshome-tab-pop{0%{transform:translateY(-1px) scale(.88)}60%{transform:translateY(-1px) scale(1.05)}to{transform:none}}
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
.uV2eYG_primary:hover{box-shadow:0 6px 18px color-mix(in srgb,var(--ds-brand) 45%,transparent)}
/* 2.0.80: the hover no longer lifts the button by 1px. That translateY(-1px)
   was ours (it came with the primary-button styling, not from the product), and
   it was the last geometry change this theme made to the send/stop button under
   the cursor -- a 1px surface motion is enough to hand the hover to a neighbour
   or to the column's width handle, which is the same class of loop the composer
   tilt caused (2.0.79). Hover now changes colour and shadow only. The product's
   own hover on this button changes nothing but its background, so nothing else
   moves it. */
` },
			// The conversation scroller must never scroll sideways (2.0.78).
			//
			// Measured on the live page while the user hovered the composer's
			// send button and the small circle: the product's own hover affordance
			// on a message lays its row out wider than the column (scrollWidth 917
			// vs clientWidth 891, overflowing element `span._bubble_...`), which
			// summons an 8 px horizontal scrollbar. That scrollbar reserves 8 px of
			// content height, so the scroll body's content box goes 842 -> 834 and
			// the composer pinned below it shifts up 8 px (card top 699 -> 691);
			// the pointer then sits over a different element, the affordance
			// closes, the scrollbar leaves, the composer drops back -- a ~5 Hz
			// bistable loop reported as "the two buttons flicker and a slider
			// flashes at the bottom". The overflow is upstream's, but the theme can
			// decline to scroll sideways at all: `clip` reserves no scrollbar and
			// keeps each code block's own inner scroller working. The trade is that
			// whatever sticks out past the column edge is clipped instead of
			// scrollable, which in a chat column is the lesser evil -- and this is
			// the guarded-block pattern, so it disappears with the anchor.
			{ anchor: ".wSkVaW_scrollBody", css: `
[class*="scrollBody"]{overflow-x:clip}
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

		// LIQUID GLASS — the "wet glass" recipe, imitated from
		// deepseek-harness-background (MIT, Copyright (c) 2026 HaoyueQin): a
		// translucent fill, a vertical sheen gradient that is brightest along the
		// top edge and gone by ~38%, one shared backdrop chain
		// (blur + saturate + brightness + contrast), an inset top highlight and a
		// hairline ring, with hover only brightening the fill. Every knob is a
		// --dshome-glass-* property so the theme stays one recipe.
		//
		// The specular highlight is composed as an EXTRA background layer rather
		// than a pseudo-element: `--dshome-spec-x/y` (centre-relative, -1..1) are
		// written by startSpecular() on the hovered surface and
		// `--dshome-glass-spec` fades it, so a surface that already spends its
		// ::after on backdrop blur still gets a moving highlight.
		//
		// Refraction is a deliberately narrower layer: `backdrop-filter: url(#…)`
		// with the feDisplacementMap filter from dsh-theme-mineradio bends the
		// backdrop at the edges of the few LARGE surfaces only. Chromium is the
		// only engine that supports an SVG filter inside backdrop-filter and it
		// costs a filter pass per element, so the rule is gated on the
		// `data-dshome-dispersion` attribute that startGlassDispersion() stamps on
		// <html> only where it really mounted — every other browser silently keeps
		// the plain chain.
		const GLASS_CSS = `
:root{
  --dshome-glass-blur:16px;
  --dshome-glass-saturate:1.42;
  --dshome-glass-brightness:1;
  --dshome-glass-contrast:1.01;
  --dshome-glass-sheen:.14;
  --dshome-glass-sheen-mid:.05;
  --dshome-glass-edge:rgba(255,255,255,.62);
  --dshome-glass-edge-low:rgba(255,255,255,.14);
  --dshome-glass-ring:rgba(255,255,255,.34);
  --dshome-glass-shadow:0 12px 40px rgba(0,0,0,.12);
  --dshome-glass-spec:0;
}
body[data-dshome-dark]{
  --dshome-glass-sheen:.16;
  --dshome-glass-sheen-mid:.06;
  --dshome-glass-edge:rgba(255,255,255,.30);
  --dshome-glass-edge-low:rgba(255,255,255,.07);
  --dshome-glass-ring:rgba(255,255,255,.18);
  --dshome-glass-shadow:0 14px 44px rgba(0,0,0,.45);
}
html .hHd-Xa_root::before,
html .uV2eYG_card::after,
html .gdEzaW_bubble,
html .fV0t5q_root,
html [data-composer-card],
html .VOzbGW_panel,
html .dshome-sa,
html .dshome-file-menu{
  background-image:
    radial-gradient(340px circle at calc(50% + var(--dshome-spec-x,0) * 50%) calc(50% + var(--dshome-spec-y,0) * 50%), rgb(255 255 255 / calc(var(--dshome-glass-spec) * .30)), transparent 62%),
    linear-gradient(180deg, rgba(255,255,255,var(--dshome-glass-sheen)), rgba(255,255,255,var(--dshome-glass-sheen-mid)) 38%, rgba(255,255,255,.01))!important;
  -webkit-backdrop-filter:blur(var(--dshome-glass-blur)) saturate(var(--dshome-glass-saturate)) brightness(var(--dshome-glass-brightness)) contrast(var(--dshome-glass-contrast))!important;
  backdrop-filter:blur(var(--dshome-glass-blur)) saturate(var(--dshome-glass-saturate)) brightness(var(--dshome-glass-brightness)) contrast(var(--dshome-glass-contrast))!important;
  box-shadow:inset 0 1px 0 var(--dshome-glass-edge),inset 0 -1px 0 var(--dshome-glass-edge-low),inset 0 0 0 .5px var(--dshome-glass-ring),var(--dshome-glass-shadow);
  transition:background-color .18s ease,box-shadow .18s ease;
}
/* The specular layer is multiplied by --dshome-glass-spec, so it has to be
   switched on: while the cursor is over a spot surface the highlight follows
   --dshome-spec-x/y (written per element by startSpecularParallax). */
html [data-dshome-spot]:hover{--dshome-glass-spec:1;}
html [data-composer-card]:hover{--dshome-glass-spec:1;--dshome-glass-sheen:.12;}
html .gdEzaW_bubble:hover,html .dshome-sa:hover,html .dshome-file-menu:hover{
  background-color:rgb(255 255 255 / calc(var(--dshome-glass-sheen) + .16))!important;
}
body[data-dshome-dark] .gdEzaW_bubble:hover,
body[data-dshome-dark] .dshome-sa:hover,
body[data-dshome-dark] .dshome-file-menu:hover{
  background-color:rgb(255 255 255 / calc(var(--dshome-glass-sheen) + .06))!important;
}
html[data-dshome-dispersion] .hHd-Xa_root::before,
html[data-dshome-dispersion] .gdEzaW_bubble,
html[data-dshome-dispersion] .VOzbGW_panel{
  -webkit-backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-glass-blur)) saturate(var(--dshome-glass-saturate))!important;
  backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-glass-blur)) saturate(var(--dshome-glass-saturate))!important;
}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  html .hHd-Xa_root::before,html .uV2eYG_card::after,html .gdEzaW_bubble,html [data-composer-card],html .VOzbGW_panel,html .dshome-sa,html .dshome-file-menu{
    background-color:rgba(255,255,255,.86)!important;
  }
  body[data-dshome-dark] .hHd-Xa_root::before,
  body[data-dshome-dark] .uV2eYG_card::after,
  body[data-dshome-dark] .gdEzaW_bubble,
  body[data-dshome-dark] [data-composer-card],
  body[data-dshome-dark] .VOzbGW_panel,
  body[data-dshome-dark] .dshome-sa,
  body[data-dshome-dark] .dshome-file-menu{
    background-color:rgba(13,30,60,.92)!important;
  }
}
`;

		/** Append a style tag; returns a disposer that removes it. */
		function injectStyle(css, label) {
			const tag = document.createElement('style');
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = PLUGIN_ID + '/' + label;
			tag.textContent = css;
			document.head.appendChild(tag);
			return () => tag.remove();
		}

		// LIQUID GLASS — the second recipe, selected by the durable `glassStyle`
		// setting and gated entirely on `html[data-dshome-glass="liquid"]`. The
		// frosted block above is deliberately left byte-identical: switching the
		// setting back has to reproduce the look the user approved, so every rule
		// in here is additive and nothing above is edited.
		//
		// What makes it "liquid" rather than "frosted":
		//   * the fill drops from a .42 white wash to a barely-there .10, and the
		//     top sheen from .14 to .07, so the pane reads as glass over the fluid
		//     rather than as a white card;
		//   * the backdrop chain leans on saturation (1.75) instead of brightness,
		//     which is what makes the colours behind the pane bloom;
		//   * the shared feDisplacementMap runs at a much larger scale (see
		//     LIQUID_REF_SCALE below), so the edge refraction is actually visible;
		//   * a conic-gradient highlight sweeps the perimeter on its own, driven by
		//     a registered <angle> property rather than by the pointer.
		//
		// Surfaces: exactly the four the user named — the sidebar shell, the
		// composer, the title bar and the user's own messages. Refraction is one
		// SVG filter pass per element in Chromium, so nothing else is added.
		//
		// The sweep lives on ::after because the product has already claimed
		// ::before on the sidebar and the title bar (measured, not assumed); the
		// composer claims both, which is why its edge highlight stays the
		// brand-tinted conic border the patch block already animates.
		// A user-authored message is not one flow kind but two: the message that
		// opens a turn is `data-chat-flow-kind="user"`, and a note typed while the
		// agent is already working is `"steering"`. Measured on the current build,
		// a transcript can contain ONLY steering bubbles — anchoring the selector
		// on "user" alone silently skipped every bubble on the page.
		//
		// The second half covers the gap the user hit: a message typed while the
		// agent is still working is painted in the transcript BEFORE it is picked
		// up, and at that moment it sits outside any flow-kind container, so the
		// two anchored selectors miss it and it renders unglazed until the turn
		// consumes it. Rather than enumerate the container it lands in, this side
		// takes any bubble that is NOT part of an assistant step — which is the
		// only place a bubble must not be glassed.
		const LIQUID_BUBBLE = ':is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]) [class*="bubble" i],[class*="bubble" i]:not([data-chat-flow-kind="assistant-step"] *)';
		const LIQUID_CSS = `
@property --dshome-liquid-sweep{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes dshome-liquid-sweep{from{--dshome-liquid-sweep:0deg}to{--dshome-liquid-sweep:360deg}}
html[data-dshome-glass="liquid"]{
  --dshome-liquid-blur:11px;
  --dshome-liquid-saturate:1.75;
  --dshome-liquid-brightness:1.05;
  --dshome-liquid-contrast:1.02;
  --dshome-liquid-fill:rgb(255 255 255 / .14);
  /* The sidebar is the largest pane on screen, so a fill that reads as "barely
     there" on the composer leaves it washed out against the fluid; it carries a
     little more body of its own, and more of it again in light mode where the
     pane has to read as white glass rather than as tinted fluid. */
  --dshome-liquid-fill-sidebar:rgb(255 255 255 / .30);
  /* The sidebar is the boundary with the conversation pane, and it blurs harder
     than everything else on purpose: at the shared 11px the flow behind it stays
     legible and the pane never separates from the transcript. */
  --dshome-liquid-blur-sidebar:24px;
  /* The composer blurs less than the rest on purpose. Filters in a backdrop
     chain apply left to right, so url(refract) followed by blur(N) blurs the
     refraction AFTER it happens: a band narrower than about the blur radius is
     simply erased. At 11px the purpose-built ~4px band was invisible, which is
     exactly what was reported. 8px lets a ~10px band read while still frosting
     the backdrop. */
  --dshome-liquid-blur-composer:8px;
  /* One extra veil on top of the sidebar's glass. The pane sits over the fluid
     at roughly the same tone as the conversation it borders, so without this
     lift the two read as one surface. It is white in light mode. */
  --dshome-liquid-veil-sidebar:rgb(255 255 255 / .18);
  --dshome-liquid-sheen:.07;
  --dshome-liquid-edge:rgba(255,255,255,.60);
  --dshome-liquid-edge-low:rgba(255,255,255,.10);
  --dshome-liquid-ring:rgba(255,255,255,.26);
  --dshome-liquid-sweep-hi:rgba(255,255,255,.85);
  --dshome-liquid-sweep-lo:rgba(255,255,255,.28);
  --dshome-liquid-shadow:0 18px 54px rgba(9,20,44,.16);
}
body[data-dshome-dark]{
  --dshome-liquid-fill:rgb(255 255 255 / .07);
  /* Night mode goes the other way: the pane is a dark slab over a dark flow, so
     it is tinted towards the shell colour instead of towards white — dark
     enough to read as black glass, light enough to keep the flow visible. */
  --dshome-liquid-fill-sidebar:rgb(6 14 32 / .32);
  /* Night mode's veil is BLACK, the same idea inverted: a dark pane over a dark
     flow is lifted off it by deepening the pane, not by washing it grey. */
  --dshome-liquid-veil-sidebar:rgb(0 0 0 / .22);
  --dshome-liquid-sheen:.05;
  --dshome-liquid-edge:rgba(255,255,255,.34);
  --dshome-liquid-edge-low:rgba(255,255,255,.05);
  --dshome-liquid-ring:rgba(255,255,255,.14);
  --dshome-liquid-sweep-hi:rgba(255,255,255,.55);
  --dshome-liquid-sweep-lo:rgba(255,255,255,.16);
  --dshome-liquid-shadow:0 20px 60px rgba(0,0,0,.5);
}
/* The title bar is deliberately NOT always-on: the user's note on it is
   "rounded corners, and only once the mouse is over it" — the header becomes a
   pill on :hover (the patch block already sets border-radius:999px, and
   ::before inherits it), so the glass is scoped to that same hover state
   instead of turning the strip into a permanent bar. */
/* The selectors carry an extra body step on purpose. The patch blocks are
   injected lazily when their anchor appears — later than this sheet — and their
   dark variants (body[data-dshome-dark] .uV2eYG_card) tie with a
   html[attr] .surface selector on specificity, at which point source order
   hands the pane back to the old fill. The extra type selector breaks the tie. */
html[data-dshome-glass="liquid"] body .hHd-Xa_root::before,
html[data-dshome-glass="liquid"] body [data-composer-card],
html[data-dshome-glass="liquid"] body .wSkVaW_header:hover::before,
html[data-dshome-glass="liquid"] body ${LIQUID_BUBBLE}{
  background-color:var(--dshome-liquid-fill)!important;
  background-image:
    radial-gradient(360px circle at calc(50% + var(--dshome-spec-x,0) * 50%) calc(50% + var(--dshome-spec-y,0) * 50%), rgb(255 255 255 / calc(var(--dshome-glass-spec) * .24)), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,var(--dshome-liquid-sheen)), rgba(255,255,255,.015) 34%, rgba(255,255,255,0))!important;
  -webkit-backdrop-filter:blur(var(--dshome-liquid-blur)) saturate(var(--dshome-liquid-saturate)) brightness(var(--dshome-liquid-brightness)) contrast(var(--dshome-liquid-contrast))!important;
  backdrop-filter:blur(var(--dshome-liquid-blur)) saturate(var(--dshome-liquid-saturate)) brightness(var(--dshome-liquid-brightness)) contrast(var(--dshome-liquid-contrast))!important;
  box-shadow:inset 0 1px 0 var(--dshome-liquid-edge),inset 0 -1px 0 var(--dshome-liquid-edge-low),inset 0 0 0 .5px var(--dshome-liquid-ring),var(--dshome-liquid-shadow)!important;
}
/* The composer is the one surface the old recipe paints TWICE: the patch block
   blurs .uV2eYG_card::after (and the frosted list paints it too), and the card
   itself is in both lists, so the backdrop was blurred twice over — which is what
   turned the pane into a smear. Under liquid the card element IS the glass, so
   the redundant layer is switched off rather than re-tuned. */
html[data-dshome-glass="liquid"] [data-composer-card]::after{
  -webkit-backdrop-filter:none!important;
  backdrop-filter:none!important;
  background-image:none!important;
  box-shadow:none!important;
}
/* The frosted recipe gives the composer a brand-tinted conic ring, painted by
   the patch block at inset:-1px and spun by dsh-border-spin. Under liquid the
   user asked for it to go: it sits one pixel OUTSIDE the card's own 1.5px white
   border, so the pair reads as a coloured line with a white line outside it, and
   two competing edges is what liquid glass is not. content:none removes the
   pseudo-element outright rather than painting it transparent. */
html[data-dshome-glass="liquid"] body [data-composer-card]::before{
  content:none!important;
  background:none!important;
  animation:none!important;
}
/* With the ring gone the card's own 1.5px white border is the only edge left,
   and on its own it reads as a flat white outline rather than as glass — which
   is what the user saw next. Liquid's edge is the inset hairline plus the
   refraction, so the border goes transparent. The WIDTH stays: removing it
   would resize the box and shift every control inside by 3px. */
html[data-dshome-glass="liquid"] body [data-composer-card]{
  border-color:transparent!important;
}
/* The sidebar pane carries its own fill and its own shape: rounded only on the
   edge that faces the conversation, so it reads as a panel clipped to the
   window rather than as a full-bleed column. The hairline ring in the shared
   box-shadow above follows the radius. */
html[data-dshome-glass="liquid"] body .hHd-Xa_root::before{
  background-color:var(--dshome-liquid-fill-sidebar)!important;
  border-radius:0 22px 22px 0;
  /* The veil rides on top of the two layers the shared rule sets, so the
     sidebar keeps its cursor-follow highlight and its sheen underneath. */
  background-image:
    linear-gradient(var(--dshome-liquid-veil-sidebar),var(--dshome-liquid-veil-sidebar)),
    radial-gradient(360px circle at calc(50% + var(--dshome-spec-x,0) * 50%) calc(50% + var(--dshome-spec-y,0) * 50%), rgb(255 255 255 / calc(var(--dshome-glass-spec) * .24)), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,var(--dshome-liquid-sheen)), rgba(255,255,255,.015) 34%, rgba(255,255,255,0))!important;
}
/* The message bubble is the one surface that is not already positioned. */
html[data-dshome-glass="liquid"] ${LIQUID_BUBBLE}{
  position:relative;
  transition:background-color .18s ease,box-shadow .18s ease;
}
/* The composer leans under the cursor (see startComposerTilt). The transition
   is what turns the release into a settle rather than a snap: the ported
   routine writes the neutral transform back and only drops the inline
   properties 240ms later. */
html[data-dshome-glass="liquid"] [data-composer-card]{
  transition:transform .24s cubic-bezier(.2,.8,.2,1),background-color .18s ease,box-shadow .18s ease!important;
  will-change:transform;
}
html[data-dshome-glass="liquid"] ${LIQUID_BUBBLE}:hover{
  background-color:rgb(255 255 255 / .18)!important;
}
body[data-dshome-dark] ${LIQUID_BUBBLE}:hover{
  background-color:rgb(255 255 255 / .10)!important;
}
html[data-dshome-glass="liquid"] body .hHd-Xa_root::after{
  border-radius:0 22px 22px 0;
}
/* The travelling edge highlight. mask-composite:exclude turns the filled
   conic gradient into a 1px perimeter band; padding:1px on the pseudo-element
   sets that band's width without touching the product's box model.
   It is drawn on the SIDEBAR ONLY. The user asked for it off the composer and
   off the message bubbles under liquid: on a small pill the band reads as a
   bright white outline rather than as light travelling a glass edge, and on the
   composer it doubled up with the card's own border. The bubbles and the
   composer keep liquid's other three marks — the translucent fill, the sheen
   and the refraction. */
html[data-dshome-glass="liquid"] .hHd-Xa_root::after{
  content:"";position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;
  padding:1px;
  background:conic-gradient(from var(--dshome-liquid-sweep),
    var(--dshome-liquid-sweep-lo) 0deg,var(--dshome-liquid-sweep-hi) 22deg,var(--dshome-liquid-sweep-lo) 64deg,
    rgba(255,255,255,.05) 140deg,var(--dshome-liquid-sweep-hi) 190deg,rgba(255,255,255,.05) 248deg,
    var(--dshome-liquid-sweep-lo) 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude;
  animation:dshome-liquid-sweep 6.5s linear infinite;
}
/* The composer's edge refraction. Three states, selected by the durable
   composerRefraction setting (see html[data-dshome-composer]):
     narrow (default) -- an 8px band top and bottom
     wide             -- a 16px band top and bottom
     off              -- no dispersion at all
   Left and right are left as they fall: the band is there, but over a
   continuous background a horizontal displacement has nothing to show, which
   the user accepted. */
html[data-dshome-dispersion][data-dshome-glass="liquid"] body .wSkVaW_header:hover::before,
html[data-dshome-dispersion][data-dshome-glass="liquid"] body ${LIQUID_BUBBLE}{
  -webkit-backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-liquid-blur)) saturate(var(--dshome-liquid-saturate))!important;
  backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-liquid-blur)) saturate(var(--dshome-liquid-saturate))!important;
}
html[data-dshome-dispersion][data-dshome-glass="liquid"][data-dshome-composer="narrow"] body [data-composer-card]{
  -webkit-backdrop-filter:url(#dshome-glass-dispersion-composer) blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
  backdrop-filter:url(#dshome-glass-dispersion-composer) blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
}
html[data-dshome-dispersion][data-dshome-glass="liquid"][data-dshome-composer="wide"] body [data-composer-card]{
  -webkit-backdrop-filter:url(#dshome-glass-dispersion-composer-wide) blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
  backdrop-filter:url(#dshome-glass-dispersion-composer-wide) blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
}
html[data-dshome-dispersion][data-dshome-glass="liquid"][data-dshome-composer="off"] body [data-composer-card]{
  -webkit-backdrop-filter:blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
  backdrop-filter:blur(var(--dshome-liquid-blur-composer)) saturate(var(--dshome-liquid-saturate))!important;
}
/* The workspace list is faded out at its bottom by a gradient whose end stop is
   the sidebar-fill token — an OPAQUE colour matched to the product's own sidebar
   background. Over a translucent glass pane that stop no longer matches what is
   actually behind it, so the fade shows up as a lighter band above 设置 (the
   user's red box). The pane itself already separates the list from the
   conversation, so the fade is dropped. Scoped to the sidebar and to the
   product's own <hash>_fade naming so nothing else is touched. */
html[data-dshome-glass="liquid"] body .hHd-Xa_root [class*="_fade" i]{
  background-image:none!important;
}
/* The sidebar's own, heavier blur. Written after the two rules above because it
   ties with the dispersion one on specificity and so has to come later. */
html[data-dshome-glass="liquid"] body .hHd-Xa_root::before{
  -webkit-backdrop-filter:blur(var(--dshome-liquid-blur-sidebar)) saturate(var(--dshome-liquid-saturate)) brightness(var(--dshome-liquid-brightness)) contrast(var(--dshome-liquid-contrast))!important;
  backdrop-filter:blur(var(--dshome-liquid-blur-sidebar)) saturate(var(--dshome-liquid-saturate)) brightness(var(--dshome-liquid-brightness)) contrast(var(--dshome-liquid-contrast))!important;
}
html[data-dshome-dispersion][data-dshome-glass="liquid"] body .hHd-Xa_root::before{
  -webkit-backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-liquid-blur-sidebar)) saturate(var(--dshome-liquid-saturate))!important;
  backdrop-filter:url(#dshome-glass-dispersion) blur(var(--dshome-liquid-blur-sidebar)) saturate(var(--dshome-liquid-saturate))!important;
}
/* Backdrop blur, switched off by the durable backdropBlur setting. Each glass
   recipe reads its radius from a variable, so turning the frosting off is one
   0px per variable -- the translucency, the sheen and the edge refraction all
   stay exactly as they were. Written with a body step so it also out-ranks the
   html[data-dshome-glass] block the liquid radii are declared in. */
html[data-dshome-blur="off"],
html[data-dshome-blur="off"] body{
  --dshome-glass-blur:0px;
  --dshome-liquid-blur:0px;
  --dshome-liquid-blur-sidebar:0px;
  --dshome-liquid-blur-composer:0px;
}
@media (prefers-reduced-motion:reduce){
  html[data-dshome-glass="liquid"] .hHd-Xa_root::after{
    animation:none;
  }
}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  html[data-dshome-glass="liquid"] body .hHd-Xa_root::before,
  html[data-dshome-glass="liquid"] body [data-composer-card],
  html[data-dshome-glass="liquid"] body .wSkVaW_header:hover::before,
  html[data-dshome-glass="liquid"] body ${LIQUID_BUBBLE}{
    background-color:rgba(255,255,255,.86)!important;
  }
  body[data-dshome-dark] .hHd-Xa_root::before,
  body[data-dshome-dark] [data-composer-card],
  body[data-dshome-dark] .wSkVaW_header:hover::before,
  body[data-dshome-dark] ${LIQUID_BUBBLE}{
    background-color:rgba(13,30,60,.92)!important;
  }
}
`;

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
			/** Last value we wrote to the body; null until the first apply(). */
			let lastDark = null;
			/**
			* Scheme-change listeners. The dark marker is a marker only if someone
			* reads it: the stylesheet matches on it, and the ambient background reads
			* it for its palette (see startAmbient). A listener that throws must not
			* cost the others their update, so each call is boxed.
			*/
			const darkListeners = new Set();
			const notifyDark = (dark) => {
				for (const fn of darkListeners) {
					try { fn(dark); } catch (error) {}
				}
			};
			const apply = () => {
				let dark = false;
				// Two signals, and BOTH of them lie in some state -- measured, not
				// assumed:
				//   * the theme service reported `light` while the page was in dark
				//     mode, so treating it as the only source painted a dark page light;
				//   * `data-ds-dark-theme` was still on <body> after a switch back to
				//     light, so treating IT as authoritative painted a light page dark.
				// This is the precedence that shipped through 1.43.1 and behaved in both
				// modes: ask the service first, and let the product's own attribute
				// override a "not dark" answer. Keep it, and sanity-check the signal
				// before touching it again.
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
				// Remember what we actually put on the body, so a later apply() that
				// lands on the same answer does not wake the background up for
				// nothing. `lastDark` is null until the first write.
				const changed = lastDark !== dark;
				lastDark = dark;
				if (dark) document.body.setAttribute('data-dshome-dark', '');
				else document.body.removeAttribute('data-dshome-dark');
				// Publish the write. The marker is what EVERY dark rule and the fluid
				// palette read, so a light/dark switch that only set the attribute left
				// the background on the scheme it was mounted with -- reported as
				// "切到深色背景还是蓝白".
				if (changed) notifyDark(dark);
			};
			let unsubscribe = null;
			try {
				unsubscribe = ctx.on('theme/change', apply);
			} catch (error) {
				unsubscribe = null;
			}
			// Always mirror the product's attribute, not only when the theme service
			// is missing: this is the self-healing half. A missed `theme/change`
			// used to leave the marker stale until the next reload.
			let mirror = null;
			try {
				mirror = new MutationObserver(apply);
				mirror.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
			} catch (error) {
				mirror = null;
			}
			return {
				/**
				* Subscribe to light/dark *writes*. Nothing is replayed on subscribe:
				* a reader that needs the current value reads the attribute (or calls
				* dshomeDark()), which keeps one source of truth.
				*/
				subscribe: (fn) => {
					darkListeners.add(fn);
					return () => darkListeners.delete(fn);
				},
				dispose: () => {
					darkListeners.clear();
					if (unsubscribe !== null) unsubscribe();
					if (mirror !== null) mirror.disconnect();
				}
			};
		}

		/**
		* Own the glass-recipe marker: mirror the durable `glassStyle` choice onto
		* <html data-dshome-glass>, which is the single switch the stylesheet gates
		* the liquid recipe on. The attribute is set before the first paint with the
		* default (`liquid`), so the only flicker is the one a user who picked
		* `frosted` sees during the initial loopback round trip.
		*/
		function createGlassSync(ctx) {
			const root = document.documentElement;
			const apply = () => {
				root.setAttribute('data-dshome-glass', dsttGetGlass());
				root.setAttribute('data-dshome-composer', dsttGetComposer());
				root.setAttribute('data-dshome-blur', dsttGetBlur() ? 'on' : 'off');
			};
			apply();
			const unsubscribe = dsttSubscribe(apply);
			return () => {
				unsubscribe();
				root.removeAttribute('data-dshome-glass');
				root.removeAttribute('data-dshome-composer');
				root.removeAttribute('data-dshome-blur');
			};
		}

		/**
		* Own the background-recipe markers. `data-dshome-bg` sits on <body>, next
		* to `data-dshome-color` and `data-dshome-dark`, and it has to: the custom
		* rules below must out-rank the per-colour body rules, and an attribute on
		* <html> would leave them one attribute short of a specificity tie.
		*
		* The custom value travels as `--dshome-custom-bg` on the same element,
		* together with `data-dshome-customkind` (colour vs image) and, for a
		* wallpaper, the two sizing variables. Nothing else writes them. The value
		* is validated before it is stamped: `CSS.supports` decides, so the browser
		* keeps owning CSS validity and this file never parses CSS by hand. With no
		* kind attribute the stylesheet's custom rules do not match at all and the
		* recipe's own background stays -- an unusable value must never leave a
		* blank page behind. Properties are set with `setProperty`, never by
		* building a rule, so no value can escape into the stylesheet.
		*
		* An EMPTY box means "use my desktop wallpaper" (2.0.75), and so does the
		* literal `desktop`: a page cannot read the system wallpaper, so the host
		* half resolves it and this asks for it over the same channel. Until that
		* answer lands -- and if the machine shows no wallpaper image, or the host
		* predates the endpoint -- the recipe's own background simply stays, so an
		* empty box can never produce a blank page.
		*/
		function createBackgroundSync() {
			const apply = () => {
				const body = document.body;
				if (body === null || body === undefined) return;
				const recipe = dshomeBackground();
				body.setAttribute('data-dshome-bg', recipe);
				const stored = dsttGetCustomBackground().trim();
				// `desktop` is the explicit opt-in for the Windows wallpaper. An EMPTY
				// box is not the same thing (2.0.76): empty means "paint nothing of
				// mine" -- a flat white/black base, or nothing at all while the
				// wallpaper plugin is painting.
				const wantsDesktop = stored.toLowerCase() === 'desktop';
				if (recipe === 'custom' && wantsDesktop && dsttState.wallpaper.state === 'idle') dsttLoadWallpaper();
				const wallpaper = dsttState.wallpaper;
				// Between the two bases. `data-dshome-bgbase` is what the stylesheet
				// keys on; see the CORE_CSS block for why the wallpaper plugin's marker
				// decides it rather than us stacking colours.
				const pluginPaints = recipe === 'custom' && body.hasAttribute(WE_ACTIVE_ATTR);
				if (recipe === 'custom') body.setAttribute('data-dshome-bgbase', pluginPaints ? 'none' : 'flat');
				else body.removeAttribute('data-dshome-bgbase');
				const chosen = wantsDesktop ? (wallpaper.state === 'ready' ? wallpaper.value : '') : stored;
				const kind = recipe === 'custom' && chosen !== '' ? backgroundKind(chosen) : null;
				if (kind === null) {
					body.removeAttribute('data-dshome-customkind');
					body.style.removeProperty('--dshome-custom-bg');
					body.style.removeProperty('--dshome-custom-size');
					body.style.removeProperty('--dshome-custom-repeat');
					return;
				}
				body.setAttribute('data-dshome-customkind', kind);
				body.style.setProperty('--dshome-custom-bg', normalizeBackgroundValue(chosen));
				// Windows' own WallpaperStyle decides how the picture fills the screen,
				// so the page matches the desktop: 10 fill and 22 span -> cover, 6 fit
				// -> contain, 2 stretch -> 100% 100%, 0 centre -> auto; `tile` repeats.
				if (kind === 'image' && wantsDesktop && wallpaper.state === 'ready' && wallpaper.kind === 'image') {
					body.style.setProperty('--dshome-custom-size', wallpaper.style === 6 ? 'contain' : wallpaper.style === 2 ? '100% 100%' : wallpaper.style === 0 ? 'auto' : 'cover');
					body.style.setProperty('--dshome-custom-repeat', wallpaper.tile ? 'repeat' : 'no-repeat');
				} else {
					body.style.removeProperty('--dshome-custom-size');
					body.style.removeProperty('--dshome-custom-repeat');
				}
			};
			apply();
			const unsubscribe = dsttSubscribe(apply);
			// dsh-plugin-wallpaper-engine sets and clears its marker at runtime, so
			// watching it is what lets ③ flip between the flat base and letting the
			// plugin's layer through without a reload. Notify (rather than apply) so
			// the settings panel's status text follows along too.
			let pluginMirror = null;
			try {
				pluginMirror = new MutationObserver(() => dsttNotify());
				pluginMirror.observe(document.body, { attributes: true, attributeFilter: [WE_ACTIVE_ATTR] });
			} catch (error) {
				pluginMirror = null;
			}
			return () => {
				unsubscribe();
				if (pluginMirror !== null) pluginMirror.disconnect();
				const body = document.body;
				if (body === null || body === undefined) return;
				body.removeAttribute('data-dshome-bg');
				body.removeAttribute('data-dshome-bgbase');
				body.removeAttribute('data-dshome-customkind');
				body.style.removeProperty('--dshome-custom-bg');
				body.style.removeProperty('--dshome-custom-size');
				body.style.removeProperty('--dshome-custom-repeat');
			};
		}

		/**
		* A bare URL is what people actually type -- the panel's own placeholder
		* offers `https://…/bg.jpg` first -- but neither `background-color` nor
		* `background-image` accepts one: the value has to be a `url()` token. So a
		* URL-shaped value is wrapped here, once, before it is either probed or
		* stamped; without this the panel would reject the very form it advertises.
		* Quotes and backslashes inside the URL are escaped and line breaks dropped,
		* since either would end the token early.
		*/
		function normalizeBackgroundValue(value) {
			if (typeof value !== 'string') return '';
			const text = value.trim().replace(/[\r\n]+/g, '');
			if (text === '') return '';
			if (/^(?:https?:|data:|file:|\/\/)/i.test(text) && !/^url\(/i.test(text)) {
				return 'url("' + text.replace(/[\\"]/g, (ch) => '\\' + ch) + '")';
			}
			return text;
		}

		/**
		* `image` for anything the browser accepts as a background image (a url(),
		* a gradient, an image-set), `color` for a plain colour, `null` when there
		* is nothing usable. The image test runs first because `background-image`
		* rejects a bare colour while `background-color` accepts only colours --
		* asking in the other order would call `url(x.png)` a colour and drop it.
		*/
		function backgroundKind(value) {
			const text = normalizeBackgroundValue(value);
			if (text === '') return null;
			const looksLikeImage = /(?:url|image|gradient)\(/i.test(text);
			try {
				if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return looksLikeImage ? 'image' : null;
				if (looksLikeImage) return CSS.supports('background-image', text) ? 'image' : null;
				if (CSS.supports('background-color', text)) return 'color';
				if (CSS.supports('background-image', text)) return 'image';
			} catch (error) {
				return null;
			}
			return null;
		}

		/**
		* Fluid palettes, one per background recipe (DSTT_BACKGROUNDS). The display
		* shader blends all three colours across the noise field and the eye reads
		* the average, so what a recipe is *for* is decided by those three numbers.
		*
		* `classic` is what shipped through 1.43.11, byte for byte: a soft lead,
		* pure white and a near-white tint of the same hue. The user's own words
		* for it were "按钮绿，背景绿，下午三点的时候一切正常，好看" -- one family,
		* no second hue anywhere -- and it is the default again, because the mixing
		* they objected to came from the palette below, not from this one.
		*
		* `bold` is the 1.43.12 three-chroma set, kept selectable on request
		* ("不好看，可以保留"). Averages: blue 67,122,226 / red 219,78,87 /
		* green 40,164,115.
		*/
		const FLUID_COLORS_CLASSIC = {
			green: { light: ['#4FBE92', '#FFFFFF', '#D6F2E4'], dark: ['#1F6B4E', '#061423', '#0E3A2A'] },
			blue: { light: ['#5E82DE', '#FFFFFF', '#D8E2FA'], dark: ['#2C4A9E', '#050F26', '#122A5C'] },
			red: { light: ['#D4797F', '#FFFFFF', '#FAD6D8'], dark: ['#8E2F36', '#1A0A0D', '#40141A'] }
		};
		const FLUID_COLORS_BOLD = {
			green: { light: ['#0FA76A', '#5FCB9E', '#0B7A52'], dark: ['#0A5C3A', '#0E7A4E', '#03130C'] },
			blue: { light: ['#1E6FE8', '#7FA8F5', '#2B57C9'], dark: ['#0B2E7A', '#123B8F', '#050A18'] },
			red: { light: ['#E23A44', '#F08A90', '#C02630'], dark: ['#8A1520', '#5E0F16', '#140507'] }
		};
		/**
		* The two-colour recipe (`white`): the classic soft lead plus pure white,
		* i.e. the user's 白蓝 / 黑蓝 rule with the near-white dropped. The shader
		* still takes three uniforms, so the third repeats the second: exactly two
		* colours participate, white carrying two thirds of the field. The dark end
		* reuses each family's near-black from the classic set rather than one
		* shared grey, so 黑蓝 stays blue-black and 黑红 stays red-black.
		*/
		const FLUID_LEADS = {
			green: { light: '#4FBE92', dark: '#1F6B4E' },
			blue: { light: '#5E82DE', dark: '#2C4A9E' },
			red: { light: '#D4797F', dark: '#8E2F36' }
		};
		const FLUID_SECOND = {
			green: { light: '#FFFFFF', dark: '#061423' },
			blue: { light: '#FFFFFF', dark: '#050F26' },
			red: { light: '#FFFFFF', dark: '#1A0A0D' }
		};
		/** Edge-tint hue for the glass dispersion, following the DSTT colour. */
		const FLUID_HUES = { green: 152, blue: 221, red: 356 };

		/** The chosen background recipe; an unknown id reads as the default. */
		function dshomeBackground() {
			const value = dsttState.backgroundMode;
			return DSTT_BACKGROUNDS.includes(value) ? value : DSTT_BACKGROUND_DEFAULT;
		}

		/**
		* The three colours the display shader blends, for the current recipe and
		* the current colour token. `custom` never lands here: that recipe has no
		* canvas at all (see the ambient controller in apply()). Classic is what it
		* would fall back to if it ever did.
		*/
		function fluidTriple() {
			const color = dshomeColor();
			const scheme = dshomeDark() ? 'dark' : 'light';
			const recipe = dshomeBackground();
			if (recipe === 'white') {
				const second = FLUID_SECOND[color][scheme];
				return [FLUID_LEADS[color][scheme], second, second];
			}
			if (recipe === 'bold') return FLUID_COLORS_BOLD[color][scheme];
			return FLUID_COLORS_CLASSIC[color][scheme];
		}

		/** The active DSTT colour token. */
		function dshomeColor() {
			const value = document.body.getAttribute('data-dshome-color');
			return value === 'red' || value === 'blue' ? value : 'green';
		}
		function dshomeDark() {
			return document.body.hasAttribute('data-dshome-dark');
		}
		/** The whole fluid parameter set for the current DSTT colour and scheme. */
		function dshomeFluidParams() {
			const pick = fluidTriple();
			// `mouseFeed` is ours, not upstream's: false keeps the cursor from
			// writing a wake into the flow field (see the DSTT `fluidBrush` setting).
			return { ...SITE_FLUID_PARAMS, color1: pick[0], color2: pick[1], color3: pick[2], mouseFeed: dsttBrush() };
		}
		/** The durable `fluidBrush` preference; off unless the host reports it on. */
		function dsttBrush() {
			try {
				return dsttState.fluidBrush === true;
			} catch (error) {
				return false;
			}
		}
		/** WebGL2 is probed on a throwaway canvas so the real one keeps its context. */
		function supportsWebgl2() {
			try {
				const probe = document.createElement('canvas');
				const gl = probe.getContext('webgl2');
				if (gl === null) return false;
				const lose = gl.getExtension('WEBGL_lose_context');
				if (lose !== null) lose.loseContext();
				return true;
			} catch (error) {
				return false;
			}
		}
		/**
		* Mark glass surfaces as specular spots. The ported startSpecularParallax
		* only tracks elements carrying the spot attribute, and stamping it on
		* pointerover avoids writing attributes onto product elements that React
		* re-renders. Registered before the parallax listener so the stamp lands on
		* the same event the parallax handler then reads.
		*/
		/**
		* Specular spot surfaces: the composer card, the sidebar shell and the
		* user's own messages. The transcript pane and the centre column are
		* deliberately NOT spots — a cursor-following highlight across that much
		* empty area reads as a large white patch sliding over the background.
		*
		* The message bubble is matched through the product's own
		* `data-chat-flow-kind="user"` marker rather than a class name: the hashed
		* `.gdEzaW_bubble` this list used to carry matches nothing on the current
		* build, which is how the old entry went dead without anyone noticing.
		*/
		const SPOT_SURFACES = `${LIQUID_BUBBLE},.uV2eYG_card,.dshome-sa,.dshome-file-menu,.hHd-Xa_root,[data-composer-card]`;
		function startSpecularSpotter() {
			const onOver = (event) => {
				const target = event.target;
				if (target === null || typeof target.closest !== 'function') return;
				const surface = target.closest(SPOT_SURFACES);
				if (surface === null) return;
				if (surface.getAttribute(SPOT_ATTR) === null) surface.setAttribute(SPOT_ATTR, '');
			};
			document.addEventListener('pointerover', onOver, true);
			return () => document.removeEventListener('pointerover', onOver, true);
		}

		// ── composer hover tilt ───────────────────────────────────────────────
		// Ported from dsh-theme-mineradio's `startSpotlight` tilt branch (MIT,
		// Copyright (c) 2026 John Wu), including its constants: the pane lifts by
		// scale(1.01) and leans up to TILT_MAX radians towards whichever side the
		// cursor is on, about its own centre, under an 800px perspective. The
		// cursor-relative offsets are the same half-range clamp, and the release
		// writes the neutral transform first and only drops the inline properties
		// SETTLE_MS later, so the stylesheet's transition animates the return
		// instead of snapping.
		//
		// Only the composer is tiltable here. mineradio tilts every spot it owns;
		// in this theme the other spots are the sidebar shell and the transcript's
		// message bubbles, where a whole-column lean reads as a bug rather than as
		// depth. It is also gated on the liquid recipe, because the frosted pane is
		// meant to stay observably identical to what shipped before.
		const TILT_SELECTOR = '[data-composer-card],.uV2eYG_card';
		const TILT_MAX = 0.0175;
		const TILT_PERSPECTIVE = 800;
		// 2.0.79: 1.01 -> 1. Measured on the live page, the lift grew the card from
		// 757 to 765 px under a stationary cursor (8 px, the same amount the
		// horizontal scrollbar used to steal), and that was enough to flip the
		// element under the pointer between the composer's own controls and the
		// column's width handle; each flip re-armed or released the tilt, giving an
		// ~8 Hz hover loop the user reported as "the buttons flicker". The lean
		// itself (the two rotations) stays: it moves things by ~1 px instead of 8.
		const TILT_SCALE = 1;
		const TILT_SETTLE_MS = 240;
		/**
		* Interactive controls inside the card must never sit on a surface that
		* moves: the pointer being over a control is exactly when a moving edge
		* costs the user a hover state. `andle` covers the column's width handle
		* (`wSkVaW_widthHandle`) and any future drag handle without pinning a
		* hashed class name; the attribute match is case-insensitive.
		*/
		const TILT_INTERACTIVE = 'button,[role="button"],a[href],input,textarea,select,[contenteditable],[class*="andle" i]';
		function startComposerTilt() {
			let current = null;
			let raf = 0;
			const tilted = new WeakSet();
			const settle = new Map();
			const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			if (reduced) return () => {};
			const release = (spot) => {
				const pending = settle.get(spot);
				if (pending !== undefined) {
					clearTimeout(pending);
					settle.delete(spot);
				}
				if (!tilted.has(spot)) return;
				tilted.delete(spot);
				spot.style.transform = 'perspective(' + TILT_PERSPECTIVE + 'px) rotateX(0rad) rotateY(0rad) scale(1)';
				const handle = window.setTimeout(() => {
					settle.delete(spot);
					spot.style.removeProperty('transform');
					spot.style.removeProperty('transform-origin');
				}, TILT_SETTLE_MS);
				settle.set(spot, handle);
			};
			const paint = (spot, rect, clientX, clientY) => {
				if (raf !== 0) return;
				raf = requestAnimationFrame(() => {
					raf = 0;
					if (current !== spot) return;
					if (dsttGetGlass() !== 'liquid') {
						release(spot);
						return;
					}
					if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
					const dx = Math.min(0.5, Math.max(-0.5, (clientX - rect.left) / rect.width - 0.5));
					const dy = Math.min(0.5, Math.max(-0.5, (clientY - rect.top) / rect.height - 0.5));
					spot.style.transformOrigin = (rect.width / 2) + 'px ' + (rect.height / 2) + 'px';
					spot.style.transform = 'perspective(' + TILT_PERSPECTIVE + 'px)'
						+ ' rotateX(' + (TILT_MAX * -2 * dy).toFixed(5) + 'rad)'
						+ ' rotateY(' + (TILT_MAX * 2 * dx).toFixed(5) + 'rad)'
						+ ' scale(' + TILT_SCALE + ')';
					tilted.add(spot);
				});
			};
			const onOver = (event) => {
				if (dsttGetGlass() !== 'liquid') return;
				const target = event.target;
				if (target === null || typeof target.closest !== 'function') return;
				const spot = target.closest(TILT_SELECTOR);
				if (spot === null) return;
				// A control (or a drag handle) is under the pointer: leave the card
				// still. See TILT_INTERACTIVE for why this is not cosmetic.
				if (target.closest(TILT_INTERACTIVE) !== null) {
					if (current === spot) {
						release(spot);
						current = null;
					}
					return;
				}
				const rect = spot.getBoundingClientRect();
				if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
				const pending = settle.get(spot);
				if (pending !== undefined) {
					clearTimeout(pending);
					settle.delete(spot);
				}
				current = spot;
				paint(spot, rect, event.clientX, event.clientY);
			};
			const onMove = (event) => {
				if (current === null) return;
				const target = event.target;
				if (target !== null && typeof target.closest === 'function' && target.closest(TILT_INTERACTIVE) !== null) {
					release(current);
					current = null;
					return;
				}
				paint(current, current.getBoundingClientRect(), event.clientX, event.clientY);
			};
			const onOut = (event) => {
				if (current === null) return;
				const target = event.target;
				if (target !== null && typeof target.closest === 'function') {
					const spot = target.closest(TILT_SELECTOR);
					if (spot !== null && spot !== current) return;
				}
				const rect = current.getBoundingClientRect();
				if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return;
				release(current);
				current = null;
			};
			document.addEventListener('pointerover', onOver, { passive: true });
			document.addEventListener('pointermove', onMove, { passive: true });
			document.addEventListener('pointerout', onOut, { passive: true });
			return () => {
				document.removeEventListener('pointerover', onOver);
				document.removeEventListener('pointermove', onMove);
				document.removeEventListener('pointerout', onOut);
				if (raf !== 0) cancelAnimationFrame(raf);
				for (const id of settle.values()) clearTimeout(id);
				settle.clear();
				for (const spot of document.querySelectorAll(TILT_SELECTOR)) {
					spot.style.removeProperty('transform');
					spot.style.removeProperty('transform-origin');
				}
				current = null;
			};
		}

		/**
		* Ambient background layer: the DSTT flow field, a WebGL2 two-pass fluid
		* simulation ported from dsh-theme-mineradio, replacing the particle field.
		* The particles stay the fallback — {@link startParticles} remains the whole
		* implementation for engines without WebGL2 — so a missing WebGL2 downgrades
		* the background instead of blanking it.
		*
		* Every colour knob follows the DSTT colour token, so a mode switch re-tints
		* the flow and the glass edge tint without a remount.
		*/
		function startAmbient() {
			if (!supportsWebgl2()) return startParticles();
			// Which build is running, readable from the page (see README). One line in
			// the console answers "is the bundle I just installed actually live?".
			try { window.__dshomeBuild = '2.0.80 no-hover-motion'; } catch (error) {}
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
			// The fluid paints an opaque full-screen wash; without this it HIDES the
			// body background, which is where the DSTT colour token actually lands.
			// Measured: canvas 235,240,252 over a body reading 233,242,241 with the
			// token green. Letting the page through is what makes a mode switch
			// visible on screen instead of only in the computed style.
			style.opacity = '0.55';
			document.body.appendChild(canvas);

			const fluid = attachFluidShader(canvas, dshomeFluidParams());
			// ── palette follows the token, every frame ────────────────────────────
			// The mount above resolves the palette ONCE. Measured failure: with the
			// token green the body background computed green while the canvas kept
			// painting its mount palette -- six light/dark x blue/red/green
			// screenshots all sampled the same blue (159,187,238). Subscriptions and
			// a MutationObserver were not enough either (1.43.6 tried), because the
			// colour driver writes the token before this canvas exists. So the
			// palette is derived from the DOM and compared per frame: two
			// getAttribute calls when nothing changed, and it cannot miss a writer.
			let fluidKey = JSON.stringify(dshomeFluidParams());
			const fluidSync = setInterval(() => {
				let next;
				try { next = JSON.stringify(dshomeFluidParams()); } catch (error) { return; }
				if (next === fluidKey) return;
				fluidKey = next;
				try { fluid.setParams(JSON.parse(next)); } catch (error) {}
			}, 200);
			// The fluid is deliberately autonomous: no pointer feed (the `fluidBrush`
			// setting, off by default) and no button stir either. The ported
			// `attachFluidInteractions` is therefore NOT wired — it is kept in the
			// file, unmodified, because re-enabling button ripples is one call, but
			// nothing in this theme uses it today.
			const stopSpotter = startSpecularSpotter();
			const stopParallax = startSpecularParallax();
			const dispersion = startGlassDispersion({ hue: FLUID_HUES[dshomeColor()] });
			// Both recipes share one filter pair, so the recipe selects the scale:
			// 104 for liquid (visible edge refraction) and the untouched 60 for
			// frosted, which is what the pane has always used.
			const applyGlass = () => {
				dispersion.setRefraction(dsttGetGlass() === 'liquid' ? LIQUID_REF_SCALE : DEFAULT_REF_SCALE);
			};
			applyGlass();
			const unsubscribeGlass = dsttSubscribe(applyGlass);
			// ── palette reconciliation ────────────────────────────────────────────
			// One reader for BOTH inputs the palette depends on: the colour token on
			// <body> and the dark marker. Reported symptom: "切主题模式背景不变 /
			// 深色模式背景还是蓝白". The colour half of that was a real dead end --
			// `subscribeColor` only fires when the notified colour string CHANGES, so
			// the boot race (this canvas mounts, then the durable mode arrives over
			// the async bridge and re-resolves the colour) left the flow painted from
			// whatever the driver had guessed first, and a mode switch that resolved
			// to the same colour never notified at all. The scheme half had no
			// listener: a MutationObserver was watching the marker, but `darkSync`
			// pointedly does not set a *changed* value twice, and the marker itself
			// was the only thing written.
			// So: derive from the DOM on every signal instead of trusting the event to
			// carry it, and box every listener so one throw cannot cost the rest.
			let fluidParams = JSON.stringify(dshomeFluidParams());
			const syncFluid = () => {
				const next = dshomeFluidParams();
				const key = JSON.stringify(next);
				if (key === fluidParams) return;
				fluidParams = key;
				try { fluid.setParams(next); } catch (error) {}
			};
			const unsubscribeColor = subscribeColor((color) => {
				syncFluid();
				try { dispersion.setTint(FLUID_HUES[color] ?? FLUID_HUES.green); } catch (error) {}
			});
			const unsubscribeDark = darkSync === null ? null : darkSync.subscribe(syncFluid);
			// The colour driver writes the token as an attribute; watching it as well
			// keeps this correct no matter who wrote it (the peak-hour chain, a manual
			// mode pick, or a future caller that forgets to notify).
			let tokenMirror = null;
			try {
				tokenMirror = new MutationObserver(syncFluid);
				tokenMirror.observe(document.body, { attributes: true, attributeFilter: ['data-dshome-color'] });
			} catch (error) {
				tokenMirror = null;
			}
			return () => {
				unsubscribeColor();
				if (unsubscribeDark !== null) unsubscribeDark();
				unsubscribeGlass();
				if (tokenMirror !== null) tokenMirror.disconnect();
				dispersion.dispose();
				stopParallax();
				stopSpotter();
				clearInterval(fluidSync);
				fluid.dispose();
				canvas.remove();
			};
		}

		function startParticles() {
			try { window.__dshomeBuild = '2.0.80 no-hover-motion'; } catch (error) {}
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
			// Two inputs again: the colour token (notified) and the dark marker
			// (written by darkSync). The particle palette is per scheme, so a
			// light/dark switch has to re-roll the colours too -- otherwise the
			// fallback background keeps the scheme it was mounted with, exactly the
			// bug the fluid path had.
			const unsubscribeColor = subscribeColor(refreshColors);
			const unsubscribeDark = darkSync === null ? null : darkSync.subscribe(refreshColors);
			let tokenMirror = null;
			try {
				tokenMirror = new MutationObserver(refreshColors);
				tokenMirror.observe(document.body, { attributes: true, attributeFilter: ['data-dshome-color'] });
			} catch (error) {
				tokenMirror = null;
			}

			window.addEventListener('resize', resize);
			resize();
			for (let i = 0; i < COUNT; i++) parts.push(make());
			rafId = requestAnimationFrame(step);

			return () => {
				running = false;
				cancelAnimationFrame(rafId);
				window.removeEventListener('resize', resize);
				unsubscribeColor();
				if (unsubscribeDark !== null) unsubscribeDark();
				if (tokenMirror !== null) tokenMirror.disconnect();
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
		* Action menu for the product's delivered/changed files
		* (`@deepseek-ai/dsh-client-ui-deliverables`), which renders two separate
		* surfaces:
		*
		*   - `[data-produced-files-row]` — the "本轮文件改动" chips, one
		*     `button[title=absolutePath]` per changed path, whose only own action
		*     is the product's preview opener;
		*   - `[data-presented-file]` — the declared-file cards, whose overlay button
		*     previews and whose chevron already offers default-app open and reveal.
		*
		* Both now open this menu: the changed-file chips on a plain left click
		* (clicking one previously looked like nothing happened) and both surfaces
		* on right click. The product's own action is preserved as a menu item, so
		* hijacking the chip click trades nothing away. "Copy path" does not exist
		* anywhere in the product — the absolute path is otherwise only reachable by
		* reading a `title` tooltip by hand — so it is also added to the product's
		* own chevron menu.
		*
		* Both anchors are stable product attributes rather than build-hashed class
		* names, and each surface already carries the absolute path in its `title`
		* (a card via the product's own `resolveWorkspacePath`), so this patch never
		* re-derives a workspace.
		*/
		function watchFileCardMenu(ctx) {
			const CARD = '[data-presented-file]';
			// The product renders changed files through a *different* component:
			// ProducedFiles draws one `button[title=absolutePath]` per path inside
			// `[data-produced-files-row]`. Those chips are not
			// `[data-presented-file]` cards at all, so they need their own anchor.
			const PRODUCED = '[data-produced-files-row] button[title]';
			const MENU = '[role="menu"]';
			const CLS = 'dshome-file-menu';
			const ITEM_CLS = CLS + '-item';
			const TOAST_CLS = CLS + '-toast';
			const COPY_CLS = 'dshome-file-copy';
			const ICON_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>';
			const ICON_REVEAL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
			const ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
			const ICON_PREVIEW = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
			const CSS = `
.${CLS}{position:fixed;z-index:2147483000;min-width:198px;padding:6px;border-radius:14px;background:rgba(255,255,255,.94);border:.5px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));box-shadow:0 18px 44px rgba(15,30,60,.2);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);animation:dshome-menu-pop .16s cubic-bezier(.2,.8,.2,1);transform-origin:top left}
body[data-dshome-dark] .${CLS}{background:rgba(14,30,60,.94);box-shadow:0 18px 44px rgba(0,0,0,.5)}
.${ITEM_CLS},.${COPY_CLS}{display:flex;align-items:center;gap:9px;box-sizing:border-box;width:100%;padding:8px 10px;border:0;border-radius:9px;background:transparent;color:var(--dsw-alias-label-primary,#152443);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer;transition:background-color .12s ease,transform .12s ease}
.${ITEM_CLS}:hover,.${COPY_CLS}:hover{background:color-mix(in srgb,var(--ds-brand,#4d6bfe) 13%,transparent);transform:translateX(1px)}
.${ITEM_CLS}:focus-visible,.${COPY_CLS}:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:-2px}
.${ITEM_CLS} svg,.${COPY_CLS} svg{flex:none;width:15px;height:15px;opacity:.72}
.${ITEM_CLS}>span,.${COPY_CLS}>span{display:inline-flex;align-items:center;min-width:0}
.${CLS}-sep{height:1px;margin:5px 6px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.06))}
.${TOAST_CLS}{position:fixed;z-index:2147483001;left:50%;bottom:56px;transform:translateX(-50%);padding:8px 15px;border-radius:999px;background:rgba(20,36,70,.93);color:#fff;font-size:12px;line-height:18px;pointer-events:none;animation:dshome-fade-in .18s ease}
@keyframes dshome-menu-pop{from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:none}}
`;

			const isZh = () => {
				try {
					const locale = ctx.get('locale');
					if (locale === undefined || locale === null) return true;
					const active = locale.getLocale().active;
					return active === 'zh' || active === 'zh-CN' || active === 'zh-Hans';
				} catch (error) {
					return true;
				}
			};
			const labels = () => (isZh() ? {
				open: '用默认应用打开',
				reveal: '打开所在文件夹',
				copy: '复制路径',
				preview: '在侧边栏预览',
				previewProduced: '打开预览',
				copied: '已复制路径',
				copyDenied: '浏览器拒绝了剪贴板访问，请手动复制',
				failed: '操作失败（宿主端未响应）'
			} : {
				open: 'Open with default app',
				reveal: 'Open containing folder',
				copy: 'Copy path',
				preview: 'Preview in sidebar',
				previewProduced: 'Open preview',
				copied: 'Path copied',
				copyDenied: 'Clipboard access was denied — copy it manually',
				failed: 'Action failed (no response from the host)'
			});

			/** The absolute path the product already resolved onto a card. */
			const pathOf = (card) => {
				const overlay = card.querySelector('button[title]');
				if (overlay === null) return '';
				const value = overlay.getAttribute('title');
				return typeof value === 'string' ? value.trim() : '';
			};

			/**
			* Resolve a click target to the file it represents. A changed-file chip
			* is both the anchor and the button whose own click opens the product's
			* preview; a presented card carries that button as an overlay. Returns
			* null when the target is neither.
			*/
			const surfaceOf = (target) => {
				if (target === null || typeof target.closest !== 'function') return null;
				const chip = target.closest(PRODUCED);
				if (chip !== null) {
					const chipPath = chip.getAttribute('title');
					const path = typeof chipPath === 'string' ? chipPath.trim() : '';
					return path === '' ? null : { path: path, button: chip, produced: true };
				}
				const card = target.closest(CARD);
				if (card === null) return null;
				const overlay = card.querySelector('button[title]');
				if (overlay === null) return null;
				const overlayPath = overlay.getAttribute('title');
				const path = typeof overlayPath === 'string' ? overlayPath.trim() : '';
				return path === '' ? null : { path: path, button: overlay, produced: false };
			};

			/**
			* Run the product's own action for a surface by re-dispatching its click.
			* The flag lets that synthetic click past our capture handler, which
			* would otherwise open this menu again instead of the product's preview.
			*/
			let replaying = false;
			const preview = (surface) => {
				replaying = true;
				try {
					surface.button.click();
				} finally {
					replaying = false;
				}
			};

			let menu = null;
			let toastNode = null;
			const closeMenu = () => {
				if (menu === null) return;
				menu.remove();
				menu = null;
			};
			const toast = (text) => {
				if (toastNode !== null) toastNode.remove();
				const node = document.createElement('div');
				node.className = TOAST_CLS;
				node.setAttribute('role', 'status');
				node.textContent = text;
				document.body.appendChild(node);
				toastNode = node;
				setTimeout(() => {
					node.remove();
					if (toastNode === node) toastNode = null;
				}, 1800);
			};
			// localhost is a secure context, so the async clipboard exists in the
			// real GUI; a rejection is still reported rather than swallowed.
			const copyPath = (path) => {
				const clipboard = navigator.clipboard;
				if (clipboard === undefined || clipboard === null || typeof clipboard.writeText !== 'function') {
					return Promise.resolve(false);
				}
				return Promise.resolve(clipboard.writeText(path)).then(() => true).catch(() => false);
			};
			const invoke = (endpoint, path) => Promise.resolve(bridgeCall(endpoint, { path: path }))
				.then((result) => result !== undefined && result !== null && result.ok === true)
				.catch(() => false);

			const buildItem = (icon, label, onPick) => {
				const item = document.createElement('button');
				item.type = 'button';
				item.className = ITEM_CLS;
				item.setAttribute('role', 'menuitem');
				item.title = label;
				item.setAttribute('aria-label', label);
				const glyph = document.createElement('span');
				glyph.innerHTML = icon;
				const caption = document.createElement('span');
				caption.textContent = label;
				item.appendChild(glyph);
				item.appendChild(caption);
				item.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					closeMenu();
					onPick();
				});
				return item;
			};

			const openMenu = (surface, clientX, clientY) => {
				closeMenu();
				const path = surface.path;
				const text = labels();
				const node = document.createElement('div');
				node.className = CLS;
				node.setAttribute('role', 'menu');
				node.appendChild(buildItem(ICON_OPEN, text.open, () => {
					invoke('dshome/file.open', path).then((ok) => { if (!ok) toast(text.failed); });
				}));
				node.appendChild(buildItem(ICON_REVEAL, text.reveal, () => {
					invoke('dshome/file.reveal', path).then((ok) => { if (!ok) toast(text.failed); });
				}));
				node.appendChild(buildItem(ICON_COPY, text.copy, () => {
					copyPath(path).then((ok) => toast(ok ? text.copied : text.copyDenied));
				}));
				const separator = document.createElement('div');
				separator.className = CLS + '-sep';
				node.appendChild(separator);
				node.appendChild(buildItem(ICON_PREVIEW, surface.produced ? text.previewProduced : text.preview, () => {
					preview(surface);
				}));
				document.body.appendChild(node);
				// Clamp to the viewport so a card near an edge never opens a menu
				// the user cannot reach.
				const box = node.getBoundingClientRect();
				node.style.left = Math.max(8, Math.min(clientX, window.innerWidth - box.width - 8)) + 'px';
				node.style.top = Math.max(8, Math.min(clientY, window.innerHeight - box.height - 8)) + 'px';
				menu = node;
				const first = node.querySelector('.' + ITEM_CLS);
				if (first !== null) first.focus();
			};

			const onContextMenu = (event) => {
				const surface = surfaceOf(event.target);
				if (surface === null) return;
				event.preventDefault();
				event.stopPropagation();
				openMenu(surface, event.clientX, event.clientY);
			};
			// A changed-file chip's only own action is the product's preview, and
			// in practice clicking one looks like nothing happens. Those chips
			// therefore open this menu on a plain left click, with the product's
			// own action kept as a menu item. Presented cards keep their left
			// click — their overlay visibly previews — and use the right click.
			const onClickCapture = (event) => {
				if (replaying || event.defaultPrevented) return;
				if (event.button !== undefined && event.button !== 0) return;
				const surface = surfaceOf(event.target);
				if (surface === null || !surface.produced) return;
				event.preventDefault();
				event.stopPropagation();
				openMenu(surface, event.clientX, event.clientY);
			};
			const onPointerDown = (event) => {
				if (menu === null) return;
				if (event.target instanceof Node && menu.contains(event.target)) return;
				closeMenu();
			};
			const onKeyDown = (event) => {
				if (event.key === 'Escape') closeMenu();
			};
			document.addEventListener('contextmenu', onContextMenu, true);
			document.addEventListener('click', onClickCapture, true);
			document.addEventListener('pointerdown', onPointerDown, true);
			document.addEventListener('keydown', onKeyDown, true);
			window.addEventListener('resize', closeMenu, true);
			window.addEventListener('scroll', closeMenu, true);

			// "Copy path" is the one gesture the product lacks, so it is also added
			// to the product's own chevron menu, where file actions are looked for.
			let anchorCard = null;
			const track = (target) => {
				anchorCard = null;
				if (target === null || typeof target.closest !== 'function') return;
				const button = target.closest('button');
				if (button === null || button.getAttribute('aria-haspopup') !== 'menu') return;
				const card = button.closest(CARD);
				if (card === null) return;
				anchorCard = card;
			};
			const onTrackCapture = (event) => track(event.target);
			document.addEventListener('click', onTrackCapture, true);
			document.addEventListener('focusin', onTrackCapture, true);

			const injectCopyItem = (node) => {
				if (anchorCard === null || !document.contains(anchorCard)) return;
				if (node.querySelector('.' + COPY_CLS) !== null) return;
				const card = anchorCard;
				const path = pathOf(card);
				if (path === '') return;
				const viewport = node.querySelector('[role="presentation"]');
				if (viewport === null) return;
				const text = labels();
				const item = document.createElement('button');
				item.type = 'button';
				item.className = COPY_CLS;
				item.setAttribute('role', 'menuitem');
				item.title = text.copy;
				item.setAttribute('aria-label', text.copy);
				const glyph = document.createElement('span');
				glyph.innerHTML = ICON_COPY;
				const caption = document.createElement('span');
				caption.textContent = text.copy;
				item.appendChild(glyph);
				item.appendChild(caption);
				item.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					copyPath(path).then((ok) => toast(ok ? text.copied : text.copyDenied));
					try {
						document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
					} catch (error) {}
				});
				viewport.appendChild(item);
			};

			const observer = new MutationObserver((records) => {
				for (const record of records) {
					for (const added of record.addedNodes) {
						if (!(added instanceof Element)) continue;
						if (added.matches(MENU)) {
							injectCopyItem(added);
							continue;
						}
						added.querySelectorAll(MENU).forEach(injectCopyItem);
					}
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });

			const disposeStyle = injectStyle(CSS, 'file-card-menu.css');
			return () => {
				disposeStyle();
				observer.disconnect();
				closeMenu();
				if (toastNode !== null) toastNode.remove();
				document.removeEventListener('contextmenu', onContextMenu, true);
				document.removeEventListener('click', onClickCapture, true);
				document.removeEventListener('pointerdown', onPointerDown, true);
				document.removeEventListener('keydown', onKeyDown, true);
				document.removeEventListener('click', onTrackCapture, true);
				document.removeEventListener('focusin', onTrackCapture, true);
				window.removeEventListener('resize', closeMenu, true);
				window.removeEventListener('scroll', closeMenu, true);
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
		/** Desktop wallpaper on the same channel: JSON status, plus raw bytes at a sub-path. */
		const WALLPAPER_GET = "dshome/desktop.wallpaper";
		const WALLPAPER_SUBPATH = "/wallpaper";
		/**
		* The marker dsh-plugin-wallpaper-engine puts on <body> while it is rendering
		* a wallpaper (its `ACTIVE_ATTR`), and clears when it stops. It is the only
		* thing needed to know whether that plugin currently owns the background:
		* its own layer is `.we-layer{position:fixed;inset:0;z-index:-2}`, i.e. above
		* anything this theme could paint on <body>, so in ③ we simply paint nothing
		* while the marker is present instead of putting a white/black sheet under it.
		*/
		const WE_ACTIVE_ATTR = "data-we-wallpaper";
		/** Peak windows, [startHour, endHour), judged in Beijing time (UTC+8). */
		const PEAK_RANGES = [[9, 12], [14, 18]];
		// The two glass recipes the stylesheet gates on <html data-dshome-glass>.
		// `liquid` is the default; `frosted` is the pane this theme shipped before.
		const DSTT_GLASS_STYLES = ["liquid", "frosted"];
		const DSTT_GLASS_DEFAULT = "liquid";
		const DSTT_GLASS_LABELS = {
			liquid: { zh: "液态", en: "Liquid" },
			frosted: { zh: "白磨砂", en: "Frosted" }
		};
		// How wide the composer's edge refraction is under liquid, measured on the
		// top and bottom edges -- the only two where a displacement has anything to
		// show. The stylesheet gates the three states on <html data-dshome-composer>.
		// `origin` was this option's first id and is still accepted from a settings
		// file written before the rename; it reads back as `wide`.
		const DSTT_COMPOSER = ["narrow", "wide", "off"];
		const DSTT_COMPOSER_DEFAULT = "narrow";
		const DSTT_COMPOSER_LABELS = {
			narrow: { zh: "窄 8px", en: "Narrow 8px" },
			wide: { zh: "宽 16px", en: "Wide 16px" },
			off: { zh: "无", en: "Off" }
		};
		// Background recipes, in the order the user numbered them: 方式1 `classic`
		// (the 1.43.11 palette, and the default again -- one family, no second hue),
		// 方式2 `white` (the same lead with pure white only), 方式3 `custom` (the
		// user's own background; the colour token drives the buttons alone and the
		// dark scheme lays a scrim over it), then `bold`, the 1.43.12 three-chroma
		// set they asked to keep. Ids match the host schema's `backgroundMode`
		// enum; the free-text value for 方式3 is `customBackground`.
		const DSTT_BACKGROUNDS = ["classic", "white", "custom", "bold"];
		const DSTT_BACKGROUND_DEFAULT = "classic";
		const DSTT_BACKGROUND_LABELS = {
			classic: { zh: "① 主色+纯白+近白", en: "1 · Lead + white + near-white" },
			white: { zh: "② 主色+纯白", en: "2 · Lead + white" },
			custom: { zh: "③ 自选背景", en: "3 · Custom" },
			bold: { zh: "浓三色", en: "Bold" }
		};

		/**
		* Shared in-memory mirror of the durable DSTT mode. The settings domain's
		* RPC only serves allowlisted namespaces, so the mode travels over this
		* plugin's own loopback channel instead; every reader (the color driver,
		* the settings tab) subscribes to this mirror.
		*/
		// `settled` is false until the first durable read answers (or fails): the
		// ambient layer waits for it, because mounting from the mirror default and
		// then tearing down again flashed the fluid wash over a saved 自选背景.
		const dsttState = { mode: "peakvalley-redblue", fluidBrush: false, glassStyle: DSTT_GLASS_DEFAULT, composer: DSTT_COMPOSER_DEFAULT, blur: true, backgroundMode: DSTT_BACKGROUND_DEFAULT, customBackground: "", settled: false, wallpaper: { state: "idle", value: "", kind: null, style: null, tile: false }, ambient: true, listeners: new Set() };
		// Fields the user has chosen in this session. A host half that predates a
		// field ignores it and answers without it -- or with its own default -- so
		// without this a fresh choice gets overwritten by the next sync and the
		// option appears to snap straight back to its default.
		const dsttTouched = new Set();
		const dsttGetMode = () => dsttState.mode;
		const dsttGetGlass = () => (DSTT_GLASS_STYLES.includes(dsttState.glassStyle) ? dsttState.glassStyle : DSTT_GLASS_DEFAULT);
		const dsttGetComposer = () => {
			if (dsttState.composer === "origin") return "wide";
			return DSTT_COMPOSER.includes(dsttState.composer) ? dsttState.composer : DSTT_COMPOSER_DEFAULT;
		};
		const dsttGetBlur = () => dsttState.blur !== false;
		const dsttGetBackground = () => (DSTT_BACKGROUNDS.includes(dsttState.backgroundMode) ? dsttState.backgroundMode : DSTT_BACKGROUND_DEFAULT);
		const dsttGetCustomBackground = () => (typeof dsttState.customBackground === "string" ? dsttState.customBackground : "");
		const dsttGetWallpaper = () => dsttState.wallpaper;
		const dsttGetAmbient = () => dsttState.ambient !== false;
		/**
		* Turn the glass frosting on or off. Same shape as the other CSS-only
		* preferences: apply locally first, then let the host persist it, and treat
		* its answer as confirmation only.
		*/
		async function dsttSetBlur(ctx, next) {
			dsttState.blur = next === true;
			dsttTouched.add("blur");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, backdropBlur: dsttState.blur });
				if (result !== undefined && result !== null && result.ok === true) {
					return result.value.backdropBlur === dsttState.blur;
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		/**
		* Turn the animated background layer on or off. Off means no WebGL2 fluid
		* and no particle fallback either: the page keeps the static themed
		* background (or the user's own 自选背景) and nothing else about the theme
		* changes. It exists for GPUs that render the simulation wrong -- an Intel
		* iGPU under ANGLE/D3D11 drew drifting squares even after the mediump fix --
		* where a switch is more honest than another round of shader archaeology.
		*/
		async function dsttSetAmbient(ctx, next) {
			dsttState.ambient = next === true;
			dsttTouched.add("ambient");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, ambientBackground: dsttState.ambient });
				if (result !== undefined && result !== null && result.ok === true) {
					return result.value.ambientBackground === dsttState.ambient;
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		/**
		* Pick the background recipe. Applied locally FIRST and confirmed by the
		* host, exactly like the glass recipe: the marker, the stylesheet and the
		* ambient layer all read the mirror, so the switch is live with no reload,
		* and the round trip only decides whether it survives one.
		*/
		async function dsttSetBackground(ctx, next) {
			if (!DSTT_BACKGROUNDS.includes(next)) return false;
			dsttState.backgroundMode = next;
			dsttTouched.add("background");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, backgroundMode: next });
				// Confirmation only -- see dsttSetComposer for why the host's echo
				// must not be copied back into the mirror.
				if (result !== undefined && result !== null && result.ok === true && DSTT_BACKGROUNDS.includes(result.value.backgroundMode)) {
					return result.value.backgroundMode === next;
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		/**
		* Store the custom background value for 方式3. Text is sent as typed -- the
		* host trims it, strips control characters and bounds the length -- and an
		* empty string is a valid value: it means "nothing usable yet", so the
		* recipe's own background stays until CSS.supports() accepts something.
		*/
		async function dsttSetCustomBackground(ctx, next) {
			const value = typeof next === "string" ? next : "";
			dsttState.customBackground = value;
			dsttTouched.add("customBackground");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, customBackground: value });
				if (result !== undefined && result !== null && result.ok === true && typeof result.value.customBackground === "string") {
					// The host normalises (trim, control characters, length cap), so a
					// byte-for-byte compare would report failure for any value it
					// cleaned up. Compare the trimmed forms; the mirror deliberately
					// keeps what the user typed either way.
					return result.value.customBackground === value.trim();
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		/**
		* Persist the composer's refraction width through the bridge.
		*
		* Applied locally FIRST, before the round trip. Both this and glassStyle
		* only flip a CSS attribute, so the choice is fully usable the moment it is
		* made — and it has to be, because a running dsh keeps the host half it
		* booted with: until `dsh web` is restarted, `dstt.mode.set` ignores fields
		* it does not know and answers without them, which used to make a brand new
		* setting look broken. The cost of applying first is that a choice made
		* against a stale host is not persisted and reverts on reload, so the
		* return value still reports the truth.
		*/
		async function dsttSetComposer(ctx, next) {
			if (!DSTT_COMPOSER.includes(next)) return false;
			dsttState.composer = next;
			dsttTouched.add("composer");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, composerRefraction: next });
				// The response is used ONLY to confirm. It must never be written back
				// into the mirror: a host that accepts the call but does not store the
				// field answers with its own value (the default, `narrow`), and copying
				// that in is what made the option snap straight back the moment the
				// round trip landed.
				if (result !== undefined && result !== null && result.ok === true && DSTT_COMPOSER.includes(result.value.composerRefraction)) {
					return result.value.composerRefraction === next;
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		/** Persist the glass recipe through the bridge; resolves with success.
		 * Applied locally first for the same reason as dsttSetComposer above. */
		async function dsttSetGlass(ctx, next) {
			if (!DSTT_GLASS_STYLES.includes(next)) return false;
			dsttState.glassStyle = next;
			dsttTouched.add("glassStyle");
			dsttNotify();
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, glassStyle: next });
				// Confirmation only -- see dsttSetComposer for why the host's echo must
				// not be copied back into the mirror.
				if (result !== undefined && result !== null && result.ok === true && DSTT_GLASS_STYLES.includes(result.value.glassStyle)) {
					return result.value.glassStyle === next;
				}
			} catch (error) {
				// Fall through: the local choice stands, it just was not stored.
			}
			return false;
		}
		const dsttGetBrush = () => dsttState.fluidBrush === true;
		/** Persist the fluid-brush preference (off by default) through the bridge. */
		async function dsttSetBrush(ctx, next) {
			try {
				const result = await bridgeCall(DSTT_SET, { mode: dsttState.mode, fluidBrush: next === true });
				if (result !== undefined && result !== null && result.ok === true) {
					dsttState.fluidBrush = result.value.fluidBrush === true;
					dsttNotify();
					return true;
				}
			} catch (error) {
				// Fall through to the caller's failure handling.
			}
			return false;
		}
		const dsttSubscribe = (listener) => {
			dsttState.listeners.add(listener);
			return () => dsttState.listeners.delete(listener);
		};
		const dsttNotify = () => {
			for (const listener of dsttState.listeners) {
				try { listener(); } catch (e) {}
			}
		};
		/**
		* The live dark-scheme handle. Factory scope, NOT a local of apply(): the
		* ambient layer (startAmbient / startParticles -- both defined above apply
		* and mounted from inside it) subscribes to this handle's writes, so a
		* binding that exists only inside apply() is not in their scope chain. The
		* read threw `ReferenceError: darkSync is not defined` on every mount, the
		* `try { return startAmbient(); } catch` swallowed it, and the layer came up
		* with no disposer at all: canvas appended, 200 ms interval running, nothing
		* to tear down. That is what made "自选背景 unmounts the canvas" a no-op and
		* left the particle fallback appended but never sized or animated. `null`
		* until the dark effect assigns it, which happens earlier in apply() than
		* the ambient mount.
		*/
		let darkSync = null;
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

		/** Fallback used when the host half is unavailable. */
		const dsttGetBlurFallback = () => dsttState.blur !== false;

		/** Pull the durable mode from the host half once. */
		async function dsttSync(ctx) {
			try {
				const result = await bridgeCall(DSTT_GET, {});
				if (result !== undefined && result !== null && result.ok === true && DSTT_MODES.includes(result.value.mode)) {
					dsttState.mode = result.value.mode;
					dsttState.fluidBrush = result.value.fluidBrush === true;
					// An older host half answers without a glass recipe: keep the
					// default rather than clearing the attribute to nothing. And a
					// field the user has already chosen this session is never taken
					// back from the host -- a stale host answers with its own default,
					// which is what made a fresh choice look like it snapped back.
					if (!dsttTouched.has("glassStyle") && DSTT_GLASS_STYLES.includes(result.value.glassStyle)) dsttState.glassStyle = result.value.glassStyle;
					if (!dsttTouched.has("composer") && DSTT_COMPOSER.includes(result.value.composerRefraction)) dsttState.composer = result.value.composerRefraction;
					if (!dsttTouched.has("blur") && typeof result.value.backdropBlur === "boolean") dsttState.blur = result.value.backdropBlur;
					if (!dsttTouched.has("background") && DSTT_BACKGROUNDS.includes(result.value.backgroundMode)) dsttState.backgroundMode = result.value.backgroundMode;
					if (!dsttTouched.has("customBackground") && typeof result.value.customBackground === "string") dsttState.customBackground = result.value.customBackground;
					if (!dsttTouched.has("ambient") && typeof result.value.ambientBackground === "boolean") dsttState.ambient = result.value.ambientBackground;
					dsttNotify();
				}
			} catch (error) {
				// Fall through to the settled flag: an unreachable host must not leave
				// the ambient layer waiting forever.
			} finally {
				dsttState.settled = true;
				dsttNotify();
			}
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

			// The durable mode crosses an async bridge (dsttSync), so the anchor above
			// may have resolved the colour from the DEFAULT mode -- its 常态绿/常态蓝
			// token then never appears, and the background keeps the first guess. One
			// extra read after the sync has had its turn fixes the boot race, and it
			// is idempotent, so it cannot fight a later answer.
			const bootTimer = setTimeout(anchor, 0);

			try { unsubscribe = dsttSubscribe(anchor); } catch (error) { unsubscribe = null; }

			return () => {
				stopped = true;
				clearTimeout(bootTimer);
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
			// 方式3's text box is the only free-text field in this panel, so it keeps
			// a local draft: the mirror must not overwrite half-typed text. `dirty`
			// spans the window between the first keystroke and the commit (Enter or
			// blur), and only outside that window does a sync refill the box.
			const [draft, setDraft] = React.useState('');
			const draftDirty = React.useRef(false);
			// The subscription effect's cleanup runs with the closure from the render
			// that created it, so it cannot call commitDraft directly -- that would
			// commit the draft as it looked on mount. This ref always points at the
			// commit function of the latest render.
			const commitRef = React.useRef(null);

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
					if (!draftDirty.current) {
						try { setDraft(typeof dstt.customBackground === 'function' ? dstt.customBackground() : ''); } catch (e) {}
					}
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
					// Text typed but never committed must not vanish when the panel goes
					// away: Escape or a settings close does not blur the input first.
					if (commitRef.current !== null) {
						try { commitRef.current(); } catch (e) {}
					}
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
			// The background recipe and 方式3's value are durable too; the mirror
			// re-renders this panel once the host confirms the write.
			const backgroundNow = dstt !== undefined && typeof dstt.background === 'function' ? dstt.background() : DSTT_BACKGROUND_DEFAULT;
			const pickBackground = (next) => {
				if (dstt === undefined || typeof dstt.setBackground !== 'function' || next === backgroundNow) return;
				dstt.setBackground(next);
			};
			const commitDraft = () => {
				draftDirty.current = false;
				if (dstt === undefined || typeof dstt.setCustomBackground !== 'function') return;
				const stored = typeof dstt.customBackground === 'function' ? dstt.customBackground() : '';
				if (draft === stored) return;
				dstt.setCustomBackground(draft);
			};
			commitRef.current = commitDraft;
			// What the box currently holds, from the browser's own point of view: the
			// chip reports CSS.supports(), the same test the marker uses.
			const draftKind = backgroundKind(draft);
			// The brush is a durable preference, not local state: flipping it asks the
			// host to persist it and the mirror re-renders this panel.
			const brushOn = dstt !== undefined && typeof dstt.brush === 'function' ? dstt.brush() === true : false;
			const toggleBrush = () => {
				if (dstt === undefined || typeof dstt.setBrush !== 'function') return;
				dstt.setBrush(!brushOn);
			};
			// The glass recipe is durable too, and the mirror re-renders this panel
			// when the host confirms the write.
			const glassNow = dstt !== undefined && typeof dstt.glass === 'function' ? dstt.glass() : DSTT_GLASS_DEFAULT;
			const pickGlass = (next) => {
				if (dstt === undefined || typeof dstt.setGlass !== 'function' || next === glassNow) return;
				dstt.setGlass(next);
			};
			const composerNow = dstt !== undefined && typeof dstt.composer === 'function' ? dstt.composer() : DSTT_COMPOSER_DEFAULT;
			const pickComposer = (next) => {
				if (dstt === undefined || typeof dstt.setComposer !== 'function' || next === composerNow) return;
				dstt.setComposer(next);
			};
			const blurOn = dstt !== undefined && typeof dstt.blur === 'function' ? dstt.blur() !== false : true;
			const toggleBlur = () => {
				if (dstt === undefined || typeof dstt.setBlur !== 'function') return;
				dstt.setBlur(!blurOn);
			};
			// The animated background layer: off means no WebGL2 fluid and no particle
			// fallback either. It is the escape hatch for GPUs that draw the
			// simulation wrong (an Intel iGPU under ANGLE/D3D11 kept showing drifting
			// squares after the mediump fix), so the panel says so plainly.
			const ambientOn = dstt !== undefined && typeof dstt.ambient === 'function' ? dstt.ambient() !== false : true;
			const toggleAmbient = () => {
				if (dstt === undefined || typeof dstt.setAmbient !== 'function') return;
				dstt.setAmbient(!ambientOn);
			};
			// 方式3's box, in three states the chip has to keep apart (2.0.76): EMPTY
			// means "paint nothing of mine" -- a flat white/black base, or nothing at
			// all while dsh-plugin-wallpaper-engine is rendering; `desktop` is the
			// explicit opt-in for the Windows wallpaper the host half resolves; and
			// anything else is a CSS value the browser validates.
			const pluginPaints = typeof document !== 'undefined' && document.body !== null && document.body.hasAttribute(WE_ACTIVE_ATTR);
			const wallpaperNow = dstt !== undefined && typeof dstt.wallpaper === 'function' ? dstt.wallpaper() : null;
			const wallpaperState = wallpaperNow === null || typeof wallpaperNow !== 'object' ? 'idle' : wallpaperNow.state;
			const wallpaperKind = wallpaperNow === null || typeof wallpaperNow !== 'object' ? null : wallpaperNow.kind;
			const draftEmpty = draft.trim() === '';
			const draftDesktop = draft.trim().toLowerCase() === 'desktop';
			const chipText = draftKind === 'image'
				? (isZh ? '可用 · 图片' : 'OK · image')
				: draftKind === 'color'
					? (isZh ? '可用 · 纯色' : 'OK · colour')
					: draftEmpty
						? (pluginPaints
							? (isZh ? '壁纸插件在画 · 我们不画' : 'Wallpaper plugin paints')
							: (isZh ? '纯白 / 纯黑底色' : 'Flat white / black'))
						: draftDesktop
							? wallpaperState === 'ready'
								? (wallpaperKind === 'color' ? (isZh ? '桌面壁纸 · 纯色' : 'Desktop · colour') : (isZh ? '桌面壁纸 · 已就绪' : 'Desktop · ready'))
								: wallpaperState === 'loading'
									? (isZh ? '桌面壁纸 · 读取中' : 'Desktop · reading')
									: wallpaperState === 'none'
										? (isZh ? '读不到桌面色 · 用底色' : 'Unavailable · base colour')
										: (isZh ? '桌面壁纸' : 'Desktop wallpaper')
							: (isZh ? '暂不可用' : 'Not usable');
			const chipState = draftKind !== null
				? 'true'
				: draftEmpty
					? 'empty'
					: draftDesktop
						? (wallpaperState === 'ready' ? 'true' : wallpaperState === 'none' ? 'false' : 'empty')
						: 'false';

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
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '背景方式' : 'Background recipe'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '① 主色+纯白+近白（默认，旧版那套同色系柔和观感）；② 主色+纯白（只有两个色参与，最干净）；③ 自选背景：我们的流体与主题底色全部让位（没别的在画时是纯白 / 纯黑）；装了 dsh-plugin-wallpaper-engine 且它正在渲染时，连纯白也不画，背景交给它。颜色只驱动按钮之类。输入框可填图片 URL / 任意 CSS 值，或点「桌面壁纸」用本机壁纸；浓三色是 1.43.12 那套，先留着。'
							: '1 Lead + white + near-white (default: the soft single-family look this theme shipped before). 2 Lead + white (only two colours participate, the cleanest). 3 Custom background: our fluid and our themed background both stand down (flat white / black when nothing else paints); while dsh-plugin-wallpaper-engine is rendering we do not even paint that, and the background is its layer. The colour drives the buttons and such only. Type an image URL / any CSS value, or press Desktop for the Windows wallpaper. Bold is the 1.43.12 set, kept around.'),
						React.createElement('div', { className: 'dshome-dstt-seg dshome-dstt-seg-row', role: 'radiogroup', 'aria-label': isZh ? '背景方式' : 'Background recipe' },
							DSTT_BACKGROUNDS.map((id) => React.createElement('button', {
								key: id,
								type: 'button',
								role: 'radio',
								'aria-checked': backgroundNow === id,
								className: 'dshome-dstt-seg-btn' + (backgroundNow === id ? ' dshome-on' : ''),
								onClick: () => pickBackground(id)
							}, isZh ? DSTT_BACKGROUND_LABELS[id].zh : DSTT_BACKGROUND_LABELS[id].en))),
						backgroundNow === 'custom'
							? React.createElement('div', { className: 'dshome-dstt-input-row' },
								React.createElement('button', {
									type: 'button',
									className: 'dshome-dstt-seg-btn' + (draftDesktop ? ' dshome-on' : ''),
									onClick: () => {
										draftDirty.current = false;
										setDraft('desktop');
										if (dstt !== undefined && typeof dstt.setCustomBackground === 'function') dstt.setCustomBackground('desktop');
									}
								}, isZh ? '桌面壁纸' : 'Desktop'),
								React.createElement('input', {
									type: 'text',
									className: 'dshome-dstt-input',
									value: draft,
									spellCheck: false,
									'aria-label': isZh ? '自选背景' : 'Custom background',
									placeholder: isZh ? '留空 = 纯白/纯黑（壁纸插件在画时我们不画）；也可填图片 URL 或任意 CSS 值：https://…/bg.jpg、linear-gradient(...)、#1F6B4E' : 'Empty = flat white/black (nothing of ours while the wallpaper plugin paints); or an image URL / any CSS value: https://…/bg.jpg, linear-gradient(...), #1F6B4E',
									onChange: (event) => { draftDirty.current = true; setDraft(event.target.value); },
									onBlur: commitDraft,
									onKeyDown: (event) => {
										if (event.key !== 'Enter' && event.key !== 'Escape') return;
										if (event.key === 'Enter') event.preventDefault();
										commitDraft();
									}
								}),
								React.createElement('span', {
									className: 'dshome-dstt-input-state',
									'data-ok': chipState
								}, chipText))
							: null)),
				pluginPaints && backgroundNow !== 'custom'
					? React.createElement('div', { className: 'dshome-dstt-row dshome-dstt-warn' },
						React.createElement('div', { className: 'dshome-dstt-row-body' },
							React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '壁纸引擎正在渲染' : 'Wallpaper engine is rendering'),
							React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
								? 'dsh-plugin-wallpaper-engine 正在画壁纸，而这一档的流体与主题底色会盖在它上面（它的图层在 body 背景之上）。建议切到 ③ 自选背景：我们完全不画，背景交给它，颜色只驱动按钮之类。'
								: 'dsh-plugin-wallpaper-engine is painting a wallpaper, and this recipe\'s fluid plus themed background sit on top of it (its layer is above the page background). Switch to 3 Custom: we paint nothing, the background is its layer, and the colour only drives the buttons.')),
						React.createElement('button', {
							type: 'button',
							className: 'dshome-dstt-seg-btn dshome-on',
							onClick: () => pickBackground('custom')
						}, isZh ? '切到自选背景' : 'Switch to Custom'))
					: null,
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '动态背景（流体）' : 'Animated background'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '关掉后不再挂载 WebGL2 流体，也不回落到粒子 —— 背景只剩静态配色。集成显卡把流体画成方块、或风扇被它拉满时，关这个。'
							: 'Off mounts no WebGL2 fluid and no particle fallback either: the background is just the static colour. This is the switch for integrated GPUs that draw it wrong or spin the fan up.')),
					React.createElement('button', {
						type: 'button',
						role: 'switch',
						'aria-checked': ambientOn,
						className: 'dshome-dstt-seg-btn' + (ambientOn ? ' dshome-on' : ''),
						onClick: toggleAmbient
					}, ambientOn ? (isZh ? '已开启' : 'On') : (isZh ? '已关闭' : 'Off'))),
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '流体跟随笔刷' : 'Fluid follow brush'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '开启后光标会把背景流场搅出一条跟随的尾迹。它是整个模拟里最贵的一部分，默认关闭；改完刷新页面生效。'
							: 'Lets the cursor stir a trail into the background flow. It is the most expensive part of the simulation, so it is off by default; reload after changing.')),
					React.createElement('button', {
						type: 'button',
						role: 'switch',
						'aria-checked': brushOn,
						className: 'dshome-dstt-seg-btn' + (brushOn ? ' dshome-on' : ''),
						onClick: toggleBrush
					}, brushOn ? (isZh ? '已开启' : 'On') : (isZh ? '已关闭' : 'Off'))),
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '玻璃风格' : 'Glass style'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '液态：透镜折射 + 会走圈的边缘高光，更通透（本次方向）。白磨砂：此前那套白磨砂 + 蓝变光边框，观感与从前完全一致。'
							: 'Liquid: lens refraction plus a highlight that travels the border, far more translucent (the current direction). Frosted: the white frosted pane with the blue shifting border, pixel-identical to what shipped before.')),
					React.createElement('div', { className: 'dshome-dstt-seg', role: 'radiogroup', 'aria-label': isZh ? '玻璃风格' : 'Glass style' },
						DSTT_GLASS_STYLES.map((style) => React.createElement('button', {
							key: style,
							type: 'button',
							role: 'radio',
							'aria-checked': glassNow === style,
							className: 'dshome-dstt-seg-btn' + (glassNow === style ? ' dshome-on' : ''),
							onClick: () => pickGlass(style)
						}, isZh ? DSTT_GLASS_LABELS[style].zh : DSTT_GLASS_LABELS[style].en)))),
				React.createElement('div', { className: 'dshome-dstt-row' },
					React.createElement('div', { className: 'dshome-dstt-row-body' },
						React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '对话框边缘倒影' : 'Composer edge reflection'),
						React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
							? '液态下对话框边缘的折射带宽（按上下量——左右背后是连续背景，同样的位移看不出变化）。窄 8px（默认）/ 宽 16px / 无，三者都是专为这张卡片做的位移图。'
							: 'Width of the lens band at the composer edge under liquid, measured top and bottom — left and right sit over a continuous backdrop where the same displacement shows nothing. Narrow 8px (default) / Wide 16px / Off; each is a map built for this card.')),
					React.createElement('div', { className: 'dshome-dstt-seg', role: 'radiogroup', 'aria-label': isZh ? '对话框边缘倒影' : 'Composer edge reflection' },
						DSTT_COMPOSER.map((choice) => React.createElement('button', {
							key: choice,
							type: 'button',
							role: 'radio',
							'aria-checked': composerNow === choice,
							className: 'dshome-dstt-seg-btn' + (composerNow === choice ? ' dshome-on' : ''),
							onClick: () => pickComposer(choice)
						}, isZh ? DSTT_COMPOSER_LABELS[choice].zh : DSTT_COMPOSER_LABELS[choice].en)))),
					React.createElement('div', { className: 'dshome-dstt-row' },
						React.createElement('div', { className: 'dshome-dstt-row-body' },
							React.createElement('div', { className: 'dshome-dstt-row-title' }, isZh ? '背景模糊（磨砂）' : 'Backdrop blur'),
							React.createElement('div', { className: 'dshome-dstt-row-hint' }, isZh
								? '玻璃面板后面那层虚化。关闭后玻璃变成纯半透明：通透度、顶部光泽、边缘折射都保留，只是不再把背后的东西磨掉。'
								: 'The frosting behind every glass pane. Off leaves the translucency, the sheen and the edge refraction intact and only stops blurring what is behind the glass.')),
						React.createElement('button', {
							type: 'button',
							role: 'switch',
							'aria-checked': blurOn,
							className: 'dshome-dstt-seg-btn' + (blurOn ? ' dshome-on' : ''),
							onClick: toggleBlur
						}, blurOn ? (isZh ? '已开启' : 'On') : (isZh ? '已关闭' : 'Off'))),
				React.createElement('div', { className: 'dshome-dstt-status', 'data-peak': timeSliced && peakNow },
					'当前：' + colorName + ' · ' + status));
		}

		function apply(ctx) {
			// A `document.querySelector('[data-dsh-probe]')` cleanup used to run
			// here. Removing an element selected by a generic attribute deletes
			// whatever else happens to use that attribute, so it is gone: a probe
			// owns the nodes it creates and removes them itself.

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
			// dark selectors match from the first paint. The handle itself lives at
			// FACTORY scope (see its declaration): the ambient background subscribes
			// to its writes, and the ambient layer is not defined inside apply().
			ctx.effect(() => {
				const handle = createDarkSync(ctx, theme);
				darkSync = handle;
				return () => {
					if (darkSync === handle) darkSync = null;
					handle.dispose();
				};
			}, 'deepseek-style-theme: dark sync');

			// Glass-recipe marker: same idea, and it has to be on <html> before the
			// first paint of the glass surfaces or the pane flashes the other recipe.
			ctx.effect(() => createGlassSync(ctx), 'deepseek-style-theme: glass style sync');

			// Background-recipe marker: `<body data-dshome-bg>` plus, for 方式3, the
			// validated value and its kind on the same element. Same pattern as the
			// glass marker above -- one writer, one reader, and the default is
			// stamped at activation. It is <body> rather than <html> because the
			// custom rules must out-rank the per-colour body rules; see
			// createBackgroundSync for the specificity arithmetic.
			ctx.effect(() => createBackgroundSync(), 'deepseek-style-theme: background recipe');

			// Guarded product-surface patches: each block activates only while
			// its anchor class exists in the DOM.
			for (const block of PATCH_BLOCKS) {
				ctx.effect(() => installGuarded(block.anchor, block.css), 'deepseek-style-theme: patch ' + block.anchor);
			}

			// Liquid glass wins by SPECIFICITY, not by order: the patch blocks are
			// injected lazily when their anchor appears and set `background`
			// (shorthand) with !important, so every glass selector below is written
			// as `html .surface` — one type selector of extra weight — instead of
			// racing their insertion order.
			ctx.effect(() => injectStyle(GLASS_CSS, 'glass.css'), 'deepseek-style-theme: liquid glass');
			// The liquid recipe is a second sheet rather than an edit of the first:
			// every rule inside is gated on html[data-dshome-glass="liquid"], so the
			// frosted pane keeps rendering exactly what it rendered before.
			ctx.effect(() => injectStyle(LIQUID_CSS, 'liquid-glass.css'), 'deepseek-style-theme: apple liquid glass');

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

			// The ambient layer is mounted and torn down with the recipe instead of
			// once at activation. Under `custom` the user's own background IS the
			// background: a fluid wash at 0.55 over it would both hide the picture
			// and re-tint it with the colour token, which that recipe hands to the
			// buttons alone. Every other recipe mounts it, so switching back and
			// forth is live -- the only cost is one mount per switch.
			ctx.effect(() => {
				let dispose = null;
				const syncAmbient = () => {
					// The first mount waits for the durable read (see dsttSync), so a
					// saved ③ page never flashes the fluid wash before the marker lands.
					if (!dsttState.settled) return;
					// Two ways to have no animated layer: the background recipe is 自选背景
					// (the user's own picture is the background), or the layer was switched
					// off outright because this GPU draws it wrong.
					const wanted = dsttGetAmbient() && dshomeBackground() !== 'custom';
					if (wanted === (dispose !== null)) return;
					if (!wanted) {
						const stop = dispose;
						dispose = null;
						try { stop(); } catch (error) {}
						return;
					}
					try { dispose = startAmbient(); } catch (error) { dispose = () => {}; }
				};
				syncAmbient();
				const unsubscribe = dsttSubscribe(syncAmbient);
				return () => {
					unsubscribe();
					const stop = dispose;
					dispose = null;
					if (stop !== null) { try { stop(); } catch (error) {} }
				};
			}, 'deepseek-style-theme: fluid background');
			// The composer's hover tilt is independent of the background: it must
			// survive a machine without WebGL2, where startAmbient() falls back to
			// the 2D particle field.
			ctx.effect(() => {
				try { return startComposerTilt(); } catch (error) { return () => {}; }
			}, 'deepseek-style-theme: composer hover tilt');
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
				try { return watchFileCardMenu(ctx); } catch (error) { return () => {}; }
			}, 'deepseek-style-theme: delivered file card menu');
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
							brush: dsttGetBrush,
							setBrush: (next) => dsttSetBrush(ctx, next),
							glass: dsttGetGlass,
							setGlass: (next) => dsttSetGlass(ctx, next),
							composer: dsttGetComposer,
							setComposer: (next) => dsttSetComposer(ctx, next),
							blur: dsttGetBlur,
							setBlur: (next) => dsttSetBlur(ctx, next),
							background: dsttGetBackground,
							setBackground: (next) => dsttSetBackground(ctx, next),
							customBackground: dsttGetCustomBackground,
							setCustomBackground: (next) => dsttSetCustomBackground(ctx, next),
							wallpaper: dsttGetWallpaper,
							ambient: dsttGetAmbient,
							setAmbient: (next) => dsttSetAmbient(ctx, next),
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
};

// Both ids, same factory. See the note at the top of this file for why one
// literal cannot work during the rename.
try {
	window.__ModuleLoader__.load({ id: "dsh-deepseek-style-theme", factory: dshDeepseekStyleThemeFactory });
} catch (error) {}
try {
	window.__ModuleLoader__.load({ id: "@dsh-external/dsh-deepseek-style-theme", factory: dshDeepseekStyleThemeFactory });
} catch (error) {}
