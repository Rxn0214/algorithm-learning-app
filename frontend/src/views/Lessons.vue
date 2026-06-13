<script setup>
import { useRouter } from 'vue-router'
import { useLessonStore } from '../stores/lesson'
import { computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const lesson = useLessonStore()

const completedLessons = computed(() => lesson.lessons.filter(l => l.status === 'status-completed').length)

function goToLessonDetail(index) {
  lesson.setCurrentLesson(index + 1)
  router.push(`/lesson/${index + 1}`)
}
</script>

<template>
  <div class="app-container">
    <AppHeader title="课程学习" :subtitle="`共${lesson.totalLessons}个课时，已完成${completedLessons}个`" />

    <div class="content">
      <div v-for="(l, index) in lesson.lessons" :key="l.id" class="lesson-card" @click="goToLessonDetail(index)">
        <div class="lesson-icon" :style="{ background: l.bg }">{{ l.icon }}</div>
        <div class="lesson-info">
          <div class="lesson-title">{{ l.title }}</div>
          <div class="lesson-desc">{{ l.desc }}</div>
        </div>
        <div :class="['lesson-status', l.status]">{{ l.statusText }}</div>
      </div>
    </div>

    <NavBar />
  </div>
</template>
