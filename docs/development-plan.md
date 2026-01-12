# Holy Sheet 开发计划

> 版本：1.0
> 更新日期：2026-01-09

## Phase 0: 基础设施

### 0.1 项目初始化
- [ ] 创建 GitHub 仓库
- [ ] 初始化 pnpm workspace
- [ ] 配置 TypeScript（strict 模式）
- [ ] 配置 tsdown 构建
- [ ] 配置 ESLint + Prettier
- [ ] 添加 .gitignore、LICENSE、README

### 0.2 包结构搭建
- [ ] 创建 packages/core
- [ ] 创建 packages/formula
- [ ] 创建 packages/clipboard
- [ ] 创建 packages/xlsx
- [ ] 创建 packages/playground

### 0.3 测试与 CI
- [ ] 配置 Vitest
- [ ] 配置 Playwright
- [ ] 创建 GitHub Actions 工作流
- [ ] 配置自动发布流程

---

## Phase 1: 核心数据层

### 1.1 基础类型定义
- [ ] CellValue、CellType 类型
- [ ] CellData 接口
- [ ] CellStyle 接口
- [ ] MergeCell 接口

### 1.2 Workbook 实现
- [ ] Workbook 类基础结构
- [ ] Sheet 管理（CRUD）
- [ ] 活动 Sheet 切换
- [ ] 样式表管理

### 1.3 Sheet 实现
- [ ] Sheet 类基础结构
- [ ] cellData 稀疏存储
- [ ] 行高/列宽配置
- [ ] 默认值管理

### 1.4 MergeIndex 实现
- [ ] MergeCell 存储
- [ ] 行索引构建
- [ ] getMergeAt 查询
- [ ] 视口范围查询

### 1.5 StylePool 实现
- [ ] 样式存储
- [ ] 样式去重
- [ ] ID/内联双模式

---

## Phase 2: 布局与渲染

### 2.1 IndexMapper 实现
- [ ] Segment 数据结构
- [ ] toPhysical/toLogical 转换
- [ ] insert/delete 操作
- [ ] compact 合并

### 2.2 AccumulatorCache 实现
- [ ] 分块累积计算
- [ ] 局部失效
- [ ] 增量重建

### 2.3 HiddenRanges 实现
- [ ] Set 模式存储
- [ ] 区间模式存储
- [ ] 自动切换逻辑

### 2.4 LayoutManager 实现
- [ ] 行高/列宽查询
- [ ] 偏移量计算
- [ ] 像素→坐标转换
- [ ] 可视范围计算

### 2.5 Viewport 实现
- [ ] 视口状态管理
- [ ] 缓冲区计算
- [ ] 滚动方向检测

### 2.6 SheetRenderer 实现
- [ ] 网格线绘制
- [ ] 背景绘制（Path2D）
- [ ] 内容绘制
- [ ] 边框绘制
- [ ] 合并单元格 clearRect

### 2.7 DirtyRect 实现
- [ ] 脏区域追踪
- [ ] 增量重绘逻辑
- [ ] copy 模式平移

### 2.8 分层 Canvas
- [ ] Main Canvas 创建
- [ ] Selection Canvas 创建
- [ ] DOM Layer 创建
- [ ] 层级管理

---

## Phase 3: 交互系统

### 3.1 EventEmitter 实现
- [ ] on/once/off/emit
- [ ] 类型安全

### 3.2 EventManager 实现
- [ ] DOM 事件绑定
- [ ] 事件归一化
- [ ] 坐标转换

### 3.3 InteractionManager 实现
- [ ] 状态机定义
- [ ] 状态转换逻辑
- [ ] idle/selecting/resizing/editing/filling

### 3.4 SelectionManager 实现
- [ ] 选区数据结构
- [ ] setRange/addRange/extendTo
- [ ] 合并单元格扩展
- [ ] 选区渲染

### 3.5 KeyboardHandler 实现
- [ ] 方向键导航
- [ ] Tab/Enter 处理
- [ ] 快捷键映射

### 3.6 TouchHandler 实现
- [ ] 点击/双击/长按
- [ ] 滑动 + 惯性
- [ ] 双指缩放

### 3.7 AutoScroller 实现
- [ ] 边缘检测
- [ ] 速度计算
- [ ] 动画循环

### 3.8 CellEditor 实现
- [ ] 输入框创建
- [ ] 定位逻辑
- [ ] IME 处理
- [ ] 值提交

### 3.9 ContextMenu 实现
- [ ] 菜单数据结构
- [ ] DOM 渲染
- [ ] 内置菜单项
- [ ] 插件扩展接口

---

## Phase 4: 命令与历史

### 4.1 Command 定义
- [ ] Command 接口
- [ ] CommandResult 类型
- [ ] UndoData 类型

### 4.2 CommandDispatcher 实现
- [ ] execute 方法
- [ ] 钩子系统
- [ ] 命令合并逻辑

### 4.3 UndoStack 实现
- [ ] undo/redo 栈
- [ ] 大小限制
- [ ] 分组支持

### 4.4 Transaction 实现
- [ ] begin/commit/rollback
- [ ] 批量收集

### 4.5 内置命令实现
- [ ] SET_CELL / SET_CELLS / CLEAR_CELLS
- [ ] INSERT_ROWS / DELETE_ROWS
- [ ] INSERT_COLS / DELETE_COLS
- [ ] SET_ROW_HEIGHT / SET_COL_WIDTH
- [ ] HIDE_ROWS / SHOW_ROWS / HIDE_COLS / SHOW_COLS
- [ ] MERGE_CELLS / UNMERGE_CELLS
- [ ] SET_STYLE
- [ ] ADD_SHEET / DELETE_SHEET / RENAME_SHEET / MOVE_SHEET

---

## Phase 5: 插件系统

### 5.1 插件接口定义
- [ ] PluginManifest 接口
- [ ] Plugin 接口
- [ ] PluginContext 接口

### 5.2 PluginManager 实现
- [ ] 插件注册/卸载
- [ ] 依赖解析
- [ ] 生命周期调用

### 5.3 PluginContext 实现
- [ ] 核心模块访问
- [ ] 状态存储
- [ ] API 封装

### 5.4 钩子系统完善
- [ ] 数据钩子调用链
- [ ] 命令钩子调用链
- [ ] 渲染钩子调用链
- [ ] 交互钩子调用链

---

## Phase 6: 核心插件

### 6.1 @holy-sheet/clipboard
- [ ] 复制实现
- [ ] 剪切实现
- [ ] 粘贴实现
- [ ] 格式处理

### 6.2 @holy-sheet/formula
- [ ] 公式解析器
- [ ] 基础函数（SUM、AVERAGE、COUNT、MAX、MIN）
- [ ] 逻辑函数（IF、AND、OR）
- [ ] 查找函数（VLOOKUP、INDEX、MATCH）
- [ ] 依赖追踪
- [ ] 增量计算

### 6.3 @holy-sheet/history
- [ ] 快捷键绑定
- [ ] UI 组件（可选）

### 6.4 @holy-sheet/xlsx
- [ ] 导入解析
- [ ] 导出生成
- [ ] 样式映射

---

## Phase 7: 性能优化

### 7.1 Worker 集成
- [ ] Worker 通信封装
- [ ] 公式计算 Worker
- [ ] 排序/筛选 Worker

### 7.2 渲染优化
- [ ] 字体测量缓存
- [ ] Path2D 对象池
- [ ] 合并绘制调用

### 7.3 内存优化
- [ ] 视口外数据策略
- [ ] 样式池压缩

### 7.4 OffscreenCanvas（可选）
- [ ] Worker 渲染
- [ ] 帧同步

---

## Phase 8: 生态建设

### 8.1 文档
- [ ] VitePress 站点
- [ ] API 文档
- [ ] 教程系列

### 8.2 示例
- [ ] 基础示例
- [ ] 公式示例
- [ ] 大数据示例
- [ ] 插件示例

### 8.3 框架适配
- [ ] React 封装
- [ ] Vue 封装

---

## 里程碑检查点

| 里程碑 | 完成条件 |
|--------|----------|
| M0 | Phase 0 全部完成，项目可构建可测试 |
| M1 | Phase 1-2 完成，静态表格可渲染 |
| M2 | Phase 3-4 完成，表格可交互可编辑 |
| M3 | Phase 5-6 完成，公式和插件可用 |
| M4 | Phase 7 完成，性能达标 |
| M5 | Phase 8 完成，文档完善，1.0 发布 |

---

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-09 | 1.0 | 初始版本 |
