<template>
  <div class="table-toolbar">
    <!-- 文本样式控制 -->
    <div class="toolbar-section">
      <label>字体:</label>
      <select v-model="fontFamily" @change="applyFontFamily" @mousedown.stop>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Times New Roman, serif">新罗马</option>
        <option value="Courier New, monospace">Courier New</option>
        <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
        <option value="SimSun, serif">宋体</option>
        <option value="NSimSun, serif">新宋体</option>
        <option value="KaiTi, serif">楷体</option>
        <option value="FangSong, serif">仿宋</option>
        <option value="Dengxian, sans-serif">等线</option>
        <option value="SimHei, sans-serif">黑体</option>
      </select>

      <label>字号:</label>
      <select v-model="fontSize" @change="applyFontSize" @mousedown.stop>
        <option v-for="size in fontSizeOptions" :key="size" :value="size + 'px'">
          {{ size }}
        </option>
      </select>
    </div>

    <!-- 文本样式按钮 -->
    <div class="toolbar-section">
      <button 
        class="toolbar-btn" 
        :class="{ active: isBold }" 
        @mousedown.stop="toggleBold"
        title="粗体 (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isItalic }" 
        @mousedown.stop="toggleItalic"
        title="斜体 (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isUnderline }" 
        @mousedown.stop="toggleUnderline"
        title="下划线 (Ctrl+U)"
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
      <button 
        class="toolbar-btn" 
        :class="{ active: textAlign === 'left' }" 
        @mousedown.stop="setTextAlign('left')"
        title="左对齐"
      >
        📝
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: textAlign === 'center' }" 
        @mousedown.stop="setTextAlign('center')"
        title="居中对齐"
      >
        📋
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: textAlign === 'right' }" 
        @mousedown.stop="setTextAlign('right')"
        title="右对齐"
      >
        📄
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: textAlign === 'justify' }" 
        @mousedown.stop="setTextAlign('justify')"
        title="两端对齐"
      >
        📊
      </button>
    </div>

    <!-- 颜色设置 -->
    <div class="toolbar-section">
      <label>文字颜色:</label>
      <input 
        type="color" 
        v-model="textColor" 
        @change="applyTextColor"
        @mousedown.stop
        title="文字颜色"
      >
      
      <label>背景色:</label>
      <input 
        type="color" 
        v-model="backgroundColor" 
        @change="applyBackgroundColor"
        @mousedown.stop
        title="背景颜色"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Handsontable from 'handsontable';

// 定义Props接口
interface TableToolbarProps {
  hotInstance: any;
}

// 接收hotInstance属性
const props = defineProps<TableToolbarProps>();

// 字体设置
const fontFamily = ref<string>('Arial, sans-serif');
const fontSize = ref<string>('14px');
const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36];

// 文本样式状态
const isBold = ref<boolean>(false);
const isItalic = ref<boolean>(false);
const isUnderline = ref<boolean>(false);
const isStrikethrough = ref<boolean>(false);

// 对齐方式
const textAlign = ref<string>('left');

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

// 严格按照您提供的格式创建自定义渲染器
const CustomTextRenderer = function(
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
) {
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
  
  if (styles) {
    if (styles.fontSize) td.style.fontSize = styles.fontSize;
    if (styles.fontFamily) td.style.fontFamily = styles.fontFamily;
    if (styles.fontWeight) td.style.fontWeight = styles.fontWeight;
    if (styles.fontStyle) td.style.fontStyle = styles.fontStyle;
    if (styles.textDecoration) td.style.textDecoration = styles.textDecoration;
    if (styles.textAlign) td.style.textAlign = styles.textAlign;
    if (styles.color) td.style.color = styles.color;
    if (styles.backgroundColor) td.style.backgroundColor = styles.backgroundColor;
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
  
  console.log('Style applied successfully:', styleProperty, styleValue);
};

// 字体设置函数
const applyFontFamily = () => {
  applyStyleToSelected('fontFamily', fontFamily.value);
};

const applyFontSize = () => {
  applyStyleToSelected('fontSize', fontSize.value);
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

// 对齐方式函数
const setTextAlign = (align: string) => {
  textAlign.value = align;
  applyStyleToSelected('textAlign', align);
};

// 颜色设置函数
const applyTextColor = () => {
  applyStyleToSelected('color', textColor.value);
};

const applyBackgroundColor = () => {
  applyStyleToSelected('backgroundColor', backgroundColor.value);
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
    
    console.log('Custom renderer set up successfully');
  }
});
</script>

<style scoped>
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 5px;
}

.toolbar-section label {
  font-size: 12px;
  color: #333;
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