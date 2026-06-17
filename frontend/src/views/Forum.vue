<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { useForumStore } from '../stores/forum'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const user = useUserStore()
const forum = useForumStore()

const showPostModal = ref(false)
const newPostContent = ref('')
const replyToId = ref(null)
const replyContent = ref('')
const searchInput = ref('')
const activeSort = ref('latest')
const showSearchBar = ref(false)
const toastMsg = ref('')
const toastVisible = ref(false)

// 页面加载
onMounted(async () => {
  await forum.init()
})

// 排序切换
watch(activeSort, async (val) => {
  forum.setSort(val)
  await forum.loadPosts(val, searchInput.value)
})

// 搜索
async function doSearch() {
  forum.setSearch(searchInput.value)
  await forum.loadPosts(activeSort.value, searchInput.value)
}

function clearSearch() {
  searchInput.value = ''
  doSearch()
}

// 发布帖子
async function publishPost() {
  if (!newPostContent.value.trim()) return
  const name = user.currentUser?.name || '匿名用户'
  const result = await forum.publishPost(newPostContent.value.trim(), name)
  newPostContent.value = ''
  showPostModal.value = false
  showToast(result.offline ? '已离线保存' : `发布成功！+${result.pointsEarned || 5}积分`)
}

// 点赞
function toggleLike(post, index) {
  forum.toggleLike(post.id, index)
}

// 回复
function showReplyInput(postId) {
  replyToId.value = replyToId.value === postId ? null : postId
  replyContent.value = ''
}

async function submitReply(postId) {
  if (!replyContent.value.trim()) return
  const name = user.currentUser?.name || '匿名用户'
  const result = await forum.addReply(postId, replyContent.value.trim(), name)
  replyContent.value = ''
  replyToId.value = null
  const hasId = result && result.id
  if (result && result.id) {
    showToast('回复成功！')
  }
}

function closeModal() {
  showPostModal.value = false
  newPostContent.value = ''
}

function showToast(msg) {
  toastMsg.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 2500)
}

// 格式化时间（用于本周之星）
function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 等级颜色
function levelColor(level) {
  const map = {
    '年级楷模': '#FF6B6B',
    '班级学霸': '#FFD93D',
    '学习达人': '#6BCB77',
    '积极分子': '#4D96FF',
    '勤奋学子': '#9B59B6',
    '新手学员': '#95A5A6'
  }
  return map[level] || '#95A5A6'
}
</script>

<template>
  <div class="app-container">
    <AppHeader title="班级学习圈" subtitle="与同学们一起交流学习" />

    <div class="content">
      <!-- 本周之星 -->
      <div class="card star-card">
        <div class="card-title">🏆 本周之星</div>
        <div v-if="forum.stats.weeklyStars && forum.stats.weeklyStars.length > 0" class="star-list">
          <div v-for="(star, i) in forum.stats.weeklyStars.slice(0, 3)" :key="i" class="star-item">
            <div class="star-avatar" :style="{ background: ['#FFD700','#C0C0C0','#CD7F32'][i] || '#95A5A6' }">
              {{ star.author ? star.author[0] : '?' }}
            </div>
            <div class="star-info">
              <div class="star-name">{{ star.author }}</div>
              <div class="star-points">{{ star.points }}积分</div>
            </div>
            <div class="star-rank">{{ ['🥇','🥈','🥉'][i] }}</div>
          </div>
        </div>
        <div v-else style="display:flex;align-items:center;padding:12px 0;">
          <div class="post-avatar" style="width:48px;height:48px;font-size:18px;">榜</div>
          <div style="flex:1;margin-left:12px;">
            <div style="font-size:15px;font-weight:600;">{{ forum.stats.members || 45 }}位同学</div>
            <div style="font-size:12px;color:#999;">快来发帖成为本周之星吧！</div>
          </div>
        </div>
      </div>

      <!-- 搜索和排序 -->
      <div class="toolbar">
        <div class="sort-tabs">
          <button :class="['sort-btn', activeSort === 'latest' ? 'active' : '']" @click="activeSort = 'latest'">
            🕐 最新
          </button>
          <button :class="['sort-btn', activeSort === 'hot' ? 'active' : '']" @click="activeSort = 'hot'">
            🔥 最热
          </button>
        </div>
        <button class="search-toggle" @click="showSearchBar = !showSearchBar">
          🔍
        </button>
      </div>

      <!-- 搜索栏 -->
      <div v-if="showSearchBar" class="search-bar">
        <input
          v-model="searchInput"
          placeholder="搜索留言内容..."
          class="search-input"
          @keyup.enter="doSearch"
        />
        <button class="search-btn" @click="doSearch">搜索</button>
        <button v-if="searchInput" class="search-btn clear" @click="clearSearch">✕</button>
      </div>

      <!-- 加载中 -->
      <div v-if="forum.loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 帖子列表 -->
      <div v-else v-for="(post, index) in forum.posts" :key="post.id" class="post-item">
        <div class="post-header">
          <div class="post-avatar">{{ post.avatar }}</div>
          <div>
            <div class="post-author">{{ post.author }}</div>
            <div class="post-time">{{ post.time }}</div>
          </div>
        </div>
        <div class="post-content">{{ post.content }}</div>
        <div class="post-interaction">
          <div :class="['interaction-item', post.liked ? 'active' : '']" @click="toggleLike(post, index)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{{ post.likes }}</span>
          </div>
          <div class="interaction-item" @click="showReplyInput(post.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ post.replies }}</span>
          </div>
        </div>

        <!-- 回复输入 -->
        <div v-if="replyToId === post.id" class="reply-box">
          <input
            v-model="replyContent"
            placeholder="写下你的回复..."
            class="reply-input"
            @keyup.enter="submitReply(post.id)"
          />
          <button class="reply-btn" @click="submitReply(post.id)">发送</button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!forum.loading && forum.posts.length === 0" class="empty-state">
        <span class="empty-icon">💬</span>
        <span class="empty-text">还没有留言，快来发表第一条吧！</span>
      </div>

      <!-- 离线提示 -->
      <div v-if="forum.isOffline" class="offline-banner">
        ⚠️ 离线模式 — 数据仅保存在本地
      </div>
    </div>

    <!-- 发布按钮 -->
    <button class="fab-button" @click="showPostModal = true">
      <span>+</span>
    </button>

    <!-- 发布弹窗 -->
    <div v-if="showPostModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-title">发布新留言</div>
        <textarea
          class="modal-textarea"
          v-model="newPostContent"
          placeholder="分享你的学习心得、问题或想法..."
          maxlength="500"
        ></textarea>
        <div class="char-count">{{ newPostContent.length }}/500</div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="publishPost" :disabled="!newPostContent.trim()">发布 (+5积分)</button>
        </div>
        <div class="post-rules">
          📌 发布心得+5积分 | 回复+3积分 | 获赞+2积分（被赞者）
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastVisible" class="toast">{{ toastMsg }}</div>

    <NavBar />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #F0F9FF;
  padding-bottom: 80px;
}

.content {
  padding: 0 16px;
}

/* ===== 本周之星 ===== */
.star-card {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%);
  border: 1px solid #FFE082;
}

.star-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.star-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.star-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.star-info {
  flex: 1;
  margin-left: 12px;
}

.star-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.star-points {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.star-rank {
  font-size: 24px;
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}

.sort-tabs {
  display: flex;
  gap: 8px;
}

.sort-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: 1px solid #E0E0E0;
  background: white;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.sort-btn.active {
  background: var(--primary-color, #00B4D8);
  color: white;
  border-color: var(--primary-color, #00B4D8);
}

.search-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #E0E0E0;
  background: white;
  font-size: 16px;
  cursor: pointer;
}

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: white;
}

.search-input:focus {
  border-color: var(--primary-color, #00B4D8);
}

.search-btn {
  padding: 10px 16px;
  border-radius: 20px;
  border: none;
  background: var(--primary-color, #00B4D8);
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.search-btn.clear {
  background: #999;
}

/* ===== 加载 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  gap: 12px;
  color: #999;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E0E0E0;
  border-top-color: var(--primary-color, #00B4D8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 回复 ===== */
.reply-box {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.reply-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background: #F8F9FA;
}

.reply-input:focus {
  border-color: var(--primary-color, #00B4D8);
}

.reply-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  background: var(--primary-color, #00B4D8);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* ===== 字数统计 ===== */
.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  margin-bottom: 4px;
}

/* ===== 积分规则 ===== */
.post-rules {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}

/* ===== 离线横幅 ===== */
.offline-banner {
  text-align: center;
  padding: 10px 16px;
  background: #FFF3CD;
  color: #856404;
  border-radius: 12px;
  font-size: 13px;
  margin-top: 16px;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}
</style>
