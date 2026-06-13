import { defineStore } from 'pinia'
import { ref } from 'vue'

const POSTS_KEY = 'forum_posts'

function loadPosts() {
  try {
    const saved = localStorage.getItem(POSTS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return getDefaultPosts()
}

function savePosts(posts) {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)) } catch { /* ignore */ }
}

export const useForumStore = defineStore('forum', () => {
  const posts = ref(loadPosts())
  const stats = ref({ members: 45, topScore: 5680 })
  const loading = ref(false)

  function fetchPosts() {
    loading.value = true
    // 已从 localStorage 加载，模拟短暂加载状态
    setTimeout(() => { loading.value = false }, 300)
  }

  function publishPost(content, userName) {
    const newPost = {
      id: Date.now(),
      avatar: userName.charAt(0),
      author: userName,
      time: '刚刚',
      content,
      likes: 0,
      replies: 0,
      liked: false
    }
    posts.value.unshift(newPost)
    savePosts(posts.value)
    return true
  }

  function toggleLike(postId, index) {
    const post = posts.value[index]
    if (post) {
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
      savePosts(posts.value)
    }
  }

  function addReply(postId, content, userName) {
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.replies = (post.replies || 0) + 1
      // 保存回复到 localStorage
      const repliesKey = `forum_replies_${postId}`
      try {
        const replies = JSON.parse(localStorage.getItem(repliesKey) || '[]')
        replies.push({ id: Date.now(), author: userName, content, time: '刚刚' })
        localStorage.setItem(repliesKey, JSON.stringify(replies))
      } catch { /* ignore */ }
      savePosts(posts.value)
    }
    return { id: Date.now(), author: userName, content, time: '刚刚' }
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
