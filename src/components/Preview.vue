<template>
  <div class="preview-wrapper">
    <button class="preview-btn" @click="enterPreview" title="预览">预览</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface PreviewProps {
  hotInstance: any;
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
</style>