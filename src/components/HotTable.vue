<template>
<div>
    <TableToolbar v-if="hotTableRef?.hotInstance" :hot-instance="hotTableRef.hotInstance" />
  </div>
  <div class="spreadsheet-container">
    <HotTable
      ref="hotTableRef"
      :data="spreadsheetData"
      :settings="hotSettings"
    />
  </div>
</template>

<script setup lang="ts">
// 1. 导入外部依赖
import { ref, reactive, onMounted } from 'vue'
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry'
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n'
import Handsontable from 'handsontable'

// 2. 导入样式
import 'handsontable/dist/handsontable.full.min.css'
import TableToolbar from './TableToolbar.vue';
// 3. 初始化配置
registerAllModules()
registerLanguageDictionary('zh-CN', zhCN)

// // 添加自定义渲染器
// const CustomTextRenderer = function(
//   instance: Handsontable,
//   td: HTMLTableCellElement,
//   row: number,
//   col: number,
//   prop: string | number,
//   value: any,
//   cellProperties: Handsontable.CellProperties
// ) {
//   Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
//   td.style.verticalAlign = 'middle';
// };

// 4. 组件引用和响应式数据
const hotTableRef = ref(null)

// 生成100行26列的空表格数据
const spreadsheetData = reactive<Array<Array<string>>>(
  Array.from({ length: 100 }, () => Array(26).fill(''))
)

// 5. Handsontable核心配置 - 按功能模块化组织
const hotSettings: Record<string, any> = {
  // 授权配置
  licenseKey: 'non-commercial-and-evaluation',
  
  // 语言与主题
  language: 'zh-CN',
  theme: 'modern',
  
  // 尺寸配置
  width: '100%',
  height: '100vh',
  rowHeights: 25,
  colWidths: 100,
  minCols: 26,
  minRows: 100,
  
  // 显示配置
  colHeaders: true, // 显示列标题(A, B, C...)
  rowHeaders: true, // 显示行标题(1, 2, 3...)
  stretchH: 'all', // 水平拉伸所有列
  autoWrapRow: true, // 自动换行
  autoWrapCol: true, // 自动换列

  trimWhitespace: false, // 禁用自动删除空格

  // 完全移除这个cells配置，让TableToolbar中的配置生效
// cells: function(row: number, col: number, prop: string | number) {
//     return {
//       // renderer: CustomTextRenderer // 关键：指定自定义渲染器
//     };
//   },
  
  // 交互配置
  selectionMode: 'multiple', // 支持多选
  // copyPaste: true, // 启用复制粘贴
  manualRowResize: true, // 允许手动调整行高
  manualColumnResize: true, // 允许手动调整列宽

  // 行列移动功能
  manualRowMove: true,
  manualColumnMove: true,
  undo: true,
  redo: true,

  
  // 右键菜单 - 使用内置菜单项保持简洁
  contextMenu: [
    'mergeCells',
    // 'unmergeCells',
    // '---------',
    // 'copy',
    // 'paste',
    '---------',
    'row_above',
    'row_below',
    'remove_row',
    '---------',
    'col_left',
    'col_right',
    'remove_col'
  ],
  
  // 合并单元格功能 - 启用插件
  mergeCells: true,

    // 确保表格可以接收自定义样式
  className: 'hot-table-with-custom-styles',
  
  // 监听表格渲染完成事件
  afterRender: function() {
    console.log('Table rendered successfully');
  }
}

// 6. 组件挂载后处理
onMounted(() => {
  // 延迟执行以确保组件完全渲染
  setTimeout(() => {
    verifyAndInitializePlugins()
  }, 500)
})

// 7. 插件验证和初始化函数 - 抽离逻辑提高可维护性
function verifyAndInitializePlugins(): void {
  const hotInstance = hotTableRef.value?.hotInstance
  
  if (!hotInstance) {
    console.warn('Handsontable实例未正确加载')
    return
  }
  
  console.log('Handsontable实例已成功加载')
  
  try {
    // 验证合并单元格插件状态
    const mergeCellsPlugin = hotInstance.getPlugin('mergeCells')
    
    if (mergeCellsPlugin) {
      console.log('合并单元格插件已正确初始化')
      
      if (!mergeCellsPlugin.isEnabled()) {
        console.log('合并单元格插件已检测到但未启用，正在启用...')
        mergeCellsPlugin.enablePlugin()
        hotInstance.render() // 启用后重新渲染表格
      }
      
      // 可选：自动测试合并功能
      // mergeCellsPlugin.merge(0, 0, 2, 2) // 合并A1:C3区域
    }
  } catch (error) {
    console.error('插件验证过程中发生错误:', error)
  }
}
</script>

<style scoped>
.spreadsheet-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>