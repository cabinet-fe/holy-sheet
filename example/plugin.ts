import { CELL_RIGHT_CLICK, SELECTION_CHANGE } from '@holy-sheet/events'
// 基础示例
import { Workbook } from 'holy-sheet'
// import { CellConfigPlugin } from '@holy-sheet/plugins'

const wb = new Workbook('销售数据', {
  /**
   * 模式, 只读模式
   * 可选项:
   * - 'view': 只读模式
   * - 'edit': 编辑模式
   */
  mode: 'view',

  /**
   * 工作表列表配置
   */
  sheets: [
    {
      name: 'sheet1',
      // 列配置
      columns: { A: { width: 100 }, D: { width: 120 } },
      // 稀疏矩阵存储
      cellData: { '0': { '0': { v: 'Hello, World!' } } }
    },
    { name: 'sheet2', columns: [], rows: [] }
  ]
})

const CellConfigPlugin = function () {
  return {
    // 必须唯一
    name: 'cell-config',
    // 版本号，兼容性相关
    version: 1,
    // 依赖的插件
    dependencies: [],

    /**
     * 插件类型
     * 可选项:
     * - 'menu': 菜单
     * - 'toolbar': 工具栏
     * - 'context-menu': 上下文菜单
     * - 'status-bar': 状态栏
     * - 'tooltip': 提示
     * - 'popup': 弹窗
     * - 'dialog': 对话框
     * - 'notification': 通知
     */
    type: 'menu',
    // 菜单项
    menuConfig: {},

    // 工作簿创建时钩子
    onCreate(wb) {
      // 添加右键
      wb.on(CELL_RIGHT_CLICK, (e) => {
        wb.getSheet(e.sheet.index)
      })

      // 选区变化事件
      wb.on(SELECTION_CHANGE, (e) => {})
    }
  }
}

wb.use(CellConfigPlugin())
