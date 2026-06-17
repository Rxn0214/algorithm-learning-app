/**
 * 论坛 API 服务 — 调用后端，离线回退 localStorage
 */
import { api } from './api'

const STORAGE_KEY = 'forum_posts'

// ========== 离线回退 ==========
function getLocalPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveLocalPosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

// ========== API 调用 ==========

export async function fetchPosts(sort = 'latest', search = '') {
  try {
    const params = { sort }
    if (search) params.search = search
    const res = await api.get('/api/forum', { params, timeout: 5000 })
    return { success: true, posts: res.data.posts || [], stats: res.data.stats }
  } catch (e) {
    console.warn('Forum API unavailable, using local data')
    const posts = getLocalPosts()
    return {
      success: true,
      posts,
      offline: true,
      stats: { totalPosts: posts.length, members: 45, weeklyStars: [], topScore: 0 }
    }
  }
}

export async function createPost(content, author) {
  try {
    const res = await api.post('/api/forum', { content, author }, { timeout: 5000 })
    return { success: true, post: res.data.post, pointsEarned: res.data.pointsEarned || 5 }
  } catch (e) {
    console.warn('Forum API unavailable, saving locally')
    const posts = getLocalPosts()
    const newPost = {
      id: Date.now(),
      avatar: author ? author.charAt(0) : '匿',
      author: author || '匿名用户',
      time: '刚刚',
      content,
      likes: 0,
      replies: 0,
      liked: false
    }
    posts.unshift(newPost)
    saveLocalPosts(posts)
    return { success: true, post: newPost, offline: true }
  }
}

export async function likePost(postId) {
  try {
    const res = await api.post(`/api/forum/${postId}/like`, {}, { timeout: 5000 })
    return { success: true, likes: res.data.likes }
  } catch (e) {
    console.warn('Like API unavailable')
    return { success: true, offline: true }
  }
}

export async function replyToPost(postId, content, author) {
  try {
    const res = await api.post(`/api/forum/${postId}/reply`, { content, author }, { timeout: 5000 })
    return { success: true, reply: res.data.reply, pointsEarned: res.data.pointsEarned || 3 }
  } catch (e) {
    console.warn('Reply API unavailable')
    return { success: true, reply: { id: Date.now(), author, content, time: '刚刚' }, offline: true }
  }
}

export async function fetchReplies(postId) {
  try {
    const res = await api.get(`/api/forum/${postId}/replies`, { timeout: 5000 })
    return { success: true, replies: res.data.replies || [] }
  } catch (e) {
    return { success: true, replies: [] }
  }
}

export async function fetchForumStats() {
  try {
    const res = await api.get('/api/forum/stats', { timeout: 5000 })
    return { success: true, stats: res.data.stats }
  } catch (e) {
    return { success: true, stats: { members: 45, topScore: 0, weeklyStars: [], totalPosts: 0 } }
  }
}

export async function fetchUserPoints() {
  try {
    const res = await api.get('/api/auth/profile', { timeout: 5000 })
    return { success: true, points: res.data.points || 0, level: res.data.level || '新手学员' }
  } catch (e) {
    return { success: true, points: 0, level: '新手学员', offline: true }
  }
}

export async function awardPoints(amount) {
  try {
    const res = await api.post('/api/auth/points', { amount }, { timeout: 5000 })
    return { success: true, points: res.data.points, level: res.data.level }
  } catch (e) {
    return { success: true, offline: true }
  }
}
