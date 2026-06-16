import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { lessons as lessonData } from '../data/lessons'

const PROGRESS_KEY = 'lesson_progress'

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  } catch { return {} }
}

function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
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
    const current = savedProgress.value[key] || { started: true, completed: false, progress: 0 }
    current.progress = Math.max(current.progress || 0, pct)
    current.started = true
    if (pct >= 100) current.completed = true
    savedProgress.value[key] = current
    saveProgress(savedProgress.value)
  }

  function submitAnswer(questionIndex, answer, lessonId = null) {
    // 支持通过 lessonId 直接查找课时（LessonDetail 用），也兼容 currentLesson
    const id = lessonId || currentLessonId.value
    if (!id) return null
    const lesson = lessonData.find(l => l.id === id)
    if (!lesson || !lesson.questions[questionIndex]) return null

    const question = lesson.questions[questionIndex]
    const correct = question.answer !== undefined
      ? answer === question.answer
      : null

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
      // 保存错题到 localStorage
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

  return {
    lessons, currentLessonId, currentLesson, wrongAnswers,
    completedLessons, totalLessons, progressPercent,
    studyDays, achievements,
    setCurrentLesson: startLesson, startLesson,
    markCompleted, submitAnswer, updateLessonProgress,
    fetchProgress, updateProgress, fetchWrongAnswers
  }
})
