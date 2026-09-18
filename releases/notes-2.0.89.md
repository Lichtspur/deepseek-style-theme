## v2.0.89 — dsh 0.1.5-rc.2 实测通过

你说「升级主题，让它兼容最新版的 DSH」。查下来结论分两半，都得说清楚：

### 1. 代码不用改，因为它早就适配了

rc.1 那次留下的两处改动到 rc.2 依然有效，且是 rc.2 下唯一会致命的两处：

| 改动 | 不做会怎样 |
|---|---|
| 客户端注入清单去掉已删除的 `@deepseek-ai/dsh-client-runtime` | 客户端模块清单对不上，主题整个不加载 |
| 宿主端 `settings.register` / 私有 RPC 改 best-effort，并不再声明 `connection` inject | rc.2 的 cordis 守卫直接抛 `cannot get property "webServer" without inject`，**整棵插件树加载失败、dsh 起不来**（同机上 `@huanlin/dsh-plugin-mineru` 就是这么挂的） |

### 2. 缺的是「证明」，这次补上了

之前每版的验证栏都写着**真机复核未做**——审批策略是 never，起不了 headless Chrome，所以每版只能靠源码层 smoke 兜底。这次把链路搭起来了：

```
独立 DSH_HOME + 独立 profile（装最新 dsh：0.1.5-rc.2）
  → 独立端口启动 dsh web
  → 真 Chrome 152 渲染（1440×900，浅色）
  → 页内读数 + 截图
```

读数（本机 rc.2 实测）：

| 项 | 值 |
|---|---|
| `window.__dshomeBuild` | `2.0.89 rc2-verified` |
| 自检入口 | `__dshomeTilt` / `__dshomeGlassProbe` / `__dshomeDispersion` / `__dshomeFluidFormat` 全部就位 |
| 页面标记 | `body[data-dshome-color=green][data-dshome-bg=white]`、`html[data-dshome-glass=liquid][data-dshome-composer=narrow][data-dshome-blur=on]` |
| 流体背景 | `<canvas>` 全屏、`position:fixed`，正在跑 |
| 玻璃 | 对话框卡片 `blur(11px) saturate(1.75) brightness(1.05) contrast(1.02)` |
| 异常 | **0 未捕获异常 / 0 页面 error / 0 失败请求**；控制台只有主题自己两行配色 `info` |

### 装完看一眼

```js
window.__dshomeBuild   // 期望 '2.0.89 rc2-verified'
```

### 回退
`@2.0.88`（纯版本标记变更，行为一致）。
