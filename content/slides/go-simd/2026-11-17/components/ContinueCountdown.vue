<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useIsSlideActive } from '@slidev/client'

// Arcade "CONTINUE?" countdown: 9 → 0 while the slide is showing, then INSERT COIN.
const active = useIsSlideActive()
const n = ref(9)
let timer: ReturnType<typeof setInterval> | undefined
watch(active, on => {
  clearInterval(timer)
  n.value = 9
  if (on) timer = setInterval(() => { if (n.value > 0) n.value-- }, 1000)
}, { immediate: true })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <p class="continue">
    <template v-if="n > 0">CONTINUE? <b>{{ n }}</b></template>
    <template v-else>INSERT COIN · QUESTIONS?</template>
  </p>
</template>

<style scoped>
.continue { font: 700 32px var(--arc-pixel); color: var(--arc-yellow); letter-spacing: .1em; margin: 6px 0 14px; text-shadow: 3px 3px 0 #04121c; }
b { display: inline-block; min-width: 1.2em; color: #ffffff; }
</style>
