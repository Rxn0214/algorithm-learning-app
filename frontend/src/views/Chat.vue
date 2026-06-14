<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agents } from '../data/lessons'
import { useLessonStore } from '../stores/lesson'
import { generateLocalReply } from '../data/knowledge_base'

const route = useRoute()
const router = useRouter()

const agentType = ref(route.params.agentType || 'guider')
const currentAgent = ref(agents.guider)
const chatInput = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const currentLessonId = ref(Number(route.query.lesson) || null)
const messageList = ref(null)

onMounted(() => {
  const type = route.params.agentType
  currentAgent.value = agents[type] || agents.guider
  if (!currentLessonId.value) {
    const lessonStore = useLessonStore()
    currentLessonId.value = lessonStore.currentLessonId
  }
})

async function sendMessage() {
  if (!chatInput.value.trim() || isTyping.value) return

  const msg = chatInput.value.trim()
  chatMessages.value.push({ type: 'user', content: msg })
  chatInput.value = ''
  isTyping.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 直接使用本地知识库生成回复（APK离线模式）
  try {
    // 模拟思考延迟，让用户看到typing状态
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))

    const reply = generateLocalReply(msg, agentType.value, currentLessonId.value)

    if (reply && reply.trim()) {
      chatMessages.value.push({ type: 'agent', content: reply })
    } else {
      // 备用回复
      const fallbackReply = agentType.value === 'guider'
        ? `好问题！关于「${msg}」，建议你先看看对应课时的知识点。需要我帮你找找相关内容吗？`
        : `让我来分析「${msg}」这个问题。你能告诉我具体是哪个课时遇到困难了吗？`
      chatMessages.value.push({ type: 'agent', content: fallbackReply })
    }
  } catch (e) {
    console.error('Chat error:', e)
    chatMessages.value.push({
      type: 'agent',
      content: '抱歉，处理问题时遇到了一些困难。请稍后再试试～'
    })
  }

  isTyping.value = false

  // 滚动到底部
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
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
        <input v-model="chatInput" @keydown="handleKeydown" placeholder="输入消息..." :disabled="isTyping">
        <button @click="sendMessage" :disabled="!chatInput.trim() || isTyping">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-messages {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
}
</style>