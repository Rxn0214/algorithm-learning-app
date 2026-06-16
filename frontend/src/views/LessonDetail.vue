<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLessonStore } from '../stores/lesson'
import { lessons } from '../data/lessons'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const lessonStore = useLessonStore()

const selectedAnswers = ref({})
const textAnswers = ref({})       // 非选择题的文本答案
const feedback = ref({})
const lessonProgress = ref(0)

const currentLesson = computed(() => {
  const id = Number(route.params.id)
  return lessons.find(l => l.id === id) || lessons[0]
})

// 进入课时同步进度
watch(() => route.params.id, (newId) => {
  selectedAnswers.value = {}
  textAnswers.value = {}
  feedback.value = {}
  // 从 localStorage 恢复进度
  const saved = JSON.parse(localStorage.getItem('lesson_progress') || '{}')
  const lp = saved[String(newId)]
  lessonProgress.value = lp ? (lp.progress || 0) : 0
}, { immediate: true })

function selectAnswer(qIndex, optIndex) {
  if (feedback.value[qIndex]) return
  selectedAnswers.value[qIndex] = optIndex
}

function submitAnswer(qIndex) {
  const q = currentLesson.value.questions[qIndex]
  const lessonId = currentLesson.value.id

  if (q.type !== '选择题') {
    // 非选择题：获取文本输入
    const userAnswer = (textAnswers.value[qIndex] || '').trim()

    if (!userAnswer) return // 没输入不提交

    // 提交答案并获取判断结果
    const result = lessonStore.submitAnswer(qIndex, userAnswer, lessonId)

    if (q.type === '填空题') {
      // 填空题：自动判断对错
      feedback.value[qIndex] = {
        show: true,
        correct: result?.correct === true,
        correctAnswer: q.answer,
        explanation: q.explanation || (result?.correct ? '回答正确！' : '答案有误，请对照正确答案。')
      }
      if (result?.correct) {
        lessonProgress.value = Math.min(100, lessonProgress.value + 15)
      }
    } else {
      // 编程题/分析题：不自动判对错，显示参考答案
      feedback.value[qIndex] = {
        show: true,
        correct: null,
        correctAnswer: q.answer,
        explanation: q.explanation || '请对照参考答案检查你的回答。'
      }
      lessonProgress.value = Math.min(100, lessonProgress.value + 15)
    }
    lessonStore.updateLessonProgress(lessonId, lessonProgress.value)
    return
  }

  // 选择题
  const selected = selectedAnswers.value[qIndex]
  if (selected === undefined) return

  const correct = selected === q.answer
  feedback.value[qIndex] = {
    show: true,
    correct,
    selected,
    correctAnswer: q.answer,
    explanation: q.explanation
  }

  if (correct) {
    lessonProgress.value = Math.min(100, lessonProgress.value + 15)
  } else {
    // 记录错题：传递选中的选项文本而非索引
    const selectedText = q.options[selected] || String(selected)
    lessonStore.submitAnswer(qIndex, selectedText, lessonId)
  }
  lessonStore.updateLessonProgress(lessonId, lessonProgress.value)
}

function startChat(agentType) {
  router.push(`/chat/${agentType}?lesson=${currentLesson.value.id}`)
}
</script>

<template>
  <div class="app-container">
    <div class="header" style="padding-bottom: 20px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <button @click="router.back()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;margin-right:12px;padding:4px;">←</button>
        <div>
          <h1 style="margin:0;">课时学习</h1>
          <p style="margin:0;">{{ currentLesson.desc }}</p>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="card">
        <div class="lesson-icon" :style="{ background: currentLesson.bg, color: 'white', marginBottom: '12px' }">
          {{ currentLesson.icon }}
        </div>
        <h2 class="lesson-title" style="font-size: 18px;">{{ currentLesson.title }}</h2>
        <p class="lesson-desc" style="margin-bottom: 16px;">{{ currentLesson.desc }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: lessonProgress + '%' }"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span style="font-size: 13px; color: #666;">学习进度</span>
          <span style="font-size: 13px; font-weight: 600; color: var(--primary-color);">{{ lessonProgress }}%</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">知识点</div>
        <div v-for="(point, index) in currentLesson.knowledgePoints" :key="index" class="knowledge-point">
          <div class="knowledge-title">{{ point.title }}</div>
          <div class="knowledge-content">{{ point.content }}</div>
        </div>
      </div>

      <!-- 引航：学习引导（知识点后面、习题前面） -->
      <div class="card">
        <div class="card-title">📖 学习引导</div>
        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">开始做练习前，先让引航帮你梳理一下学习思路？</p>
        <div class="agent-card" style="padding: 12px;margin-bottom:0;" @click="startChat('guider')">
          <div class="agent-avatar agent-guider" style="width:40px;height:40px;font-size:18px;margin-right:12px;">引</div>
          <div class="agent-info">
            <div class="agent-name" style="font-size: 14px;">引航</div>
            <div class="agent-desc" style="font-size: 11px;">学习引导者 · 帮你理解知识点、规划学习</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div class="card">
        <div class="card-title">练习题</div>
        <div v-for="(q, qIndex) in currentLesson.questions" :key="qIndex" class="question-item">
          <div class="question-header">
            <span :class="['question-type', q.typeClass]">{{ q.type }}</span>
            <span style="font-size: 12px; color: #999;">第{{ qIndex + 1 }}题</span>
          </div>
          <div class="question-text">{{ q.text }}</div>

          <template v-if="q.type === '选择题'">
            <div v-for="(opt, optIndex) in q.options" :key="optIndex"
                 :class="['option-item',
                   selectedAnswers[qIndex] === optIndex ? 'selected' : '',
                   feedback[qIndex]?.show && optIndex === q.answer ? 'correct' : '',
                   feedback[qIndex]?.show && optIndex === selectedAnswers[qIndex] && optIndex !== q.answer ? 'wrong' : ''
                 ]"
                 @click="selectAnswer(qIndex, optIndex)">
              <span class="option-letter">{{ String.fromCharCode(65 + optIndex) }}</span>
              <span class="option-text">{{ opt }}</span>
            </div>
            <button class="btn-primary" style="width:100%;margin-top:8px;" @click="submitAnswer(qIndex)"
                    :disabled="selectedAnswers[qIndex] === undefined && !feedback[qIndex]?.show">
              {{ feedback[qIndex]?.show ? '已提交' : '提交答案' }}
            </button>
            <div v-if="feedback[qIndex]?.show" :class="['answer-feedback', feedback[qIndex].correct ? 'correct' : 'wrong']">
              <strong>{{ feedback[qIndex].correct ? '✓ 回答正确！' : '✗ 回答错误' }}</strong><br>
              {{ feedback[qIndex].explanation }}
            </div>
          </template>

          <template v-else>
            <textarea v-model="textAnswers[qIndex]" class="modal-textarea"
              :placeholder="q.type === '填空题' ? '请输入答案' : q.type === '编程题' ? '请输入Python代码' : '请输入分析过程'"
              style="height:80px;margin-bottom:8px;"
              :disabled="feedback[qIndex]?.show"></textarea>
            <button class="btn-primary" style="width:100%;" @click="submitAnswer(qIndex)"
                    :disabled="!textAnswers[qIndex]?.trim() || feedback[qIndex]?.show">
              {{ feedback[qIndex]?.show ? '已提交' : '提交答案' }}
            </button>

            <!-- 填空题：显示对错 -->
            <div v-if="feedback[qIndex]?.show && q.type === '填空题'"
                 :class="['answer-feedback', feedback[qIndex].correct ? 'correct' : 'wrong']">
              <strong>{{ feedback[qIndex].correct ? '✓ 回答正确！' : '✗ 回答有误' }}</strong><br>
              <span v-if="!feedback[qIndex].correct">正确答案：{{ feedback[qIndex].correctAnswer }}<br></span>
              {{ feedback[qIndex].explanation }}
            </div>

            <!-- 编程题/分析题：显示参考答案 -->
            <div v-if="feedback[qIndex]?.show && q.type !== '填空题'"
                 :class="['answer-feedback', 'info']"
                 style="background:#E8F4FD;color:var(--primary-color);margin-top:8px;">
              <strong>参考答案：</strong><br>
              {{ feedback[qIndex].correctAnswer }}<br>
              <span style="font-size:12px;margin-top:4px;display:block;">{{ feedback[qIndex].explanation }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 辅智：答疑辅导（练习题后面） -->
      <div class="card">
        <div class="card-title">💡 遇到困难？</div>
        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">习题不会做？让辅智帮你分析答疑</p>
        <div class="agent-card" style="padding: 12px;margin-bottom:0;" @click="startChat('tutor')">
          <div class="agent-avatar agent-tutor" style="width:40px;height:40px;font-size:18px;margin-right:12px;">辅</div>
          <div class="agent-info">
            <div class="agent-name" style="font-size: 14px;">辅智</div>
            <div class="agent-desc" style="font-size: 11px;">答疑辅导者 · 解答疑问、讲解题目</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>
