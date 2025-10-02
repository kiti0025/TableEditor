<template>
  <div class="qualification-text-input">
    <select 
      v-model="selectedTextType"
      @change="insertText"
      @mousedown.stop
      class="qualification-select"
      title="已绑定的U9字段"
    >
      <option value="">预置文本</option>
      <option value="工单号">工单号</option>
      <option value="交货数量">交货数量</option>
      <option value="送检数量">送检数量</option>
      <option value="抽样数量">抽样数量</option>
      <option value="产品名称">产品名称</option>
      <option value="Ac_1">Ac_1</option>
      <option value="Ac_2.5">Ac_2.5</option>
      <option value="Re_1">Re_1</option>
      <option value="Re_2.5">Re_2.5</option>
      <option value="缺陷总数">缺陷总数</option>
      <option value="合格数量">合格数量</option>
      <option value="合格状态">合格状态</option>
      <option value="当前时间">当前时间</option>
    </select>
  </div>
  <DataRefresher :hot-instance="hotInstance" @defect-count-generated="handleDefectCountGenerated" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataRefresher from './DataRefresher.vue';

// 定义Props接口
interface QualificationTextInputProps {
  hotInstance: any;
}

// 接收hotInstance属性
const props = defineProps<QualificationTextInputProps>();

// 当前选中的文本类型
const selectedTextType = ref<string>('');


const 工单号 = ref<string>("xx工单号xx");
const 产品名称 = ref<string>("xx产品名称xx");
const 合格状态 = ref<string>("xx合格状态xx");
const 当前时间 = ref<string>("xx当前时间xx");
const 交货数量 = ref<number>(0);
const 送检数量 = ref<number>(0);
const 抽样数量 = ref<number>(0);
const Ac_1 = ref<number>(0);
const Ac_2_5 = ref<number>(0); 
const Re_1 = ref<number>(0);
const Re_2_5 = ref<number>(0); 
const 缺陷总数 = ref<number>(0);
const 合格数量 = ref<number>(0);

// 处理缺陷总数生成事件
const handleDefectCountGenerated = (count: number) => {
  console.log('PredefinedText接收到生成的缺陷总数:', count);
  // 保存旧的缺陷总数用于查找表格中的单元格
  const oldDefectCount = 缺陷总数.value;
  // 更新缺陷总数
  缺陷总数.value = count;
  
  // 如果有表格实例，且缺陷总数确实发生了变化，更新表格中所有已插入的缺陷总数
  if (props.hotInstance && oldDefectCount !== count) {
    console.log('更新表格中所有已插入的缺陷总数，从', oldDefectCount, '变为', count);
    
    // 获取表格的行数和列数
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    // 遍历表格中的所有单元格
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        try {
          // 获取单元格当前值
          const cellValue = props.hotInstance.getDataAtCell(row, col);
          
          // 检查单元格值是否包含带标记的旧缺陷总数
          if (cellValue && cellValue.toString().includes(`[DEFECT]${oldDefectCount}`)) {
            // 替换单元格值中的旧缺陷总数为新值
            const newValue = cellValue.toString().replace(
              `[DEFECT]${oldDefectCount}`, 
              `[DEFECT]${count}`
            );
            
            // 更新单元格值
            props.hotInstance.setDataAtCell(row, col, newValue);
          }
        } catch (error) {
          console.error('更新单元格时发生错误:', error);
        }
      }
    }
    
    // 重绘表格以显示更新
    props.hotInstance.render();
  }
};

// 获取选中区域
const getSelectedRange = (): any => {
  if (!props.hotInstance) return null;
  
  try {
    const selection = props.hotInstance.getSelectedRangeLast();
    if (!selection) return null;
    
    return {
      startRow: selection.getTopStartCorner().row,
      startCol: selection.getTopStartCorner().col
    };
  } catch (error) {
    console.error('获取选中区域时发生错误:', error);
    return null;
  }
};

// 插入文本到选中单元格
const insertText = () => {
  if (!selectedTextType.value || !props.hotInstance) {
    return;
  }

  try {
    const selection = getSelectedRange();
    
    if (selection) {
      // 获取要插入的值
      let valueToInsert = '';
      
      // 根据选择的类型获取对应的值
      switch(selectedTextType.value) {
        // ... 其他case保持不变 ...
        case '缺陷总数':
          // 添加特殊标记，表示这是系统插入的缺陷总数
          valueToInsert = `[DEFECT]${缺陷总数.value}`;
          break;
        case '合格数量':
          // 添加特殊标记，表示这是系统插入的合格数量
          valueToInsert = `[QUALIFY]${合格数量.value}`;
          break;
        // ... 其他case保持不变 ...
      }
      
      if (valueToInsert) {
        // 获取当前单元格的值
        const currentValue = props.hotInstance.getDataAtCell(
          selection.startRow,
          selection.startCol
        );
        
        // 构建新值
        const newValue = currentValue ? `${currentValue}${valueToInsert}` : valueToInsert;
        
        // 设置新值
        props.hotInstance.setDataAtCell(
          selection.startRow,
          selection.startCol,
          newValue
        );
        
        // 重绘表格以显示更新
        props.hotInstance.render();
      }
    }
  } catch (error) {
    console.error('插入值时发生错误:', error);
  } finally {
    // 重置选择，以便下次可以重新选择
    selectedTextType.value = '';
  }
};

// 暴露必要的数据和方法
defineExpose({
  工单号,
  交货数量,
  送检数量,
  抽样数量,
  产品名称,
  Ac_1,
  Ac_2_5,
  Re_1,
  Re_2_5,
  缺陷总数,
  合格数量,
  合格状态,
  当前时间
});
</script>

<style scoped>
.qualification-text-input {
  display: flex;
  align-items: center;
}

.qualification-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  min-width: auto;
}

.qualification-select:hover {
  border-color: #999;
}
</style>