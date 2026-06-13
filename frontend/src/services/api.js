import axios from 'axios'

export const api = axios.create({
  baseURL: '',
  timeout: 2000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const user = localStorage.getItem('userInfo')
  if (user) {
    const { studentId } = JSON.parse(user)
    config.headers['X-Student-Id'] = studentId
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    console.warn('API Error:', error.message)
    return Promise.reject(error)
  }
)
