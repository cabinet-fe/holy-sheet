# Holy Sheet 技术路线图

> 版本：1.0
> 更新日期：2026-01-09

## 概述

本路线图定义了 Holy Sheet 电子表格库从零到一的技术实现路径。按照模块依赖关系和功能完整性划分为多个阶段，每个阶段都有明确的交付目标。

---

## 阶段总览

```
Phase 0: 基础设施
    ↓
Phase 1: 核心数据层
    ↓
Phase 2: 布局与渲染
    ↓
Phase 3: 交互系统
    ↓
Phase 4: 命令与历史
    ↓
Phase 5: 插件系统
    ↓
Phase 6: 核心插件
    ↓
Phase 7: 性能优化
    ↓
Phase 8: 生态建设
```

---

## Phase 0: 基础设施

### 目标
搭建项目骨架，确立开发规范和工具链。

### 交付物

- [ ] 项目初始化
  - Monorepo 结构（pnpm workspace）
  - TypeScript 配置
  - tsdown 构建配置
  - ESLint + Prettier 规范

- [ ] 包结构
  ```
  packages/
  ├── core/           # @holy-sheet/core
  ├── formula/        # @holy-sheet/formula
  ├── clipboard/      # @holy-sheet/clipboard
  ├── xlsx/           # @holy-sheet/xlsx
  └── playground/     # 开发调试环境
  ```

- [ ] 测试框架
  - Vitest 单元测试
  - Playwright E2E 测试框架

- [ ] 文档站点
  - VitePress 文档框架
  - API 文档自动生成

- [ ] CI/CD
  - GitHub Actions 工作流
  - 自动化测试、构建、发布

### 技术决策
| 项目 | 选型 | 理由 |
|------|------|------|
| 包管理 | pnpm | 高效磁盘利用，原生 workspace |
| 构建 | tsdown | 轻量、快速、零配置 |
| 测试 | Vitest | 与 Vite 生态一致，快速 |
| 文档 | VitePress | Vue 生态，Markdown 友好 |

---

## Phase 1: 核心数据层

### 目标
实现完整的数据模型，支持工作簿、工作表、单元格的 CRUD 操作。

### 交付物

- [ ] **Workbook 模块**
  ```typescript
  class Workbook {
    sheets: Map<string, Sheet>
    sheetOrder: string[]
    activeSheetId: string
    styles: Record<StyleId, CellStyle>
    metadata: WorkbookMeta
  }
  ```
  - 工作表管理（增删改查、排序）
  - 活动工作表切换
  - 元数据管理

- [ ] **Sheet 模块**
  ```typescript
  class Sheet {
    id: string
    name: string
    cellData: Record<number, Record<number, CellData>>
    merges: MergeCell[]
    rowHeights: Record<number, number>
    colWidths: Record<number, number>
    frozen: FreezeConfig | null
  }
  ```
  - 单元格数据存取
  - 行列配置
  - 合并单元格管理
  - 冻结窗格

- [ ] **CellData 模块**
  ```typescript
  interface CellData {
    v?: CellValue           // 原始值
    s?: StyleId | CellStyle // 样式
    t?: CellType            // 类型
    f?: string              // 公式
    si?: string             // 共享公式 ID
    p?: RichTextData        // 富文本
    custom?: Record<string, unknown>
  }
  ```

- [ ] **StylePool 模块**
  - 共享样式表
  - 样式去重
  - 样式合并

- [ ] **MergeIndex 模块**
  - 合并单元格索引
  - O(log n) 查询
  - 视口范围查询

- [ ] **RichText 模块**
  - 富文本数据结构
  - 文本片段管理

### 测试覆盖
- 单元格读写性能测试（100 万单元格）
- 合并单元格边界测试
- 样式池去重测试

---

## Phase 2: 布局与渲染

### 目标
实现高性能的虚拟滚动和 Canvas 渲染。

### 交付物

- [ ] **LayoutManager 模块**
  - 行高/列宽管理
  - 像素→行列坐标转换
  - 可视区域计算

- [ ] **IndexMapper 模块**
  ```typescript
  class IndexMapper {
    toPhysical(logical: number): number   // O(log k)
    toLogical(physical: number): number   // O(k)
    insert(at: number, count: number): void
    delete(at: number, count: number): void
  }
  ```
  - 逻辑/物理索引映射
  - 分段存储
  - 懒更新策略

- [ ] **AccumulatorCache 模块**
  - 分块累积缓存
  - 局部失效重建
  - O(log b + blockSize) 查询

- [ ] **HiddenRanges 模块**
  - Set/区间自适应存储
  - 阈值自动切换（100）

- [ ] **Viewport 模块**
  - 虚拟滚动
  - 缓冲区预渲染
  - 滚动方向检测

- [ ] **SheetRenderer 模块**
  - 网格线绘制
  - 单元格背景（Path2D 批量）
  - 单元格内容绘制
  - 边框绘制
  - 合并单元格处理（clearRect）

- [ ] **DirtyRect 模块**
  - 脏矩形追踪
  - 增量重绘
  - globalCompositeOperation: 'copy' 平移优化

- [ ] **CacheCanvas 模块**
  - 离屏缓存
  - 滚动复用

- [ ] **分层渲染**
  ```
  DOM Layer（事件/输入）
       ↓
  Selection Canvas（选区）
       ↓
  Main Canvas（网格+内容）
  ```

### 性能目标
| 指标 | 目标值 |
|------|--------|
| 首屏渲染 | < 50ms |
| 滚动帧率 | 60fps |
| 内存占用（100万单元格） | < 200MB |

---

## Phase 3: 交互系统

### 目标
实现完整的用户交互，包括鼠标、键盘、触摸支持。

### 交付物

- [ ] **EventManager 模块**
  - DOM 事件绑定
  - 事件委托
  - 事件归一化

- [ ] **EventEmitter 模块**
  ```typescript
  class EventEmitter {
    on<T>(event: string, callback: EventCallback<T>): () => void
    once<T>(event: string, callback: EventCallback<T>): () => void
    emit<T>(event: string, data: T): void
    off(event: string, callback?: EventCallback): void
  }
  ```

- [ ] **InteractionManager 模块**
  - 状态机实现
  ```typescript
  type InteractionState =
    | { type: 'idle' }
    | { type: 'selecting', start, current }
    | { type: 'rowResizing', row, startY, startHeight }
    | { type: 'colResizing', col, startX, startWidth }
    | { type: 'filling', selection, direction }
    | { type: 'editing', pos }
  ```

- [ ] **SelectionManager 模块**
  - 单选/多选/范围选择
  - Ctrl+点击（添加选区）
  - Shift+点击（扩展选区）
  - 合并单元格扩展

- [ ] **KeyboardHandler 模块**
  - 方向键导航
  - Tab/Enter 移动
  - 快捷键支持
  - 插件钩子

- [ ] **TouchHandler 模块**
  - 点击/双击/长按
  - 滑动 + 惯性滚动
  - 双指缩放

- [ ] **AutoScroller 模块**
  - 边缘检测
  - 速度渐变
  - 平滑滚动

- [ ] **CellEditor 模块**
  - 输入框定位
  - IME 输入处理
  - 公式编辑模式

- [ ] **ContextMenu 模块**
  - 内置菜单项
  - 插件扩展接口
  - 分组/分隔符

---

## Phase 4: 命令与历史

### 目标
实现命令模式，支持撤销/重做和事务。

### 交付物

- [ ] **Command 定义**
  ```typescript
  interface Command<T = unknown> {
    type: string
    payload: T
    undo?: UndoData
  }
  ```

- [ ] **CommandDispatcher 模块**
  - 命令分发
  - 前置/后置钩子
  - 命令合并（300ms 窗口）

- [ ] **CommandHandler 模块**
  - 处理器注册
  - 执行逻辑
  - Undo 数据生成

- [ ] **UndoStack 模块**
  - 撤销/重做栈
  - 历史大小限制（100）
  - 分组撤销

- [ ] **Transaction 模块**
  - 批量操作
  - 原子提交
  - 回滚支持

- [ ] **内置命令**
  | 命令 | 说明 |
  |------|------|
  | SET_CELL | 设置单元格值 |
  | SET_CELLS | 批量设置 |
  | CLEAR_CELLS | 清除单元格 |
  | INSERT_ROWS | 插入行 |
  | DELETE_ROWS | 删除行 |
  | INSERT_COLS | 插入列 |
  | DELETE_COLS | 删除列 |
  | SET_ROW_HEIGHT | 设置行高 |
  | SET_COL_WIDTH | 设置列宽 |
  | HIDE_ROWS/SHOW_ROWS | 隐藏/显示行 |
  | HIDE_COLS/SHOW_COLS | 隐藏/显示列 |
  | MERGE_CELLS | 合并单元格 |
  | UNMERGE_CELLS | 取消合并 |
  | SET_STYLE | 设置样式 |
  | ADD_SHEET | 添加工作表 |
  | DELETE_SHEET | 删除工作表 |
  | RENAME_SHEET | 重命名工作表 |
  | MOVE_SHEET | 移动工作表 |

---

## Phase 5: 插件系统

### 目标
实现灵活的插件架构，支持功能扩展。

### 交付物

- [ ] **PluginManifest**
  ```typescript
  interface PluginManifest {
    name: string
    version: string
    description?: string
    dependencies?: string[]
  }
  ```

- [ ] **Plugin 接口**
  ```typescript
  interface Plugin {
    manifest: PluginManifest
    onInstall?(ctx: PluginContext): void
    onUninstall?(ctx: PluginContext): void
    onWorkbookCreate?(ctx, workbook): void
    // 数据钩子
    onCellGet?(ctx, pos, data): CellData | null | void
    onCellSet?(ctx, pos, data): CellData | false
    // 命令钩子
    onBeforeCommand?(ctx, cmd): Command | false
    onAfterCommand?(ctx, cmd, result): void
    // 渲染钩子
    onCellRender?(ctx, info): CellRenderInfo | void
    // 交互钩子
    onCellClick?(ctx, e): boolean
    onKeyDown?(ctx, e): boolean
    onKeyUp?(ctx, e): boolean
  }
  ```

- [ ] **PluginManager 模块**
  - 插件注册/卸载
  - 依赖解析
  - 生命周期管理

- [ ] **PluginContext 模块**
  - Workbook 访问
  - CommandDispatcher 访问
  - EventEmitter 访问
  - LayoutManager 访问
  - 状态存储

---

## Phase 6: 核心插件

### 目标
实现常用功能插件。

### 交付物

- [ ] **@holy-sheet/clipboard**
  - 复制/剪切/粘贴
  - 跨表格粘贴
  - 格式保留
  - 纯文本/HTML 格式

- [ ] **@holy-sheet/formula**
  - 公式解析器
  - 常用函数（SUM、AVERAGE、IF、VLOOKUP 等）
  - 依赖追踪
  - 循环引用检测
  - 增量计算

- [ ] **@holy-sheet/history**
  - Ctrl+Z/Y 快捷键
  - 历史面板 UI

- [ ] **@holy-sheet/xlsx**
  - xlsx 文件导入
  - xlsx 文件导出
  - 样式映射
  - 公式兼容

---

## Phase 7: 性能优化

### 目标
针对大数据量场景进行深度优化。

### 交付物

- [ ] **Worker 集成（Phase 1）**
  - 公式计算 Worker
  - 排序/筛选 Worker
  - 数据处理 Worker

- [ ] **渲染优化**
  - 字体缓存
  - 文本测量缓存
  - Path2D 对象池
  - 层级合并

- [ ] **内存优化**
  - 稀疏数据压缩
  - 视口外数据卸载
  - 样式池优化

- [ ] **OffscreenCanvas（Phase 2）**
  - Worker 中渲染
  - 主线程合成
  - 帧同步

### 性能基准
| 场景 | 目标 |
|------|------|
| 100 万单元格加载 | < 1s |
| 大范围选择 | 60fps |
| 公式计算（1000 个） | < 100ms |
| 排序（10 万行） | < 500ms |

---

## Phase 8: 生态建设

### 目标
完善文档和示例，建设开发者生态。

### 交付物

- [ ] **完整 API 文档**
  - 核心 API
  - 插件 API
  - 类型定义

- [ ] **教程系列**
  - 快速开始
  - 基础用法
  - 高级特性
  - 插件开发

- [ ] **示例集合**
  - 基础表格
  - 带公式表格
  - 大数据表格
  - 自定义渲染
  - 插件示例

- [ ] **框架适配**
  - React 组件封装
  - Vue 组件封装
  - Svelte 组件封装

- [ ] **开发者工具**
  - Chrome DevTools 扩展
  - 性能分析工具
  - 调试辅助

---

## 里程碑

| 里程碑 | 阶段 | 交付目标 |
|--------|------|----------|
| M0 | Phase 0 | 项目基础设施就绪 |
| M1 | Phase 1-2 | 静态表格渲染（只读） |
| M2 | Phase 3-4 | 交互式表格（可编辑） |
| M3 | Phase 5-6 | 完整功能表格（带公式） |
| M4 | Phase 7 | 高性能版本 |
| M5 | Phase 8 | 正式发布 1.0 |

---

## 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Canvas 渲染性能瓶颈 | 大数据量卡顿 | 分层渲染、脏矩形、Worker |
| 公式引擎复杂度 | 兼容性不足 | 渐进实现，优先常用函数 |
| 内存占用过高 | 浏览器崩溃 | 稀疏存储、视口卸载 |
| 跨浏览器兼容性 | 功能异常 | 特性检测、Polyfill |
| 触摸设备适配 | 交互体验差 | 专门的触摸处理层 |

---

## 附录：核心包体积预算

| 模块 | 预算 (gzip) |
|------|-------------|
| model/ | 8KB |
| layout/ | 6KB |
| render/ | 15KB |
| event/ | 10KB |
| command/ | 5KB |
| plugin/ | 4KB |
| utils/ | 4KB |
| 其他 | 8KB |
| **总计** | **< 60KB** |

---

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-09 | 1.0 | 初始版本 |
