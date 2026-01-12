# 详细开发计划 (Development Plan)

> 基于 Brainstorm Session 与 Development Plan 整理

## Phase 0: 基础设施搭建 (Infrastructure)

### 0.1 项目初始化
- [ ] 创建 GitHub 仓库
- [ ] 初始化 pnpm workspace (Monorepo)
- [ ] 配置 TypeScript (strict 模式)
- [ ] 配置 tsdown 构建流程
- [ ] 配置 ESLint + Prettier 代码规范
- [ ] 添加 .gitignore, LICENSE, README

### 0.2 包结构搭建
- [ ] 创建 `packages/core` (核心库)
- [ ] 创建 `packages/formula` (公式插件)
- [ ] 创建 `packages/clipboard` (剪贴板插件)
- [ ] 创建 `packages/xlsx` (导入导出插件)
- [ ] 创建 `packages/playground` (调试环境)

### 0.3 测试与 CI
- [ ] 配置 Vitest 单元测试环境
- [ ] 配置 Playwright E2E 测试环境
- [ ] 创建 GitHub Actions 工作流 (Build & Test)
- [ ] 配置自动发布流程 (Changesets 或 Semantic Release)

---

## Phase 1: 核心数据层 (Core Data Layer)

### 1.1 基础类型定义
- [ ] 定义 `CellValue`, `CellType` 枚举与类型
- [ ] 定义 `CellData` 接口
- [ ] 定义 `CellStyle` 接口
- [ ] 定义 `MergeCell` 接口

### 1.2 Workbook 实现
- [ ] 实现 `Workbook` 类基础结构
- [ ] 实现 Sheet 管理 (Add, Remove, Rename)
- [ ] 实现 Active Sheet 切换逻辑
- [ ] 实现 `StylePool` 样式池管理

### 1.3 Sheet 实现
- [ ] 实现 `Sheet` 类基础结构
- [ ] 实现基于稀疏矩阵的 `cellData` 存储
- [ ] 实现行高/列宽配置存储
- [ ] 实现默认值管理

### 1.4 MergeIndex 实现
- [ ] 实现 `MergeIndex` 类
- [ ] 实现合并单元格的快速查询 (`getMergeAt`)
- [ ] 实现视口范围内的合并单元格查询

---

## Phase 2: 布局与渲染 (Layout & Render)

### 2.1 布局管理器 (LayoutManager)
- [ ] 实现 `IndexMapper` (逻辑索引 <-> 物理索引映射)
- [ ] 实现 `AccumulatorCache` (行高累积缓存，分块优化)
- [ ] 实现 `HiddenRanges` (隐藏行列管理)
- [ ] 实现 `LayoutManager` 统一接口 (pixel <-> cell 坐标转换)

### 2.2 视口管理 (Viewport)
- [ ] 实现 `Viewport` 类
- [ ] 实现可视区域计算
- [ ] 实现虚拟滚动缓冲区策略

### 2.3 渲染引擎 (SheetRenderer)
- [ ] 实现分层 Canvas 架构 (Main, Selection)
- [ ] 实现网格线绘制
- [ ] 实现 `drawBackgrounds` (Path2D 批量绘制优化)
- [ ] 实现 `drawContents` (文本与内容绘制)
- [ ] 实现 `drawBorders` (边框绘制)
- [ ] 实现合并单元格的渲染处理

### 2.4 渲染优化
- [ ] 实现 `DirtyRect` 脏矩形追踪机制
- [ ] 实现增量重绘逻辑
- [ ] 实现 Canvas 平移优化 (`globalCompositeOperation: 'copy'`)

---

## Phase 3: 交互系统 (Interaction System)

### 3.1 事件基础
- [ ] 实现 `EventEmitter` 事件总线
- [ ] 实现 `EventManager` (DOM 事件绑定与坐标归一化)

### 3.2 交互逻辑
- [ ] 实现 `InteractionManager` 状态机
- [ ] 实现 `SelectionManager` (选区模型，支持多选、扩展)
- [ ] 实现 `KeyboardHandler` (方向键导航、快捷键)
- [ ] 实现 `TouchHandler` (触摸手势支持)
- [ ] 实现 `AutoScroller` (拖拽边缘自动滚动)

### 3.3 UI 组件
- [ ] 实现 `CellEditor` (DOM 输入框定位与同步)
- [ ] 实现 IME 输入合成事件处理
- [ ] 实现 `ContextMenu` (右键菜单架构)

---

## Phase 4: 命令与历史 (Command & History)

### 4.1 命令系统架构
- [ ] 定义 `Command` 接口与 `CommandResult`
- [ ] 实现 `CommandDispatcher` (命令分发与执行)
- [ ] 实现命令合并逻辑 (连续输入优化)

### 4.2 撤销重做
- [ ] 实现 `UndoStack` (撤销/重做栈)
- [ ] 实现事务机制 (`beginTransaction`, `commit`)
- [ ] 实现基础编辑命令 (SetCell, InsertRow/Col, Resize 等)

---

## Phase 5: 插件系统 (Plugin System)

### 5.1 插件架构
- [ ] 定义 `Plugin` 接口与生命周期
- [ ] 实现 `PluginManager` (加载、卸载、依赖管理)
- [ ] 实现 `PluginContext` (上下文注入)

### 5.2 钩子系统
- [ ] 实现数据读写钩子 (`onCellGet`, `onCellSet`)
- [ ] 实现命令拦截钩子 (`onBeforeCommand`)
- [ ] 实现渲染钩子 (`onCellRender`)
- [ ] 实现交互钩子 (`onCellClick`, `onKeyDown` 等)

---

## Phase 6: 核心插件 (Core Plugins)

### 6.1 剪贴板插件 (@holy-sheet/clipboard)
- [ ] 实现 `copy`, `cut`, `paste` 命令
- [ ] 实现 HTML/Text 格式转换
- [ ] 实现跨表格粘贴

### 6.2 公式插件 (@holy-sheet/formula)
- [ ] 实现公式解析器 (Lexer/Parser)
- [ ] 实现基础函数库 (SUM, AVERAGE 等)
- [ ] 实现依赖追踪与重算机制

### 6.3 历史记录插件 (@holy-sheet/history)
- [ ] 封装 Undo/Redo 命令与快捷键

### 6.4 XLSX 插件 (@holy-sheet/xlsx)
- [ ] 集成 xlsx 解析库 (如 exceljs 或 sheetjs 简化版)
- [ ] 实现导入与导出适配

---

## Phase 7: 性能优化 (Performance)

### 7.1 并行计算
- [ ] 封装 Worker 通信层
- [ ] 将公式计算移至 Worker
- [ ] 将排序/筛选移至 Worker

### 7.2 渲染进阶
- [ ] 字体测量缓存优化
- [ ] 探索 OffscreenCanvas Worker 渲染

---

## Phase 8: 生态与发布 (Ecosystem)

### 8.1 文档
- [ ] 搭建 VitePress 文档站
- [ ] 编写 API 文档
- [ ] 编写核心概念教程

### 8.2 框架适配
- [ ] 开发 React Wrapper 组件
- [ ] 开发 Vue Wrapper 组件

### 8.3 示例与发布
- [ ] 完善 Playground 示例
- [ ] 发布 1.0 正式版
