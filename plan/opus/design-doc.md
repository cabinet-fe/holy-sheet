# Holy Sheet 详细设计文档

> 版本：1.0  
> 创建日期：2026-01-12  
> 状态：已确认

---

## 1. 整体架构

### 1.1 架构概览

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

### 1.2 数据流向

```
用户操作 → 事件系统 → 命令系统 → 数据模型
                         ↓
                    布局系统 → 渲染系统 → Canvas
```

### 1.3 核心包结构

```
@holy-sheet/core/
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

## 2. 数据模型层

### 2.1 CellData 设计

单元格数据采用精简的属性命名，减少存储开销：

```typescript
interface CellData {
  v?: CellValue                    // value: 原始值
  s?: StyleId | CellStyle          // style: 样式 ID 或内联样式
  t?: CellType                     // type: 强制类型 (n/s/b/d/e)
  f?: string                       // formula: 公式文本 "=SUM(A1:A10)"
  si?: string                      // sharedFormulaId: 共享公式 ID
  p?: RichTextData                 // richText: 富文本数据
  custom?: Record<string, unknown> // 插件扩展数据
}

type CellValue = string | number | boolean | null
type CellType = 'n' | 's' | 'b' | 'd' | 'e'  // number/string/boolean/date/error
type StyleId = number
```

**设计决策**：
- 使用单字母属性名减少 JSON 序列化体积
- 同时支持 StyleId（引用共享样式）和内联 CellStyle 对象
- `custom` 字段预留给插件扩展，避免污染核心数据结构

### 2.2 RichText 设计

富文本采用 runs 数组存储格式化片段：

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

### 2.3 CellStyle 设计

完整的单元格样式定义：

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
  ta?: number         // textAngle (旋转角度 -90 ~ 90)
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

### 2.4 Workbook 设计

工作簿是顶层容器，管理多个工作表和共享样式：

```typescript
class Workbook {
  sheets: Map<string, Sheet>              // 工作表集合
  sheetOrder: string[]                    // 工作表顺序
  activeSheetId: string                   // 当前活动工作表
  styles: Record<StyleId, CellStyle>      // 共享样式表
  metadata: WorkbookMeta                  // 元数据

  // 工作表管理
  addSheet(name?: string): Sheet
  deleteSheet(id: string): boolean
  renameSheet(id: string, name: string): void
  moveSheet(id: string, toIndex: number): void
  getSheet(id: string): Sheet | undefined
  getActiveSheet(): Sheet
  setActiveSheet(id: string): void

  // 样式管理
  addStyle(style: CellStyle): StyleId
  getStyle(id: StyleId): CellStyle | undefined
}

interface WorkbookMeta {
  name?: string
  author?: string
  createdAt?: number
  modifiedAt?: number
}
```

### 2.5 Sheet 设计

工作表存储单元格数据和配置：

```typescript
class Sheet {
  id: string
  name: string
  cellData: Record<number, Record<number, CellData>>  // 稀疏二维存储
  merges: MergeCell[]                                  // 合并单元格列表
  rowHeights: Record<number, number>                   // 自定义行高
  colWidths: Record<number, number>                    // 自定义列宽
  defaultRowHeight: number                             // 默认行高 (20)
  defaultColWidth: number                              // 默认列宽 (80)
  rowCount: number                                     // 行数
  colCount: number                                     // 列数
  frozen: FreezeConfig | null                          // 冻结窗格
  sharedFormulas?: Record<string, SharedFormula>       // 共享公式
  metadata: SheetMeta                                  // 元数据

  // 单元格操作
  getCell(row: number, col: number): CellData | null
  setCell(row: number, col: number, data: CellData): void
  clearCell(row: number, col: number): void
  getCellRange(sr: number, sc: number, er: number, ec: number): CellData[][]
  setCellRange(sr: number, sc: number, data: CellData[][]): void
}

interface MergeCell {
  sr: number  // startRow
  sc: number  // startCol
  er: number  // endRow
  ec: number  // endCol
}

interface FreezeConfig {
  row: number  // 冻结行数
  col: number  // 冻结列数
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

**设计决策**：
- `cellData` 使用 `Record<number, Record<number, CellData>>` 而非 Map，与 Univer 保持一致，便于 JSON 序列化
- 隐藏行列不在 Sheet 中存储，由 LayoutManager 管理

### 2.6 MergeIndex 设计

合并单元格索引，支持快速查询：

```typescript
class MergeIndex {
  private merges: MergeCell[] = []
  private rowIndex: Map<number, MergeCell[]> = new Map()  // 行索引

  // 查询
  getMergeAt(row: number, col: number): MergeCell | null
  isMasterCell(row: number, col: number): boolean      // 是否合并区域左上角
  isSlaveCell(row: number, col: number): boolean       // 是否合并区域从属单元格
  getMergesInViewport(sr: number, er: number, sc: number, ec: number): MergeCell[]

  // 修改
  addMerge(merge: MergeCell): void
  removeMerge(sr: number, sc: number): boolean
  clear(): void

  // 内部
  private buildRowIndex(): void
}
```

**复杂度分析**：
| 操作 | 复杂度 | 说明 |
|------|--------|------|
| getMergeAt | O(k) | k = 该行的合并数 |
| getMergesInViewport | O(r × k) | r = 行数, k = 平均每行合并数 |
| addMerge/removeMerge | O(1) + 索引更新 | - |

### 2.7 StylePool 设计

共享样式池，实现样式去重：

```typescript
class StylePool {
  private styles: Map<StyleId, CellStyle> = new Map()
  private hashMap: Map<string, StyleId> = new Map()  // 样式哈希 → ID
  private nextId: StyleId = 1

  // 添加样式（自动去重）
  add(style: CellStyle): StyleId {
    const hash = this.hash(style)
    if (this.hashMap.has(hash)) {
      return this.hashMap.get(hash)!
    }
    const id = this.nextId++
    this.styles.set(id, style)
    this.hashMap.set(hash, id)
    return id
  }

  get(id: StyleId): CellStyle | undefined {
    return this.styles.get(id)
  }

  // 合并两个样式
  merge(baseId: StyleId, override: Partial<CellStyle>): StyleId {
    const base = this.get(baseId) || {}
    return this.add({ ...base, ...override })
  }

  private hash(style: CellStyle): string {
    return JSON.stringify(style, Object.keys(style).sort())
  }
}
```

**设计决策**：
- 不需要引用计数，样式池不追踪样式使用次数
- 使用 JSON.stringify 生成哈希，简单可靠

---

## 3. 布局系统

### 3.1 IndexMapper 设计

处理行列插入删除时的逻辑/物理索引映射：

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

  // 转换
  toPhysical(logical: number): number   // O(log k), k = 段数量
  toLogical(physical: number): number   // O(k)

  // 修改
  insert(at: number, count: number): void  // O(k)
  delete(at: number, count: number): void  // O(k)

  // 优化
  compact(): void  // 合并相邻段
}
```

**示例**：
```
初始状态: [{logicalStart: 0, physicalStart: 0, count: ∞}]

在第 5 行插入 3 行后:
[
  {logicalStart: 0, physicalStart: 0, count: 5},  // 行 0-4 不变
  {logicalStart: 5, physicalStart: -1, count: 3}, // 新插入的行（无物理索引）
  {logicalStart: 8, physicalStart: 5, count: ∞}   // 原来的行 5+ 向下移动
]
```

### 3.2 AccumulatorCache 设计

分块缓存累积偏移量，加速像素→行列转换：

```typescript
const BLOCK_SIZE = 1000  // 每 1000 行为一个块

class AccumulatorCache {
  private blockAccum: number[] = []  // blockAccum[i] = 第 0 ~ i*blockSize 行的总高度
  private dirty = true
  private dirtyFrom = 0

  // 查询
  getOffset(index: number): number      // O(log b + blockSize), b = 块数量
  getIndexAtOffset(offset: number): number  // O(log b + blockSize)

  // 失效
  invalidateFrom(index: number): void   // 局部失效
  invalidateAll(): void                 // 全部失效

  // 重建
  rebuildFrom(fromIndex: number): void  // 增量重建

  private getRowHeight(index: number): number
}
```

**算法**：
1. 先二分查找确定所在块
2. 在块内线性累加得到精确偏移量

### 3.3 HiddenRanges 设计

隐藏行列的自适应存储：

```typescript
class HiddenRanges {
  private set: Set<number> = new Set()
  private intervals: Array<[number, number]> | null = null
  private readonly THRESHOLD = 100

  isHidden(index: number): boolean
  hide(index: number): void
  show(index: number): void
  hideRange(start: number, end: number): void
  showRange(start: number, end: number): void

  // 自动切换存储模式
  private maybeCompress(): void {
    if (this.set.size >= this.THRESHOLD && this.intervals === null) {
      this.compressToIntervals()
    }
  }

  private compressToIntervals(): void
  private expandToSet(): void
}
```

**设计决策**：
- < 100 个隐藏项：Set 存储，O(1) 查询
- >= 100 个隐藏项：压缩为区间数组，减少内存

### 3.4 LayoutManager 设计

布局管理器的完整接口：

```typescript
class LayoutManager {
  private rowMapper: IndexMapper
  private colMapper: IndexMapper
  private rowAccum: AccumulatorCache
  private colAccum: AccumulatorCache
  private hiddenRows: HiddenRanges
  private hiddenCols: HiddenRanges
  private inTransaction = false

  // 查询
  getRowHeight(row: number): number
  getColWidth(col: number): number
  getRowOffset(row: number): number
  getColOffset(col: number): number
  getCellAtPoint(x: number, y: number): { row: number; col: number }
  getVisibleRange(scroll: Point, size: Size): ViewRange

  // 修改
  setRowHeight(row: number, height: number): void
  setColWidth(col: number, width: number): void
  insertRows(at: number, count: number): void
  deleteRows(at: number, count: number): void
  insertCols(at: number, count: number): void
  deleteCols(at: number, count: number): void
  hideRows(rows: number[]): void
  showRows(rows: number[]): void
  hideCols(cols: number[]): void
  showCols(cols: number[]): void

  // 事务（批量修改时减少重计算）
  beginTransaction(): void
  endTransaction(): void
}

interface ViewRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}
```

**性能特性**：
| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 获取行高/列宽 | O(log k) | k = 段数量 |
| 获取偏移量 | O(log b + blockSize) | b = 块数量 |
| 像素→行列 | O(log b + blockSize) | 二分+块内线性 |
| 插入/删除行列 | O(k) | 只更新映射表 |
| 修改行高/列宽 | O(1) | 局部失效缓存 |

---

## 4. 渲染系统

### 4.1 渲染分层架构

```
┌─────────────────────────────────────────┐
│  DOM Layer (事件捕获、输入、滚动)        │
│  ┌─────────────────────────────────────┐│
│  │ <input> 单元格编辑器 (隐藏/显示)     ││
│  │ <div> 滚动容器                      ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Canvas: Selection Layer (选区/拖拽)    │  ← 频繁重绘，独立 canvas
├─────────────────────────────────────────┤
│  Canvas: Main Layer (网格+内容)         │  ← 脏矩形重绘
└─────────────────────────────────────────┘
```

**层级职责**：
| 层 | 职责 | 重绘频率 |
|---|------|---------|
| DOM Layer | 事件捕获、输入框、滚动条 | 按需 |
| Selection Layer | 选区高亮、拖拽指示 | 高（鼠标移动） |
| Main Layer | 网格线、单元格背景、内容、边框 | 中（数据变化） |

### 4.2 SheetRenderer 设计

主画布渲染器：

```typescript
class SheetRenderer {
  private ctx: CanvasRenderingContext2D
  private layout: LayoutManager
  private sheet: Sheet
  private stylePool: StylePool

  draw(bound: ViewRange): void {
    // 1. 绘制网格线
    this.drawGridLines(bound)
    // 2. 清除合并单元格内部的网格线
    this.clearMergeGridLines(bound)
    // 3. 绘制单元格背景（Path2D 批量）
    this.drawBackgrounds(bound)
    // 4. 绘制单元格内容
    this.drawContents(bound)
    // 5. 绘制边框
    this.drawBorders(bound)
  }

  private drawGridLines(bound: ViewRange): void
  private clearMergeGridLines(bound: ViewRange): void
  private drawBackgrounds(bound: ViewRange): void
  private drawContents(bound: ViewRange): void
  private drawBorders(bound: ViewRange): void
}
```

### 4.3 高效绘制技术

**1. Path2D 批量绘制**

按颜色分组，减少 draw call：

```typescript
function drawBackgrounds(ctx: CanvasRenderingContext2D, cells: CellRenderInfo[]) {
  // 按背景色分组
  const groups = new Map<string, Path2D>()

  for (const cell of cells) {
    const bg = cell.style?.bg
    if (!bg) continue

    if (!groups.has(bg)) {
      groups.set(bg, new Path2D())
    }
    const path = groups.get(bg)!
    path.rect(cell.x, cell.y, cell.width, cell.height)
  }

  // 每种颜色只需一次 fill
  for (const [color, path] of groups) {
    ctx.fillStyle = color
    ctx.fill(path)
  }
}
```

**2. 网格线 clearRect**

先画全部线，再清除合并区域：

```typescript
function drawGridLinesWithMerge(ctx, bound, merges) {
  // 绘制所有水平线和垂直线
  drawAllGridLines(ctx, bound)

  // 清除合并单元格内部的线
  for (const merge of merges) {
    const { x, y, width, height } = getMergeRect(merge)
    ctx.clearRect(x + 1, y + 1, width - 2, height - 2)
  }
}
```

**3. 脏矩形增量渲染**

```typescript
class DirtyRect {
  private regions: Rect[] = []

  mark(rect: Rect): void {
    this.regions.push(rect)
  }

  flush(ctx: CanvasRenderingContext2D, drawFn: (bound: Rect) => void): void {
    const merged = this.mergeRegions()

    for (const rect of merged) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(rect.x, rect.y, rect.width, rect.height)
      ctx.clip()

      drawFn(rect)

      ctx.restore()
    }

    this.regions = []
  }

  private mergeRegions(): Rect[]
}
```

**4. 滚动优化**

使用 `globalCompositeOperation: 'copy'` 平移现有内容：

```typescript
function scrollOptimized(ctx, dx, dy) {
  // 保存当前内容
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // 平移绘制
  ctx.globalCompositeOperation = 'copy'
  ctx.drawImage(canvas, dx, dy)
  ctx.globalCompositeOperation = 'source-over'

  // 只重绘差异区域
  if (dy > 0) {
    // 向下滚动，重绘顶部
    drawRegion(ctx, { y: 0, height: dy, ... })
  } else if (dy < 0) {
    // 向上滚动，重绘底部
    drawRegion(ctx, { y: canvas.height + dy, height: -dy, ... })
  }
}
```

### 4.4 Viewport 设计

视口管理：

```typescript
class Viewport {
  private scrollX = 0
  private scrollY = 0
  private width: number
  private height: number
  private bufferSize = 5  // 缓冲行列数

  getVisibleRange(layout: LayoutManager): ViewRange {
    const range = layout.getVisibleRange(
      { x: this.scrollX, y: this.scrollY },
      { width: this.width, height: this.height }
    )

    // 添加缓冲区
    return {
      startRow: Math.max(0, range.startRow - this.bufferSize),
      endRow: range.endRow + this.bufferSize,
      startCol: Math.max(0, range.startCol - this.bufferSize),
      endCol: range.endCol + this.bufferSize,
    }
  }

  scroll(dx: number, dy: number): ScrollDirection {
    this.scrollX += dx
    this.scrollY += dy

    return {
      horizontal: dx > 0 ? 'right' : dx < 0 ? 'left' : 'none',
      vertical: dy > 0 ? 'down' : dy < 0 ? 'up' : 'none',
    }
  }

  scrollTo(x: number, y: number): void
  scrollToCell(row: number, col: number, layout: LayoutManager): void
}
```

### 4.5 Worker 渲染策略

**Phase 1**：主线程渲染，Worker 只做数据计算

```
Main Thread                    Worker
     │                            │
     │  postMessage(公式/排序)    │
     │ ─────────────────────────→ │
     │                            │ 计算
     │  postMessage(结果)         │
     │ ←───────────────────────── │
     │                            │
     │ 更新数据 → 渲染            │
```

**Phase 2**：OffscreenCanvas 在 Worker 中渲染

```
Main Thread                    Worker
     │                            │
     │  transferControlToOffscreen│
     │ ─────────────────────────→ │
     │                            │
     │  postMessage(视口/数据)    │
     │ ─────────────────────────→ │
     │                            │ 渲染到 OffscreenCanvas
     │                            │
     │  commit() 自动同步         │
     │ ←─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
```

---

## 5. 事件系统

### 5.1 EventEmitter 设计

```typescript
type EventCallback<T = unknown> = (data: T) => void

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as EventCallback)

    // 返回取消订阅函数
    return () => this.off(event, callback)
  }

  once<T>(event: string, callback: EventCallback<T>): () => void {
    const wrapper: EventCallback<T> = (data) => {
      this.off(event, wrapper)
      callback(data)
    }
    return this.on(event, wrapper)
  }

  emit<T>(event: string, data: T): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data)
      }
    }
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event)
    } else {
      this.listeners.get(event)?.delete(callback)
    }
  }
}
```

### 5.2 事件类型定义

```typescript
const Events = {
  // 单元格事件
  CELL_CLICK: 'cell:click',
  CELL_DBLCLICK: 'cell:dblclick',
  CELL_CONTEXTMENU: 'cell:contextmenu',

  // 选区事件
  SELECTION_START: 'selection:start',
  SELECTION_CHANGE: 'selection:change',
  SELECTION_END: 'selection:end',

  // 编辑事件
  EDIT_START: 'edit:start',
  EDIT_CHANGE: 'edit:change',
  EDIT_END: 'edit:end',

  // 视口事件
  SCROLL: 'scroll',
  VIEWPORT_CHANGE: 'viewport:change',

  // 调整大小事件
  ROW_RESIZE_START: 'row:resize:start',
  ROW_RESIZE: 'row:resize',
  ROW_RESIZE_END: 'row:resize:end',
  COL_RESIZE_START: 'col:resize:start',
  COL_RESIZE: 'col:resize',
  COL_RESIZE_END: 'col:resize:end',
} as const
```

### 5.3 InteractionManager 设计

交互状态机：

```typescript
type InteractionState =
  | { type: 'idle' }
  | { type: 'selecting'; start: CellPos; current: CellPos }
  | { type: 'rowResizing'; row: number; startY: number; startHeight: number }
  | { type: 'colResizing'; col: number; startX: number; startWidth: number }
  | { type: 'filling'; selection: Selection; direction: FillDirection }
  | { type: 'editing'; pos: CellPos }

class InteractionManager {
  private state: InteractionState = { type: 'idle' }
  private events: EventEmitter
  private autoScroller: AutoScroller

  getState(): InteractionState {
    return this.state
  }

  // 状态转换
  startSelecting(pos: CellPos): void
  updateSelecting(pos: CellPos): void
  endSelecting(): void

  startRowResizing(row: number, y: number, height: number): void
  updateRowResizing(y: number): void
  endRowResizing(): void

  startEditing(pos: CellPos): void
  endEditing(commit: boolean): void

  // 事件处理
  handleMouseDown(e: MouseEvent): void
  handleMouseMove(e: MouseEvent): void
  handleMouseUp(e: MouseEvent): void
}
```

### 5.4 SelectionManager 设计

选区管理：

```typescript
interface Selection {
  start: CellPos
  end: CellPos
}

class SelectionManager {
  private selections: Selection[] = []
  private activeIndex = 0
  private events: EventEmitter
  private mergeIndex: MergeIndex

  // 获取
  getSelections(): Selection[]
  getActiveSelection(): Selection | null
  getPrimaryCell(): CellPos | null  // 活动选区的起始单元格

  // 设置
  setRange(start: CellPos, end: CellPos): void
  addRange(start: CellPos, end: CellPos): void      // Ctrl+点击
  extendTo(pos: CellPos): void                      // Shift+点击
  move(deltaRow: number, deltaCol: number, extend: boolean): void  // 键盘导航
  selectAll(): void
  clear(): void

  // 合并单元格处理
  expandForMerge(selection: Selection): Selection {
    // 如果选区包含合并单元格，扩展到完整的合并区域
    let { start, end } = selection
    // ... 遍历检查并扩展
    return { start, end }
  }

  // 迭代选区内的单元格
  *iterateCells(): Generator<CellPos>
}
```

### 5.5 TouchHandler 设计

触摸事件处理：

```typescript
class TouchHandler {
  private lastTap = 0
  private longPressTimer: number | null = null
  private startTouch: Touch | null = null

  // 手势识别
  // 点击 → 选择单元格
  // 双击 → 进入编辑
  // 长按 → 显示右键菜单
  // 滑动 → 滚动（支持惯性滚动）
  // 双指 → 缩放

  handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.startTouch = e.touches[0]
      this.longPressTimer = setTimeout(() => this.onLongPress(), 500)
    } else if (e.touches.length === 2) {
      this.startPinch(e.touches)
    }
  }

  handleTouchMove(e: TouchEvent): void
  handleTouchEnd(e: TouchEvent): void

  private onTap(pos: CellPos): void
  private onDoubleTap(pos: CellPos): void
  private onLongPress(): void
  private onSwipe(velocity: Point): void
  private onPinch(scale: number): void

  // 惯性滚动
  private startInertiaScroll(velocity: Point): void
}
```

### 5.6 AutoScroller 设计

拖拽自动滚动：

```typescript
class AutoScroller {
  private EDGE_THRESHOLD = 50    // 边缘感应距离
  private BASE_SPEED = 10        // 基础滚动速度
  private MAX_SPEED = 50         // 最大滚动速度
  private animationId: number | null = null
  private mousePosition: Point = { x: 0, y: 0 }

  start(): void {
    if (this.animationId) return
    this.animationId = requestAnimationFrame(this.tick.bind(this))
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  updateMousePosition(x: number, y: number): void {
    this.mousePosition = { x, y }
  }

  private tick(): void {
    const { dx, dy } = this.calculateScrollDelta()
    if (dx !== 0 || dy !== 0) {
      this.viewport.scroll(dx, dy)
    }
    this.animationId = requestAnimationFrame(this.tick.bind(this))
  }

  private calculateScrollDelta(): { dx: number; dy: number } {
    // 根据鼠标距边缘的距离计算滚动速度
    // 越接近边缘，速度越快
  }
}
```

### 5.7 CellEditor 设计

单元格编辑器：

```typescript
class CellEditor {
  private input: HTMLInputElement
  private isComposing = false
  private currentPos: CellPos | null = null

  show(pos: CellPos, initialValue?: string): void {
    this.currentPos = pos
    this.input.value = initialValue ?? ''
    this.positionInput(pos)
    this.input.style.display = 'block'
    this.input.focus()
  }

  hide(): void {
    this.input.style.display = 'none'
    this.currentPos = null
  }

  getValue(): string {
    return this.input.value
  }

  // IME 事件处理
  private onCompositionStart = (): void => {
    this.isComposing = true
  }

  private onCompositionUpdate = (e: CompositionEvent): void => {
    // 实时预览 IME 输入
  }

  private onCompositionEnd = (e: CompositionEvent): void => {
    this.isComposing = false
    // 提交最终值
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.isComposing) {
      // IME 中的 Enter 是确认候选词，不处理
      return
    }

    if (e.key === 'Enter') {
      this.commit()
    } else if (e.key === 'Escape') {
      this.cancel()
    } else if (e.key === 'Tab') {
      this.commit()
      // 移动到下一个单元格
    }
  }

  private commit(): void
  private cancel(): void
  private positionInput(pos: CellPos): void
}
```

### 5.8 ContextMenu 设计

右键菜单：

```typescript
interface MenuItem {
  id: string
  label: string
  shortcut?: string
  icon?: string
  disabled?: boolean
  children?: MenuItem[]
  separator?: boolean
}

class ContextMenu {
  private container: HTMLElement
  private builtinItems: MenuItem[] = [
    { id: 'cut', label: '剪切', shortcut: 'Ctrl+X' },
    { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
    { id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
    { separator: true },
    { id: 'insertRowAbove', label: '在上方插入行' },
    { id: 'insertRowBelow', label: '在下方插入行' },
    { id: 'insertColLeft', label: '在左侧插入列' },
    { id: 'insertColRight', label: '在右侧插入列' },
    { separator: true },
    { id: 'deleteRow', label: '删除行' },
    { id: 'deleteCol', label: '删除列' },
    { separator: true },
    { id: 'merge', label: '合并单元格' },
    { id: 'unmerge', label: '取消合并' },
    { separator: true },
    { id: 'clear', label: '清除内容' },
  ]
  private pluginItems: Map<string, MenuItem[]> = new Map()

  // 插件扩展
  registerItems(groupId: string, items: MenuItem[], position?: 'before' | 'after', referenceId?: string): void
  unregisterItems(groupId: string): void

  // 显示/隐藏
  show(x: number, y: number, context?: { selection: Selection }): void
  hide(): void

  // 事件
  onItemClick(callback: (itemId: string) => void): void
}
```

---

## 6. 命令系统

### 6.1 Command 定义

```typescript
interface Command<T = unknown> {
  type: string
  payload: T
  undo?: UndoData
}

interface UndoData {
  type: string
  payload: unknown
}

interface CommandResult {
  success: boolean
  error?: string
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

### 6.2 CommandDispatcher 设计

```typescript
type CommandHandler<T = unknown> = (payload: T, ctx: CommandContext) => CommandResult
type CommandHook = (cmd: Command) => Command | false | void

class CommandDispatcher {
  private handlers: Map<string, CommandHandler> = new Map()
  private undoStack: UndoData[][] = []  // 按组
  private redoStack: UndoData[][] = []
  private transaction: UndoData[] | null = null
  private beforeHooks: CommandHook[] = []
  private afterHooks: CommandHook[] = []

  // 命令合并
  private lastCommand: Command | null = null
  private lastCommandTime = 0
  private mergeWindow = 300  // 300ms

  // 注册处理器
  register<T>(type: string, handler: CommandHandler<T>): void {
    this.handlers.set(type, handler as CommandHandler)
  }

  // 执行命令
  execute<T>(type: string, payload: T): CommandResult {
    const cmd: Command<T> = { type, payload }

    // 前置钩子
    for (const hook of this.beforeHooks) {
      const result = hook(cmd)
      if (result === false) {
        return { success: false, error: 'Cancelled by hook' }
      }
      if (result) {
        Object.assign(cmd, result)
      }
    }

    // 执行
    const handler = this.handlers.get(type)
    if (!handler) {
      return { success: false, error: `Unknown command: ${type}` }
    }

    const result = handler(cmd.payload, this.context)

    // 处理撤销数据
    if (result.success && result.undo) {
      this.pushUndo(result.undo)
    }

    // 后置钩子
    for (const hook of this.afterHooks) {
      hook(cmd)
    }

    return result
  }

  // 撤销/重做
  undo(): boolean {
    const undoGroup = this.undoStack.pop()
    if (!undoGroup) return false

    const redoGroup: UndoData[] = []
    for (const undo of undoGroup.reverse()) {
      const result = this.executeUndo(undo)
      if (result.undo) {
        redoGroup.push(result.undo)
      }
    }
    this.redoStack.push(redoGroup)
    return true
  }

  redo(): boolean {
    const redoGroup = this.redoStack.pop()
    if (!redoGroup) return false

    const undoGroup: UndoData[] = []
    for (const redo of redoGroup.reverse()) {
      const result = this.executeUndo(redo)
      if (result.undo) {
        undoGroup.push(result.undo)
      }
    }
    this.undoStack.push(undoGroup)
    return true
  }

  // 事务
  beginTransaction(): void {
    if (this.transaction) {
      throw new Error('Nested transactions not supported')
    }
    this.transaction = []
  }

  commit(): void {
    if (!this.transaction) return
    if (this.transaction.length > 0) {
      this.undoStack.push(this.transaction)
    }
    this.transaction = null
    this.redoStack = []
  }

  rollback(): void {
    if (!this.transaction) return
    for (const undo of this.transaction.reverse()) {
      this.executeUndo(undo)
    }
    this.transaction = null
  }

  // 打断命令合并
  breakMerge(): void {
    this.lastCommand = null
  }

  // 钩子
  onBefore(hook: CommandHook): () => void
  onAfter(hook: CommandHook): () => void

  private pushUndo(undo: UndoData): void
  private executeUndo(undo: UndoData): CommandResult
  private shouldMerge(cmd: Command): boolean
}
```

### 6.3 设计决策

| 项目 | 决策 | 理由 |
|------|------|------|
| 历史大小 | 默认 100 个撤销步骤 | 平衡内存与用户体验 |
| 嵌套事务 | 不支持 | 简化实现，避免复杂状态 |
| 命令序列化 | 暂不实现，接口预留 | 为协同编辑预留扩展点 |
| 命令合并 | 300ms 窗口 | 连续输入合并为一个撤销单元 |

---

## 7. 插件系统

### 7.1 PluginManifest 定义

```typescript
interface PluginManifest {
  name: string           // 唯一标识
  version: string        // 语义化版本
  description?: string   // 描述
  dependencies?: string[] // 依赖的其他插件
}
```

### 7.2 Plugin 接口

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

### 7.3 PluginManager 实现

```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private ctx: PluginContext

  install(plugin: Plugin): void {
    const { name, dependencies = [] } = plugin.manifest

    // 1. 检查是否已安装
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already installed`)
    }

    // 2. 检查依赖
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`)
      }
    }

    // 3. 注册插件
    this.plugins.set(name, plugin)

    // 4. 调用 onInstall
    plugin.onInstall?.(this.ctx)
  }

  uninstall(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) return

    // 1. 检查是否有其他插件依赖此插件
    for (const [otherName, other] of this.plugins) {
      if (other.manifest.dependencies?.includes(name)) {
        throw new Error(`Plugin ${otherName} depends on ${name}`)
      }
    }

    // 2. 调用 onUninstall
    plugin.onUninstall?.(this.ctx)

    // 3. 移除插件
    this.plugins.delete(name)
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  has(name: string): boolean {
    return this.plugins.has(name)
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  // 钩子调用
  callHook<K extends keyof Plugin>(
    hookName: K,
    ...args: Parameters<NonNullable<Plugin[K]>>
  ): void {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName]
      if (typeof hook === 'function') {
        (hook as Function).call(plugin, ...args)
      }
    }
  }
}
```

### 7.4 PluginContext 实现

```typescript
class PluginContext {
  readonly workbook: Workbook
  readonly commands: CommandDispatcher
  readonly events: EventEmitter
  readonly layout: LayoutManager
  readonly selection: SelectionManager

  // 插件私有状态
  private storage: Map<string, Map<string, unknown>> = new Map()

  getState<T>(pluginName: string, key: string): T | undefined {
    return this.storage.get(pluginName)?.get(key) as T | undefined
  }

  setState<T>(pluginName: string, key: string, value: T): void {
    if (!this.storage.has(pluginName)) {
      this.storage.set(pluginName, new Map())
    }
    this.storage.get(pluginName)!.set(key, value)
  }

  deleteState(pluginName: string, key?: string): void {
    if (key === undefined) {
      this.storage.delete(pluginName)
    } else {
      this.storage.get(pluginName)?.delete(key)
    }
  }
}
```

### 7.5 内置插件示例

**Clipboard 插件**：

```typescript
const ClipboardPlugin: Plugin = {
  manifest: { name: 'clipboard', version: '1.0.0' },

  onInstall(ctx) {
    ctx.commands.register('COPY', this.handleCopy.bind(this))
    ctx.commands.register('CUT', this.handleCut.bind(this))
    ctx.commands.register('PASTE', this.handlePaste.bind(this))
  },

  onKeyDown(ctx, e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        ctx.commands.execute('COPY', {})
        return true
      }
      if (e.key === 'x') {
        ctx.commands.execute('CUT', {})
        return true
      }
      if (e.key === 'v') {
        ctx.commands.execute('PASTE', {})
        return true
      }
    }
    return false
  },

  handleCopy(payload, ctx) { /* ... */ },
  handleCut(payload, ctx) { /* ... */ },
  handlePaste(payload, ctx) { /* ... */ },
}
```

**Formula 插件**：

```typescript
const FormulaPlugin: Plugin = {
  manifest: { name: 'formula', version: '1.0.0' },

  private engine: FormulaEngine

  onInstall(ctx) {
    this.engine = new FormulaEngine()
  },

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
```

**History 插件**：

```typescript
const HistoryPlugin: Plugin = {
  manifest: { name: 'history', version: '1.0.0' },

  onKeyDown(ctx, e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        ctx.commands.undo()
        return true
      }
      if (e.key === 'y') {
        ctx.commands.redo()
        return true
      }
    }
    return false
  }
}
```

### 7.6 设计决策

| 项目 | 决策 | 理由 |
|------|------|------|
| 异步钩子 | 暂不支持 | 保持简单，避免复杂的异步流程 |
| 优先级 | 暂不支持 | 按注册顺序执行，简化实现 |
| 热更新 | 不支持 | 插件热替换增加复杂度 |
| 沙箱隔离 | 不限制 | 插件可访问完整 API |

---

## 8. 附录：类型定义汇总

```typescript
// 基础类型
type CellValue = string | number | boolean | null
type CellType = 'n' | 's' | 'b' | 'd' | 'e'
type StyleId = number

interface CellPos {
  row: number
  col: number
}

interface Point {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface ViewRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

// 事件类型
interface CellClickEvent {
  pos: CellPos
  originalEvent: MouseEvent
}

interface SelectionEvent {
  selections: Selection[]
  added?: Selection[]
  removed?: Selection[]
}

interface EditEvent {
  pos: CellPos
  value: string
  cancelled?: boolean
}

interface SheetKeyEvent {
  key: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  originalEvent: KeyboardEvent
}

interface ScrollEvent {
  scrollX: number
  scrollY: number
  deltaX: number
  deltaY: number
}

// 渲染类型
interface CellRenderInfo {
  pos: CellPos
  x: number
  y: number
  width: number
  height: number
  data: CellData | null
  style: CellStyle | null
  isMerged: boolean
  isMaster: boolean
}
```

---

## 9. 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-12 | 1.0 | 初始版本 |
