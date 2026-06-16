<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useLessonStore } from './stores/lesson'

const user = useUserStore()
const lesson = useLessonStore()

onMounted(() => {
  if (user.isLoggedIn) {
    lesson.recordStudyDay()
  }
})
</script>

<template>
  <router-view />
</template>
