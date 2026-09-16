# Third-party notices

This plugin contains code from, and borrows a visual technique from, the
following MIT-licensed projects. Their notices are reproduced in full below and
must be preserved in every redistribution.

---

## dsh-theme-mineradio — code included`lib/client.js` contains a port of the fluid-shader subsystem and the glass
dispersion / specular-parallax subsystem of **dsh-theme-mineradio v2.3.8**:

- the three GLSL programs (`VERTEX_SHADER`, `FLOW_SHADER`, `DISPLAY_SHADER`) and
  the `SITE_FLUID_PARAMS` default set,
- the WebGL2 two-pass fluid solver (`attachFluidShader`),
- the pointer/click interaction feeds (`attachFluidInteractions`),
- the SVG chromatic-dispersion filter and its generators
  (`startGlassDispersion`, `buildDisplacementMapDataUrl`, `tintMatrix`,
  `supportsSvgBackdropFilter`),
- the specular cursor parallax (`startSpecularParallax`).

One further technique is **re-expressed, not copied** (v2.0.88): the docked bottom bar,
in which the composer and its stats line become a single glass slab with the backdrop
blur on the wrapper's `::before`, the inner surfaces transparent, and one hairline at
the seam. That structure comes from mineradio's "fused" state
(`[data-dsh-inputbar]:has([data-dsh-stats])`), including two of its recorded lessons:
`z-index` rather than `isolation` on the wrapper (isolation is also a backdrop root and
would clip popup frost to the bar) and `backdrop-filter: none` on the inner surfaces so
their blur cannot double up with the slab's. The declarations here are written against
this plugin's own tokens (`--dshome-*`), not mineradio's `--dsh-aqua-*`.

Only naming and external dependencies were adapted: plugin-scoped identifiers
were renamed to this plugin's `dshome-` prefix, and the upstream settings/theme
store and React layer were replaced by function parameters. **The GLSL shader
sources are copies of upstream, with two recorded deviations:**

1. **(v2.0.74)** the `precision mediump float;` qualifier in FLOW_SHADER and
   DISPLAY_SHADER was changed to `precision highp float;`. The reason is a
   rendering defect, not a feature: under ANGLE/D3D11 on Intel integrated GPUs
   `mediump` is a real 16-bit float (`min16float`), and the display shader's noise
   needs roughly 24 bits of mantissa, so at 16 bits the hash collapses into
   constant plateaus and the noise lattice shows up as large drifting squares.
   WebGL2 guarantees highp in fragment shaders, and on GPUs that promoted mediump
   to 32 bits the change is a no-op.
2. **(v2.0.86)** DISPLAY_SHADER's `random(vec2 st)` -- upstream's classic
   `fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123)` -- was replaced by
   Dave Hoskins' sin-free hash (`fract(vec3(p.xyx) * 0.1031)` plus one dot and one
   multiply). The reason is the same class of defect, one layer down and this time
   precision-independent: this shader scales the noise coordinate to ~1e5
   (`uv *= ns * u_resolution`, doubled again for `n2`), and at that magnitude the
   error left by `sin()`'s argument reduction in float32 is multiplied by 43758
   into ~100 units, so neighbouring cells receive nearly the same value and the
   warp field degenerates into flat plateaus with hard edges (measured on an Intel
   Arc 130V: 39.6% flat 8x8 blocks, an 800x1000px plateau, 60-90/255 jumps along
   its boundary -- the user's 大方块). The sin-free hash keeps every intermediate
   small, so it behaves identically on every GPU, and it preserves upstream's
   per-cell white noise rather than shrinking the domain warp (which would cure the
   symptom by removing the effect). `noise()`'s interpolation and every other line
   of every shader are unchanged.

The two deviations are related on purpose: deviation 1 fixed a 16-bit intermediate
precision collapse, deviation 2 the 32-bit argument-magnitude collapse that
survived it. Both were diagnosed from the same symptom on the same machine class,
and both were verified there rather than assumed.

Upstream notes that its fluid shader is itself a faithful port of the
`ds-join-shader-bg` shader in the deepseek.com site bundle, with the shader
sources taken verbatim from that bundle. That provenance is upstream's; it is
recorded here so anyone auditing this file knows where the GLSL ultimately came
from. If you redistribute this plugin, that chain is yours to evaluate.

```
MIT License

Copyright (c) 2026 John Wu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## deepseek-harness-background — visual technique imitated, no code copied

The "liquid glass" recipe in this plugin's `GLASS_CSS` block — a translucent
fill, a vertical sheen gradient, the shared
`blur() saturate() brightness() contrast()` backdrop chain, the inset top
highlight plus hairline ring, and a brighter fill on hover — is modelled on the
glass styling of **deepseek-harness-background** by HaoyueQin. It is a
re-expression of the technique against this plugin's own selectors and its own
`--dshome-glass-*` custom properties; no source from that project is copied, and
its CSS is not redistributed here.

Credited because the technique and its defaults are that project's work.

```
MIT License

Copyright (c) 2026 HaoyueQin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
