// 基础示例

import { Workbook } from 'holy-sheet'

const wb = new Workbook('销售数据', {
  /**
   * 共享样式表
   */
  styles: {
    xxx: {
      color: 'red',
      border: { top: {}, right: {}, bottom: {}, left: {} },
      backgroundColor: 'blue',
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fontColor: 'black',
      fontStyle: 'italic'
    }
  },

  /**
   * 模式, 只读模式
   * 可选项:
   * - 'view': 只读模式
   * - 'edit': 编辑模式
   *
   * @default 'edit'
   */
  mode: 'edit',

  /**
   * 工作表列表配置
   */
  sheets: [
    {
      name: 'sheet1',
      // 稀疏矩阵存储
      cellData: { '0': { '0': { v: 'Hello, World!' } } }
    },
    { name: 'sheet2', columns: [], rows: [] }
  ]
})

// 根据索引获取工作表
const sheet2 = wb.getSheet(1)
// 根据名称获取工作表
const sheet1 = wb.getSheetByName('sheet1')
// 获取当前活动工作表
const activeSheet = wb.getActiveSheet()

// 获取行
const row = sheet1.get
