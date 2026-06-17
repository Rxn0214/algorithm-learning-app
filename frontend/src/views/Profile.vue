<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useLessonStore } from '../stores/lesson'
import { badges } from '../data/lessons'
import { fetchUserPoints } from '../services/forum'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const user = useUserStore()
const lesson = useLessonStore()

const showWrongAnswers = ref(false)
const showReport = ref(false)
const learningReport = ref(null)
const apiPoints = ref(0)
const apiLevel = ref('新手学员')

// 等级颜色
function levelColor(level) {
  const map = {
    '年级楷模': '#FF6B6B', '班级学霸': '#FFD93D',
    '学习达人': '#6BCB77', '积极分子': '#4D96FF',
    '勤奋学子': '#9B59B6', '新手学员': '#95A5A6'
  }
  return map[level] || '#95A5A6'
}

// 页面加载时同步最新数据
onMounted(async () => {
  lesson.fetchStats()
  lesson.fetchWrongAnswers()
  // 从后端获取最新积分
  const pts = await fetchUserPoints()
  if (pts.success) {
    apiPoints.value = pts.points || 0
    apiLevel.value = pts.level || '新手学员'
  }
})

// 正确率：使用真实答题统计
const correctRate = computed(() => {
  const total = lesson.totalAttempts
  if (total === 0) return '—'
  const correct = lesson.correctAttempts
  return Math.round((correct / total) * 100) + '%'
})

// 学习时长估算
const studyHours = computed(() => {
  if (lesson.completedLessons === 0) return '—'
  return '约' + (lesson.completedLessons * 1.5) + '小时'
})

function handleLogout() {
  user.logout()
  router.push('/login')
}

function toggleWrongAnswers() {
  showWrongAnswers.value = !showWrongAnswers.value
  if (showWrongAnswers.value) {
    lesson.fetchWrongAnswers()
  }
}

function generateReport() {
  lesson.fetchStats()
  lesson.fetchWrongAnswers()
  const now = new Date()
  const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日'
  learningReport.value = {
    date: dateStr,
    completed: lesson.completedLessons,
    total: lesson.totalLessons,
    totalAnswered: lesson.totalAttempts,
    correctCount: lesson.correctAttempts,
    wrongCount: lesson.wrongAnswers.length,
    rate: correctRate.value,
    hours: studyHours.value,
    level: apiLevel.value,
    points: apiPoints.value
  }
  showReport.value = true
}
</script>

<template>
  <div class="app-container">
    <div class="header" style="padding-bottom: 20px;">
      <div class="user-info-header">
        <div style="display: flex; align-items: center;">
          <div class="user-info-avatar">{{ user.currentUser?.name?.charAt(0) || '?' }}</div>
          <span class="user-info-name">{{ user.currentUser?.name || '用户' }}</span>
        </div>
        <span class="user-info-logout" @click="handleLogout">退出</span>
      </div>
      <h1>个人中心</h1>
      <p>查看你的学习数据</p>
    </div>

    <div class="content">
      <div class="card" style="text-align: center; padding: 30px 20px;">
        <div class="post-avatar" style="width: 80px; height: 80px; font-size: 32px; margin: 0 auto 16px;">{{ user.currentUser?.name?.charAt(0) || '?' }}</div>
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">{{ user.currentUser?.name || '用户' }}</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 8px;">学号：{{ user.currentUser?.studentId || '' }}</p>
        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 8px;">
          <span :style="{ background: levelColor(apiLevel), color: 'white', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }">
            {{ apiLevel }}
          </span>
          <span style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 4px 14px; border-radius: 12px; font-size: 13px; font-weight: 600;">
            ⭐ {{ apiPoints }}积分
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">学习数据</div>
        <div class="stat-item">
          <span class="stat-label">总答题数</span>
          <span class="stat-value">{{ lesson.totalAttempts }}题</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">答对次数</span>
          <span class="stat-value">{{ lesson.correctAttempts }}次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">正确率</span>
          <span class="stat-value">{{ correctRate }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成课时</span>
          <span class="stat-value">{{ lesson.completedLessons }}/{{ lesson.totalLessons }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">学习时长</span>
          <span class="stat-value">{{ studyHours }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">成就徽章</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div v-for="badge in badges" :key="badge.name"
               :class="['badge-item', lesson.achievements_unlocked.includes(badge.key) ? '' : 'badge-locked']">
            <div class="badge-icon" :style="lesson.achievements_unlocked.includes(badge.key) ? {} : { filter: 'grayscale(1)', opacity: 0.4 }">
              {{ badge.icon }}
            </div>
            <div class="badge-name">{{ badge.name }}</div>
            <div class="badge-desc">{{ badge.desc }}</div>
            <div v-if="!lesson.achievements_unlocked.includes(badge.key)" style="font-size:10px;color:#999;margin-top:2px;">🔒 未解锁</div>
            <div v-else style="font-size:10px;color:#06D6A0;margin-top:2px;">✅ 已解锁</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">错题本</div>
        <p style="font-size: 13px; color: #666; margin-bottom: 12px;">
          共收录 {{ lesson.wrongAnswers.length }} 道错题
        </p>
        <button class="btn-primary" style="width: 100%;" @click="toggleWrongAnswers">
          {{ showWrongAnswers ? '收起错题' : '查看错题' }}
        </button>

        <div v-if="showWrongAnswers" style="margin-top: 16px;">
          <div v-if="lesson.wrongAnswers.length === 0" class="empty-state" style="padding: 20px;">
            <span class="empty-icon" style="font-size:32px;">🎉</span>
            <span class="empty-text">暂无错题，继续保持！</span>
          </div>
          <div v-for="(item, index) in lesson.wrongAnswers" :key="item.id" class="wrong-item">
            <div class="wrong-question">{{ index + 1 }}. {{ item.question }}</div>
            <div class="wrong-detail">
              <span class="wrong-user">你的答案：{{ item.userAnswer }}</span><br>
              <span class="wrong-correct">正确答案：{{ item.correctAnswer }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">学习报告</div>
        <button class="btn-primary" style="width: 100%;" @click="generateReport">生成学习报告</button>

        <div v-if="showReport && learningReport" style="margin-top: 16px; background: #F0F9FF; border-radius: 12px; padding: 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #023E8A; margin-bottom: 12px;">
            📊 学习报告 ({{ learningReport.date }})
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">完成课时</span>
            <span class="stat-value">{{ learningReport.completed }}/{{ learningReport.total }}</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">累计答题</span>
            <span class="stat-value">{{ learningReport.totalAnswered }}题</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">答对次数</span>
            <span class="stat-value">{{ learningReport.correctCount }}次</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">正确率</span>
            <span class="stat-value">{{ learningReport.rate }}</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">错题数量</span>
            <span class="stat-value">{{ learningReport.wrongCount }}道</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">学习时长</span>
            <span class="stat-value">{{ learningReport.hours }}</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">当前积分</span>
            <span class="stat-value" style="color: #FFA500;">⭐ {{ learningReport.points }}</span>
          </div>
          <div class="stat-item" style="padding: 8px 0;">
            <span class="stat-label">等级</span>
            <span class="stat-value" :style="{ color: levelColor(learningReport.level) }">{{ learningReport.level }}</span>
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #D0E8F7; font-size: 12px; color: #666; line-height: 1.6;">
            💡 <strong>学习建议：</strong>
            <span v-if="learningReport.completed === 0">开始你的第一节课程吧！从"算法的概念"入手。</span>
            <span v-else-if="learningReport.completed < 4">继续加油！建议完成前4个课时，打好基础。</span>
            <span v-else-if="learningReport.completed < 8">进度不错！还剩{{ learningReport.total - learningReport.completed }}个课时，坚持就是胜利。</span>
            <span v-else>🎉 全部课时已完成！复习错题巩固知识点吧。</span>
          </div>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>
