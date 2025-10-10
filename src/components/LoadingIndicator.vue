<template>
  <div v-if="isLoading" class="loading-overlay" :class="{ 'fullscreen': fullscreen }">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LoadingIndicatorProps {
  isLoading?: boolean;
  text?: string;
  fullscreen?: boolean;
}

const props = withDefaults(defineProps<LoadingIndicatorProps>(), {
  isLoading: false,
  text: '正在加载中',
  fullscreen: false
});
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.loading-overlay.fullscreen {
  position: fixed;
  z-index: 3000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 16px;
  color: #333;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>