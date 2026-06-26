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
  // 切换账号后重新加载当前用户数据
  lesson.reloadUserData()
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

const progressTip = computed(() => {
  const pct = lesson.progressPercent
  if (pct >= 100) return '🎉 全部完成！太棒了！'
  if (pct >= 50) return '进度过半，坚持就是胜利！'
  if (pct > 0) return `继续加油，已完成 ${lesson.completedLessons}/${lesson.totalLessons}`
  return '开始你的第一课吧！'
})

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
        <div class="card-title">📊 学习进度</div>

        <!-- 进度条 -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: lesson.progressPercent + '%' }"></div>
        </div>
        <div style="text-align: center; font-size: 14px; color: #666; margin: 8px 0;">
          {{ progressTip }}
        </div>

        <!-- 课时圆点指示器 -->
        <div style="font-size: 13px; color: #999; text-align: center; margin-bottom: 8px;">课时进度</div>
        <div class="lesson-dots">
          <div v-for="(l, index) in lesson.lessons" :key="l.id"
               :class="['lesson-dot', l.status]"
               @click="goToLesson(l)"
               :title="l.title + ' - ' + l.statusText">
            {{ index + 1 }}
          </div>
        </div>
        <div style="display: flex; justify-content: center; gap: 16px; font-size: 11px; color: #999; margin-top: 6px;">
          <span>🟢 已完成</span>
          <span>🟠 进行中</span>
          <span>⚪ 未开始</span>
        </div>

        <!-- 提示 -->
        <div style="background: #F0F9FF; border-radius: 10px; padding: 10px 14px; margin-top: 14px; font-size: 12px; color: #0077B6; line-height: 1.6;">
          💡 完成每个课时的<strong>全部题目</strong>后，该课时自动标记为"已完成"
        </div>

        <!-- 跳转按钮 -->
        <button class="btn-secondary" style="width: 100%; margin-top: 12px;" @click="router.push('/lessons')">
          查看全部课程 →
        </button>
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

<style scoped>
.lesson-dots {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 10px 0;
}
.lesson-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}
.lesson-dot.status-completed {
  background: #06D6A0;
  color: white;
  box-shadow: 0 2px 8px rgba(6, 214, 160, 0.3);
}
.lesson-dot.status-progress {
  background: #FFD166;
  color: #333;
  box-shadow: 0 2px 8px rgba(255, 209, 102, 0.3);
}
.lesson-dot.status-pending {
  background: #E8E8E8;
  color: #999;
  border: 2px dashed #CCC;
}
.lesson-dot:hover {
  transform: scale(1.15);
}
.lesson-dot:active {
  transform: scale(0.95);
}
</style>
