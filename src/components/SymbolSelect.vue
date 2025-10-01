<template>
  <select 
    v-model="selectedSymbol" 
    @change="insertSymbol"
    @mousedown.stop
    class="symbol-select"
    title="选择符号"
  >
    <option value="">Ω</option>
    <option v-for="symbol in symbols" :key="symbol.value" :value="symbol.value">
      {{ symbol.display }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义Props接口
interface SymbolSelectProps {
  hotInstance: any;
}

// 接收hotInstance属性
const props = defineProps<SymbolSelectProps>();

// 符号选项配置 
const symbols = [
  { value: '+', display: '+' },
  { value: '-', display: '-' },
  { value: '×', display: '×' },
  { value: '÷', display: '÷' },
  { value: '☐', display: '☐' },  
  { value: '☑', display: '☑' },  
  { value: '☒', display: '☒' }, 
  { value: '✓', display: '✓' },
  { value: '✗', display: '✗' },
  { value: '°C', display: '°C' }
];

// 当前选中的符号
const selectedSymbol = ref<string>('');

// 获取选中区域 
const getSelectedRange = (): any => {
  if (!props.hotInstance) return null;
  
  const selection = props.hotInstance.getSelectedRangeLast();
  if (!selection) return null;
  
  return {
    startRow: selection.getTopStartCorner().row,
    startCol: selection.getTopStartCorner().col,
    endRow: selection.getBottomEndCorner().row,
    endCol: selection.getBottomEndCorner().col
  };
};

// 插入符号到选中单元格
const insertSymbol = () => {
  if (!selectedSymbol.value || !props.hotInstance) {
    return;
  }

  try {
    const selection = getSelectedRange();
    
    if (selection) {
      // 获取当前单元格的值
      const currentValue = props.hotInstance.getDataAtCell(
        selection.startRow,
        selection.startCol
      );
      
      // 在当前值后面添加符号
      const newValue = (currentValue || '') + selectedSymbol.value;
      
      // 设置新值
      props.hotInstance.setDataAtCell(
        selection.startRow,
        selection.startCol,
        newValue
      );
      
      // 重绘表格以显示更新
      props.hotInstance.render();
    }
  } catch (error) {
    console.error('插入符号时发生错误:', error);
  } finally {
    // 重置选择，以便下次可以重新选择同一符号
    selectedSymbol.value = '';
  }
};
</script>

<style scoped>
.symbol-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  min-width: auto;
}

.symbol-select:hover {
  border-color: #999;
}
</style>