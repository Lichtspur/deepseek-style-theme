# DeepSeek Style Theme

为 DeepSeek Harness Web GUI 复刻 DeepSeek 官网视觉的主题皮肤插件。

## 特性

- **流体粒子背景**：全屏 `<canvas>` 连线粒子，明暗两套配色
- **玻璃拟态**：侧边栏、会话卡片、输入框半透明填充 + 毛玻璃
- **明暗双主题**：深色通过 `body[data-ds-dark-theme]` 切换
- **品牌细节**：胶囊按钮、渐变主按钮、圆角卡片
- **标题栏**：默认透明，悬停变毛玻璃
- **DeepSeek 品牌链接**：点击侧边栏 DeepSeek 标识跳转 `https://www.deepseek.com/`
- **轨迹视图**：「对话 / 轨迹」标签常驻，可随时切回对话

## 安装

```bash
dsh plugin --profile web add <git-url>
```

安装后重启 web 应用（`dsh web`）即可生效。

## 目录结构

```
.
├── package.json          # dsh bundle 元数据
├── cordis.patch.yml      # insert 插件行
└── lib/
    ├── index.js          # host 空入口
    └── client.js         # 主题 client 端
```

## 许可

MIT
