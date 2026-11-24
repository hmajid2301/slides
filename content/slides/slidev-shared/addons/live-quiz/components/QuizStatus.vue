<script setup lang="ts">
import { computed } from 'vue'
import { useQuiz } from '../client/useQuiz'

const { mode, status, message, hostError } = useQuiz()

const text = computed(() => {
  if (mode === 'offline') return null
  switch (status.value) {
    case 'ok':
    case 'loading':
      return null
    case 'disabled':
      return 'Live quiz off: answer-only mode.'
    case 'auth-pending':
      return 'Approve sign-in in the terminal. Answer-only until then.'
    case 'auth-expired':
      return message.value ?? 'Sign-in expired: approve again in the terminal. Answer-only.'
    case 'restart-required':
      return message.value ?? 'Quiz changed: restart the dev server.'
    default:
      return `Quiz server unreachable${message.value ? `: ${message.value}` : ''}. Answer-only.`
  }
})
</script>

<template>
  <p v-if="text || hostError" class="quiz-status" role="status">
    <span v-if="hostError">{{ hostError }}</span>
    <span v-else>{{ text }}</span>
  </p>
</template>
