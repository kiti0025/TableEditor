<template>
  <div class="login-overlay" @click="handleOverlayClick">
    <div class="login-container" @click.stop>
      <div class="login-form">
        <h2>登录到表格编辑器</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">用户名:</label>
            <input 
              type="text" 
              id="username" 
              v-model="credentials.username" 
              required 
              placeholder="请输入用户名"
            />
          </div>
          <div class="form-group">
            <label for="password">密码:</label>
            <input 
              type="password" 
              id="password" 
              v-model="credentials.password" 
              required 
              placeholder="请输入密码"
            />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  emits: ['login-success'],
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      loading: false,
      error: ''
    };
  },
  methods: {
    handleOverlayClick(event) {
      // 点击遮罩层不关闭登录界面
    },
    async handleLogin() {
      this.loading = true;
      this.error = '';
      
      try {
        // 这里应该调用实际的登录API
        // 暂时使用简单的验证逻辑
        if (this.credentials.username === 'admin' && this.credentials.password === 'password') {
          // 登录成功
          localStorage.setItem('isLoggedIn', 'true');
          this.$emit('login-success');
        } else {
          this.error = '用户名或密码错误';
        }
      } catch (err) {
        this.error = '登录失败，请稍后再试';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white; 
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.login-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  min-width: 300px;
  max-width: 400px;
  width: 90%;
  z-index: 1001; /* 确保登录容器在遮罩层之上 */
}

.login-form h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.form-actions button {
  width: 100%;
  padding: 0.75rem;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.form-actions button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.form-actions button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}
</style>