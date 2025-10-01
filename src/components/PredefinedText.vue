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
        case '工单号':
          valueToInsert = 工单号.value;
          break;
        case '交货数量':
          valueToInsert = 交货数量.value.toString();
          break;
        case '送检数量':
          valueToInsert = 送检数量.value.toString();
          break;
        case '抽样数量':
          valueToInsert = 抽样数量.value.toString();
          break;
        case '产品名称':
          valueToInsert = 产品名称.value;
          break;
        case 'Ac_1':
          valueToInsert = Ac_1.value.toString();
          break;
        case 'Ac_2.5':
          valueToInsert = Ac_2_5.value.toString();
          break;
        case 'Re_1':
          valueToInsert = Re_1.value.toString();
          break;
        case 'Re_2.5':
          valueToInsert = Re_2_5.value.toString();
          break;
        case '缺陷总数':
          valueToInsert = 缺陷总数.value.toString();
          break;
        case '合格数量':
          valueToInsert = 合格数量.value.toString();
          break;
        case '合格状态':
          valueToInsert = 合格状态.value;
          break;
        case '当前时间':
          valueToInsert = 当前时间.value;
          break;
        default:
          valueToInsert = '';
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