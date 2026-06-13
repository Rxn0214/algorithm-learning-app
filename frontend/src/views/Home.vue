<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useLessonStore } from '../stores/lesson'
import { quickEntries, lessons } from '../data/lessons'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const user = useUserStore()
const lesson = useLessonStore()

const selectedLesson = computed(() => {
  const next = lessons.find(l => l.status === 'status-progress')
  return next || lessons[0]
})

function goToLesson(l) {
  const id = lessons.findIndex(x => x.title === l.title) + 1
  lesson.setCurrentLesson(id)
  router.push(`/lesson/${id}`)
}

function navigateTo(route) {
  router.push(route)
}
</script>

<template>
  <div class="app-container">
    <AppHeader />

    <div class="content">
      <div class="card">
        <div class="card-title">学习进度</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: lesson.progressPercent + '%' }"></div>
        </div>
        <div class="stat-item">
          <span class="stat-label">已完成课时</span>
          <span class="stat-value">{{ lesson.completedLessons }}/{{ lesson.totalLessons }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">获得成就</span>
          <span class="stat-value">5</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">学习天数</span>
          <span class="stat-value">12天</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">今日推荐</div>
        <div class="lesson-card" @click="goToLesson(selectedLesson)">
          <div class="lesson-icon" :style="{ background: selectedLesson.bg, color: 'white' }">
            {{ selectedLesson.icon }}
          </div>
          <div class="lesson-info">
            <div class="lesson-title">{{ selectedLesson.title }}</div>
            <div class="lesson-desc">{{ selectedLesson.desc }}</div>
          </div>
          <div class="lesson-status status-progress">继续学习</div>
        </div>
        <button class="btn-primary" style="width: 100%; margin-top: 8px;" @click="goToLesson(selectedLesson)">开始学习</button>
      </div>

      <div class="card">
        <div class="card-title">快速入口</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <div v-for="item in quickEntries" :key="item.name" class="badge-item" @click="navigateTo(item.route)">
            <div class="badge-icon" :style="{ background: item.bg }">{{ item.icon }}</div>
            <div class="badge-name">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>
