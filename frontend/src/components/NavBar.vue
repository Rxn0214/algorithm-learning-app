<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => route.name?.toLowerCase() || 'home')

const navItems = [
  { name: '首页', page: 'home', path: '/' },
  { name: '课程', page: 'lessons', path: '/lessons' },
  { name: '助手', page: 'agents', path: '/agents' },
  { name: '圈子', page: 'forum', path: '/forum' },
  { name: '我的', page: 'profile', path: '/profile' }
]

const pathToPage = { '/': 'home', '/lessons': 'lessons', '/agents': 'agents', '/forum': 'forum', '/profile': 'profile' }
const activePage = computed(() => pathToPage[route.path] || 'home')
</script>

<template>
  <div class="nav-bar" v-if="route.path !== '/chat/guider' && route.path !== '/chat/tutor'">
    <div v-for="item in navItems" :key="item.name"
         :class="['nav-item', activePage === item.page ? 'active' : '']"
         @click="router.push(item.path)">
      <template v-if="item.page === 'home'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </template>
      <template v-else-if="item.page === 'lessons'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </template>
      <template v-else-if="item.page === 'agents'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </template>
      <template v-else-if="item.page === 'forum'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </template>
      <template v-else-if="item.page === 'profile'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </template>
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>
