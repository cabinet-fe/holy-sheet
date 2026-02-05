## 1. 项目基础设施

- [ ] 1.1 初始化 pnpm workspace，创建 pnpm-workspace.yaml
- [ ] 1.2 配置根目录 TypeScript (tsconfig.json)，启用 strict 模式
- [ ] 1.3 配置 ESLint + Prettier，添加 .editorconfig
- [ ] 1.4 创建 packages/core 目录结构和 package.json
- [ ] 1.5 配置 tsdown 构建，输出 ESM + CJS + 类型定义
- [ ] 1.6 配置 Vitest 单元测试框架
- [ ] 1.7 创建 packages/playground（Vite 开发环境）

## 2. 数据模型层 (data-model)

- [ ] 2.1 定义 CellValue、CellType、StyleId 基础类型
- [ ] 2.2 定义 CellData 接口（v/s/t/f/si/p/custom 字段）
- [ ] 2.3 定义 CellStyle、TextStyle、BorderStyle 接口
- [ ] 2.4 定义 RichTextData、TextRun 接口
- [ ] 2.5 定义 MergeCell、FreezeConfig 接口
- [ ] 2.6 实现 Workbook 类（sheets 管理、activeSheet）
- [ ] 2.7 实现 Sheet 类（稀疏矩阵存储 cellData）
- [ ] 2.8 实现 Sheet.getCell/setCell/clearCell 方法
- [ ] 2.9 实现 Sheet.getCellRange/setCellRange 方法
- [ ] 2.10 实现 StylePool 类（样式哈希去重、add/get/merge）
- [ ] 2.11 实现 MergeIndex 类（行索引、getMergeAt、getMergesInViewport）
- [ ] 2.12 编写数据模型单元测试

## 3. 布局系统 (layout-system)

- [ ] 3.1 定义 Segment 数据结构
- [ ] 3.2 实现 IndexMapper 类（toPhysical、toLogical、insert、delete）
- [ ] 3.3 实现 AccumulatorCache 类（分块缓存、getOffset、getIndexAtOffset）
- [ ] 3.4 实现 HiddenRanges 类（Set/区间双模式存储）
- [ ] 3.5 实现 LayoutManager 类基础结构
- [ ] 3.6 实现 LayoutManager.getRowHeight/getColWidth
- [ ] 3.7 实现 LayoutManager.getRowOffset/getColOffset
- [ ] 3.8 实现 LayoutManager.getCellAtPoint（像素 → 坐标）
- [ ] 3.9 实现 LayoutManager.getVisibleRange（视口范围）
- [ ] 3.10 实现 LayoutManager 事务支持（beginTransaction/endTransaction）
- [ ] 3.11 编写布局系统单元测试

## 4. 渲染引擎 (render-engine)

- [ ] 4.1 实现 Viewport 类（滚动状态、缓冲区、scrollToCell）
- [ ] 4.2 实现 DirtyRect 类（脏区域追踪、合并、flush）
- [ ] 4.3 创建分层 Canvas 结构（Main + Selection + DOM Layer）
- [ ] 4.4 实现 SheetRenderer 类基础结构
- [ ] 4.5 实现网格线绘制（drawGridLines）
- [ ] 4.6 实现合并单元格 clearRect 处理
- [ ] 4.7 实现背景绘制（Path2D 批量按颜色分组）
- [ ] 4.8 实现文本内容绘制（对齐、换行、旋转）
- [ ] 4.9 实现边框绘制
- [ ] 4.10 实现行/列标题渲染（A/B/C... 和 1/2/3...）
- [ ] 4.11 实现滚动优化（canvas copy 平移）
- [ ] 4.12 实现 resize 处理
- [ ] 4.13 编写渲染引擎视觉测试

## 5. 事件系统 (event-system)

- [ ] 5.1 实现 EventEmitter 类（on/off/emit/once）
- [ ] 5.2 定义事件类型常量（CELL_CLICK、SELECTION_CHANGE 等）
- [ ] 5.3 实现 EventManager（DOM 事件绑定与归一化）
- [ ] 5.4 实现 InteractionManager 状态机
- [ ] 5.5 实现 SelectionManager（setRange/addRange/extendTo/move）
- [ ] 5.6 实现选区的合并单元格扩展逻辑
- [ ] 5.7 实现选区渲染到 Selection Canvas
- [ ] 5.8 实现 KeyboardHandler（方向键、Tab、Enter、Ctrl+方向键）
- [ ] 5.9 实现 TouchHandler（点击、双击、长按、滑动、缩放）
- [ ] 5.10 实现 AutoScroller（边缘检测、速度计算）
- [ ] 5.11 实现 CellEditor（输入框定位、IME 处理）
- [ ] 5.12 实现 ContextMenu（内置菜单项、显示/隐藏）
- [ ] 5.13 编写事件系统单元测试

## 6. 命令系统 (command-system)

- [ ] 6.1 定义 Command、CommandResult、UndoData 接口
- [ ] 6.2 定义 CommandType 枚举
- [ ] 6.3 实现 CommandDispatcher 类（register/execute）
- [ ] 6.4 实现 before/after 钩子机制
- [ ] 6.5 实现 UndoStack（undo/redo 栈、大小限制 100）
- [ ] 6.6 实现 Transaction（beginTransaction/commit/rollback）
- [ ] 6.7 实现命令合并逻辑（300ms 窗口）
- [ ] 6.8 实现 SET_CELL/SET_CELLS/CLEAR_CELLS 命令
- [ ] 6.9 实现 INSERT_ROWS/DELETE_ROWS/INSERT_COLS/DELETE_COLS 命令
- [ ] 6.10 实现 SET_ROW_HEIGHT/SET_COL_WIDTH 命令
- [ ] 6.11 实现 HIDE_ROWS/SHOW_ROWS/HIDE_COLS/SHOW_COLS 命令
- [ ] 6.12 实现 MERGE_CELLS/UNMERGE_CELLS 命令
- [ ] 6.13 实现 SET_STYLE 命令
- [ ] 6.14 实现 ADD_SHEET/DELETE_SHEET/RENAME_SHEET/MOVE_SHEET 命令
- [ ] 6.15 编写命令系统单元测试

## 7. 插件系统 (plugin-system)

- [ ] 7.1 定义 PluginManifest 接口
- [ ] 7.2 定义 Plugin 接口（所有钩子类型）
- [ ] 7.3 定义 PluginContext 接口
- [ ] 7.4 实现 PluginManager 类（install/uninstall/依赖解析）
- [ ] 7.5 实现 PluginContext 类（核心模块访问、状态存储）
- [ ] 7.6 实现数据钩子调用链（onCellGet/onCellSet）
- [ ] 7.7 实现命令钩子调用链（onBeforeCommand/onAfterCommand）
- [ ] 7.8 实现渲染钩子调用链（onCellRender）
- [ ] 7.9 实现交互钩子调用链（onKeyDown/onCellClick 等）
- [ ] 7.10 实现内置 History 插件（Ctrl+Z/Y）
- [ ] 7.11 编写插件系统单元测试

## 8. 集成与测试

- [ ] 8.1 创建 HolySheet 主类，整合所有子系统
- [ ] 8.2 实现公开 API（create、destroy、getData、setData）
- [ ] 8.3 在 playground 中集成完整功能演示
- [ ] 8.4 性能测试：10000 单元格首屏渲染 < 50ms
- [ ] 8.5 性能测试：滚动帧率 60fps
- [ ] 8.6 编写 E2E 测试（Playwright）
- [ ] 8.7 完善 README 和基础使用文档
