<script setup lang="ts">
import { renderSVG } from 'uqr'
import { computed } from 'vue'
import { useQuiz } from '../client/useQuiz'
import QuizStatus from './QuizStatus.vue'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const { mode, view, connected } = useQuiz()

const joinUrl = computed(() => (connected.value ? view.value?.joinUrl ?? null : null))
const shortUrl = computed(() => joinUrl.value?.replace(/^https?:\/\//, '') ?? '')
const qr = computed(() => {
  if (!joinUrl.value) return null
  const svg = renderSVG(joinUrl.value, { ecc: 'M', border: 2, pixelSize: 8 })
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
})
</script>

<template>
  <div v-if="mode !== 'offline'" class="live-quiz quiz-join" :class="{ 'quiz-compact': props.compact }">
    <template v-if="joinUrl && qr">
      <img class="quiz-qr" :src="qr" :alt="`QR code for ${shortUrl}`">
      <div class="quiz-join-text">
        <p class="quiz-eyebrow">Join the quiz</p>
        <p class="quiz-url">{{ shortUrl }}</p>
        <p class="quiz-players">
          <strong>{{ view?.joined ?? 0 }} joined</strong>
          <span v-for="(name, i) in view?.recentNicknames ?? []" :key="i" class="quiz-nick"> · {{ name }}</span>
        </p>
      </div>
    </template>
    <QuizStatus allow-start />
  </div>
</template>
