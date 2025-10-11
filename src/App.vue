<script setup>
import { ref, onMounted } from 'vue'
import HotTable from './components/HotTable.vue'
import Login from './components/Login.vue'
import { parseProductInfo, getCustomerName } from './urlUtils'

// 控制是否显示登录界面
const showLogin = ref(false)

// 检查用户是否已登录
const isLoggedIn = () => {
  return localStorage.getItem('isLoggedIn') === 'true'
}

// 检查URL是否携带参数
const hasUrlParams = () => {
  // 检查是否有客户名称参数(param2)
  const customerName = getCustomerName()
  if (!customerName) {
    return false
  }
  
  // 检查是否有产品信息参数(param3)
  const products = parseProductInfo()
  return products.length > 0
}

// 处理登录成功事件
const handleLoginSuccess = () => {
  showLogin.value = false
}

// 组件挂载时检查是否需要显示登录界面
onMounted(() => {
  // 如果URL不携带参数且用户未登录，则显示登录界面
  if (!hasUrlParams() && !isLoggedIn()) {
    showLogin.value = true
  }
})
</script>

<template>
  <div>
    <!-- 登录界面 -->
    <Login v-if="showLogin" @login-success="handleLoginSuccess" />
    <!-- 主应用界面 -->
    <HotTable v-if="!showLogin || isLoggedIn() || hasUrlParams()" />
  </div>
</template>

<style scoped>
</style>