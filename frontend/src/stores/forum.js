import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useForumStore = defineStore('forum', () => {
  const posts = ref([])
  const stats = ref({ members: 45, topScore: 5680 })
  const loading = ref(false)

  async function fetchPosts() {
    loading.value = true
    try {
      const { data } = await api.get('/api/forum')
      posts.value = data.posts || []
      if (data.stats) stats.value = data.stats
    } catch (e) {
      console.warn('Failed to fetch posts', e)
      if (posts.value.length === 0) {
        posts.value = getDefaultPosts()
      }
    } finally {
      loading.value = false
    }
  }

  async function publishPost(content, userName) {
    try {
      const { data } = await api.post('/api/forum', { content, author: userName })
      posts.value.unshift(data.post)
      return true
    } catch (e) {
      // Fallback to local
      posts.value.unshift({
        id: Date.now(),
        avatar: userName.charAt(0),
        author: userName,
        time: '刚刚',
        content,
        likes: 0,
        replies: 0,
        liked: false
      })
      return true
    }
  }

  async function toggleLike(postId, index) {
    try {
      await api.post(`/api/forum/${postId}/like`)
    } catch (e) { /* ignore */ }
    const post = posts.value[index]
    if (post) {
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
    }
  }

  async function addReply(postId, content, userName) {
    try {
      const { data } = await api.post(`/api/forum/${postId}/reply`, { content, author: userName })
      return data.reply
    } catch (e) {
      return { id: Date.now(), author: userName, content, time: '刚刚' }
    }
  }

  function getDefaultPosts() {
    return [
      { id: 1, avatar: '张', author: '张小明', time: '10分钟前', content: '今天学了流程图，感觉画流程图挺有意思的！有没有同学一起讨论一下怎么画判断框？', likes: 12, replies: 3, liked: false },
      { id: 2, avatar: '李', author: '李小红', time: '30分钟前', content: '请教一下，顺序结构和分支结构的区别是什么呀？感觉有点分不清...', likes: 8, replies: 5, liked: true },
      { id: 3, avatar: '王', author: '王大伟', time: '1小时前', content: '分享一个小技巧：画流程图的时候可以先用铅笔打草稿，这样修改起来比较方便～', likes: 23, replies: 7, liked: false },
      { id: 4, avatar: '陈', author: '陈静怡', time: '2小时前', content: '老师布置的编程作业大家都做完了吗？我卡在循环那部分了...', likes: 15, replies: 12, liked: false }
    ]
  }

  return { posts, stats, loading, fetchPosts, publishPost, toggleLike, addReply }
})
