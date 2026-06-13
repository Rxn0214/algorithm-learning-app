<script setup>
import { useRouter } from 'vue-router'
import { agents } from '../data/lessons'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'

const router = useRouter()

function startChat(type) {
  router.push(`/chat/${type}`)
}
</script>

<template>
  <div class="app-container">
    <AppHeader title="智能助手" subtitle="选择助手开始对话" />

    <div class="content">
      <div v-for="agent in [agents.guider, agents.tutor]" :key="agent.type" class="agent-card" @click="startChat(agent.type)">
        <div :class="['agent-avatar', agent.avatarClass]">{{ agent.avatar }}</div>
        <div class="agent-info">
          <div class="agent-name">{{ agent.name }}</div>
          <div class="agent-role">{{ agent.role }}</div>
          <div class="agent-desc">{{ agent.desc }}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>

      <div class="card">
        <div class="card-title">使用指南</div>
        <div style="font-size: 13px; color: #666; line-height: 1.6;">
          <p><strong>引航</strong>适合在学习开始时使用，帮助你制定学习计划、了解新课内容。</p>
          <p style="margin-top: 8px;"><strong>辅智</strong>适合在遇到困难时使用，帮你解答疑问、分析代码问题。</p>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>
