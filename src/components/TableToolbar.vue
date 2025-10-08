<template>
  <div class="table-toolbar">
    <!-- 文本样式控制 -->
    <div class="toolbar-section">
      <select v-model="fontFamily" @change="applyFontFamily" @mousedown.stop title="字体">
        <option value="Arial, sans-serif">Arial</option>
        <option value="Times New Roman, serif">新罗马</option>
        <option value="NSimSun, serif">新宋体</option>
        <option value="SimSun, serif">宋体</option>
        <option value="FangSong, serif">仿宋</option>
        <!-- <option value="Courier New, monospace">Courier New</option> -->
        <option value="Microsoft YaHei, sans-serif">雅黑</option>
        <option value="KaiTi, serif">楷体</option>
        <option value="Dengxian, sans-serif">等线</option>
        <option value="SimHei, sans-serif">黑体</option>
      </select>

      <select v-model="fontSize" @change="applyFontSize" @mousedown.stop title="字号">
        <option v-for="size in fontSizeOptions" :key="size" :value="size + 'px'">
          {{ size }}
        </option>
      </select>

      <select v-model="lineHeight" @change="applyLineHeight" @mousedown.stop title="行间距">
        <option v-for="lh in lineHeightOptions" :key="lh" :value="lh">
          {{ lh === 'normal' ? '标准' : `${lh}x` }}
        </option>
      </select>
    </div>

    <!-- 文本样式按钮 -->
    <div class="toolbar-section">
      <button 
        class="toolbar-btn" 
        :class="{ active: isBold }" 
        @mousedown.stop="toggleBold"
        title="粗体"
      >
        <strong>B</strong>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isItalic }" 
        @mousedown.stop="toggleItalic"
        title="斜体"
      >
        <em>I</em>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isUnderline }" 
        @mousedown.stop="toggleUnderline"
        title="下划线"
      >
        <u>U</u>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isStrikethrough }" 
        @mousedown.stop="toggleStrikethrough"
        title="删除线"
      >
        <s>S</s>
      </button>
    </div>

    <!-- 对齐方式 -->
    <div class="toolbar-section">
      <select v-model="textAlign" @change="setTextAlign(textAlign)" @mousedown.stop title="水平对齐">
        <option value="left" title="左对齐">⬅</option>
        <option value="center" title="居中对齐">⏺</option>
        <option value="right" title="右对齐">➡</option>
        <!-- <option value="justify" title="两端对齐">⬌</option> -->
      </select>
    </div>

    <div class="toolbar-section">
      <select v-model="verticalAlign" @change="setVerticalAlign(verticalAlign)" @mousedown.stop title="垂直对齐">
        <option value="top" title="顶部对齐">⬆</option>
        <option value="middle" title="垂直居中">⏺</option>
        <option value="bottom" title="底部对齐">⬇</option>
      </select>
    </div>

    <!-- 颜色设置 -->
    <div class="toolbar-section">
      <input 
        type="color" 
        v-model="textColor" 
        @change="applyTextColor"
        @mousedown.stop
        title="文字颜色"
      >
      
      <input 
        type="color" 
        v-model="backgroundColor" 
        @change="applyBackgroundColor"
        @mousedown.stop
        title="背景颜色"
      >
    </div>
     <SymbolSelect :hot-instance="hotInstance" />
     <PredefinedText :hot-instance="hotInstance" />
     <TableSaver :hot-instance="hotInstance" :get-cell-styles="getCellStyles" :set-cell-styles="setCellStyles" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Handsontable from 'handsontable';
import SymbolSelect from './SymbolSelect.vue'
import PredefinedText from './PredefinedText.vue';
import TableSaver from './TableSaver.vue';

// 定义Props接口
interface TableToolbarProps {
  hotInstance: any;
}

// 接收hotInstance属性
const props = defineProps<TableToolbarProps>();

// 字体设置
const fontFamily = ref<string>('Arial, sans-serif');
const fontSize = ref<string>('14px');
const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 72];

// 行间距相关设置
const lineHeight = ref<string | number>('normal');
const lineHeightOptions = ['normal', 1.2, 1.5, 1.8, 2.0, 2.5];


// 文本样式状态
const isBold = ref<boolean>(false);
const isItalic = ref<boolean>(false);
const isUnderline = ref<boolean>(false);
const isStrikethrough = ref<boolean>(false);

// 对齐方式
const textAlign = ref<string>('left');
const verticalAlign = ref<string>('middle');

// 颜色设置
const textColor = ref<string>('#000000');
const backgroundColor = ref<string>('#ffffff');

// 存储单元格样式的对象
const cellStyles: Record<string, Record<string, string>> = {};

// 获取单元格唯一标识符
const getCellKey = (row: number, col: number): string => {
  return `cell_${row}_${col}`;
};

// 检查选中区域
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

// 创建自定义渲染器
const CustomTextRenderer = function(
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
) {
  // const displayValue = value === null || value === undefined ? '' : String(value);//处理空格
  // 应用基础文本渲染器
  Handsontable.renderers.TextRenderer.apply(this, [
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties,
  ]);

  // 应用所有样式
  const cellKey = getCellKey(row, col);
  const styles = cellStyles[cellKey];

  if (!styles) {
    // 没有自定义样式时使用默认值
    td.style.verticalAlign = verticalAlign.value;
    td.style.textAlign = textAlign.value;
    td.style.fontFamily = fontFamily.value;
    td.style.fontSize = fontSize.value;
    td.style.fontWeight = 'normal';
    td.style.fontStyle = 'normal';
    td.style.textDecoration = 'none';
    td.style.color = textColor.value;
    td.style.backgroundColor = backgroundColor.value;
    td.style.lineHeight = lineHeight.value.toString();
  } else {
    // 有自定义样式时，应用存储的样式，并为未存储的样式提供默认值，不提供默认值会导致样式丢失，比如垂直居中
    td.style.verticalAlign = styles.verticalAlign || verticalAlign.value;
    td.style.textAlign = styles.textAlign || textAlign.value;
    td.style.fontFamily = styles.fontFamily || fontFamily.value;
    td.style.fontSize = styles.fontSize || fontSize.value;
    td.style.fontWeight = styles.fontWeight || 'normal';
    td.style.fontStyle = styles.fontStyle || 'normal';
    td.style.textDecoration = styles.textDecoration || 'none';
    td.style.color = styles.color || textColor.value;
    td.style.backgroundColor = styles.backgroundColor || backgroundColor.value;
    td.style.lineHeight = styles.lineHeight || lineHeight.value.toString();
  }
};

// 应用样式到选中区域
const applyStyleToSelected = (styleProperty: string, styleValue: string): void => {
  if (!props.hotInstance) {
    console.error('hotInstance is not available');
    return;
  }
  
  const range = getSelectedRange();
  if (!range) {
    console.warn('No cell selected');
    return;
  }
  
  // 遍历选中区域的每个单元格
  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      const cellKey = getCellKey(row, col);
      
      if (!cellStyles[cellKey]) {
        cellStyles[cellKey] = {};
      }
      
      // 设置样式
      cellStyles[cellKey][styleProperty] = styleValue;
      
      // 直接获取DOM元素并应用样式
      const td = props.hotInstance.getCell(row, col) as HTMLTableCellElement;
      if (td) {
        (td.style as any)[styleProperty] = styleValue;
      }
    }
  }
  
  // console.log('Style applied successfully:', styleProperty, styleValue);
};

// 字体设置函数
const applyFontFamily = () => {
  applyStyleToSelected('fontFamily', fontFamily.value);
};

const applyFontSize = () => {
  applyStyleToSelected('fontSize', fontSize.value);
};

// 行间距的函数
const applyLineHeight = () => {
  applyStyleToSelected('lineHeight', lineHeight.value.toString());
};
// 文本样式函数
const toggleBold = () => {
  isBold.value = !isBold.value;
  applyStyleToSelected('fontWeight', isBold.value ? 'bold' : 'normal');
};

const toggleItalic = () => {
  isItalic.value = !isItalic.value;
  applyStyleToSelected('fontStyle', isItalic.value ? 'italic' : 'normal');
};

const toggleUnderline = () => {
  isUnderline.value = !isUnderline.value;
  updateTextDecoration();
};

const toggleStrikethrough = () => {
  isStrikethrough.value = !isStrikethrough.value;
  updateTextDecoration();
};

// 更新文本装饰（下划线和删除线）
const updateTextDecoration = () => {
  let decorations: string[] = [];
  if (isUnderline.value) decorations.push('underline');
  if (isStrikethrough.value) decorations.push('line-through');
  applyStyleToSelected('textDecoration', decorations.length > 0 ? decorations.join(' ') : 'none');
};

// 水平对齐方式函数
const setTextAlign = (align: string) => {
  // textAlign.value = align;
  applyStyleToSelected('textAlign', align);
};

// 垂直对齐方式函数
const setVerticalAlign = (align: string) => {
  // verticalAlign.value = align;
  applyStyleToSelected('verticalAlign', align);
};

// 颜色设置函数
const applyTextColor = () => {
  applyStyleToSelected('color', textColor.value);
};

const applyBackgroundColor = () => {
  applyStyleToSelected('backgroundColor', backgroundColor.value);
};

// TableSaver需要的方法
const getCellStyles = () => cellStyles;
const setCellStyles = (styles: Record<string, Record<string, string>>) => {
  // 先清空所有旧样式
  Object.keys(cellStyles).forEach(key => {
    delete cellStyles[key];
  });
  // 然后设置新样式
  Object.assign(cellStyles, styles);
};

// 组件挂载时设置自定义渲染器
onMounted(() => {
  if (props.hotInstance) {
    // 注册自定义渲染器
    Handsontable.renderers.registerRenderer('CustomTextRenderer', CustomTextRenderer);
    
    // 设置渲染器到表格
    props.hotInstance.updateSettings({
      cells: function(row: number, col: number) {
        return {
          renderer: CustomTextRenderer
        };
      }
    });
    
     // 添加单元格选择变化监听，用于更新按钮状态
    props.hotInstance.addHook('afterSelection', updateToolbarButtonStates);
    props.hotInstance.addHook('afterSelectionEnd', updateToolbarButtonStates);

     updateToolbarButtonStates();// 初始化时更新一次按钮状态

    console.log('Custom renderer set up successfully');
  }
});

// 更新工具栏按钮状态以匹配选中单元格的样式
const updateToolbarButtonStates = () => {
  if (!props.hotInstance) return;
  
  const range = getSelectedRange();
  if (!range) {
    // 没有选中单元格时，重置按钮状态
    isBold.value = false;
    isItalic.value = false;
    isUnderline.value = false;
    isStrikethrough.value = false;
    textAlign.value = 'left'; 
    verticalAlign.value = 'middle'; 
    fontFamily.value = 'Arial, sans-serif'; 
    fontSize.value = '14px'; 
    lineHeight.value = 'normal';
    return;
  }
  
  // 获取第一个选中单元格的样式作为参考
  const firstCellKey = getCellKey(range.startRow, range.startCol);
  const firstCellStyles = cellStyles[firstCellKey];
  
  // 如果单元格有自定义样式，根据样式更新按钮状态
  if (firstCellStyles) {
    isBold.value = firstCellStyles.fontWeight === 'bold';
    isItalic.value = firstCellStyles.fontStyle === 'italic';
    isUnderline.value = firstCellStyles.textDecoration?.includes('underline') || false;
    isStrikethrough.value = firstCellStyles.textDecoration?.includes('line-through') || false;
    textAlign.value = firstCellStyles.textAlign || 'left';
    verticalAlign.value = firstCellStyles.verticalAlign || 'middle';
    fontFamily.value = firstCellStyles.fontFamily || 'Arial, sans-serif';
    fontSize.value = firstCellStyles.fontSize || '14px';
    lineHeight.value = firstCellStyles.lineHeight || 'normal';
  } else {
    // 没有自定义样式时，重置按钮状态
    isBold.value = false;
    isItalic.value = false;
    isUnderline.value = false;
    isStrikethrough.value = false;
    textAlign.value = 'left';
    verticalAlign.value = 'middle';
    fontFamily.value = 'Arial, sans-serif';
    fontSize.value = '14px';
    lineHeight.value = 'normal';
  }
};
</script>

<style scoped>
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 5px;
}

.toolbar-section select,
.toolbar-section input[type="color"] {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}

.toolbar-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.toolbar-btn:hover {
  background-color: #e6e6e6;
}

.toolbar-btn.active {
  background-color: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-section {
    justify-content: center;
  }
}

</style>