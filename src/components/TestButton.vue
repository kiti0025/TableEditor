<template>
  <div class="test-button-container">
    <button 
      class="test-button"
      @click="generateRandomNumber"
      title="生成随机数并赋值给缺陷总数"
    >
      测试
    </button>
  </div>
</template>

<script setup lang="ts">
// 定义emits - 简化为直接通知父组件
const emit = defineEmits<{
  'defect-count-generated': [count: number];
}>();

// 生成随机数并发送给父组件
const generateRandomNumber = () => {
  try {
    // 生成一个1到100之间的随机整数
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    
    // 直接向父组件(PredefinedText)发送事件
    emit('defect-count-generated', randomNumber);
    
    console.log('生成的随机数已发送给PredefinedText:', randomNumber);
  } catch (error) {
    console.error('生成随机数时发生错误:', error);
  }
};
</script>

<style scoped>
.test-button-container {
  display: flex;
  align-items: center;
}

.test-button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  transition: background-color 0.2s;
}

.test-button:hover {
  background-color: #f0f0f0;
  border-color: #999;
}
</style>