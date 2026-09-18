## v2.0.80 — 发送按钮的跳动：我们自己的最后一条 hover 位移

你说剩下的现象是**发送按钮跳动**——查下来确实是我们的：

- 2.0.79 收掉的是**倾斜**的 `scale(1.01)`（整张卡片 757↔765）；
- 但 `.uV2eYG_primary:hover` 上还有一条**我们写的** `transform:translateY(-1px)`（当初给主按钮做的样式），**1px 的表面位移**同样足以把 hover 交给邻居或列的宽度把手——和 2.0.79 是同一类闭环，只是幅度更小、更快。

**改法**：`.uV2eYG_primary:hover` 只保留阴影，去掉 `transform`。产品自己对这颗按钮的 hover 只改背景色，所以现在**指针底下没有任何东西会移动它**。

### 顺带一件家务

写这版注释时我又把 `translateY(-1px)` 用反引号包了起来 —— **第四次**把 CORE_CSS 的模板字面量提前闭合（`node --check` 当场抓到）。原来的守卫只查「背景配方」那一段注释；现在改成**整表扫描**：从 `const CORE_CSS = \`` 走到第一个后面紧跟分号的反引号（真正的终止符），中间还有反引号就判失败。四次里三次是我干的，这次终于全表覆盖。

### 复验

装上后把鼠标停在发送按钮上 8 秒：跳动应当消失。`window.__dshomeBuild` → **`2.0.80 no-hover-motion`**。

如果还在跳，请跑下面这段（8 秒，逐帧）——它专门回答"还剩哪种可能"：

```js
(() => {
  const card = document.querySelector('[data-composer-card],.uV2eYG_card');
  if (!card) return console.log('no card');
  let px = -1, py = -1, last = '', n = 0, replaced = 0;
  addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; }, true);
  const nm = (el) => el ? el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\s+/)[0].slice(0, 18) : 'null';
  const snap = () => {
    const btn = card.querySelector('button.uV2eYG_primary');
    if (btn && !btn.hasAttribute('data-probe')) { replaced += 1; btn.setAttribute('data-probe', '1'); }
    const r = btn ? btn.getBoundingClientRect() : null;
    return 'btn=' + (btn ? (r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(',') : '-') : 'gone')
      + ' hov=' + (btn && btn.matches(':hover') ? 1 : 0)
      + ' replaced=' + replaced
      + ' tilt=' + (card.style.transform ? 'on' : 'off')
      + ' under=' + nm(document.elementFromPoint(px, py));
  };
  const t0 = performance.now();
  const tick = () => { const s = snap(); if (s !== last) { n++; console.log('+' + Math.round(performance.now()) + ' #' + n + ' ' + s); last = s; } if (performance.now() - t0 < 8000) requestAnimationFrame(tick); else console.log('done #' + n + ' replaced=' + replaced); };
  requestAnimationFrame(tick);
  console.log('把鼠标停在发送按钮上 8 秒');
})()
```

判读：
- **`btn=` 矩形不变、`tilt=off`、只有 `hov` 在 1↔0 之间翻** → 指针下有重叠元素在抢 hover（`under=` 会给出名字），我按同样方法处理；
- **`replaced=` 一直涨** → 产品在流式期间**反复重建这颗按钮节点**（React key 变化），节点一换 hover 就丢一次——纯产品侧，只能记录 + 上报；
- **`tilt=on` 还在闪** → 说明倾斜仍在按钮附近触发（那我的 `TILT_INTERACTIVE` 守卫漏了某个包裹层），把 `under=` 的名字发我即可。

### 验证账
`node --check` 两个文件；`bg-recipes-smoke` **60/60**；`dstt-schema-smoke` **29/29**；`bridge-smoke` **26/26**。

### 退路
`@2.0.79`（倾斜收手）、`@2.0.78`（断滚动条链）、`@2.0.77`（壁纸引擎提示）。
