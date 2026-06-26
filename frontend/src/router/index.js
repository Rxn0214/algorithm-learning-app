import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/lessons', name: 'Lessons', component: () => import('../views/Lessons.vue') },
  { path: '/lesson/:id', name: 'LessonDetail', component: () => import('../views/LessonDetail.vue') },
  { path: '/agents', name: 'Agents', component: () => import('../views/Agents.vue') },
  { path: '/chat/:agentType', name: 'Chat', component: () => import('../views/Chat.vue') },
  { path: '/forum', name: 'Forum', component: () => import('../views/Forum.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = JSON.parse(localStorage.getItem('current_user') || 'null')
  if (to.name !== 'Login' && !userStore) {
    next('/login')
  } else {
    next()
  }
})

export default router
