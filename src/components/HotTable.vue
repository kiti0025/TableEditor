<template>
  <div class="custom-component">
    <TableToolbar ref="tableToolbarRef" v-if="hotTableRef?.hotInstance" :hot-instance="hotTableRef.hotInstance" />
    <Preview 
      ref="previewRef"
      v-if="hotTableRef?.hotInstance" 
      :hot-instance="hotTableRef.hotInstance" 
      :data-refresher="tableToolbarRef?.getDataRefresher()"
      @preview-mode-change="handlePreviewModeChange"
    />
  </div>
  <div class="spreadsheet-container">
    <HotTable
      ref="hotTableRef"
      :data="spreadsheetData"
      :settings="hotSettings"
    />
  </div>
  <!-- 使用LoadingIndicator组件 -->
  <LoadingIndicator :is-loading="isGlobalLoading" fullscreen />
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
import TableToolbar from './TableToolbar.vue'
import Preview from './Preview.vue'
import LoadingIndicator from './LoadingIndicator.vue'
import { autoLoadAndMultiPreview, autoLoadAndPreview, getCustomerName, parseProductInfo, type ProductInfo } from '../urlUtils'

// 3. 初始化配置
registerAllModules()
registerLanguageDictionary('zh-CN', zhCN)

// 预览状态
const isPreviewMode = ref(false)
// 全局加载状态，初始设置为true，表示应用正在加载中
const isGlobalLoading = ref(true)

// 检查URL是否携带参数
const hasUrlParams = () => {
  // 检查是否有客户名称参数(param2)
  const customerName = getCustomerName();
  if (!customerName) {
    return false;
  }
  
  // 检查是否有产品信息参数(param3)
  const products = parseProductInfo();
  return products.length > 0;
}

// 处理预览状态变化
const handlePreviewModeChange = (isPreview: boolean) => {
  isPreviewMode.value = isPreview
  
  // 当预览状态改变时，更新表格配置并重新渲染
  if (hotTableRef.value?.hotInstance) {
    hotTableRef.value.hotInstance.updateSettings({
      colHeaders: !isPreview,
      rowHeaders: !isPreview
    })
  }
  
  // 当退出预览模式时，关闭全局加载状态
  if (!isPreview) {
    isGlobalLoading.value = false
  }
}

// 增强版自定义渲染器 - 移除特殊标记,同时保留通过TableToolbar设置好的样式
const createEnhancedRenderer = (baseRenderer) => {
  return function(
    instance, 
    td, 
    row, 
    col, 
    prop, 
    value, 
    cellProperties
  ) {
    // 1. 先移除特殊标记
    if (typeof value === 'string') {
      // 定义系统标识符和对应的前后标记
      const systemMarkers = [
        { start: '{WO}', end: '{/WO}' }, // 工单号
        { start: '{DL}', end: '{/DL}' }, // 交货数量
        { start: '{IN}', end: '{/IN}' }, // 送检数量
        { start: '{SA}', end: '{/SA}' }, // 抽样数量
        { start: '{PN}', end: '{/PN}' }, // 产品名称
        { start: '{A1}', end: '{/A1}' }, // Ac_1
        { start: '{A2}', end: '{/A2}' }, // Ac_2.5
        { start: '{R1}', end: '{/R1}' }, // Re_1
        { start: '{R2}', end: '{/R2}' }, // Re_2.5
        { start: '{DF}', end: '{/DF}' }, // 缺陷总数
        { start: '{QL}', end: '{/QL}' }, // 合格数量
        { start: '{QT}', end: '{/QT}' }, // 合格状态
        { start: '{TM}', end: '{/TM}' }  // 当前时间
      ];

      // 移除所有前后标记，只保留标记内的内容
      let displayValue = value;
      systemMarkers.forEach(marker => {
        const regex = new RegExp(`${marker.start}\\[.*?\\](.*?)${marker.end}`, 'g');
        displayValue = displayValue.replace(regex, '$1');
      });
      
      value = displayValue;
    }
    
    // 2. 调用原始渲染器处理样式
    baseRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
    
    // 3. 确保基础样式
    td.style.verticalAlign = 'middle';
  };
};

// 4. 组件引用和响应式数据
const hotTableRef = ref(null)
const tableToolbarRef = ref(null)
const previewRef = ref(null)

// 生成100行26列的空表格数据
const spreadsheetData = reactive<Array<Array<string>>>(
  Array.from({ length: 52 }, () => Array(26).fill(''))
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
  // autoRowSize: true, // 自动调整行高
  // autoColumnSize: true,  // 添加自动列宽调整
  rowHeights: 25,
  colWidths: 100,
  minCols: 1,//最小列数
  minRows: 1,
  
  // 显示配置
  colHeaders: true, // 显示列标题(A, B, C...)
  rowHeaders: true, // 显示行标题(1, 2, 3...)
  stretchH: 'none', // 水平拉伸所有列 all
  autoWrapRow: true, // 自动换行
  autoWrapCol: true, // 自动换列

  trimWhitespace: false, // 禁用自动删除空格
  
  // 交互配置
  selectionMode: 'multiple', // 支持多选
  // copyPaste: true, // 启用复制粘贴
  manualRowResize: true, // 允许手动调整行高
  manualColumnResize: true, // 允许手动调整列宽

  // 行列移动功能
  manualRowMove: true,
  manualColumnMove: true,
  //撤销和重做
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

// 组件挂载后处理
onMounted(() => {
  // 检查URL是否携带参数，如果不携带参数则立即关闭加载状态
  if (!hasUrlParams()) {
    isGlobalLoading.value = false;
  }
  
  // 延迟执行以确保组件完全渲染
  setTimeout(() => {
    verifyAndInitializePlugins();
    
    // 等待TableToolbar注册样式渲染器后，增强它
    if (hotTableRef.value?.hotInstance) {
      const hotInstance = hotTableRef.value.hotInstance;
      
      // 检查当前渲染器
      const currentRenderer = hotInstance.getCellMeta(0, 0).renderer;
      
      // 创建增强版渲染器
      const enhancedRenderer = createEnhancedRenderer(currentRenderer || Handsontable.renderers.TextRenderer);
      
      // 重新注册并应用增强版渲染器
      hotInstance.updateSettings({
        cells: function(row, col) {
          return { renderer: enhancedRenderer };
        }
      });
      
      // 尝试从URL自动加载表格并预览
      handleAutoLoadFromUrl();
    }
  }, 1000); // 减少到1000ms
});

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
        console.log('合并单元格插件已检测到但未启用，正在启用...');
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

// 处理URL自动加载
async function handleAutoLoadFromUrl(): Promise<void> {
  try {
    console.log('开始处理URL自动加载...');
    
    // 检查URL是否携带参数
    const urlHasParams = hasUrlParams();
    
    // 如果URL不携带参数，则直接关闭加载状态
    if (!urlHasParams) {
      console.log('URL中没有找到合适的参数，跳过自动加载');
      isGlobalLoading.value = false;
      return;
    }
    
    // 设置全局加载状态
    isGlobalLoading.value = true;
    
    // 等待组件初始化完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const loadFunction = async (filename: string) => {
      console.log('开始加载文件:', filename);
      
      if (!tableToolbarRef.value?.loadTableFromFile) {
        console.error('tableToolbarRef.value.loadTableFromFile 不可用');
        return;
      }
      
      await tableToolbarRef.value.loadTableFromFile(filename);
      console.log('文件加载完成');
    };
    
    // 多预览函数
    const createMultiPreviewFunction = (products: ProductInfo[]) => {
      console.log('开始创建多预览，产品数量:', products.length);
      
      if (!previewRef.value?.createMultiPreview) {
        console.error('previewRef.value.createMultiPreview 不可用');
        return;
      }
      
      previewRef.value.createMultiPreview(products);
      console.log('多预览创建完成');
      
      // 在预览创建完成后，关闭全局加载状态
      setTimeout(() => {
        isGlobalLoading.value = false;
      }, 100); // 稍微延迟以确保预览完全渲染
    };
    
    // 单预览函数（作为备用）
    const previewFunction = () => {
      console.log('开始触发单预览...');
      
      if (!previewRef.value?.enterPreview) {
        console.error('previewRef.value.enterPreview 不可用');
        return;
      }
      
      previewRef.value.enterPreview();
      console.log('单预览触发完成');
      
      // 在预览触发完成后，关闭全局加载状态
      setTimeout(() => {
        isGlobalLoading.value = false;
      }, 100); // 稍微延迟以确保预览完全渲染
    };
    
    // 尝试使用多预览模式，传递dataRefresher用于预置文本更新
    const dataRefresher = tableToolbarRef.value?.getDataRefresher();
    let success = await autoLoadAndMultiPreview(loadFunction, createMultiPreviewFunction, dataRefresher);
    
    // 如果多预览失败，则回退到单预览模式
    if (!success) {
      console.log('多预览模式失败，尝试单预览模式...');
      success = await autoLoadAndPreview(loadFunction, previewFunction);
    }
    
    if (success) {
      console.log('URL自动加载和预览成功');
    } else {
      console.log('URL中没有找到合适的参数，跳过自动加载');
      // 如果没有URL参数，关闭加载状态
      isGlobalLoading.value = false;
    }
  } catch (error) {
    console.error('URL自动加载失败:', error);
    // 出现错误时也关闭加载状态
    isGlobalLoading.value = false;
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
.custom-component {
  display: flex;
  /* gap: -5px; */
  align-items: center; 
  background-color: #f5f5f5;
  width: fit-content; 
  /* padding: 0 20px; */
}
</style>