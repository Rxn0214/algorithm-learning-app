<script setup>
import { useUserStore } from './stores/user'

const user = useUserStore()
</script>

<template>
  <router-view />
</template>
