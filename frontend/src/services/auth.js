/**
 * 认证服务 — 调用后端 API，离线回退 localStorage
 */
import { api } from './api'

/**
 * 注册新账号
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export async function registerUser(name, studentId) {
  try {
    const res = await api.post('/api/auth/register', { name, studentId }, { timeout: 15000 })
    if (res.data?.user) {
      return { success: true, user: res.data.user }
    }
    return { success: false, error: '注册失败' }
  } catch (e) {
    // 后端不可用，回退到本地注册
    console.warn('Backend auth unavailable, using local register')
    return localRegister(name, studentId)
  }
}

/**
 * 登录
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export async function loginUser(studentId) {
  try {
    const res = await api.post('/api/auth/login', { studentId }, { timeout: 15000 })
    if (res.data?.user) {
      return { success: true, user: res.data.user }
    }
    return { success: false, error: '登录失败' }
  } catch (e) {
    // 404 = 未注册
    if (e.response?.status === 404) {
      return { success: false, error: '该学号未注册，请先注册账号' }
    }
    // 网络错误，回退到本地登录
    console.warn('Backend auth unavailable, using local login')
    return localLogin(studentId)
  }
}

// ========== 离线回退 ==========

function localRegister(name, studentId) {
  try {
    const users = JSON.parse(localStorage.getItem('local_users') || '[]')
    if (users.find(u => u.studentId === studentId)) {
      return { success: true, user: { name, studentId, points: 0, level: '新手学员' }, offline: true }
    }
    users.push({ name, studentId })
    localStorage.setItem('local_users', JSON.stringify(users))
    return { success: true, user: { name, studentId, points: 0, level: '新手学员' }, offline: true }
  } catch {
    return { success: false, error: '本地存储异常' }
  }
}

function localLogin(studentId) {
  try {
    const users = JSON.parse(localStorage.getItem('local_users') || '[]')
    const found = users.find(u => u.studentId === studentId)
    if (found) {
      return { success: true, user: { ...found, points: 0, level: '新手学员' }, offline: true }
    }
    // 新学号自动注册
    const newUser = { name: `同学${studentId.slice(-4)}`, studentId }
    users.push(newUser)
    localStorage.setItem('local_users', JSON.stringify(users))
    return { success: true, user: { ...newUser, points: 0, level: '新手学员' }, offline: true }
  } catch {
    return { success: false, error: '本地存储异常' }
  }
}
