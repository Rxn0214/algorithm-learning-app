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
    const res = await api.post('/api/auth/register', { name, studentId }, { timeout: 10000 })
    if (res.data?.user) {
      return { success: true, user: res.data.user }
    }
    return { success: false, error: '注册失败：服务器返回异常' }
  } catch (e) {
    console.error('Register error:', e)
    // 网络错误才回退本地，其他错误显示出来
    if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || !e.response) {
      console.warn('Backend auth unavailable, using local register')
      return localRegister(name, studentId)
    }
    // 服务器返回了错误（如 400、404 等），显示给用户
    const msg = e.response?.data?.detail || '注册请求失败，请重试'
    return { success: false, error: msg }
  }
}

/**
 * 登录
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export async function loginUser(studentId) {
  try {
    const res = await api.post('/api/auth/login', { studentId }, { timeout: 10000 })
    if (res.data?.user) {
      return { success: true, user: res.data.user }
    }
    return { success: false, error: '登录失败：服务器返回异常' }
  } catch (e) {
    console.error('Login error:', e)
    if (e.response?.status === 404) {
      return { success: false, error: '该学号未注册，请先注册账号' }
    }
    // 网络错误回退本地
    if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || !e.response) {
      console.warn('Backend auth unavailable, using local login')
      return localLogin(studentId)
    }
    const msg = e.response?.data?.detail || '登录请求失败，请重试'
    return { success: false, error: msg }
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
