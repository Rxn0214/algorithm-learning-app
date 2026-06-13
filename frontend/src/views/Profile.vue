<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useLessonStore } from '../stores/lesson'
import { badges } from '../data/lessons'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const user = useUserStore()
const lesson = useLessonStore()

const showWrongAnswers = ref(false)

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
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">{{ user.currentUser?.name || '用户' }}</h2>
        <p style="font-size: 14px; color: #666;">学号：{{ user.currentUser?.studentId || '' }}</p>
      </div>

      <div class="card">
        <div class="card-title">学习数据</div>
        <div class="stat-item">
          <span class="stat-label">总学习时长</span>
          <span class="stat-value">12小时35分</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成课时</span>
          <span class="stat-value">{{ lesson.completedLessons }}/{{ lesson.totalLessons }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">正确率</span>
          <span class="stat-value">85%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">获得积分</span>
          <span class="stat-value">2,340</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">成就徽章</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div v-for="badge in badges" :key="badge.name" class="badge-item">
            <div class="badge-icon">{{ badge.icon }}</div>
            <div class="badge-name">{{ badge.name }}</div>
            <div class="badge-desc">{{ badge.desc }}</div>
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
        <button class="btn-primary" style="width: 100%;" @click="alert('学习报告生成功能已开启，数据分析中...')">生成周报</button>
      </div>
    </div>

    <NavBar />
  </div>
</template>
