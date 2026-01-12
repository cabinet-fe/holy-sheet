# 开发路线与目标 (Roadmap & Goals)

> 基于 Brainstorm Session 整理

## 1. 项目愿景与目标

**Holy Sheet** 旨在基于 HTML5 Canvas 构建一个高性能、轻量级且高扩展性的电子表格核心库。

### 核心目标
*   **对标 Excel 数据模型**：支持复杂的表格数据结构，但不包含图表等非核心功能。
*   **高性能渲染**：目标支持百万级数据流畅渲染（Canvas 渲染）。
*   **高扩展性**：采用插件化架构，核心功能最小化，扩展功能通过插件实现。
*   **轻量级体积**：核心包（Core）体积目标控制在 **< 100KB (gzipped)** (核心包细分目标 < 60KB)。
*   **未来扩展**：架构设计需支持未来扩展报表功能。

### 核心定位与边界
*   **公式引擎**：作为独立插件实现，兼容 Excel 常用公式语法。
*   **样式系统**：实现共享样式池，优化内存占用。
*   **导入导出**：XLSX 导入导出以插件形式提供，核心仅关注自定义数据格式。
*   **渲染架构**：采用脏矩形 + 分层 Canvas 技术，利用 Worker 进行计算密集型任务。
*   **技术栈**：TypeScript + tsdown，保持框架无关（Framework Agnostic）。

---

## 2. 技术路线图 (Technical Roadmap)

开发过程划分为 8 个主要阶段，每个阶段有明确的交付目标。

### Phase 0: 基础设施 (Infrastructure)
*   建立 Monorepo 仓库结构。
*   配置构建工具 (tsdown)、Lint 工具、测试框架 (Vitest, Playwright)。
*   搭建文档站点与 CI/CD 流程。

### Phase 1: 核心数据层 (Core Data Layer)
*   实现 `Workbook`, `Sheet`, `Cell` 等核心数据模型。
*   实现 `StylePool` 共享样式系统。
*   实现 `MergeIndex` 合并单元格索引。
*   完成数据层的 CRUD 操作与测试。

### Phase 2: 布局与渲染 (Layout & Rendering)
*   实现 `LayoutManager` (行高列宽管理，逻辑/物理索引映射)。
*   实现 `Viewport` 虚拟滚动与缓冲区管理。
*   实现基于 Canvas 的分层渲染架构 (Main Layer, Selection Layer)。
*   实现脏矩形 (Dirty Rect) 增量渲染机制。

### Phase 3: 交互系统 (Interaction System)
*   实现事件总线 (EventBus) 与 DOM 事件绑定。
*   实现交互状态机 (Idle, Selecting, Editing, Resizing 等)。
*   实现选区管理 (SelectionManager) 与拖拽滚动。
*   实现基础的单元格编辑 (CellEditor) 与 IME 支持。

### Phase 4: 命令与历史 (Command & History)
*   设计 Command 接口与 Dispatcher 分发器。
*   实现核心编辑命令 (SetCell, InsertRow, Merge 等)。
*   实现 Undo/Redo 栈与事务管理。

### Phase 5: 插件系统 (Plugin System)
*   定义插件接口 (Manifest, Lifecycle, Hooks)。
*   实现 `PluginManager` 进行插件加载与管理。
*   实现 `PluginContext` 为插件提供核心能力注入。

### Phase 6: 核心插件实现 (Core Plugins)
*   **@holy-sheet/clipboard**: 实现复制、剪切、粘贴功能。
*   **@holy-sheet/formula**: 实现公式解析与计算引擎。
*   **@holy-sheet/history**: 实现撤销重做快捷键与面板。
*   **@holy-sheet/xlsx**: 实现 Excel 文件的导入导出。

### Phase 7: 性能优化 (Performance Optimization)
*   集成 Web Worker 处理公式计算与数据处理。
*   引入 OffscreenCanvas 优化渲染线程。
*   优化大数据量下的内存占用与渲染帧率。

### Phase 8: 生态建设 (Ecosystem)
*   完善 API 文档与使用教程。
*   开发 React/Vue 适配层组件。
*   提供丰富的示例 (Playground)。

---

## 3. 里程碑 (Milestones)

| 里程碑 | 阶段 | 交付目标 |
| :--- | :--- | :--- |
| **M0** | Phase 0 | 基础设施就绪，CI/CD跑通 |
| **M1** | Phase 1-2 | 静态表格可渲染，虚拟滚动流畅 |
| **M2** | Phase 3-4 | 表格可交互、可编辑，支持撤销重做 |
| **M3** | Phase 5-6 | 插件系统可用，支持公式与剪贴板 |
| **M4** | Phase 7 | 性能达标（百万数据），Worker 集成 |
| **M5** | Phase 8 | 1.0 正式发布，文档完善 |
