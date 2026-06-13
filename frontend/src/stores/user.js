import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const USERS_KEY = 'registered_users'
const CURRENT_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoggedIn = computed(() => currentUser.value !== null)
  const isRegistering = ref(false)
  const isLoggingIn = ref(false)

  // 从 localStorage 恢复登录状态
  const stored = localStorage.getItem(CURRENT_KEY)
  if (stored) {
    try { currentUser.value = JSON.parse(stored) } catch { /* ignore */ }
  }

  function register(name, studentId) {
    isRegistering.value = true
    // 纯本地注册
    const user = { id: Date.now(), name, studentId, points: 0, level: '新手学员' }
    currentUser.value = user
    localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
    // 保存到已注册用户列表（支持多账号切换）
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      if (!users.find(u => u.studentId === studentId)) {
        users.push({ name, studentId })
        localStorage.setItem(USERS_KEY, JSON.stringify(users))
      }
    } catch { /* ignore */ }
    isRegistering.value = false
    return { success: true }
  }

  function login(studentId) {
    isLoggingIn.value = true
    // 检查是否已注册
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const found = users.find(u => u.studentId === studentId)
    if (found) {
      currentUser.value = { id: Date.now(), ...found, points: 0, level: '新手学员' }
      localStorage.setItem(CURRENT_KEY, JSON.stringify(currentUser.value))
      isLoggingIn.value = false
      return { success: true }
    }
    // 新学号自动注册
    const user = { id: Date.now(), name: `同学${studentId.slice(-4)}`, studentId, points: 0, level: '新手学员' }
    currentUser.value = user
    localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
    users.push({ name: user.name, studentId })
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    isLoggingIn.value = false
    return { success: true }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(CURRENT_KEY)
  }

  return { currentUser, isLoggedIn, isRegistering, isLoggingIn, register, login, logout }
})
