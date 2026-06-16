import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { lessons as lessonData } from '../data/lessons'

const PROGRESS_KEY = 'lesson_progress'
const STATS_KEY = 'answer_stats'

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  } catch { return {} }
}

function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{"total":0,"correct":0}')
  } catch { return { total: 0, correct: 0 } }
}

function saveStats(data) {
  localStorage.setItem(STATS_KEY, JSON.stringify(data))
}

/**
 * 灵活匹配填空题答案
 * 支持：忽略大小写、忽略多余空格、按关键词匹配
 */
export function checkFillAnswer(userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return false

  const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  const ua = normalize(userAnswer)
  const ca = normalize(correctAnswer)

  // 精确匹配
  if (ua === ca) return true

  // 关键词匹配：正确答案中的每个关键词都出现在用户答案中
  const keywords = ca.split(/[\s,，、]+/).filter(k => k.length > 0)
  if (keywords.length >= 2) {
    const allFound = keywords.every(kw => ua.includes(kw))
    if (allFound) return true
  }

  // 去掉标点后再试一次精确匹配
  const stripPunct = (s) => s.replace(/[，,、。！？；：""''【】《》（）()\s]+/g, '')
  if (stripPunct(ua) === stripPunct(ca)) return true

  return false
}

export const useLessonStore = defineStore('lesson', () => {
  // 从 localStorage 加载真实进度
  const savedProgress = ref(loadProgress())

  // 用真实进度覆盖课时状态
  const lessons = computed(() =>
    lessonData.map(l => {
      const p = savedProgress.value[String(l.id)]
      if (p) {
        return {
          ...l,
          status: p.completed ? 'status-completed' : p.started ? 'status-progress' : 'status-pending',
          statusText: p.completed ? '已完成' : p.started ? '进行中' : '未开始'
        }
      }
      // 新用户所有课时默认"未开始"
      return { ...l, status: 'status-pending', statusText: '未开始' }
    })
  )

  const currentLessonId = ref(null)
  const wrongAnswers = ref([])
  const studyDays = ref(0)
  const achievements = ref(0)

  // 答题统计（持久化）
  const stats = ref(loadStats())
  const totalAttempts = computed(() => stats.value.total || 0)
  const correctAttempts = computed(() => stats.value.correct || 0)

  const currentLesson = computed(() =>
    lessons.value.find(l => l.id === currentLessonId.value) || null
  )

  const completedLessons = computed(() =>
    Object.values(savedProgress.value).filter(p => p.completed).length
  )

  const totalLessons = computed(() => lessonData.length)

  const progressPercent = computed(() => {
    const total = totalLessons.value
    if (total === 0) return 0
    return Math.round((completedLessons.value / total) * 100)
  })

  function startLesson(id) {
    currentLessonId.value = id
    const key = String(id)
    if (!savedProgress.value[key]) {
      savedProgress.value[key] = { started: true, completed: false, progress: 0 }
      saveProgress(savedProgress.value)
    }
  }

  function markCompleted(id) {
    const key = String(id)
    savedProgress.value[key] = { started: true, completed: true, progress: 100 }
    saveProgress(savedProgress.value)
  }

  function updateLessonProgress(id, pct) {
    const key = String(id)
    const prev = savedProgress.value[key] || { started: true, completed: false, progress: 0 }
    // 创建新对象引用触发 Vue ref 响应
    const current = {
      started: true,
      completed: pct >= 100 || prev.completed,
      progress: Math.max(prev.progress || 0, pct)
    }
    // 替换整个 value 对象确保响应式更新
    savedProgress.value = { ...savedProgress.value, [key]: current }
    saveProgress(savedProgress.value)
  }

  function submitAnswer(questionIndex, answer, lessonId = null) {
    const id = lessonId || currentLessonId.value
    if (!id) return null
    const lesson = lessonData.find(l => l.id === id)
    if (!lesson || !lesson.questions[questionIndex]) return null

    const question = lesson.questions[questionIndex]
    let correct = null

    if (question.answer !== undefined) {
      if (question.type === '选择题') {
        // 选择题：精确比较索引
        correct = answer === question.answer
      } else if (question.type === '填空题') {
        // 填空题：灵活匹配
        correct = checkFillAnswer(answer, question.answer)
      } else {
        // 编程题/分析题：不自动判对错，返回 null
        correct = null
      }
    }

    // 记录答题统计
    stats.value.total = (stats.value.total || 0) + 1
    if (correct === true) {
      stats.value.correct = (stats.value.correct || 0) + 1
    }
    saveStats(stats.value)

    if (correct === false) {
      wrongAnswers.value.push({
        id: Date.now(),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        question: question.text,
        userAnswer: answer,
        correctAnswer: question.answer,
        type: question.type,
        createdAt: new Date().toISOString()
      })
      try {
        const saved = JSON.parse(localStorage.getItem('wrong_answers') || '[]')
        saved.push(wrongAnswers.value[wrongAnswers.value.length - 1])
        localStorage.setItem('wrong_answers', JSON.stringify(saved))
      } catch { /* ignore */ }
    }

    return { correct, correctAnswer: question.answer, explanation: question.explanation }
  }

  function fetchProgress() {
    // 离线模式：进度已从 localStorage 加载
  }

  function updateProgress(lessonId, pct) {
    updateLessonProgress(lessonId, pct)
  }

  function fetchWrongAnswers() {
    try {
      const saved = JSON.parse(localStorage.getItem('wrong_answers') || '[]')
      wrongAnswers.value = saved
    } catch { wrongAnswers.value = [] }
  }

  function fetchStats() {
    stats.value = loadStats()
  }

  return {
    lessons, currentLessonId, currentLesson, wrongAnswers,
    savedProgress, completedLessons, totalLessons, progressPercent,
    studyDays, achievements,
    totalAttempts, correctAttempts, stats,
    setCurrentLesson: startLesson, startLesson,
    markCompleted, submitAnswer, updateLessonProgress,
    fetchProgress, updateProgress, fetchWrongAnswers, fetchStats
  }
})
