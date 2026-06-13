<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

function show(message, type = 'info', duration = 2500) {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

defineExpose({ show })
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="fade">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
