<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const user = useUserStore()

const loginMode = ref('register')
const registerForm = reactive({ name: '', studentId: '' })
const loginForm = reactive({ studentId: '' })
const registerErrors = reactive({ name: '', studentId: '' })
const loginErrors = reactive({ studentId: '' })

function switchToLogin() { loginMode.value = 'login'; loginErrors.studentId = '' }
function switchToRegister() { loginMode.value = 'register'; registerErrors.name = ''; registerErrors.studentId = '' }

function validateRegister() {
  let valid = true
  registerErrors.name = ''
  registerErrors.studentId = ''
  if (!registerForm.name.trim()) { registerErrors.name = '请输入姓名'; valid = false }
  else if (registerForm.name.trim().length < 2) { registerErrors.name = '姓名至少2个字符'; valid = false }
  if (!registerForm.studentId.trim()) { registerErrors.studentId = '请输入学号'; valid = false }
  else if (!/^\d{7}$/.test(registerForm.studentId.trim())) { registerErrors.studentId = '学号格式不正确（应为7位数字）'; valid = false }
  return valid
}

async function handleRegister() {
  if (!validateRegister()) return
  const result = await user.register(registerForm.name.trim(), registerForm.studentId.trim())
  if (result.success) router.push('/')
  else registerErrors.studentId = result.error
}

async function handleLogin() {
  if (!loginForm.studentId.trim()) { loginErrors.studentId = '请输入学号'; return }
  loginErrors.studentId = ''
  const result = await user.login(loginForm.studentId.trim())
  if (result.success) router.push('/')
  else loginErrors.studentId = result.error
}
</script>

<template>
  <div class="login-page">
    <div class="login-logo">📚</div>
    <h1 class="login-title">算法与程序实现</h1>
    <p class="login-subtitle">高中信息技术必修1 · 第二章学习助手</p>

    <div v-if="loginMode === 'register'" class="login-form">
      <h2 class="form-title">注册账号</h2>
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input type="text" class="form-input" v-model="registerForm.name" placeholder="请输入您的姓名" :class="{ error: registerErrors.name }">
        <div class="form-error" v-if="registerErrors.name">{{ registerErrors.name }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">学号</label>
        <input type="text" class="form-input" v-model="registerForm.studentId" placeholder="请输入您的学号" :class="{ error: registerErrors.studentId }">
        <div class="form-error" v-if="registerErrors.studentId">{{ registerErrors.studentId }}</div>
        <div class="form-hint">学号格式：7位数字，如 2024001</div>
      </div>
      <button class="login-btn" @click="handleRegister" :disabled="user.isRegistering">
        {{ user.isRegistering ? '注册中...' : '注册并登录' }}
      </button>
      <div class="login-switch">
        已有账号？<a @click="switchToLogin">直接登录</a>
      </div>
    </div>

    <div v-if="loginMode === 'login'" class="login-form">
      <h2 class="form-title">登录账号</h2>
      <div class="form-group">
        <label class="form-label">学号</label>
        <input type="text" class="form-input" v-model="loginForm.studentId" placeholder="请输入您的学号" :class="{ error: loginErrors.studentId }">
        <div class="form-error" v-if="loginErrors.studentId">{{ loginErrors.studentId }}</div>
      </div>
      <button class="login-btn" @click="handleLogin" :disabled="user.isLoggingIn">
        {{ user.isLoggingIn ? '登录中...' : '登录' }}
      </button>
      <div class="login-switch">
        还没有账号？<a @click="switchToRegister">立即注册</a>
      </div>
    </div>

    <div class="login-footer">© 2024 高中信息技术学习平台</div>
  </div>
</template>
