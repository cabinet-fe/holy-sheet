# Holy Sheet 架构头脑风暴记录

> 日期：2026-01-08 ~ 2026-01-09
> 状态：已完成

## 项目目标

基于 Canvas 实现高性能电子表格开源库：
- 数据模型对标 Excel（不含图表）
- 百万级数据渲染性能
- 高扩展性 + 插件系统
- 核心包体积 < 100KB gzipped
- 支持未来扩展报表功能

---

## 第一轮：核心定位与边界

### 确定的需求

1. **公式引擎**：常用公式，兼容 Excel 语法，作为插件实现
2. **样式系统**：共享样式池，低内存占用
3. **条件格式/数据验证**：暂不对标
4. **xlsx 导入导出**：插件形式，自定义格式优先
5. **渲染架构**：脏矩形 + 分层 Canvas，考虑离屏 Canvas + Worker
6. **体积目标**：gzip < 100KB
7. **技术栈**：TypeScript + tsdown，框架无关

---

## 第二轮：核心架构模块拆解

### 核心包结构 (`@holy-sheet/core`) - 目标 < 60KB gzipped

```
core/
├── model/          # 数据模型
│   ├── Workbook    # 工作簿
│   ├── Sheet       # 工作表
│   ├── Cell        # 单元格（轻量引用）
│   └── StylePool   # 共享样式池
├── render/         # 渲染系统
│   ├── Viewport    # 视口管理（虚拟滚动）
│   ├── LayerManager# 分层管理
│   ├── DirtyRect   # 脏矩形追踪
│   └── Bindable    # 渲染器抽象接口
├── layout/         # 布局系统
│   ├── RowManager  # 行高管理（支持动态行高）
│   ├── ColManager  # 列宽管理
│   └── MergeIndex  # 合并单元格索引
├── event/          # 事件系统
│   ├── EventBus    # 事件总线
│   ├── Bindable    # 交互绑定抽象
│   └── Selection   # 选区模型
├── command/        # 命令系统
│   ├── Command     # 命令基类
│   └── Scheduler   # 命令调度（批量优化）
└── plugin/         # 插件系统
    ├── PluginHost  # 插件宿主
    └── hooks/      # 生命周期钩子
```

---

## 第三轮：渲染系统设计（已确认）

### 参考 Univer 的高效绘制技术

1. **Path2D 批量绘制**：按颜色分组，减少 draw call
2. **网格线**：先画全部线，再 clearRect 清除合并区域内部
3. **脏矩形增量渲染**：`globalCompositeOperation: 'copy'` 平移 + clip 重绘差异区域

### CellData 精简设计（已确认）

```typescript
interface CellData {
  v: CellValue          // value: 原始值
  s?: StyleId           // style: 样式ID
  f?: string            // formula: 公式文本 "=SUM(A1:A10)"
  t?: CellType          // type: 强制类型 (n/s/b/d/e)
  m?: unknown           // metadata: 插件扩展数据
}

type CellValue = string | number | boolean | null
type CellType = 'n' | 's' | 'b' | 'd' | 'e'  // number/string/boolean/date/error
```

### 渲染分层（已确认）

```
┌─────────────────────────────────────────┐
│  DOM Layer (事件捕获、输入、滚动)          │
│  ┌─────────────────────────────────────┐│
│  │ <input> 单元格编辑器 (隐藏/显示)      ││
│  │ <div> 滚动容器                       ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Canvas: Selection Layer (选区/拖拽)     │  ← 频繁重绘，独立canvas
├─────────────────────────────────────────┤
│  Canvas: Main Layer (网格+内容)          │  ← 脏矩形重绘
└─────────────────────────────────────────┘
```

### MergeIndex 设计（已确认）

```typescript
class MergeIndex {
  private merges: MergeCell[] = []
  private rowIndex: Map<number, MergeCell[]> = new Map()  // 行索引

  getMergeAt(row: number, col: number): MergeCell | null
  isMasterCell(row: number, col: number): boolean
  isSlaveCell(row: number, col: number): boolean
  getMergesInViewport(startRow, endRow, startCol, endCol): MergeCell[]
}
```

### 渲染流程

```typescript
draw(ctx, bound) {
  // 1. 绘制网格线
  this.drawGridLines(ctx, bound)
  // 2. 清除合并单元格内部的网格线
  this.clearMergeGridLines(ctx, bound)
  // 3. 绘制单元格背景（Path2D 批量）
  this.drawBackgrounds(ctx, bound)
  // 4. 绘制单元格内容
  this.drawContents(ctx, bound)
  // 5. 绘制边框
  this.drawBorders(ctx, bound)
}
```

### Worker 策略（已确认）

- **Phase 1**：主线程渲染，Worker 只做数据计算（公式、排序、筛选）
- **Phase 2**：OffscreenCanvas 在 Worker 中渲染，主线程只做合成

---

## 第四轮：布局系统设计（已确认）

### 数据存储：逻辑索引映射法（分段 + 懒更新）

```typescript
interface Segment {
  logicalStart: number   // 逻辑起始索引
  physicalStart: number  // 物理起始索引
  count: number          // 该段包含的行/列数
}

class IndexMapper {
  private segments: Segment[] = [
    { logicalStart: 0, physicalStart: 0, count: Infinity }
  ]

  toPhysical(logical: number): number   // O(log k)
  toLogical(physical: number): number   // O(k)
  insert(at: number, count: number): void  // O(k)
  delete(at: number, count: number): void  // O(k)
  compact(): void  // 合并相邻段
}
```

### 累积偏移缓存（分块缓存）

```typescript
const BLOCK_SIZE = 1000  // 每 1000 行为一个块

class AccumulatorCache {
  private blockAccum: number[] = []  // blockAccum[i] = 第 0 ~ i*blockSize 行的总高度
  private dirty = true

  getOffset(index: number): number      // O(log b + blockSize)
  getIndexAtOffset(offset: number): number  // O(log b + blockSize)
  invalidateFrom(index: number): void   // 局部失效
  rebuildFrom(fromIndex: number): void  // 增量重建
}
```

### 隐藏行列存储

```typescript
class HiddenRanges {
  private set: Set<number> = new Set()
  private intervals: Array<[number, number]> | null = null
  private readonly THRESHOLD = 100

  // < 100 个：Set 存储
  // >= 100 个：自动压缩为区间
}
```

### LayoutManager 完整接口

```typescript
class LayoutManager {
  // 查询
  getRowHeight(row): number
  getColWidth(col): number
  getRowOffset(row): number
  getColOffset(col): number
  getCellAtPoint(x, y): CellPos
  getVisibleRange(scroll, size): ViewRange

  // 修改
  setRowHeight(row, height): void
  setColWidth(col, width): void
  insertRows(at, count): void
  deleteRows(at, count): void
  hideRows(rows[]): void
  showRows(rows[]): void

  // 事务
  beginTransaction(): void
  endTransaction(): void
}
```

### 性能特性

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 获取行高/列宽 | O(log k) | k = 段数量 |
| 获取偏移量 | O(log b + blockSize) | b = 块数量 |
| 像素→行列 | O(log b + blockSize) | 二分+块内线性 |
| 插入/删除行列 | O(k) | 只更新映射表 |
| 修改行高/列宽 | O(1) | 局部失效缓存 |

---

## 第五轮：命令系统设计（已确认）

### Command 定义

```typescript
interface Command<T = unknown> {
  type: string
  payload: T
  undo?: UndoData
}

type CommandType =
  | 'SET_CELL' | 'SET_CELLS' | 'CLEAR_CELLS'
  | 'INSERT_ROWS' | 'DELETE_ROWS' | 'INSERT_COLS' | 'DELETE_COLS'
  | 'SET_ROW_HEIGHT' | 'SET_COL_WIDTH'
  | 'HIDE_ROWS' | 'SHOW_ROWS' | 'HIDE_COLS' | 'SHOW_COLS'
  | 'MERGE_CELLS' | 'UNMERGE_CELLS'
  | 'SET_STYLE'
  | 'ADD_SHEET' | 'DELETE_SHEET' | 'RENAME_SHEET' | 'MOVE_SHEET'
```

### CommandDispatcher

```typescript
class CommandDispatcher {
  private handlers: Map<string, CommandHandler>
  private undoStack: UndoData[][]  // 按组
  private redoStack: UndoData[][]
  private transaction: UndoData[] | null
  private beforeHooks[] / afterHooks[]

  // 命令合并（连续输入）
  private lastCommand: Command | null
  private lastCommandTime: number
  private mergeWindow = 300  // 300ms

  execute(type, payload): CommandResult
  undo(): boolean
  redo(): boolean
  beginTransaction(): void
  commit(): void
  rollback(): void
  breakMerge(): void  // 打断合并
  onBefore(hook): () => void
  onAfter(hook): () => void
}
```

### 设计决策

- **历史大小**：默认 100 个撤销步骤
- **嵌套事务**：不支持
- **命令序列化**：暂不实现，接口预留（用于协同编辑）
- **命令合并**：300ms 内同一单元格的连续输入合并为一个撤销单元

---

## 第六轮：事件系统设计（已确认）

### 事件总线

```typescript
class EventEmitter {
  on<T>(event: string, callback: EventCallback<T>): () => void
  once<T>(event: string, callback: EventCallback<T>): () => void
  emit<T>(event: string, data: T): void
  off(event: string, callback?: EventCallback): void
}
```

### 事件类型

```typescript
const Events = {
  CELL_CLICK: 'cell:click',
  CELL_DBLCLICK: 'cell:dblclick',
  CELL_CONTEXTMENU: 'cell:contextmenu',
  SELECTION_START: 'selection:start',
  SELECTION_CHANGE: 'selection:change',
  SELECTION_END: 'selection:end',
  EDIT_START: 'edit:start',
  EDIT_CHANGE: 'edit:change',
  EDIT_END: 'edit:end',
  SCROLL: 'scroll',
  VIEWPORT_CHANGE: 'viewport:change',
  ROW_RESIZE_START/ROW_RESIZE/ROW_RESIZE_END,
  COL_RESIZE_START/COL_RESIZE/COL_RESIZE_END,
}
```

### 交互状态机

```typescript
type InteractionState =
  | { type: 'idle' }
  | { type: 'selecting', start: CellPos, current: CellPos }
  | { type: 'rowResizing', row, startY, startHeight }
  | { type: 'colResizing', col, startX, startWidth }
  | { type: 'filling', selection, direction }
  | { type: 'editing', pos: CellPos }
```

### 选区管理

```typescript
class SelectionManager {
  private selections: Selection[]

  setRange(start, end): void
  addRange(start, end): void      // Ctrl+点击
  extendTo(pos): void             // Shift+点击
  move(deltaRow, deltaCol, extend): void  // 键盘导航
  selectAll(): void
  expandForMerge(selection): Range  // 合并单元格扩展
}
```

### 触摸事件支持（已确认）

```typescript
class TouchHandler {
  // 点击 → 选择单元格
  // 双击 → 进入编辑
  // 长按 → 显示右键菜单
  // 滑动 → 滚动（支持惯性滚动）
  // 双指 → 缩放
}
```

### 拖拽自动滚动（已确认）

```typescript
class AutoScroller {
  private EDGE_THRESHOLD = 50    // 边缘感应距离
  private BASE_SPEED = 10        // 基础滚动速度
  private MAX_SPEED = 50         // 最大滚动速度

  start(): void
  stop(): void
  updateMousePosition(x, y): void
}
```

### 右键菜单（已确认）

```typescript
class ContextMenu {
  // 内置菜单项
  private builtinItems: MenuItem[] = [
    { id: 'cut', label: '剪切', shortcut: 'Ctrl+X' },
    { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
    { id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
    // ... 插入行/列、删除、合并、清除等
  ]

  // 插件扩展
  registerItems(groupId, items, position?, referenceId?): void
  unregisterItems(groupId): void

  // DOM 实现，可自定义样式
  show(x, y, context?): void
  hide(): void
}
```

### IME 输入处理（已确认）

```typescript
class CellEditor {
  private isComposing = false

  // 事件处理
  onCompositionStart  // IME 开始
  onCompositionUpdate // IME 更新（实时预览）
  onCompositionEnd    // IME 结束，提交值

  // 特殊按键处理
  // - Enter 在 IME 中是确认候选词
  // - Escape 取消 IME 输入
}
```

### 插件钩子（已确认）

```typescript
interface Plugin {
  // 交互事件
  onCellClick?(ctx, e): boolean
  onCellDblClick?(ctx, e): boolean
  onCellContextMenu?(ctx, e): boolean
  onSelectionChange?(ctx, e): void
  onEditStart?(ctx, e): boolean
  onEditEnd?(ctx, e): void
  onKeyDown?(ctx, e): boolean
  onKeyUp?(ctx, e): boolean  // 新增
  onScroll?(ctx, e): void
  onViewportChange?(ctx, viewport): void
}
```

### 事件系统架构总结

```
EventManager
├── DOM 绑定
│   ├── 鼠标: mousedown/move/up/dblclick/contextmenu
│   ├── 键盘: keydown/keyup
│   ├── 触摸: touchstart/move/end/cancel
│   └── 滚动: scroll/wheel
│
├── TouchHandler
│   ├── 点击/双击/长按
│   ├── 滑动 + 惯性滚动
│   └── 双指缩放
│
├── InteractionManager (状态机)
│   └── AutoScroller (拖拽边缘滚动)
│
├── SelectionManager
│   └── 合并单元格扩展
│
├── KeyboardHandler
│   └── 插件钩子
│
├── ContextMenu
│   └── 内置 + 插件扩展 + 可自定义样式
│
└── CellEditor
    └── IME 输入处理 + 命令合并
```

---

## 第七轮：数据模型设计（已确认）

### CellData 完整设计（参考 Univer）

```typescript
interface CellData {
  v?: CellValue                    // 原始值
  s?: StyleId | CellStyle          // 样式 ID 或内联样式
  t?: CellType                     // 类型 (n/s/b/d/e)
  f?: string                       // 公式 "=SUM(A1:A10)"
  si?: string                      // 共享公式 ID
  p?: RichTextData                 // 富文本
  custom?: Record<string, unknown> // 插件扩展数据
}

type CellValue = string | number | boolean | null
type CellType = 'n' | 's' | 'b' | 'd' | 'e'  // number/string/boolean/date/error
type StyleId = number
```

### RichText 设计

```typescript
interface RichTextData {
  runs: TextRun[]
}

interface TextRun {
  t: string           // text: 文本内容
  s?: TextStyle       // style: 文本样式
}

interface TextStyle {
  ff?: string         // fontFamily
  fs?: number         // fontSize
  fc?: string         // fontColor
  b?: boolean         // bold
  i?: boolean         // italic
  u?: boolean         // underline
  s?: boolean         // strikethrough
}
```

### CellStyle 设计

```typescript
interface CellStyle {
  // 字体
  ff?: string         // fontFamily
  fs?: number         // fontSize
  fc?: string         // fontColor
  b?: boolean         // bold
  i?: boolean         // italic
  u?: boolean         // underline
  s?: boolean         // strikethrough

  // 对齐
  ha?: 'left' | 'center' | 'right'      // horizontalAlign
  va?: 'top' | 'middle' | 'bottom'      // verticalAlign
  ta?: number         // textAngle (旋转角度)
  tw?: boolean        // textWrap

  // 背景
  bg?: string         // backgroundColor

  // 边框
  bd?: {
    t?: BorderStyle   // top
    r?: BorderStyle   // right
    b?: BorderStyle   // bottom
    l?: BorderStyle   // left
  }

  // 数字格式
  nf?: string         // numberFormat
}

interface BorderStyle {
  s: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double'
  c: string           // color
}
```

### Workbook 设计

```typescript
class Workbook {
  sheets: Map<string, Sheet>
  sheetOrder: string[]
  activeSheetId: string
  styles: Record<StyleId, CellStyle>  // 共享样式表
  metadata: WorkbookMeta
}

interface WorkbookMeta {
  name?: string
  author?: string
  createdAt?: number
  modifiedAt?: number
}
```

### Sheet 设计

```typescript
class Sheet {
  id: string
  name: string
  cellData: Record<number, Record<number, CellData>>  // 稀疏存储
  merges: MergeCell[]
  rowHeights: Record<number, number>   // 自定义行高
  colWidths: Record<number, number>    // 自定义列宽
  defaultRowHeight: number
  defaultColWidth: number
  rowCount: number
  colCount: number
  frozen: FreezeConfig | null
  sharedFormulas?: Record<string, SharedFormula>
  metadata: SheetMeta
}

interface MergeCell {
  sr: number  // startRow
  sc: number  // startCol
  er: number  // endRow
  ec: number  // endCol
}

interface FreezeConfig {
  row: number
  col: number
}

interface SharedFormula {
  formula: string
  range: { sr: number; sc: number; er: number; ec: number }
}

interface SheetMeta {
  tabColor?: string
  hidden?: boolean
}
```

### 设计决策

- **cellData 存储**：使用 `Record<number, Record<number, CellData>>` 而非 Map，与 Univer 保持一致
- **样式支持**：同时支持 StyleId（引用共享样式）和内联 CellStyle 对象
- **不需要引用计数**：样式池简化设计，不追踪样式使用次数
- **隐藏行列**：不在 Sheet 中存储，由 LayoutManager 管理

---

## 第八轮：插件系统设计（已确认）

### PluginManifest 定义

```typescript
interface PluginManifest {
  name: string
  version: string
  description?: string
  dependencies?: string[]
}
```

### Plugin 接口

```typescript
interface Plugin {
  manifest: PluginManifest

  // 生命周期
  onInstall?(ctx: PluginContext): void
  onUninstall?(ctx: PluginContext): void
  onWorkbookCreate?(ctx: PluginContext, workbook: Workbook): void

  // 数据钩子
  onCellGet?(ctx: PluginContext, pos: CellPos, data: CellData | null): CellData | null | void
  onCellSet?(ctx: PluginContext, pos: CellPos, data: CellData): CellData | false

  // 命令钩子
  onBeforeCommand?(ctx: PluginContext, cmd: Command): Command | false
  onAfterCommand?(ctx: PluginContext, cmd: Command, result: CommandResult): void

  // 渲染钩子
  onCellRender?(ctx: PluginContext, info: CellRenderInfo): CellRenderInfo | void

  // 交互钩子
  onCellClick?(ctx: PluginContext, e: CellClickEvent): boolean
  onCellDblClick?(ctx: PluginContext, e: CellClickEvent): boolean
  onCellContextMenu?(ctx: PluginContext, e: CellClickEvent): boolean
  onSelectionChange?(ctx: PluginContext, e: SelectionEvent): void
  onEditStart?(ctx: PluginContext, e: EditEvent): boolean
  onEditEnd?(ctx: PluginContext, e: EditEvent): void
  onKeyDown?(ctx: PluginContext, e: SheetKeyEvent): boolean
  onKeyUp?(ctx: PluginContext, e: SheetKeyEvent): boolean
  onScroll?(ctx: PluginContext, e: ScrollEvent): void
  onViewportChange?(ctx: PluginContext, viewport: ViewRange): void
}
```

### PluginManager 实现

```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private ctx: PluginContext

  install(plugin: Plugin): void {
    // 1. 检查依赖
    // 2. 注册插件
    // 3. 调用 onInstall
  }

  uninstall(name: string): void {
    // 1. 调用 onUninstall
    // 2. 移除插件
  }

  get(name: string): Plugin | undefined
  has(name: string): boolean
  list(): Plugin[]
}
```

### PluginContext 实现

```typescript
class PluginContext {
  readonly workbook: Workbook
  readonly commands: CommandDispatcher
  readonly events: EventEmitter
  readonly layout: LayoutManager
  readonly selection: SelectionManager

  // 插件私有状态
  private storage: Map<string, Map<string, unknown>> = new Map()

  getState<T>(pluginName: string, key: string): T | undefined
  setState<T>(pluginName: string, key: string, value: T): void
}
```

### 内置插件示例

```typescript
// Clipboard 插件
const ClipboardPlugin: Plugin = {
  manifest: { name: 'clipboard', version: '1.0.0' },

  onInstall(ctx) {
    ctx.commands.register('COPY', this.handleCopy)
    ctx.commands.register('CUT', this.handleCut)
    ctx.commands.register('PASTE', this.handlePaste)
  },

  onKeyDown(ctx, e) {
    if (e.ctrlKey && e.key === 'c') {
      ctx.commands.execute('COPY')
      return true
    }
    // ...
  }
}

// Formula 插件
const FormulaPlugin: Plugin = {
  manifest: { name: 'formula', version: '1.0.0' },

  onCellGet(ctx, pos, data) {
    if (data?.f) {
      // 计算公式结果
      const result = this.engine.evaluate(data.f, ctx.workbook)
      return { ...data, v: result }
    }
  },

  onAfterCommand(ctx, cmd) {
    if (cmd.type === 'SET_CELL') {
      // 重新计算依赖
      this.engine.invalidate(cmd.payload.pos)
    }
  }
}

// History 插件
const HistoryPlugin: Plugin = {
  manifest: { name: 'history', version: '1.0.0' },

  onKeyDown(ctx, e) {
    if (e.ctrlKey && e.key === 'z') {
      ctx.commands.undo()
      return true
    }
    if (e.ctrlKey && e.key === 'y') {
      ctx.commands.redo()
      return true
    }
  }
}
```

### 设计决策

- **异步钩子**：暂不支持，保持简单
- **优先级**：暂不支持，按注册顺序执行
- **热更新**：不支持插件热替换
- **沙箱隔离**：不限制插件能力

---

## 架构图

架构图已使用 Draw.io 绘制完成，包含以下模块：

```
┌─────────────────────────────────────────────────────────────────────┐
│                           HolySheet                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │    Core     │─→│   Layout    │─→│   Render    │                  │
│  │ (数据模型)   │  │ (布局系统)   │  │ (渲染系统)   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│         ↑                                    ↑                       │
│         │修改                                │渲染钩子               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Command   │←─│    Event    │←─│   Plugin    │                  │
│  │ (命令系统)   │  │ (事件系统)   │  │ (插件系统)   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│         │                ↑                    ↑                      │
│         │                │事件               │注册                   │
│  ┌──────────────────────────────┐  ┌─────────────────────┐          │
│  │       UI (用户界面)          │  │  Plugins (可选插件)  │          │
│  │ ContextMenu│CellEditor│...  │  │ Formula│Clipboard...│          │
│  └──────────────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 相关文档

- [技术路线图](./technical-roadmap.md) - 8 个阶段的开发路径
- [开发计划](./development-plan.md) - 详细任务分解

---

## 后续规划

- [x] 渲染系统设计
- [x] 布局系统设计
- [x] 命令系统设计
- [x] 事件系统设计
- [x] 数据模型设计
- [x] 插件系统详细设计
- [x] 绘制架构图（使用 drawio）
- [x] 编写技术路线图
- [x] 制定开发计划
