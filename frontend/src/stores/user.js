import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoggedIn = computed(() => currentUser.value !== null)
  const isRegistering = ref(false)
  const isLoggingIn = ref(false)

  const stored = localStorage.getItem('userInfo')
  if (stored) {
    try { currentUser.value = JSON.parse(stored) } catch (e) { /* ignore */ }
  }

  async function register(name, studentId) {
    isRegistering.value = true
    try {
      const { data } = await api.post('/api/auth/register', { name, studentId })
      currentUser.value = data.user
      localStorage.setItem('userInfo', JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || '注册失败' }
    } finally {
      isRegistering.value = false
    }
  }

  async function login(studentId) {
    isLoggingIn.value = true
    try {
      const { data } = await api.post('/api/auth/login', { studentId })
      currentUser.value = data.user
      localStorage.setItem('userInfo', JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || '登录失败' }
    } finally {
      isLoggingIn.value = false
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('userInfo')
  }

  return { currentUser, isLoggedIn, isRegistering, isLoggingIn, register, login, logout }
})
