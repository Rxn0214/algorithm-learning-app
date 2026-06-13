<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agents } from '../data/lessons'
import { useLessonStore } from '../stores/lesson'
import { api } from '../services/api'
import { generateLocalReply } from '../data/knowledge_base'

const route = useRoute()
const router = useRouter()

const agentType = ref(route.params.agentType || 'guider')
const currentAgent = ref(agents.guider)
const chatInput = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const currentLessonId = ref(Number(route.query.lesson) || null)

onMounted(() => {
  const type = route.params.agentType
  currentAgent.value = agents[type] || agents.guider
  if (!currentLessonId.value) {
    const lessonStore = useLessonStore()
    currentLessonId.value = lessonStore.currentLessonId
  }
})

// 快速检测后端是否可用（超时2秒）
let _backendAlive = null
async function checkBackend() {
  if (_backendAlive !== null) return _backendAlive
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 800)
    const res = await fetch('/api/health', { signal: ctrl.signal })
    _backendAlive = res.ok
    return _backendAlive
  } catch {
    _backendAlive = false
    return false
  }
}

async function sendMessage() {
  if (!chatInput.value.trim()) return

  const msg = chatInput.value
  chatMessages.value.push({ type: 'user', content: msg })
  chatInput.value = ''
  isTyping.value = true

  // 先检查后端是否可用
  const backendUp = await checkBackend()

  if (backendUp) {
    try {
      const { data } = await api.post('/api/chat', {
        message: msg,
        agent_type: agentType.value,
        lesson_id: currentLessonId.value,
        history: chatMessages.value.slice(-10).map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      })
      chatMessages.value.push({ type: 'agent', content: data.reply })
      isTyping.value = false
      return
    } catch (e) {
      // API 失败，降级到本地
    }
  }

  // 离线/降级模式：直接使用本地知识库
  await new Promise(r => setTimeout(r, 300)) // 模拟思考过程
  const reply = generateLocalReply(msg, agentType.value, currentLessonId.value)
  chatMessages.value.push({ type: 'agent', content: reply })
  isTyping.value = false
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="app-container" style="padding-bottom:0;">
    <div class="chat-header">
      <button class="back-btn" @click="router.back()">←</button>
      <div :class="['agent-avatar', currentAgent.avatarClass]" style="width:36px;height:36px;font-size:16px;margin-right:12px;">
        {{ currentAgent.avatar }}
      </div>
      <div>
        <div style="font-size:16px;font-weight:600;">{{ currentAgent.name }}</div>
        <div style="font-size:12px;opacity:0.8;">{{ currentAgent.role }}</div>
      </div>
    </div>

    <div class="chat-container">
      <div class="chat-messages" ref="messageList">
        <div class="message agent">
          <div class="message-text">{{ currentAgent.greeting }}</div>
        </div>
        <div v-for="(msg, index) in chatMessages" :key="index" :class="['message', msg.type]">
          <div class="message-text">{{ msg.content }}</div>
        </div>
        <div v-if="isTyping" class="message agent">
          <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <input v-model="chatInput" @keydown="handleKeydown" placeholder="输入消息...">
        <button @click="sendMessage" :disabled="!chatInput.trim()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
