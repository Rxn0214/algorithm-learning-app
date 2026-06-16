/**
 * 聊天服务 — 调用后端 AI API，离线时回退到本地知识库
 */
import { api } from './api'
import { generateLocalReply } from '../data/knowledge_base'

// 聊天专用 axios 实例（超时更长，AI 响应需要时间）
const chatApi = api

/**
 * 发送消息到 AI 智能体
 * @param {string} message - 用户消息
 * @param {string} agentType - 'guider' | 'tutor'
 * @param {number|null} lessonId - 当前课时 ID
 * @param {Array} history - 对话历史 [{role, content}, ...]
 * @returns {Promise<string>} AI 回复内容
 */
export async function sendChatMessage(message, agentType = 'tutor', lessonId = null, history = []) {
  // 构建请求体
  const payload = {
    message: message.trim(),
    agent_type: agentType,
    lesson_id: lessonId,
    history: history.slice(-20) // 最近10轮对话
  }

  try {
    const response = await chatApi.post('/api/chat', payload, {
      timeout: 30000 // AI 对话 30s 超时
    })

    if (response.data && response.data.reply) {
      return response.data.reply
    }

    throw new Error('Empty reply from server')
  } catch (error) {
    // API 调用失败，回退到本地知识库
    console.warn('AI API unavailable, falling back to local knowledge base:', error.message)

    // 等待一小段延迟，模拟思考
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))

    const fallbackReply = generateLocalReply(message, agentType, lessonId)

    if (fallbackReply) {
      return '📡 当前为离线模式，使用本地知识库回答：\n\n' + fallbackReply
    }

    // 极端情况：本地知识库也没有匹配
    return agentType === 'guider'
      ? '📡 离线模式中～关于「' + message + '」，建议你先回顾课本对应章节，然后试着用自己的话解释一遍。加油哦！💪'
      : '📡 离线模式中～关于「' + message + '」，建议你查看对应课时知识点。告诉我你学到哪个课时了，我帮你找相关内容～'
  }
}
