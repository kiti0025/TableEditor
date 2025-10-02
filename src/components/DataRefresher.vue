<template>
  <div class="data-refresher">
    <button 
      class="refresh-button"
      @click="refreshData"
      title="刷新数据"
    >
      刷新
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 定义Props接口
interface DataRefresherProps {
  hotInstance: any;
}

// 接收hotInstance属性
const props = defineProps<DataRefresherProps>();

// 定义emits
const emit = defineEmits<{
  'defect-count-generated': [count: number];
  'ac-re-values-updated': [{ac1: number, ac25: number, re1: number, re25: number}];
}>();

// 定义数据变量
const 抽样数量 = ref<number>(0);
const Ac_1 = ref<number>(0);
const Ac_2_5 = ref<number>(0);
const Re_1 = ref<number>(0);
const Re_2_5 = ref<number>(0);
const 缺陷总数 = ref<number>(0);
const 合格数量 = ref<number>(0);

// 组件挂载时初始化数据
onMounted(() => {
  // 初始化数据，确保组件加载时就有默认数据
  refreshData();
});

// 从表格中获取送检数量
const getInspectionCountFromTable = (): number => {
  const defaultInspectionCount = 2000;
  if (!props.hotInstance) {
    return defaultInspectionCount; // 返回默认值
  }
  
  try {
    // 尝试从表格中获取送检数量
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    if (rowCount > 0 && colCount > 0) {
      // 遍历表格寻找送检数量
      for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
          const cellValue = props.hotInstance.getDataAtCell(row, col);
          if (cellValue) {
            if (typeof cellValue === 'string') {
              // 检查带有特殊标记的送检数量
              if (cellValue.includes('[INSPECTION]')) {
                const match = cellValue.match(/\[INSPECTION\](\d+)/);
                if (match) {
                  return parseInt(match[1], 10);
                }
              }
              // 保留原有的检查逻辑
              if (cellValue.includes('送检数量')) {
                const match = cellValue.match(/\d+/);
                if (match) {
                  return parseInt(match[0], 10);
                }
              }
            } else if (typeof cellValue === 'number' && !isNaN(cellValue)) {
              return cellValue;
            }
          }
        }
      }
    }
    
    return defaultInspectionCount; // 默认值
  } catch (error) {
    console.error('获取送检数量时发生错误:', error);
    return defaultInspectionCount;
  }
};

// 根据送检数量更新抽样数量和Ac/Re值
const updateSampleAndAcReValues = (count: number) => {
  if (isNaN(count) || count <= 0) {
    console.warn('送检数量必须是有效的正数');
    return;
  }

  // 根据送检数量设置抽样数量和Ac/Re值
  if (count >= 1201 && count <= 3200) {
    抽样数量.value = 125;
    Ac_1.value = 3;
    Re_1.value = 4;
    Ac_2_5.value = 7;
    Re_2_5.value = 8;
  } else if (count >= 3201 && count <= 10000) {
    抽样数量.value = 200;
    Ac_1.value = 5;
    Re_1.value = 6;
    Ac_2_5.value = 10;
    Re_2_5.value = 11;
  } else if (count >= 10001 && count <= 35000) {
    抽样数量.value = 315;
    Ac_1.value = 7;
    Re_1.value = 8;
    Ac_2_5.value = 14;
    Re_2_5.value = 15;
  } else if (count >= 35001 && count <= 150000) {
    抽样数量.value = 500;
    Ac_1.value = 10;
    Re_1.value = 11;
    Ac_2_5.value = 21;
    Re_2_5.value = 22;
  } else if (count >= 150001 && count <= 500000) {
    抽样数量.value = 800;
    Ac_1.value = 14;
    Re_1.value = 15;
    Ac_2_5.value = 21;
    Re_2_5.value = 22;
  } else if (count > 500000) {
    抽样数量.value = 1250;
    Ac_1.value = 21;
    Re_1.value = 22;
    Ac_2_5.value = 21;
    Re_2_5.value = 22;
  } else {
    // 默认值，当送检数量小于1201时使用
    抽样数量.value = 50;
    Ac_1.value = 0;
    Re_1.value = 1;
    Ac_2_5.value = 1;
    Re_2_5.value = 2;
  }
};

// 生成随机的缺陷总数
const generateRandomDefectCount = () => {
  // 缺陷总数必须大于0且小于Ac_2_5
  if (Ac_2_5.value <= 1) {
    return 1; // 确保至少有1个缺陷
  }
  
  // 生成1到Ac_2_5-1之间的随机整数
  return Math.floor(Math.random() * (Ac_2_5.value - 1)) + 1;
};

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
          // 只识别带有特殊标记的合格数量单元格
          if (typeof cellValue === 'string' && cellValue.includes('[QUALIFY]')) {
            qualifiedCountCells.push({row, col, value: cellValue});
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
          // 只识别带有特殊标记的缺陷总数
          if (typeof cellValue === 'string' && cellValue.includes('[DEFECT]')) {
            const match = cellValue.match(/\[DEFECT\](\d+)/);
            if (match) {
              return parseInt(match[1], 10);
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

// 更新表格中的合格数量
const updateQualifiedCountsInTable = (defectCount: number, qualifiedCountCells: Array<{row: number, col: number, value: string | number}>) => {
  if (qualifiedCountCells.length === 0) {
    console.log('没有合格数量单元格可更新');
    return;
  }
  
  // 计算如何分配缺陷总数到各个合格数量
  const counts: number[] = [];
  let remainingCount = defectCount;
  
  // 为前n-1个单元格分配随机数
  for (let i = 0; i < qualifiedCountCells.length - 1; i++) {
    if (remainingCount > 0) {
      const count = Math.floor(Math.random() * remainingCount) + 1;
      counts.push(count);
      remainingCount -= count;
    } else {
      counts.push(0);
    }
  }
  
  // 最后一个单元格分配剩余的数量
  counts.push(remainingCount);
  
  // 打乱数组，使得分配更加随机
  for (let i = counts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [counts[i], counts[j]] = [counts[j], counts[i]];
  }
  
  // 更新表格中的合格数量
  qualifiedCountCells.forEach((cell, index) => {
    try {
      // 替换带标记的合格数量为新值
      const newValue = (cell.value as string).replace(/\[QUALIFY\]\d+/, `[QUALIFY]${counts[index]}`);
      props.hotInstance.setDataAtCell(cell.row, cell.col, newValue);
    } catch (error) {
      console.error('更新合格数量单元格时发生错误:', error);
    }
  });
  
  // 重绘表格以显示更新
  props.hotInstance.render();
};

// 刷新数据的方法
const refreshData = () => {
  try {
    // 1. 先获取表格中的送检数量（如果有）
    const inspectionCount = getInspectionCountFromTable();
    
    // 2. 更新抽样数量和Ac/Re值
    updateSampleAndAcReValues(inspectionCount);

    // 发出Ac/Re值更新事件
    emit('ac-re-values-updated', {
      ac1: Ac_1.value,
      ac25: Ac_2_5.value,
      re1: Re_1.value,
      re25: Re_2_5.value
    });
    
    // 3. 生成随机的缺陷总数
    const randomDefectCount = generateRandomDefectCount();
    
    // 4. 获取表格中已插入的合格数量单元格
    const qualifiedCountCells = getQualifiedCountCells();
    
    // 5. 无论表格中是否有缺陷总数，都使用新生成的随机缺陷总数
    缺陷总数.value = randomDefectCount;
    
    // 6. 更新表格中的合格数量
    if (qualifiedCountCells.length > 0) {
      updateQualifiedCountsInTable(randomDefectCount, qualifiedCountCells);
      console.log(`已生成新的随机缺陷总数 ${randomDefectCount} 并更新合格数量`);
    } else {
      console.log('没有找到合格数量单元格');
    }
    
    // 7. 发出数据更新事件
    emit('defect-count-generated', 缺陷总数.value);
    
    console.log('数据已刷新:', {
      抽样数量: 抽样数量.value,
      Ac_1: Ac_1.value,
      Ac_2_5: Ac_2_5.value,
      Re_1: Re_1.value,
      Re_2_5: Re_2_5.value,
      缺陷总数: 缺陷总数.value,
      合格数量: 合格数量.value
    });
  } catch (error) {
    console.error('刷新数据时发生错误:', error);
  }
};
</script>

<style scoped>
.data-refresher {
  display: flex;
  align-items: center;
}

.refresh-button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background-color: #f0f0f0;
  border-color: #999;
}
</style>