# Holy Sheet 开发路线与目标

> 版本：1.0
> 创建日期：2026-01-12
> 状态：规划中

---

## 1. 项目愿景

Holy Sheet 是一个基于 Canvas 的高性能开源电子表格库，目标是为 Web 应用提供接近原生 Excel 体验的表格组件，同时保持轻量级和高扩展性。

### 1.1 核心定位

```
┌─────────────────────────────────────────────────────────────┐
│                     Holy Sheet                               │
│                                                              │
│   高性能 Canvas 表格引擎 + 插件化架构 + 框架无关             │
│                                                              │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │  轻量级   │  │  高性能   │  │  可扩展   │              │
│   │  <100KB   │  │  百万级   │  │  插件系统  │              │
│   └───────────┘  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心目标

| 目标 | 指标 | 说明 |
|------|------|------|
| **轻量级** | 核心包 < 60KB gzipped | 不含插件的纯核心包体积 |
| **高性能** | 百万级单元格渲染 | 虚拟滚动 + 脏矩形增量渲染 |
| **低内存** | 100万单元格 < 200MB | 稀疏存储 + 共享样式池 |
| **高帧率** | 滚动 60fps | 分层 Canvas + 增量重绘 |
| **可扩展** | 完整插件系统 | 生命周期钩子 + 上下文 API |
| **兼容性** | Excel 数据模型 | 不含图表的完整数据结构 |

---

## 2. 技术选型与约束

### 2.1 技术栈

| 类别 | 选型 | 理由 |
|------|------|------|
| 语言 | TypeScript | 类型安全、IDE 友好 |
| 构建 | tsdown | 轻量、快速、零配置 |
| 包管理 | pnpm | 高效磁盘利用、原生 workspace |
| 测试 | Vitest + Playwright | 快速单元测试 + E2E 测试 |
| 文档 | VitePress | Vue 生态、Markdown 友好 |
| 渲染 | Canvas 2D | 高性能、跨平台 |

### 2.2 架构约束

- **框架无关**：核心库不依赖任何 UI 框架
- **零运行时依赖**：核心包不引入第三方运行时依赖
- **渐进增强**：功能通过插件按需加载
- **向后兼容**：主版本内 API 稳定

### 2.3 设计原则

1. **数据驱动**：所有 UI 状态由数据模型派生
2. **命令模式**：所有修改通过命令系统，支持撤销/重做
3. **事件驱动**：模块间通过事件解耦
4. **分层架构**：数据层 → 布局层 → 渲染层 → 交互层

---

## 3. 开发阶段路线图

```
Phase 0: 基础设施        ──┐
                          │
Phase 1: 核心数据层      ──┼── M1: 静态表格渲染
                          │
Phase 2: 布局与渲染      ──┘

Phase 3: 交互系统        ──┐
                          ├── M2: 交互式表格
Phase 4: 命令与历史      ──┘

Phase 5: 插件系统        ──┐
                          ├── M3: 完整功能表格
Phase 6: 核心插件        ──┘

Phase 7: 性能优化        ──── M4: 高性能版本

Phase 8: 生态建设        ──── M5: 正式发布 1.0
```

---

## 4. 阶段详细说明

### Phase 0: 基础设施

**目标**：搭建项目骨架，确立开发规范和工具链

**交付物**：
- Monorepo 项目结构（pnpm workspace）
- TypeScript + tsdown 构建配置
- ESLint + Prettier 代码规范
- Vitest 单元测试 + Playwright E2E 框架
- GitHub Actions CI/CD 流程
- VitePress 文档站点骨架

**包结构**：
```
packages/
├── core/           # @holy-sheet/core (核心库)
├── formula/        # @holy-sheet/formula (公式引擎)
├── clipboard/      # @holy-sheet/clipboard (剪贴板)
├── xlsx/           # @holy-sheet/xlsx (Excel 导入导出)
└── playground/     # 开发调试环境
```

**里程碑**：项目可构建、可测试、可发布

---

### Phase 1: 核心数据层

**目标**：实现完整的数据模型，支持工作簿、工作表、单元格的 CRUD 操作

**核心模块**：
| 模块 | 职责 | 体积预算 |
|------|------|----------|
| Workbook | 工作簿管理、样式表 | 3KB |
| Sheet | 工作表、单元格存储 | 3KB |
| CellData | 单元格数据结构 | 1KB |
| StylePool | 共享样式池 | 1KB |

**数据结构**：
```typescript
// 核心数据类型
interface CellData {
  v?: CellValue           // 原始值
  s?: StyleId | CellStyle // 样式
  t?: CellType            // 类型 (n/s/b/d/e)
  f?: string              // 公式
  p?: RichTextData        // 富文本
  custom?: Record<string, unknown>
}

// 存储方式：稀疏二维对象
cellData: Record<number, Record<number, CellData>>
```

**验收标准**：
- 100 万单元格读写性能测试通过
- 合并单元格边界测试覆盖
- 样式池去重功能正常

---

### Phase 2: 布局与渲染

**目标**：实现高性能的虚拟滚动和 Canvas 渲染

**核心模块**：
| 模块 | 职责 | 体积预算 |
|------|------|----------|
| LayoutManager | 行高列宽、坐标转换 | 3KB |
| IndexMapper | 逻辑/物理索引映射 | 2KB |
| AccumulatorCache | 累积偏移缓存 | 1KB |
| Viewport | 视口管理、虚拟滚动 | 2KB |
| SheetRenderer | Canvas 绘制 | 8KB |
| DirtyRect | 脏矩形追踪 | 2KB |

**渲染架构**：
```
┌─────────────────────────────────────────┐
│  DOM Layer (事件捕获、输入、滚动)        │
├─────────────────────────────────────────┤
│  Canvas: Selection Layer (选区/拖拽)     │  ← 频繁重绘
├─────────────────────────────────────────┤
│  Canvas: Main Layer (网格+内容)          │  ← 脏矩形重绘
└─────────────────────────────────────────┘
```

**渲染优化技术**：
1. Path2D 批量绘制（按颜色分组，减少 draw call）
2. 网格线清除法（先画全部线，再 clearRect 合并区域）
3. 脏矩形增量渲染（`globalCompositeOperation: 'copy'`）

**性能目标**：
| 指标 | 目标值 |
|------|--------|
| 首屏渲染 | < 50ms |
| 滚动帧率 | 60fps |
| 内存占用（100万单元格） | < 200MB |

---

### Phase 3: 交互系统

**目标**：实现完整的用户交互，包括鼠标、键盘、触摸支持

**核心模块**：
| 模块 | 职责 |
|------|------|
| EventEmitter | 事件总线 |
| EventManager | DOM 事件绑定与归一化 |
| InteractionManager | 交互状态机 |
| SelectionManager | 选区管理 |
| KeyboardHandler | 键盘导航与快捷键 |
| TouchHandler | 触摸手势支持 |
| CellEditor | 单元格编辑器 |
| ContextMenu | 右键菜单 |

**交互状态机**：
```typescript
type InteractionState =
  | { type: 'idle' }
  | { type: 'selecting', start, current }
  | { type: 'rowResizing', row, startY, startHeight }
  | { type: 'colResizing', col, startX, startWidth }
  | { type: 'filling', selection, direction }
  | { type: 'editing', pos }
```

**功能支持**：
- 单选/多选/范围选择
- Ctrl+点击添加选区、Shift+点击扩展选区
- 方向键/Tab/Enter 导航
- 边缘拖拽自动滚动
- IME 中文输入支持
- 触摸手势（点击/双击/长按/滑动/缩放）

---

### Phase 4: 命令与历史

**目标**：实现命令模式，支持撤销/重做和事务

**核心模块**：
| 模块 | 职责 |
|------|------|
| Command | 命令定义 |
| CommandDispatcher | 命令分发与钩子 |
| UndoStack | 撤销/重做栈 |
| Transaction | 批量操作事务 |

**内置命令**：
```
SET_CELL / SET_CELLS / CLEAR_CELLS
INSERT_ROWS / DELETE_ROWS / INSERT_COLS / DELETE_COLS
SET_ROW_HEIGHT / SET_COL_WIDTH
HIDE_ROWS / SHOW_ROWS / HIDE_COLS / SHOW_COLS
MERGE_CELLS / UNMERGE_CELLS
SET_STYLE
ADD_SHEET / DELETE_SHEET / RENAME_SHEET / MOVE_SHEET
```

**设计决策**：
- 历史大小：默认 100 个撤销步骤
- 命令合并：300ms 内同一单元格的连续输入合并
- 嵌套事务：不支持
- 命令序列化：暂不实现，接口预留

---

### Phase 5: 插件系统

**目标**：实现灵活的插件架构，支持功能扩展

**插件接口**：
```typescript
interface Plugin {
  manifest: PluginManifest

  // 生命周期钩子
  onInstall?(ctx: PluginContext): void
  onUninstall?(ctx: PluginContext): void

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
  // ...
}
```

**PluginContext 能力**：
- Workbook 访问
- CommandDispatcher 访问
- EventEmitter 访问
- LayoutManager 访问
- 私有状态存储

---

### Phase 6: 核心插件

**目标**：实现常用功能插件

| 插件 | 包名 | 功能 |
|------|------|------|
| Clipboard | @holy-sheet/clipboard | 复制/剪切/粘贴、格式保留 |
| Formula | @holy-sheet/formula | 公式解析、常用函数、依赖追踪 |
| History | @holy-sheet/history | Ctrl+Z/Y 快捷键 |
| XLSX | @holy-sheet/xlsx | Excel 文件导入导出 |

**公式引擎能力**：
- 基础函数：SUM、AVERAGE、COUNT、MAX、MIN
- 逻辑函数：IF、AND、OR
- 查找函数：VLOOKUP、INDEX、MATCH
- 依赖追踪与增量计算
- 循环引用检测

---

### Phase 7: 性能优化

**目标**：针对大数据量场景进行深度优化

**优化方向**：

1. **Worker 集成（Phase 1）**
   - 公式计算 Worker
   - 排序/筛选 Worker
   - 数据处理 Worker

2. **渲染优化**
   - 字体测量缓存
   - Path2D 对象池
   - 层级合并

3. **内存优化**
   - 稀疏数据压缩
   - 视口外数据卸载
   - 样式池优化

4. **OffscreenCanvas（Phase 2）**
   - Worker 中渲染
   - 主线程合成
   - 帧同步

**性能基准**：
| 场景 | 目标 |
|------|------|
| 100 万单元格加载 | < 1s |
| 大范围选择 | 60fps |
| 公式计算（1000 个） | < 100ms |
| 排序（10 万行） | < 500ms |

---

### Phase 8: 生态建设

**目标**：完善文档和示例，建设开发者生态

**交付物**：
- 完整 API 文档
- 教程系列（快速开始、基础用法、高级特性、插件开发）
- 示例集合（基础表格、公式表格、大数据表格、自定义渲染）
- 框架适配（React、Vue、Svelte 组件封装）
- 开发者工具（Chrome DevTools 扩展、性能分析工具）

---

## 5. 里程碑定义

| 里程碑 | 阶段 | 交付目标 | 验收标准 |
|--------|------|----------|----------|
| **M0** | Phase 0 | 项目基础设施就绪 | 可构建、可测试、CI 通过 |
| **M1** | Phase 1-2 | 静态表格渲染（只读） | 100万单元格渲染、60fps 滚动 |
| **M2** | Phase 3-4 | 交互式表格（可编辑） | 选区、编辑、撤销/重做正常 |
| **M3** | Phase 5-6 | 完整功能表格（带公式） | 插件系统、公式计算、剪贴板 |
| **M4** | Phase 7 | 高性能版本 | 性能基准全部达标 |
| **M5** | Phase 8 | 正式发布 1.0 | 文档完善、示例齐全 |

---

## 6. 核心包体积预算

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

## 7. 风险评估与缓解

| 风险 | 影响 | 可能性 | 缓解措施 |
|------|------|--------|----------|
| Canvas 渲染性能瓶颈 | 高 | 中 | 分层渲染、脏矩形、Worker |
| 公式引擎复杂度 | 中 | 高 | 渐进实现，优先常用函数 |
| 内存占用过高 | 高 | 中 | 稀疏存储、视口卸载 |
| 跨浏览器兼容性 | 中 | 中 | 特性检测、Polyfill |
| 触摸设备适配 | 中 | 中 | 专门的触摸处理层 |
| 包体积超标 | 中 | 低 | Tree-shaking、代码审查 |

---

## 8. 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-12 | 1.0 | 初始版本 |
