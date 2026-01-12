## Holy Sheet：分阶段开发计划与任务（Phase 0-8）

> 版本：1.0
> 更新日期：2026-01-12
> 参考来源：[`../../docs/development-plan.md`](../../docs/development-plan.md)、[`../../docs/technical-roadmap.md`](../../docs/technical-roadmap.md)、[`../../docs/brainstorm-session.md`](../../docs/brainstorm-session.md)
> 设计规格：[`design-spec.md`](design-spec.md)
> 路线与里程碑：[`roadmap-and-goals.md`](roadmap-and-goals.md)

## 1. 使用方式（建议）

- 按 Phase 推进：每个 Phase 都有 **目标 → 任务 → 交付物 → 验收标准（DoD）**。
- 优先跑通“最小可演示链路”：
  - Phase 1-2：只读可滚动
  - Phase 3-4：可交互可编辑 + 撤销
  - Phase 5-6：插件体系与常用插件
  - Phase 7：性能达标
  - Phase 8：文档与生态
- 每个 Phase 完成后做一次“里程碑检查点”，避免后期返工。

## 2. 阶段依赖与里程碑总览

| 里程碑 | 覆盖 Phase | 核心能力 | 必要验收 |
|-------:|------------|----------|----------|
| M0 | 0 | 工程化就绪 | 可构建/可测试/可发布、playground 可运行 |
| M1 | 1-2 | 静态表格（只读） | 可加载数据、渲染正确、滚动流畅（目标 60fps） |
| M2 | 3-4 | 交互式表格（可编辑） | 选择/编辑/键盘/IME；撤销重做可用 |
| M3 | 5-6 | 插件化功能表格 | 插件钩子稳定；剪贴板/公式/xlsx 主流程跑通 |
| M4 | 7 | 高性能版本 | 百万单元格与复杂交互达到目标指标 |
| M5 | 8 | 生态与 1.0 | 文档/示例/适配完善，可对外发布 |

## Phase 0：基础设施

### 目标

搭建可持续开发的工程体系：可构建、可测试、可发布、可文档化、可跑基准。

### 任务清单

#### 0.1 项目初始化

- [ ] 创建仓库基础文件：`.gitignore`、`LICENSE`、`README`
- [ ] 初始化 pnpm workspace（monorepo）
- [ ] TypeScript 配置：strict 模式、统一 path alias 策略
- [ ] tsdown 构建配置（core 与插件包的多入口打包策略）
- [ ] ESLint + Prettier（统一规则、提交前检查）

#### 0.2 包结构搭建

- [ ] 创建 `packages/core`（`@holy-sheet/core`）
- [ ] 创建 `packages/formula`、`packages/clipboard`、`packages/xlsx`
- [ ] 创建 `packages/playground`：
  - 基础 demo（100x100 小表）
  - 性能 demo（例如 1e6 cells 稀疏生成）
  - 基准开关（便于 A/B 对比）

#### 0.3 测试与 CI/CD

- [ ] 配置 Vitest（单元测试）
- [ ] 配置 Playwright（E2E）
- [ ] GitHub Actions：lint/test/build
- [ ] 发布流程（版本号策略、tag、changelog）

#### 0.4 文档与 API

- [ ] VitePress 文档框架
- [ ] API 文档自动生成（至少对 core 的 public API）

### 交付物

- Monorepo 可运行（构建/测试/格式化/文档站均能跑）
- playground 可启动并展示基础 demo

### 验收标准（DoD）

- CI 在干净环境可通过（lint + test + build）
- `@holy-sheet/core` 可被 playground 引用并运行

## Phase 1：核心数据层（model）

### 目标

实现可被渲染与交互消费的数据模型：Workbook/Sheet/CellData/样式/合并索引。

### 依赖

- Phase 0 完成（工程化与测试框架可用）

### 任务清单

#### 1.1 基础类型定义

- [ ] 定义 `CellValue / CellType / CellData`
- [ ] 定义 `CellStyle / BorderStyle / RichTextData`
- [ ] 定义 `MergeCell / FreezeConfig / SheetMeta / WorkbookMeta`
- [ ] 统一索引约定（0-based）与范围结构（`sr/sc/er/ec`）

#### 1.2 Workbook

- [ ] `Workbook` 基础结构与元数据
- [ ] Sheet 管理：add/delete/rename/move/switchActive
- [ ] 全局样式表：`styles: Record<StyleId, CellStyle>`

#### 1.3 Sheet

- [ ] 稀疏存储：`cellData: Record<number, Record<number, CellData>>`
  - getCell/setCell/clearCell
  - 批量 setCells/clearRange（为后续粘贴与填充铺路）
- [ ] 行列参数：`rowCount/colCount/defaultRowHeight/defaultColWidth`
- [ ] 冻结窗格：`frozen: FreezeConfig | null`（先数据层落地，渲染后续支持）

#### 1.4 StylePool

- [ ] 样式去重（稳定序列化 + map）
- [ ] 支持 StyleId 与内联样式双模式
  - `normalize(style)`：内联 → StyleId（可选策略）
  - `resolve(style)`：StyleId/内联 → 统一 CellStyle

#### 1.5 MergeIndex

- [ ] merges 存储与 rowIndex 构建
- [ ] `getMergeAt` / `isMasterCell` / `isSlaveCell`
- [ ] `getMergesInViewport`（为渲染加速）

### 交付物

- model 模块可独立单测，性能与边界用例覆盖

### 验收标准（DoD）

- 单测覆盖：
  - Workbook/Sheet CRUD
  - 稀疏读写一致性
  - StylePool 去重正确
  - MergeIndex 查询边界（含重叠/相邻/越界输入处理策略明确）
- 在 playground 中能构建数据并被后续渲染模块消费（即便渲染暂未完成）

## Phase 2：布局与渲染（layout + render）

### 目标

实现只读可滚动的高性能表格渲染（分层 Canvas + 虚拟滚动 + 脏矩形）。

### 依赖

- Phase 1（数据模型与合并索引）

### 任务清单

#### 2.1 IndexMapper

- [ ] Segment 数据结构
- [ ] `toPhysical/toLogical` 转换
- [ ] `insert/delete/compact`（插入删除后映射正确）

#### 2.2 AccumulatorCache

- [ ] 分块累积计算（建议 `BLOCK_SIZE=1000`）
- [ ] `invalidateFrom` 与增量重建
- [ ] `getOffset` 与 `getIndexAtOffset`（滚动定位关键）

#### 2.3 HiddenRanges

- [ ] Set 模式（少量隐藏）
- [ ] 区间模式（批量隐藏）
  - 阈值切换逻辑（默认 100）

#### 2.4 LayoutManager

- [ ] 行高/列宽：默认值 + 覆盖值
  - 查询：`getRowHeight/getColWidth`
  - 修改：`setRowHeight/setColWidth`
- [ ] 偏移计算：`getRowOffset/getColOffset`
- [ ] 像素→坐标：`getCellAtPoint(x,y)`
- [ ] 可视范围：`getVisibleRange(scroll,size)`（带 buffer）
- [ ] 事务：`beginTransaction/endTransaction`（批量更新减少重复失效）

#### 2.5 Viewport

- [ ] 视口状态：scroll/size/buffer
- [ ] 滚动方向检测与 delta 计算（为 copy 平移铺路）
- [ ] 触发 viewport-change 事件（供渲染与插件监听）

#### 2.6 SheetRenderer（主渲染）

- [ ] 分层结构落地：Main Canvas + Selection Canvas + DOM Layer
- [ ] 绘制流程（对齐 `design-spec.md`）：
  - 网格线
  - 合并区域内部 clearRect
  - 背景（Path2D 批量）
  - 内容（文本/富文本最小实现）
  - 边框
- [ ] 合并单元格：只绘制 master cell 内容（宽高为合并后的矩形）

#### 2.7 DirtyRect（增量渲染）

- [ ] 脏区域追踪与合并策略（避免无限增长）
- [ ] `globalCompositeOperation: 'copy'` 平移复用
  - 只补画新增暴露区域

#### 2.8 CacheCanvas（可选）

- [ ] 离屏缓存：滚动复用、重复内容缓存
- [ ] 缓存上限与回收策略（避免内存炸）

### 交付物

- M1：静态表格（只读）可演示：加载数据、渲染正确、滚动流畅

### 验收标准（DoD）

- 渲染正确性：
  - 网格线、背景、文本对齐、边框最小集
  - 合并单元格网格线清除正确，内容只绘制一次
- 性能：
  - 首屏 < 50ms（在明确的基准数据集上）
  - 持续滚动 60fps（基准定义在 playground）
- 测试：
  - LayoutManager 单测覆盖像素↔行列映射与 insert/delete/hide
  - 渲染回归（可先做截图对比的 E2E 基础框架）

## Phase 3：交互系统（event）

### 目标

实现完整交互：选择、编辑、键盘、触摸、右键菜单、拖拽自动滚动、IME。

### 依赖

- Phase 2（可视范围、坐标映射、渲染层）

### 任务清单

#### 3.1 EventEmitter

- [ ] `on/once/off/emit`（类型安全逐步增强）

#### 3.2 EventManager

- [ ] DOM 事件绑定与归一化：mouse/keyboard/touch/scroll
- [ ] 坐标转换：client → sheet content（考虑滚动与容器偏移）
- [ ] 统一事件命名（如 `cell:click`、`selection:change`、`edit:start`）

#### 3.3 InteractionManager（状态机）

- [ ] 状态定义：idle/selecting/resizing/editing/filling
- [ ] 状态转换：
  - mousedown → selecting
  - double click → editing
  - resize handle → resizing
  - drag fill handle → filling

#### 3.4 SelectionManager + Selection 渲染

- [ ] 单选/多选/范围选择（Ctrl/Shift）
  - `setRange/addRange/extendTo`
- [ ] 合并单元格扩展：`expandForMerge`
- [ ] Selection Canvas 渲染（高频重绘）

#### 3.5 KeyboardHandler

- [ ] 方向键导航、Tab/Enter 移动
- [ ] 快捷键映射（复制/粘贴/撤销等与插件协作）
- [ ] 插件拦截：`onKeyDown/onKeyUp` 优先级（先插件后默认）

#### 3.6 TouchHandler

- [ ] 点击/双击/长按（触发选择/编辑/菜单）
- [ ] 滑动滚动（含惯性滚动策略）
- [ ] 双指缩放（可选：先占位接口，后续实现）

#### 3.7 AutoScroller

- [ ] 边缘检测（阈值 50）
- [ ] 速度曲线（base 10 / max 50）
- [ ] 与 selecting/filling 状态协作

#### 3.8 CellEditor（输入与 IME）

- [ ] editor DOM：定位与显示/隐藏
- [ ] compositionstart/update/end（IME）
- [ ] Enter/Escape 语义：IME 确认 vs 提交编辑
- [ ] 与命令合并（Phase 4）联动策略

#### 3.9 ContextMenu

- [ ] 内置菜单项（cut/copy/paste、插入/删除行列、合并等）
- [ ] 插件扩展：register/unregister、分组、插入位置
- [ ] show/hide 与定位策略（避免溢出视口）

### 交付物

- 交互式表格（可选择、可进入编辑、可键盘导航）

### 验收标准（DoD）

- 选择/编辑/键盘/右键菜单主路径通过 E2E
- IME 输入可用且不会误触发提交/撤销
- 拖拽选择时边缘自动滚动稳定（不抖动、不飘）

## Phase 4：命令与历史（command）

### 目标

用命令模式驱动数据变更，支持撤销/重做、事务、命令合并（提升编辑体验）。

### 依赖

- Phase 1（可变更的数据模型）
- Phase 3（编辑入口与交互事件）

### 任务清单

#### 4.1 Command / Result / UndoData

- [ ] 定义 `Command`、`CommandResult`、`UndoData` 基础类型
- [ ] 明确“可序列化”边界（协同编辑暂不实现，但预留）

#### 4.2 CommandDispatcher

- [ ] handler 注册与 execute
- [ ] before/after hooks（供插件/内部扩展）
- [ ] 命令合并窗口：默认 300ms
  - 规则：同一 cell 的连续输入合并
  - `breakMerge()`：明确打断（如鼠标点击切换 cell）

#### 4.3 Undo/Redo 栈

- [ ] 大小限制（默认 100）
- [ ] 分组撤销（事务提交为一个组）

#### 4.4 Transaction

- [ ] `begin/commit/rollback`
  - 事务期间收集 undo
  - commit 后压栈
  - rollback 还原

#### 4.5 内置命令实现（最小到完整）

- [ ] 数据：SET_CELL / SET_CELLS / CLEAR_CELLS
- [ ] 行列：INSERT/DELETE、HIDE/SHOW、SET_ROW_HEIGHT/SET_COL_WIDTH
- [ ] 合并：MERGE/UNMERGE
- [ ] 样式：SET_STYLE（对 StylePool 的使用策略明确）
- [ ] Sheet：ADD/DELETE/RENAME/MOVE

### 交付物

- M2：可交互可编辑 + 撤销/重做可用（基础编辑体验成立）

### 验收标准（DoD）

- 撤销/重做正确（含合并命令、事务）
- 连续输入合并体验正确：
  - 300ms 内输入合并为一次撤销
  - 切换 cell 会打断合并
- 单测覆盖：命令执行、undo 数据生成、事务边界

## Phase 5：插件系统（plugin）

### 目标

建立稳定的插件扩展机制：生命周期、依赖、钩子链路与返回值约定明确且可组合。

### 依赖

- Phase 4（命令 hooks）
- Phase 3（交互 hooks）
- Phase 2（渲染 hooks）

### 任务清单

#### 5.1 接口与类型

- [ ] PluginManifest / Plugin / PluginContext 类型定义
- [ ] 钩子返回值约定文档化（参考 `design-spec.md`）

#### 5.2 PluginManager

- [ ] install/uninstall
  - 依赖解析与校验
  - 生命周期调用（onInstall/onUninstall）
- [ ] list/get/has

#### 5.3 PluginContext

- [ ] 暴露核心能力访问：workbook/commands/events/layout/selection
- [ ] 插件私有状态：getState/setState

#### 5.4 钩子调用链（顺序与短路）

- [ ] 数据钩子：onCellGet/onCellSet
  - 链式变换（最后一个返回值覆盖/叠加策略明确）
  - 拦截（false）短路策略明确
- [ ] 命令钩子：onBeforeCommand/onAfterCommand
- [ ] 渲染钩子：onCellRender（渲染输入变换）
- [ ] 交互钩子：click/key/edit/scroll/viewport-change

### 交付物

- 插件基础设施可用，核心插件可以开始接入

### 验收标准（DoD）

- 能安装/卸载插件，并且钩子在正确时机触发
- 插件可拦截默认行为（例如 keydown/cellSet/command）
- 多插件同时存在时行为可预测（顺序确定、短路一致）

## Phase 6：核心插件（clipboard / formula / history / xlsx）

### 目标

把最常用能力以插件形式落地，验证插件体系可用且 API 足够表达。

### 依赖

- Phase 5（插件系统）

### 任务清单

#### 6.1 `@holy-sheet/clipboard`

- [ ] COPY/CUT/PASTE 命令与快捷键
- [ ] 范围复制：值 + 样式（策略：是否默认保留格式）
- [ ] 跨 Sheet 粘贴（同 Workbook）
- [ ] 支持纯文本/HTML（可分阶段）

#### 6.2 `@holy-sheet/formula`

- [ ] 公式解析器（Excel 语法子集）
- [ ] 常用函数：SUM/AVERAGE/COUNT/MAX/MIN
- [ ] 逻辑函数：IF/AND/OR
- [ ] 查找函数：VLOOKUP/INDEX/MATCH（可分阶段）
- [ ] 依赖追踪与增量计算
- [ ] 循环引用检测与错误输出（CellType='e'）

#### 6.3 `@holy-sheet/history`

- [ ] Ctrl+Z / Ctrl+Y 快捷键（或 Cmd+Z）
- [ ] 历史面板 UI（可选：先提供事件/数据接口，UI 放到生态阶段）

#### 6.4 `@holy-sheet/xlsx`

- [ ] xlsx 导入解析（值/合并/样式/公式映射策略）
- [ ] xlsx 导出生成
- [ ] 与 StylePool 的映射与去重策略

### 交付物

- M3：插件体系 + 核心插件主路径跑通（功能表格成立）

### 验收标准（DoD）

- clipboard：复制粘贴正确（含合并区域与样式策略明确）
- formula：典型表格（几百到几千公式）可用，依赖刷新正确
- xlsx：可导入导出一个包含样式/合并/公式的示例文件（兼容策略文档化）

## Phase 7：性能优化（深水区）

### 目标

把“可用”提升到“在大数据与重交互下仍稳定”：Worker、缓存、对象池、内存策略。

### 依赖

- Phase 2-6（完整功能链路）

### 任务清单

#### 7.1 Worker 集成（Phase 1）

- [ ] Worker 通信封装（request/response、超时、取消）
- [ ] 公式计算 Worker（将重计算移出主线程）
- [ ] 排序/筛选 Worker（可选，取决于需求优先级）

#### 7.2 渲染优化

- [ ] 文本测量缓存（按 fontKey + textKey）
- [ ] Path2D 对象池与复用策略
- [ ] 减少绘制调用：按样式分组、合并批次
- [ ] 层级与缓存策略调优（Selection/Main 分离，必要时合并）

#### 7.3 内存优化

- [ ] 稀疏数据压缩策略（如按行分块、惰性创建行对象）
- [ ] 视口外数据策略（谨慎：避免影响功能正确性）
- [ ] 样式池压缩与上限策略（避免无限增长）

#### 7.4 OffscreenCanvas（Phase 2，可选）

- [ ] Worker 中渲染 Main Layer，主线程合成
- [ ] 特性检测与降级路径
- [ ] 帧同步与输入延迟评估

### 交付物

- M4：高性能版本（在明确基准上达到目标指标）

### 验收标准（DoD）

- 100 万单元格加载 < 1s（基准定义固定）
- 持续滚动 60fps（或明确的掉帧阈值与统计口径）
- 交互（选择/编辑/粘贴）不出现明显卡顿（配合性能面板数据）

## Phase 8：生态建设与 1.0

### 目标

完成文档、示例、框架适配与开发者体验，发布 1.0。

### 依赖

- Phase 0-7（核心能力与性能达标）

### 任务清单

#### 8.1 文档

- [ ] 完整 API 文档：core + plugin API
- [ ] 教程：快速开始/基础用法/高级特性/插件开发
- [ ] 设计与性能说明：为什么这样设计、如何跑基准

#### 8.2 示例

- [ ] 基础表格、带公式表格、大数据表格
- [ ] 自定义渲染示例（演示 onCellRender）
- [ ] 插件示例集合（最佳实践）

#### 8.3 框架适配

- [ ] React 封装（组件化 API）
- [ ] Vue 封装（可选）

#### 8.4 开发者工具（可选）

- [ ] 性能分析/调试辅助（DevTools 扩展或内置面板）

### 交付物

- M5：1.0 发布（文档完善、示例齐备、对外可用）

### 验收标准（DoD）

- 文档站可访问、快速开始可跑通
- 示例覆盖核心能力与常见集成方式
- 发布流程稳定（版本/变更记录/兼容策略透明）

