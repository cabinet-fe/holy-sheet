## Why

Holy Sheet 项目需要创建一个高性能、轻量级的 Canvas 电子表格库，为 Web 应用提供接近原生 Excel 体验的表格组件。当前 Web 表格解决方案要么体积庞大，要么性能不足以处理大数据量。目标是核心包 < 60KB gzipped，支持百万级单元格渲染，保持 60fps 滚动帧率。

## What Changes

- 创建基于 Canvas 的高性能渲染引擎，支持虚拟滚动和脏矩形增量渲染
- 实现稀疏矩阵数据模型，支持 Workbook → Sheet → Cell 三层结构
- 构建分段索引布局系统，支持动态行高列宽和隐藏行列
- 设计事件驱动的交互系统，包含选区管理、单元格编辑、触摸手势
- 实现命令模式的操作系统，支持撤销/重做和事务
- 创建基于钩子的插件系统，支持功能扩展
- 建立 monorepo 项目结构，使用 pnpm workspace 管理多包

## Capabilities

### New Capabilities

- `data-model`: 核心数据模型层，包含 Workbook、Sheet、CellData、StylePool、MergeIndex 的数据结构和操作接口
- `layout-system`: 布局计算系统，包含 IndexMapper（逻辑/物理索引映射）、AccumulatorCache（累积偏移缓存）、HiddenRanges、LayoutManager
- `render-engine`: Canvas 渲染引擎，包含 SheetRenderer（主画布）、Viewport（视口管理）、DirtyRect（脏矩形追踪）、分层 Canvas 架构
- `event-system`: 事件与交互系统，包含 EventEmitter、InteractionManager（状态机）、SelectionManager、KeyboardHandler、TouchHandler、CellEditor
- `command-system`: 命令与历史系统，包含 Command 定义、CommandDispatcher、UndoStack、Transaction、内置命令集
- `plugin-system`: 插件扩展系统，包含 Plugin 接口、PluginManager、PluginContext、生命周期钩子

### Modified Capabilities

（无现有能力需要修改，这是全新项目）

## Impact

- **代码结构**: 创建 monorepo 结构 packages/core, formula, clipboard, xlsx, playground
- **技术栈**: TypeScript + tsdown + pnpm + Vitest + Playwright + VitePress
- **API 设计**: 提供框架无关的纯 JavaScript API，后续可封装 React/Vue/Svelte 组件
- **性能目标**: 首屏渲染 < 50ms，滚动 60fps，100 万单元格内存 < 200MB
- **兼容性**: 支持现代浏览器，Canvas 2D API，可选 OffscreenCanvas Worker 优化
