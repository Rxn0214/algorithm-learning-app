<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { useForumStore } from '../stores/forum'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const user = useUserStore()
const forum = useForumStore()

const showPostModal = ref(false)
const newPostContent = ref('')
const replyTo = ref(null)
const replyContent = ref('')

// 直接使用forum.posts，不需要再次fetchPosts
const posts = computed(() => forum.posts)

function publishPost() {
  if (!newPostContent.value.trim()) return
  forum.publishPost(newPostContent.value.trim(), user.currentUser?.name || '匿名用户')
  newPostContent.value = ''
  showPostModal.value = false
}

function toggleLike(index) {
  if (index >= 0 && index < forum.posts.length) {
    forum.toggleLike(forum.posts[index].id, index)
  }
}

function showReplyInput(index) {
  replyTo.value = replyTo.value === index ? null : index
  replyContent.value = ''
}

function submitReply(index) {
  if (!replyContent.value.trim()) return
  if (index >= 0 && index < forum.posts.length) {
    forum.addReply(forum.posts[index].id, replyContent.value.trim(), user.currentUser?.name || '匿名用户')
    replyContent.value = ''
    replyTo.value = null
  }
}

function closeModal() {
  showPostModal.value = false
  newPostContent.value = ''
}
</script>

<template>
  <div class="app-container">
    <AppHeader title="班级学习圈" subtitle="与同学们一起交流学习" />

    <div class="content">
      <div class="card">
        <div class="card-title">本周之星</div>
        <div style="display: flex; align-items: center;">
          <div class="post-avatar" style="width: 56px; height: 56px; font-size: 20px;">榜</div>
          <div style="flex: 1; margin-left: 16px;">
            <div style="font-size: 16px; font-weight: 600;">学习达人</div>
            <div style="font-size: 13px; color: #999;">累计积分: {{ forum.stats.topScore }}</div>
          </div>
          <div style="background: linear-gradient(135deg, var(--warning-color) 0%, #FF8C00 100%); color: white; padding: 8px 16px; border-radius: 12px; font-size: 14px; font-weight: 600;">
            🏆 第一名
          </div>
        </div>
      </div>

      <!-- 使用computed的posts，避免重复fetch -->
      <div v-for="(post, index) in posts" :key="post.id" class="post-item">
        <div class="post-header">
          <div class="post-avatar">{{ post.avatar }}</div>
          <div>
            <div class="post-author">{{ post.author }}</div>
            <div class="post-time">{{ post.time }}</div>
          </div>
        </div>
        <div class="post-content">{{ post.content }}</div>
        <div class="post-interaction">
          <div :class="['interaction-item', post.liked ? 'active' : '']" @click="toggleLike(index)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{{ post.likes }}</span>
          </div>
          <div class="interaction-item" @click="showReplyInput(index)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ post.replies }}</span>
          </div>
        </div>

        <div v-if="replyTo === index" style="margin-top: 12px;">
          <div class="chat-input" style="padding: 0; border: none;">
            <input v-model="replyContent" placeholder="写下你的回复..." style="flex:1;padding:10px 16px;border:1px solid #E0E0E0;border-radius:20px;font-size:14px;outline:none;">
            <button @click="submitReply(index)" style="width:36px;height:36px;border-radius:50%;background:var(--primary-color);border:none;color:white;margin-left:8px;cursor:pointer;">→</button>
          </div>
        </div>
      </div>

      <div v-if="posts.length === 0" class="empty-state">
        <span class="empty-icon">💬</span>
        <span class="empty-text">还没有留言，快来发表第一条吧！</span>
      </div>
    </div>

    <button class="fab-button" @click="showPostModal = true">+</button>

    <div v-if="showPostModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-title">发布新留言</div>
        <textarea class="modal-textarea" v-model="newPostContent" placeholder="分享你的学习心得、问题或想法..."></textarea>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="publishPost" :disabled="!newPostContent.trim()">发布</button>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>