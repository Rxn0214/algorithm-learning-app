<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useLessonStore } from '../stores/lesson'
import { quickEntries } from '../data/lessons'
import { fetchUserPoints } from '../services/forum'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const user = useUserStore()
const lesson = useLessonStore()

const apiPoints = ref(0)
const apiLevel = ref('新手学员')

onMounted(async () => {
  const pts = await fetchUserPoints()
  if (pts.success) {
    apiPoints.value = pts.points || 0
    apiLevel.value = pts.level || '新手学员'
  }
})

const selectedLesson = computed(() => {
  const next = lesson.lessons.find(l => l.status === 'status-progress')
  return next || lesson.lessons[0]
})

function goToLesson(l) {
  const id = lesson.lessons.findIndex(x => x.title === l.title) + 1
  lesson.setCurrentLesson(id)
  router.push(`/lesson/${id}`)
}

const isNewUser = computed(() => lesson.completedLessons === 0)

function navigateTo(route) {
  router.push(route)
}
</script>

<template>
  <div class="app-container">
    <AppHeader />

    <div class="content">
      <div class="card" style="background: linear-gradient(135deg, #E8F4FD 0%, #F0F9FF 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="card-title" style="margin-bottom:4px;">我的积分</div>
            <div style="font-size: 28px; font-weight: 700; color: #FF8C00;">⭐ {{ apiPoints }}</div>
          </div>
          <div style="text-align: right;">
            <span style="background: #00B4D8; color: white; padding: 6px 16px; border-radius: 16px; font-size: 14px; font-weight: 600;">{{ apiLevel }}</span>
          </div>
        </div>
      </div>

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
          <span class="stat-value">{{ isNewUser ? 0 : 1 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">学习天数</span>
          <span class="stat-value">{{ isNewUser ? '0天' : (lesson.studyDays + '天' || '1天') }}</span>
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
          <div :class="['lesson-status', isNewUser ? 'status-pending' : 'status-progress']">{{ isNewUser ? '未开始' : '继续学习' }}</div>
        </div>
        <button class="btn-primary" style="width: 100%; margin-top: 8px;" @click="goToLesson(selectedLesson)">{{ isNewUser ? '开始学习' : '继续学习' }}</button>
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
