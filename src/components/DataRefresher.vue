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
import type { ProductInfo } from '../urlUtils';

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
  'preset-text-updated': [{
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
  }];
}>();

// 定义所有预置文本相关的数据变量
// 基础数据
const 抽样数量 = ref<number>(0);
const Ac_1 = ref<number>(0);
const Ac_2_5 = ref<number>(0);
const Re_1 = ref<number>(0);
const Re_2_5 = ref<number>(0);
const 缺陷总数 = ref<number>(0);
const 合格数量 = ref<number>(0);

// URL参数驱动的预置文本数据
const 工单号 = ref<string>('xx工单号xx');
const 产品名称 = ref<string>('xx产品名称xx');
const 交货数量 = ref<string>('xx交货数量xx');
const 送检数量 = ref<string>('xx送检数量xx'); // 新增：送检数量（等于交货数量）

// 其他预置文本数据（有自己的逻辑）
const 合格状态 = ref<string>('xx合格状态xx');
const 当前时间 = ref<string>('xx当前时间xx');

// 组件挂载时初始化数据
onMounted(() => {
  // 初始化数据，确保组件加载时就有默认数据
  refreshData();
});

// 更新其他预置文本的逻辑（合格状态、当前时间）
const updateOtherPresetTexts = () => {
  // 更新当前时间
  const now = new Date();
  const timeString = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  当前时间.value = timeString;
  
  // 更新合格状态（根据缺陷总数和Ac/Re值计算）
  updateQualityStatus();
  
  console.log('DataRefresher: 其他预置文本更新完成', {
    合格状态: 合格状态.value,
    当前时间: 当前时间.value
  });
};

// 计算合格状态
const updateQualityStatus = () => {
  // 如果缺陷总数小于等于Ac_2.5，则合格；否则不合格
  if (缺陷总数.value <= Ac_2_5.value) {
    合格状态.value = '合格';
  } else {
    合格状态.value = '不合格';
  }
  
  console.log(`合格状态计算: 缺陷总数=${缺陷总数.value}, Ac_2.5=${Ac_2_5.value}, 结果=${合格状态.value}`);
};

/**
 * 更新URL参数驱动的预置文本数据
 * @param product 产品信息，包含工单号、产品名称、交货数量
 */
const updatePresetTextFromUrlParams = (product: ProductInfo) => {
  console.log('DataRefresher: 更新URL参数驱动的预置文本', product);
  
  // 更新URL参数相关的预置文本
  工单号.value = product.workOrderNumber;
  产品名称.value = product.productName;
  交货数量.value = product.totalQuantity;
  送检数量.value = product.totalQuantity; // 送检数量等于交货数量
  
  // 更新其他预置文本（合格状态、当前时间）
  updateOtherPresetTexts();
  
  // 发出预置文本更新事件，通知PredefinedText组件更新
  emitPresetTextUpdate();
  
  console.log('DataRefresher: 预置文本更新完成');
};

/**
 * 为预览准备：刷新所有预置文本数据
 * 这个函数在预览前被调用，确保所有预置文本都是最新的
 * @param product 产品信息，用于获取送检数量
 */
const refreshAllPresetTextsForPreview = (product?: ProductInfo) => {
  console.log('DataRefresher: 开始为预览刷新所有预置文本...', product);
  
  // 1. 获取送检数量：优先使用URL参数，其次从表格获取
  let inspectionCount: number;
  if (product?.totalQuantity) {
    inspectionCount = parseInt(product.totalQuantity, 10);
    console.log(`使用URL参数中的送检数量: ${inspectionCount}`);
  } else {
    inspectionCount = getInspectionCountFromTable();
    console.log(`使用表格中的送检数量: ${inspectionCount}`);
  }
  
  // 2. 根据送检数量更新抽样数量和Ac/Re值
  updateSampleAndAcReValues(inspectionCount);
  
  // 3. 生成新的随机缺陷总数
  const randomDefectCount = generateRandomDefectCount();
  缺陷总数.value = randomDefectCount;
  
  // 4. 获取表格中已插入的合格数量单元格并更新
  const qualifiedCountCells = getQualifiedCountCells();
  if (qualifiedCountCells.length > 0) {
    updateQualifiedCountsInTable(randomDefectCount, qualifiedCountCells);
    console.log(`已为预览生成新的随机缺陷总数 ${randomDefectCount} 并更新合格数量`);
  } else {
    console.warn('没有找到合格数量单元格，跳过合格数量更新');
  }
  
  // 5. 更新其他预置文本（合格状态、当前时间）
  updateOtherPresetTexts();
  
  // 6. 发出全面更新事件
  emit('ac-re-values-updated', {
    ac1: Ac_1.value,
    ac25: Ac_2_5.value,
    re1: Re_1.value,
    re25: Re_2_5.value
  });
  
  emit('defect-count-generated', 缺陷总数.value);
  emitPresetTextUpdate();
  
  console.log('DataRefresher: 预览预置文本刷新完成', {
    送检数量: inspectionCount,
    抽样数量: 抽样数量.value,
    Ac_1: Ac_1.value,
    Ac_2_5: Ac_2_5.value,
    Re_1: Re_1.value,
    Re_2_5: Re_2_5.value,
    缺陷总数: 缺陷总数.value,
    合格状态: 合格状态.value,
    当前时间: 当前时间.value
  });
};

/**
 * 在克隆的表格DOM元素上替换预置文本标记为指定产品的值
 * @param clonedElement 克隆的表格DOM元素
 * @param product 产品信息
 */
const replacePresetTextInClonedTable = (clonedElement: HTMLElement, product: ProductInfo): void => {
  if (!clonedElement || !product) {
    console.log('DataRefresher: 无法进行DOM预置文本替换：缺少必要参数');
    return;
  }
  
  console.log('DataRefresher: 开始在克隆表格中替换预置文本:', product);
  
  try {
    // 获取克隆表格中的所有文本节点
    const walker = document.createTreeWalker(
      clonedElement,
      NodeFilter.SHOW_TEXT
    );
    
    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    // 替换每个文本节点中的预置文本标记
    textNodes.forEach(textNode => {
      let content = textNode.nodeValue || '';
      let hasChanges = false;
      
      // 替换工单号
      if (content.includes('[WORKORDER]')) {
        const regex = /\[WORKORDER\][^\[\]\s]*/g;
        content = content.replace(regex, `[WORKORDER]${product.workOrderNumber}`);
        hasChanges = true;
      }
      
      // 替换产品名称
      if (content.includes('[PRODUCT]')) {
        const regex = /\[PRODUCT\][^\[\]\s]*/g;
        content = content.replace(regex, `[PRODUCT]${product.productName}`);
        hasChanges = true;
      }
      
      // 替换交货数量
      if (content.includes('[DELIVERY]')) {
        const regex = /\[DELIVERY\][^\[\]\s]*/g;
        content = content.replace(regex, `[DELIVERY]${product.totalQuantity}`);
        hasChanges = true;
      }
      
      // 替换送检数量（等于交货数量）
      if (content.includes('[INSPECTION]')) {
        const regex = /\[INSPECTION\][^\[\]\s]*/g;
        content = content.replace(regex, `[INSPECTION]${product.totalQuantity}`);
        hasChanges = true;
      }
      
      // 替换合格状态（使用当前的合格状态值）
      if (content.includes('[QUALITY]')) {
        const regex = /\[QUALITY\][^\[\]\s]*/g;
        content = content.replace(regex, `[QUALITY]${合格状态.value}`);
        hasChanges = true;
      }
      
      // 替换当前时间（使用当前的时间值）
      if (content.includes('[TIME]')) {
        const regex = /\[TIME\][^\[\]\s]*/g;
        content = content.replace(regex, `[TIME]${当前时间.value}`);
        hasChanges = true;
      }
      
      // 如果有变化，更新文本节点
      if (hasChanges) {
        textNode.nodeValue = content;
        console.log('DataRefresher: 已更新DOM文本节点:', textNode.nodeValue);
      }
    });
    
    console.log('DataRefresher: 克隆表格预置文本替换完成');
    
  } catch (error) {
    console.error('DataRefresher: DOM预置文本替换过程中发生错误:', error);
  }
};

/**
 * 临时替换表格中的预置文本标记为指定产品的值
 * @param products 产品信息数组
 * @param productIndex 当前产品索引（用于多预览）
 */
const temporaryReplacePresetTextInTable = (products: ProductInfo[], productIndex: number = 0): void => {
  if (!props.hotInstance || !products || products.length === 0) {
    console.log('DataRefresher: 无法进行预置文本替换：缺少必要参数');
    return;
  }
  
  const product = products[productIndex];
  if (!product) {
    console.log(`DataRefresher: 产品索引${productIndex}超出范围`);
    return;
  }
  
  console.log(`DataRefresher: 开始替换第${productIndex + 1}个产品的预置文本:`, product);
  
  try {
    const rowCount = props.hotInstance.countRows();
    const colCount = props.hotInstance.countCols();
    
    // 遗历表格中的所有单元格
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const cellValue = props.hotInstance.getDataAtCell(row, col);
        
        if (cellValue && typeof cellValue === 'string') {
          let newValue = cellValue;
          let hasChanges = false;
          
          // 先恢复所有预置文本标记到原始状态（删除标记后的内容）
          // 这样可以确保每次预览时都从原始标记开始替换，避免累积替换
          if (newValue.includes('[WORKORDER]')) {
            newValue = newValue.replace(/\[WORKORDER\][^\[\]\s]*/g, '[WORKORDER]');
            hasChanges = true;
          }
          if (newValue.includes('[PRODUCT]')) {
            newValue = newValue.replace(/\[PRODUCT\][^\[\]\s]*/g, '[PRODUCT]');
            hasChanges = true;
          }
          if (newValue.includes('[DELIVERY]')) {
            newValue = newValue.replace(/\[DELIVERY\][^\[\]\s]*/g, '[DELIVERY]');
            hasChanges = true;
          }
          if (newValue.includes('[INSPECTION]')) {
            newValue = newValue.replace(/\[INSPECTION\][^\[\]\s]*/g, '[INSPECTION]');
            hasChanges = true;
          }
          if (newValue.includes('[QUALITY]')) {
            newValue = newValue.replace(/\[QUALITY\][^\[\]\s]*/g, '[QUALITY]');
            hasChanges = true;
          }
          if (newValue.includes('[TIME]')) {
            newValue = newValue.replace(/\[TIME\][^\[\]\s]*/g, '[TIME]');
            hasChanges = true;
          }
          // 添加抽样数量和Ac/Re值的恢复
          if (newValue.includes('[SAMPLE]')) {
            newValue = newValue.replace(/\[SAMPLE\][^\[\]\s]*/g, '[SAMPLE]');
            hasChanges = true;
          }
          if (newValue.includes('[AC1]')) {
            newValue = newValue.replace(/\[AC1\][^\[\]\s]*/g, '[AC1]');
            hasChanges = true;
          }
          if (newValue.includes('[AC25]')) {
            newValue = newValue.replace(/\[AC25\][^\[\]\s]*/g, '[AC25]');
            hasChanges = true;
          }
          if (newValue.includes('[RE1]')) {
            newValue = newValue.replace(/\[RE1\][^\[\]\s]*/g, '[RE1]');
            hasChanges = true;
          }
          if (newValue.includes('[RE25]')) {
            newValue = newValue.replace(/\[RE25\][^\[\]\s]*/g, '[RE25]');
            hasChanges = true;
          }
          if (newValue.includes('[DEFECT]')) {
            newValue = newValue.replace(/\[DEFECT\][^\[\]\s]*/g, '[DEFECT]');
            hasChanges = true;
          }
          // 注意：对于[QUALIFY]标记，我们不进行恢复操作，
          // 因为它们需要保持updateQualifiedCountsInTable方法中分配的具体数值
          // 每个合格数量单元格都应该保持其独立的值
          // 这确保了多个合格数量单元格的值相加等于缺陷总数的业务逻辑
          
          // 然后替换为当前产品的具体值
          if (newValue.includes('[WORKORDER]')) {
            newValue = newValue.replace(/\[WORKORDER\]/g, `[WORKORDER]${product.workOrderNumber}`);
            hasChanges = true;
          }
          if (newValue.includes('[PRODUCT]')) {
            newValue = newValue.replace(/\[PRODUCT\]/g, `[PRODUCT]${product.productName}`);
            hasChanges = true;
          }
          if (newValue.includes('[DELIVERY]')) {
            newValue = newValue.replace(/\[DELIVERY\]/g, `[DELIVERY]${product.totalQuantity}`);
            hasChanges = true;
          }
          if (newValue.includes('[INSPECTION]')) {
            newValue = newValue.replace(/\[INSPECTION\]/g, `[INSPECTION]${product.totalQuantity}`);
            hasChanges = true;
          }
          if (newValue.includes('[QUALITY]')) {
            newValue = newValue.replace(/\[QUALITY\]/g, `[QUALITY]${合格状态.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[TIME]')) {
            newValue = newValue.replace(/\[TIME\]/g, `[TIME]${当前时间.value}`);
            hasChanges = true;
          }
          // 添加抽样数量和Ac/Re值的替换
          if (newValue.includes('[SAMPLE]')) {
            newValue = newValue.replace(/\[SAMPLE\]/g, `[SAMPLE]${抽样数量.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[AC1]')) {
            newValue = newValue.replace(/\[AC1\]/g, `[AC1]${Ac_1.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[AC25]')) {
            newValue = newValue.replace(/\[AC25\]/g, `[AC25]${Ac_2_5.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[RE1]')) {
            newValue = newValue.replace(/\[RE1\]/g, `[RE1]${Re_1.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[RE25]')) {
            newValue = newValue.replace(/\[RE25\]/g, `[RE25]${Re_2_5.value}`);
            hasChanges = true;
          }
          if (newValue.includes('[DEFECT]')) {
            newValue = newValue.replace(/\[DEFECT\]/g, `[DEFECT]${缺陷总数.value}`);
            hasChanges = true;
          }
          // 注意：对于[QUALIFY]标记，我们不进行全局替换，
          // 而是保持updateQualifiedCountsInTable方法中分配的具体数值
          // 这样每个合格数量单元格都能保持其独立的值
          // 确保多个合格数量单元格的值相加等于缺陷总数
          
          // 如果有变化，更新单元格
          if (hasChanges) {
            props.hotInstance.setDataAtCell(row, col, newValue);
            console.log(`DataRefresher: 已更新单元格(${row},${col}):`, cellValue, '->', newValue);
          }
        }
      }
    }
    
    // 重新渲染表格
    props.hotInstance.render();
    console.log(`DataRefresher: 第${productIndex + 1}个产品的预置文本替换完成`);
    
  } catch (error) {
    console.error('DataRefresher: 预置文本替换过程中发生错误:', error);
  }
};

/**
 * 发出预置文本更新事件
 */
const emitPresetTextUpdate = () => {
  emit('preset-text-updated', {
    工单号: 工单号.value,
    产品名称: 产品名称.value,
    交货数量: 交货数量.value,
    送检数量: 送检数量.value,
    抽样数量: 抽样数量.value,
    Ac_1: Ac_1.value,
    Ac_2_5: Ac_2_5.value,
    Re_1: Re_1.value,
    Re_2_5: Re_2_5.value,
    合格状态: 合格状态.value,
    当前时间: 当前时间.value
  });
};

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
          // 识别带有特殊标记的合格数量单元格
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
          // 识别带有特殊标记的缺陷总数
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
    
    // 发出预置文本更新事件
    emitPresetTextUpdate();
    
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
    
    // 8. 更新其他预置文本（合格状态、当前时间）
    updateOtherPresetTexts();
    
    // 9. 最后发出完整的预置文本更新事件
    emitPresetTextUpdate();
    
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

// 暴露给父组件的接口
defineExpose({
  // 基础刷新功能
  refreshData,
  
  // URL参数更新功能
  updatePresetTextFromUrlParams,
  temporaryReplacePresetTextInTable,
  
  // DOM替换功能（新增）
  replacePresetTextInClonedTable,
  
  // 预览前刷新功能
  refreshAllPresetTextsForPreview,
  
  // 数据访问接口（为了兼容性）
  get工单号: () => 工单号.value,
  get产品名称: () => 产品名称.value,
  get交货数量: () => 交货数量.value,
  get送检数量: () => 送检数量.value,
  get抽样数量: () => 抽样数量.value,
  getAc_1: () => Ac_1.value,
  getAc_2_5: () => Ac_2_5.value,
  getRe_1: () => Re_1.value,
  getRe_2_5: () => Re_2_5.value,
  get缺陷总数: () => 缺陷总数.value,
  get合格数量: () => 合格数量.value,
  get合格状态: () => 合格状态.value,
  get当前时间: () => 当前时间.value
});
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