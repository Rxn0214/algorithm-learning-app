<script setup>
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '算法与程序实现' },
  subtitle: { type: String, default: '高中信息技术必修1 · 第二章' }
})

const user = useUserStore()
const router = useRouter()

function handleLogout() {
  user.logout()
  router.push('/login')
}
</script>

<template>
  <div class="header">
    <div class="user-info-header">
      <div style="display: flex; align-items: center;">
        <div class="user-info-avatar">{{ user.currentUser?.name?.charAt(0) || '?' }}</div>
        <span class="user-info-name">{{ user.currentUser?.name || '用户' }}</span>
      </div>
      <span class="user-info-logout" @click="handleLogout">退出</span>
    </div>
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </div>
</template>
