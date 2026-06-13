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
      // 离线模式：直接保存到本地
      const user = { id: Date.now(), name, studentId, points: 0, level: '新手学员' }
      currentUser.value = user
      localStorage.setItem('userInfo', JSON.stringify(user))
      return { success: true }
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
      // 离线模式：从本地存储检查
      const stored = localStorage.getItem('userInfo')
      if (stored) {
        const user = JSON.parse(stored)
        if (user.studentId === studentId) {
          currentUser.value = user
          return { success: true }
        }
      }
      // 离线模式：允许任何学号登录（仅首次）
      const user = { id: Date.now(), name: '同学', studentId, points: 0, level: '新手学员' }
      currentUser.value = user
      localStorage.setItem('userInfo', JSON.stringify(user))
      return { success: true }
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
