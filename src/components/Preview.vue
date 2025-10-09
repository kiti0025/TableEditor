<template>
  <div class="preview-wrapper">
    <button class="preview-btn" @click="enterPreview" title="预览">预览</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ProductInfo } from '../urlUtils';

interface PreviewProps {
  hotInstance: any;
  dataRefresher?: any; // DataRefresher组件的引用
}

const props = defineProps<PreviewProps>();
const emit = defineEmits<{
  'preview-mode-change': [boolean]
}>();

// 进入预览模式
const enterPreview = () => {
  if (!props.hotInstance) return;
  
  // 通知父组件进入预览模式
  emit('preview-mode-change', true);
  
  const hotElement = props.hotInstance.rootElement;
  if (!hotElement) return;
  
  try {
    // 创建预览容器
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'preview-container';
    document.body.appendChild(previewWrapper);
    
    // 克隆整个表格
    const tableClone = hotElement.cloneNode(true) as HTMLElement;
    previewWrapper.appendChild(tableClone);
    
    // 添加点击预览容器退出预览的功能
    previewWrapper.addEventListener('click', function handlePreviewClick(event) {
      if (event.target === previewWrapper) {
        // 通知父组件退出预览模式
        emit('preview-mode-change', false);
        previewWrapper.remove();
        previewWrapper.removeEventListener('click', handlePreviewClick);
      }
    });
    
  } catch (error) {
    console.error('进入预览模式时发生错误:', error);
    // 发生错误时确保状态正确
    emit('preview-mode-change', false);
  }
};

// 创建多个预览（在同一页面中垂直排列，只显示表格内容）
const createMultiPreview = (products: ProductInfo[]) => {
  if (!props.hotInstance) return;
  
  console.log('开始创建多预览，产品数量:', products.length);
  
  // 通知父组件进入预览模式
  emit('preview-mode-change', true);
  
  const hotElement = props.hotInstance.rootElement;
  if (!hotElement) return;
  
  try {
    // 创建一个主预览容器
    const mainPreviewWrapper = document.createElement('div');
    mainPreviewWrapper.className = 'preview-container';
    document.body.appendChild(mainPreviewWrapper);
    
    // 为每个产品创建预览区块
    products.forEach((product, index) => {
      console.log(`正在为第${index + 1}个产品创建预览:`, product);
      
      // 为每个产品单独刷新所有预置文本数据（包括随机数据）
      // 这确保每组预览都有独立的缺陷总数、合格数量等随机生成的数据
      if (props.dataRefresher?.refreshAllPresetTextsForPreview) {
        props.dataRefresher.refreshAllPresetTextsForPreview(product);
        console.log(`已为第${index + 1}个产品刷新所有预置文本数据`);
      }
      
      // 然后为当前产品替换URL参数相关的预置文本
      // 这确保每组预览显示对应产品的工单号、产品名称等URL参数数据
      if (props.dataRefresher?.temporaryReplacePresetTextInTable) {
        props.dataRefresher.temporaryReplacePresetTextInTable(products, index);
        console.log(`已为第${index + 1}个产品在原始表格上替换预置文本`);
      }
      
      // 立即克隆表格，捕获当前产品的替换结果
      const tableClone = hotElement.cloneNode(true) as HTMLElement;
      tableClone.style.width = '100%';
      tableClone.style.marginBottom = '0';
      
      // 创建产品预览区块
      const productSection = document.createElement('div');
      productSection.className = 'product-preview-section';
      productSection.appendChild(tableClone);
      
      // 如果不是最后一个产品，添加分页符
      if (index < products.length - 1) {
        const pageBreak = document.createElement('div');
        pageBreak.className = 'page-break';
        productSection.appendChild(pageBreak);
      }
      
      // 将产品区块添加到主容器
      mainPreviewWrapper.appendChild(productSection);
      
      console.log(`第${index + 1}个预览区块创建完成，产品:`, product.productName);
    });
    
    // 添加点击预览容器退出预览的功能
    mainPreviewWrapper.addEventListener('click', function handlePreviewClick(event) {
      if (event.target === mainPreviewWrapper) {
        // 通知父组件退出预览模式
        emit('preview-mode-change', false);
        mainPreviewWrapper.remove();
        mainPreviewWrapper.removeEventListener('click', handlePreviewClick);
      }
    });
    
  } catch (error) {
    console.error('创建多预览时发生错误:', error);
    // 发生错误时确保状态正确
    emit('preview-mode-change', false);
  }
};

// 暴露给父组件
defineExpose({
  enterPreview,
  createMultiPreview
});
</script>

<style scoped>
.preview-btn {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  transition: background-color 0.2s;
}

.preview-btn:hover {
  background-color: #f0f0f0;
  border-color: #999;
}

:global(.preview-container) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  padding: 20px;
  overflow: auto;
}

:global(.product-preview-section) {
  margin-bottom: 30px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 20px;
}

:global(.product-preview-section:last-child) {
  border-bottom: none;
  margin-bottom: 0;
}

:global(.page-break) {
  page-break-after: always;
  height: 1px;
  margin: 20px 0;
  border-top: 1px dashed #ccc;
}

/* 打印样式优化 */
@media print {
  :global(.preview-container) {
    position: static;
    padding: 0;
    background: white;
  }
  
  :global(.product-preview-section) {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  :global(.page-break) {
    page-break-after: always;
    height: 0;
    margin: 0;
    border: none;
  }
}
</style>