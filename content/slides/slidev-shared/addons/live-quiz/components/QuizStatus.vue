<script setup lang="ts">
import { computed } from 'vue'
import { useQuiz } from '../client/useQuiz'

const props = defineProps<{ allowStart?: boolean }>()
const { mode, status, message, hostError, hostedPresenter, hasRoom, canStart, authenticated, connected, busy,
  start, reconnect, pair, unpair, paired, pairError } = useQuiz()

const text = computed(() => {
  if (mode.value === 'offline') return null
  if (mode.value === 'hosted') return hostedPresenter.value && !connected.value
    ? message.value ?? 'Live quiz off. Start or reconnect from the presenter.' : null
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
  <template v-if="hostedPresenter">
    <button v-if="hasRoom && !connected" type="button" class="quiz-retry" :disabled="busy" @click="reconnect">
      {{ authenticated ? 'Reconnect to room' : 'Sign in to reconnect' }}
    </button>
    <button v-else-if="props.allowStart && canStart" type="button" class="quiz-retry" :disabled="busy" @click="start">
      {{ authenticated ? 'Start a new room' : 'Sign in to host' }}
    </button>
    <template v-if="connected && props.allowStart">
      <button type="button" class="quiz-retry" @click="pair">{{ paired ? 'Open another projector' : 'Open paired projector' }}</button>
      <button v-if="paired" type="button" class="quiz-retry" @click="unpair">Disconnect projector</button>
      <p v-if="pairError" class="quiz-status" role="status">{{ pairError }}</p>
    </template>
  </template>
</template>
