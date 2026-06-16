import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { registerUser, loginUser } from '../services/auth'

const CURRENT_KEY = 'current_user'
const PROGRESS_KEY = 'lesson_progress'
const STATS_KEY = 'answer_stats'
const WRONG_KEY = 'wrong_answers'

function getStudentKey(studentId) {
  return studentId || 'anonymous'
}

// 按学号加载进度
function loadUserProgress(studentId) {
  const key = getStudentKey(studentId)
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY + '_' + key) || '{}')
  } catch { return {} }
}

function saveUserProgress(studentId, data) {
  const key = getStudentKey(studentId)
  localStorage.setItem(PROGRESS_KEY + '_' + key, JSON.stringify(data))
}

function loadUserStats(studentId) {
  const key = getStudentKey(studentId)
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY + '_' + key) || '{"total":0,"correct":0}')
  } catch { return { total: 0, correct: 0 } }
}

function saveUserStats(studentId, data) {
  const key = getStudentKey(studentId)
  localStorage.setItem(STATS_KEY + '_' + key, JSON.stringify(data))
}

function loadWrongAnswers(studentId) {
  const key = getStudentKey(studentId)
  try {
    return JSON.parse(localStorage.getItem(WRONG_KEY + '_' + key) || '[]')
  } catch { return [] }
}

function saveWrongAnswers(studentId, data) {
  const key = getStudentKey(studentId)
  localStorage.setItem(WRONG_KEY + '_' + key, JSON.stringify(data))
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoggedIn = computed(() => currentUser.value !== null)
  const isRegistering = ref(false)
  const isLoggingIn = ref(false)
  const isOffline = ref(false)

  // 从 localStorage 恢复登录状态
  const stored = localStorage.getItem(CURRENT_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      currentUser.value = parsed
      isOffline.value = parsed.offline === true
    } catch { /* ignore */ }
  }

  async function register(name, studentId) {
    isRegistering.value = true
    const result = await registerUser(name.trim(), studentId.trim())
    isRegistering.value = false

    if (result.success && result.user) {
      const user = { ...result.user, offline: result.offline || false }
      currentUser.value = user
      isOffline.value = result.offline || false
      localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
      return { success: true }
    }
    return { success: false, error: result.error || '注册失败' }
  }

  async function login(studentId) {
    isLoggingIn.value = true
    const result = await loginUser(studentId.trim())
    isLoggingIn.value = false

    if (result.success && result.user) {
      const user = { ...result.user, offline: result.offline || false }
      currentUser.value = user
      isOffline.value = result.offline || false
      localStorage.setItem(CURRENT_KEY, JSON.stringify(user))
      return { success: true }
    }
    return { success: false, error: result.error || '登录失败' }
  }

  function logout() {
    currentUser.value = null
    isOffline.value = false
    localStorage.removeItem(CURRENT_KEY)
  }

  // 获取当前用户的数据 key
  function getDataKey() {
    return currentUser.value?.studentId || 'anonymous'
  }

  return {
    currentUser, isLoggedIn, isRegistering, isLoggingIn, isOffline,
    register, login, logout, getDataKey
  }
})
