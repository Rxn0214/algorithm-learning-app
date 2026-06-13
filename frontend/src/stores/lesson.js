import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { lessons as lessonData } from '../data/lessons'
import { api } from '../services/api'

export const useLessonStore = defineStore('lesson', () => {
  const lessons = ref(lessonData)
  const currentLessonId = ref(null)
  const progress = ref({})
  const wrongAnswers = ref([])

  const currentLesson = computed(() =>
    lessons.value.find(l => l.id === currentLessonId.value) || null
  )

  const completedLessons = computed(() =>
    lessons.value.filter(l => l.status === 'status-completed').length
  )

  const totalLessons = computed(() => lessons.value.length)

  const progressPercent = computed(() =>
    Math.round((completedLessons.value / totalLessons.value) * 100)
  )

  function setCurrentLesson(id) {
    currentLessonId.value = id
  }

  function selectAnswer(questionIndex, optionIndex) {
    // handled in component with reactive state
  }

  function submitAnswer(questionIndex, answer) {
    const lesson = currentLesson.value
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
    }

    return { correct, correctAnswer: question.answer, explanation: question.explanation }
  }

  async function fetchProgress() {
    try {
      const { data } = await api.get('/api/progress')
      progress.value = data
    } catch (e) {
      console.warn('Failed to fetch progress', e)
    }
  }

  async function updateProgress(lessonId, pct) {
    try {
      await api.put(`/api/progress/${lessonId}`, { progress: pct })
    } catch (e) {
      console.warn('Failed to update progress', e)
    }
  }

  async function fetchWrongAnswers() {
    try {
      const { data } = await api.get('/api/wrong-answers')
      wrongAnswers.value = data
    } catch (e) {
      console.warn('Failed to fetch wrong answers', e)
    }
  }

  return {
    lessons, currentLessonId, currentLesson, progress, wrongAnswers,
    completedLessons, totalLessons, progressPercent,
    setCurrentLesson, selectAnswer, submitAnswer,
    fetchProgress, updateProgress, fetchWrongAnswers
  }
})
