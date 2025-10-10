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
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义Props接口
interface QualificationTextInputProps {
  hotInstance: any;
  dataRefresher?: any; // DataRefresher组件的引用
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
const 送检数量 = ref<number>(312501);
const 抽样数量 = ref<number>(0);
const Ac_1 = ref<number>(0);
const Ac_2_5 = ref<number>(0); 
const Re_1 = ref<number>(0);
const Re_2_5 = ref<number>(0); 
const 缺陷总数 = ref<number>(0);
const 合格数量 = ref<number>(0);

// 从表格中获取所有已插入的合格数量单元格
const getQualifiedCountCells = (): Array<{row: number, col: number, value: string | number}> => {
  const qualifiedCountCells: Array<{row: number, col: number, value: string | number}> = [];
  
  if (!props.hotInstance) {
    return qualifiedCountCells;
  }
  
  try {
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const cellValue = props.hotInstance.getDataAtCell(row, col);
        if (cellValue) {
          // 识别带有特殊标记的合格数量单元格，使用新的前后标记格式
          if (typeof cellValue === 'string' && cellValue.includes('[QUALIFY]')) {
            // 检查是否包含新的前后标记格式
            if (cellValue.includes('{QL}') && cellValue.includes('{/QL}')) {
              qualifiedCountCells.push({row, col, value: cellValue});
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取合格数量单元格时发生错误:', error);
  }
  
  console.log('找到的合格数量单元格数量:', qualifiedCountCells.length);
  return qualifiedCountCells;
};

// 查找与指定合格数量单元格绑定的合格状态单元格
// 通过检查相邻单元格（上下左右）是否有[QUALITY]标记来实现绑定关系
// 使用新的前后标记格式
const findBoundQualityStatusCell = (qualifiedCellRow: number, qualifiedCellCol: number): {row: number, col: number} | null => {
  if (!props.hotInstance) {
    return null;
  }
  
  try {
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    // 检查当前单元格的相邻单元格（上下左右）
    const directions = [
      {row: -1, col: 0},  // 上
      {row: 1, col: 0},   // 下
      {row: 0, col: -1},  // 左
      {row: 0, col: 1}    // 右
    ];
    
    for (const dir of directions) {
      const checkRow = qualifiedCellRow + dir.row;
      const checkCol = qualifiedCellCol + dir.col;
      
      // 确保检查的单元格在有效范围内
      if (checkRow >= 0 && checkRow < rowCount && checkCol >= 0 && checkCol < colCount) {
        const cellValue = props.hotInstance.getDataAtCell(checkRow, checkCol);
        if (cellValue && typeof cellValue === 'string' && cellValue.includes('[QUALITY]')) {
          // 检查是否包含新的前后标记格式
          if (cellValue.includes('{QT}') && cellValue.includes('{/QT}')) {
            return {row: checkRow, col: checkCol};
          }
        }
      }
    }
  } catch (error) {
    console.error('查找绑定的合格状态单元格时发生错误:', error);
  }
  
  return null;
};

// 从表格中获取已插入的缺陷总数
const getDefectCountFromTable = (): number | null => {
  if (!props.hotInstance) {
    return null;
  }
  
  try {
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const cellValue = props.hotInstance.getDataAtCell(row, col);
        if (cellValue) {
          // 识别带有特殊标记的缺陷总数，使用新的前后标记格式
          if (typeof cellValue === 'string' && cellValue.includes('[DEFECT]')) {
            // 检查是否包含新的前后标记格式
            if (cellValue.includes('{DF}') && cellValue.includes('{/DF}')) {
              const match = cellValue.match(/\{DF\}\[DEFECT\](\d+)\{\/DF\}/);
              if (match) {
                return parseInt(match[1], 10);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取缺陷总数时发生错误:', error);
  }
  
  return null;
};

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
          if (cellValue && cellValue.toString().includes('[DEFECT]')) {
            // 使用正则表达式替换前后标记中的缺陷总数
            const regex = /\{DF\}\[DEFECT\][^]*?\{\/DF\}/g;
            const newValue = cellValue.toString().replace(
              regex,
              `{DF}[DEFECT]${count}{/DF}`
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

// 处理Ac/Re值更新事件
const handleAcReValuesUpdated = (values: {ac1: number, ac25: number, re1: number, re25: number}) => {
  console.log('PredefinedText接收到更新的Ac/Re值:', values);
  
  // 保存旧值用于查找表格中的单元格
  const oldAc1 = Ac_1.value;
  const oldAc25 = Ac_2_5.value;
  const oldRe1 = Re_1.value;
  const oldRe2_5 = Re_2_5.value;
  
  // 更新新值
  Ac_1.value = values.ac1;
  Ac_2_5.value = values.ac25;
  Re_1.value = values.re1;
  Re_2_5.value = values.re25;
  
  // 如果有表格实例，且值确实发生了变化，更新表格中所有已插入的值
  if (props.hotInstance) {
    // 获取表格的行数和列数
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    // 遍历表格中的所有单元格
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        try {
          // 获取单元格当前值
          const cellValue = props.hotInstance.getDataAtCell(row, col);
          let needsUpdate = false;
          let newValue = cellValue ? cellValue.toString() : '';
          
          // 检查并更新Ac_1
          if (oldAc1 !== values.ac1 && newValue.includes('[AC1]')) {
            const regex = /\{A1\}\[AC1\][^]*?\{\/A1\}/g;
            newValue = newValue.replace(regex, `{A1}[AC1]${values.ac1}{/A1}`);
            needsUpdate = true;
          }
          
          // 检查并更新Ac_2.5
          if (oldAc25 !== values.ac25 && newValue.includes('[AC25]')) {
            const regex = /\{A2\}\[AC25\][^]*?\{\/A2\}/g;
            newValue = newValue.replace(regex, `{A2}[AC25]${values.ac25}{/A2}`);
            needsUpdate = true;
          }
          
          // 检查并更新Re_1
          if (oldRe1 !== values.re1 && newValue.includes('[RE1]')) {
            const regex = /\{R1\}\[RE1\][^]*?\{\/R1\}/g;
            newValue = newValue.replace(regex, `{R1}[RE1]${values.re1}{/R1}`);
            needsUpdate = true;
          }
          
          // 检查并更新Re_2.5
          if (oldRe2_5 !== values.re25 && newValue.includes('[RE25]')) {
            const regex = /\{R2\}\[RE25\][^]*?\{\/R2\}/g;
            newValue = newValue.replace(regex, `{R2}[RE25]${values.re25}{/R2}`);
            needsUpdate = true;
          }
          
          // 如果需要更新，则更新单元格值
          if (needsUpdate) {
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

// 处理预置文本更新事件（来自 DataRefresher）
const handlePresetTextUpdated = (data: {
  工单号: string,
  产品名称: string,
  交货数量: string,
  送检数量: string,
  抽样数量: number,
  Ac_1: number,
  Ac_2_5: number,
  Re_1: number,
  Re_2_5: number,
  合格状态: string,
  当前时间: string
}) => {
  console.log('PredefinedText接收到预置文本更新:', data);
  
  // 更新本地数据
  工单号.value = data.工单号;
  产品名称.value = data.产品名称;
  交货数量.value = parseInt(data.交货数量) || 0;
  送检数量.value = parseInt(data.送检数量) || 0;
  抽样数量.value = data.抽样数量;
  Ac_1.value = data.Ac_1;
  Ac_2_5.value = data.Ac_2_5;
  Re_1.value = data.Re_1;
  Re_2_5.value = data.Re_2_5;
  合格状态.value = data.合格状态;
  当前时间.value = data.当前时间;
  
  console.log('PredefinedText预置文本更新完成');
};

// 暴露给父组件的方法（为了让TableToolbar能够调用）

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
      
      // 根据选择的类型获取对应的值，使用前后标记的方式
      switch(selectedTextType.value) {
        case '工单号':
          valueToInsert = `{WO}[WORKORDER]${工单号.value}{/WO}`;
          break;
        case '交货数量':
          valueToInsert = `{DL}[DELIVERY]${交货数量.value}{/DL}`;
          break;
        case '送检数量':
          valueToInsert = `{IN}[INSPECTION]${送检数量.value}{/IN}`;
          break;
        case '抽样数量':
          valueToInsert = `{SA}[SAMPLE]${抽样数量.value}{/SA}`;
          break;
        case '产品名称':
          valueToInsert = `{PN}[PRODUCT]${产品名称.value}{/PN}`;
          break;
        case 'Ac_1':
          valueToInsert = `{A1}[AC1]${Ac_1.value}{/A1}`;
          break;
        case 'Ac_2.5':
          valueToInsert = `{A2}[AC25]${Ac_2_5.value}{/A2}`;
          break;
        case 'Re_1':
          valueToInsert = `{R1}[RE1]${Re_1.value}{/R1}`;
          break;
        case 'Re_2.5':
          valueToInsert = `{R2}[RE25]${Re_2_5.value}{/R2}`;
          break;
        case '缺陷总数':
          valueToInsert = `{DF}[DEFECT]${缺陷总数.value}{/DF}`;
          break;
        case '合格数量':
          valueToInsert = `{QL}[QUALIFY]${合格数量.value}{/QL}`;
          break;
        case '合格状态':
          valueToInsert = `{QT}[QUALITY]${合格状态.value}{/QT}`;
          break;
        case '当前时间':
          valueToInsert = `{TM}[TIME]${当前时间.value}{/TM}`;
          break;
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
  }
 finally {
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
  当前时间,
  // 事件处理函数，供父组件调用
  handleDefectCountGenerated,
  handleAcReValuesUpdated,
  handlePresetTextUpdated
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