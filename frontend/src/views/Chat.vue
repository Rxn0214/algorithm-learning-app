<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { agents } from '../data/lessons'
import { useLessonStore } from '../stores/lesson'
import { sendChatMessage } from '../services/chat'

const route = useRoute()
const router = useRouter()

const agentType = ref(route.params.agentType || 'guider')
const currentAgent = ref(agents.guider)
const chatInput = ref('')
const chatMessages = ref([])        // 显示用：[{type: 'user'|'agent', content}]
const chatHistory = ref([])         // API 用：[{role: 'user'|'assistant', content}]
const isTyping = ref(false)
const currentLessonId = ref(Number(route.query.lesson) || null)
const messageList = ref(null)
const apiAvailable = ref(true)      // 追踪 API 是否可用

onMounted(async () => {
  const type = route.params.agentType
  currentAgent.value = agents[type] || agents.guider
  if (!currentLessonId.value) {
    const lessonStore = useLessonStore()
    currentLessonId.value = lessonStore.currentLessonId
  }

  // 引航：主动发起第一次引导提问
  if (type === 'guider') {
    await startGuiding()
  }
})

// 引航首次主动提问
async function startGuiding() {
  isTyping.value = true
  const reply = await sendChatMessage(
    '开始引导学习',
    'guider',
    currentLessonId.value,
    []
  )
  if (reply) {
    chatMessages.value.push({ type: 'agent', content: reply })
    chatHistory.value.push({ role: 'assistant', content: reply })
  }
  isTyping.value = false
  await nextTick()
  scrollToBottom()
}

async function sendMessage() {
  const msg = chatInput.value.trim()
  if (!msg || isTyping.value) return

  // 添加用户消息到显示区和历史
  chatMessages.value.push({ type: 'user', content: msg })
  chatHistory.value.push({ role: 'user', content: msg })
  chatInput.value = ''
  isTyping.value = true

  await nextTick()
  scrollToBottom()

  // 调用 AI API（带完整对话历史）
  const reply = await sendChatMessage(
    msg,
    agentType.value,
    currentLessonId.value,
    chatHistory.value.slice(0, -1) // 不包含刚发的这条（history 应为当前消息之前的历史）
  )

  // 检查是否离线回退
  if (reply.startsWith('📡')) {
    apiAvailable.value = false
  }

  // 添加 AI 回复
  chatMessages.value.push({ type: 'agent', content: reply })
  chatHistory.value.push({ role: 'assistant', content: reply })

  isTyping.value = false

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
    <!-- 顶部栏 -->
    <div class="chat-header">
      <button class="back-btn" @click="router.back()">←</button>
      <div :class="['agent-avatar', currentAgent.avatarClass]" style="width:36px;height:36px;font-size:16px;margin-right:12px;">
        {{ currentAgent.avatar }}
      </div>
      <div>
        <div style="font-size:16px;font-weight:600;">{{ currentAgent.name }}</div>
        <div style="font-size:12px;opacity:0.8;">
          {{ currentAgent.role }}
          <span v-if="!apiAvailable" style="color:#FFD166;margin-left:6px;">📡 离线模式</span>
        </div>
      </div>
    </div>

    <!-- 对话区域 -->
    <div class="chat-container">
      <div class="chat-messages" ref="messageList">
        <!-- 辅智的系统欢迎消息（引航已有主动引导，不显示） -->
        <div v-if="agentType !== 'guider'" class="message agent">
          <div class="message-text">{{ currentAgent.greeting }}</div>
        </div>

        <!-- 对话消息 -->
        <div v-for="(msg, index) in chatMessages" :key="index" :class="['message', msg.type]">
          <div class="message-text">{{ msg.content }}</div>
        </div>

        <!-- AI 思考中动画 -->
        <div v-if="isTyping" class="message agent">
          <div class="message-text" style="display:flex;align-items:center;gap:6px;">
            <span>思考中</span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <input
          v-model="chatInput"
          @keydown="handleKeydown"
          :placeholder="isTyping ? 'AI 正在思考...' : '输入消息，Enter 发送...'"
          :disabled="isTyping"
        >
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

/* 思考中动画点 */
.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-6px); }
}
</style>
