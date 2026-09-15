# Third-party notices

This plugin contains code from, and borrows a visual technique from, the
following MIT-licensed projects. Their notices are reproduced in full below and
must be preserved in every redistribution.

---

## dsh-theme-mineradio — code included

`lib/client.js` contains a port of the fluid-shader subsystem and the glass
dispersion / specular-parallax subsystem of **dsh-theme-mineradio v2.3.8**:

- the three GLSL programs (`VERTEX_SHADER`, `FLOW_SHADER`, `DISPLAY_SHADER`) and
  the `SITE_FLUID_PARAMS` default set,
- the WebGL2 two-pass fluid solver (`attachFluidShader`),
- the pointer/click interaction feeds (`attachFluidInteractions`),
- the SVG chromatic-dispersion filter and its generators
  (`startGlassDispersion`, `buildDisplacementMapDataUrl`, `tintMatrix`,
  `supportsSvgBackdropFilter`),
- the specular cursor parallax (`startSpecularParallax`).

Only naming and external dependencies were adapted: plugin-scoped identifiers
were renamed to this plugin's `dshome-` prefix, and the upstream settings/theme
store and React layer were replaced by function parameters. **The GLSL shader
sources are copies of upstream, with one recorded deviation (v2.0.74): the
`precision mediump float;` qualifier in FLOW_SHADER and DISPLAY_SHADER was
changed to `precision highp float;`.** The reason is a rendering defect, not a
feature: under ANGLE/D3D11 on Intel integrated GPUs `mediump` is a real 16-bit
float (`min16float`), and the display shader's noise --
`fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123)` -- needs roughly 24
bits of mantissa, so at 16 bits the hash collapses into constant plateaus and the
noise lattice shows up as large drifting squares. WebGL2 guarantees highp in
fragment shaders, and on GPUs that promoted mediump to 32 bits the change is a
no-op. Every other line of every shader is unchanged.

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
