import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchPosts, createPost, likePost, replyToPost,
  fetchForumStats, fetchUserPoints
} from '../services/forum'

function getDefaultPosts() {
  return [
    { id: 1, avatar: '张', author: '张小明', time: '10分钟前', content: '今天学了流程图，感觉画流程图挺有意思的！有没有同学一起讨论一下怎么画判断框？', likes: 12, replies: 3, liked: false },
    { id: 2, avatar: '李', author: '李小红', time: '30分钟前', content: '请教一下，顺序结构和分支结构的区别是什么呀？感觉有点分不清...', likes: 8, replies: 5, liked: true },
    { id: 3, avatar: '王', author: '王大伟', time: '1小时前', content: '分享一个小技巧：画流程图的时候可以先用铅笔打草稿，这样修改起来比较方便～', likes: 23, replies: 7, liked: false },
    { id: 4, avatar: '陈', author: '陈静怡', time: '2小时前', content: '老师布置的编程作业大家都做完了吗？我卡在循环那部分了...', likes: 15, replies: 12, liked: false }
  ]
}

export const useForumStore = defineStore('forum', () => {
  const posts = ref(getDefaultPosts())
  const stats = ref({ members: 45, topScore: 5680, weeklyStars: [], totalPosts: 4 })
  const loading = ref(false)
  const isOffline = ref(false)
  const sortBy = ref('latest')
  const searchQuery = ref('')
  const userPoints = ref(0)
  const userLevel = ref('新手学员')

  // ========== 从服务器加载帖子 ==========
  async function loadPosts(sort, search) {
    loading.value = true
    if (sort !== undefined) sortBy.value = sort
    if (search !== undefined) searchQuery.value = search

    const result = await fetchPosts(sortBy.value, searchQuery.value)
    if (result.posts && result.posts.length > 0) {
      posts.value = result.posts
    }
    if (result.stats) {
      stats.value = { ...stats.value, ...result.stats }
    }
    isOffline.value = result.offline || false
    loading.value = false
  }

  // ========== 加载论坛统计（本周之星等） ==========
  async function loadStats() {
    const result = await fetchForumStats()
    if (result.stats) {
      stats.value = { ...stats.value, ...result.stats }
    }
  }

  // ========== 加载用户积分 ==========
  async function loadUserPoints() {
    const result = await fetchUserPoints()
    userPoints.value = result.points || 0
    userLevel.value = result.level || '新手学员'
    isOffline.value = result.offline || isOffline.value
  }

  // ========== 发布帖子 ==========
  async function publishPost(content, userName) {
    const result = await createPost(content, userName)
    if (result.post) {
      posts.value.unshift(result.post)
      userPoints.value += (result.pointsEarned || 5)
    }
    return result
  }

  // ========== 点赞 ==========
  async function toggleLike(postId, index) {
    if (index < 0 || index >= posts.value.length) return
    const post = posts.value[index]
    if (!post) return

    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1

    // 异步调用 API
    likePost(postId)
  }

  // ========== 回复 ==========
  async function addReply(postId, content, userName) {
    const result = await replyToPost(postId, content, userName)
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.replies = (post.replies || 0) + 1
    }
    if (result.pointsEarned) {
      userPoints.value += result.pointsEarned
    }
    return result.reply || { id: Date.now(), author: userName, content, time: '刚刚' }
  }

  // ========== 搜索 ==========
  function setSearch(query) {
    searchQuery.value = query
  }

  function setSort(sort) {
    sortBy.value = sort
  }

  // ========== 初始化（页面加载后调用） ==========
  async function init() {
    await Promise.all([
      loadPosts(),
      loadStats(),
      loadUserPoints()
    ])
  }

  // 兼容旧接口
  function initFromStorage() {
    loadPosts()
  }

  return {
    posts, stats, loading, isOffline,
    sortBy, searchQuery, userPoints, userLevel,
    loadPosts, loadStats, loadUserPoints,
    publishPost, toggleLike, addReply,
    setSearch, setSort, init, initFromStorage
  }
})
