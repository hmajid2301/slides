<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuiz } from '../client/useQuiz'
import QuizLeaderboard from './QuizLeaderboard.vue'
import QuizStatus from './QuizStatus.vue'

const { quiz, recording, mode, view, connected, hostAction, hostError, busy, control,
  hostedBuild, hostedPresenter, downloadRecording, recordingError } = useQuiz()

const finished = computed(() => connected.value && view.value?.phase === 'winner')
const ready = computed(() => {
  const v = view.value
  return connected.value && v !== null && v.questionId === quiz.questions.at(-1)!.id && v.phase === 'leaderboard'
})

// Fire `winner` once, only from the active presenter slide after the final
// leaderboard. Already finished (e.g. presenter reload) → never re-sent; saving
// again is an explicit button.
const sent = ref(false)
watch([control, ready], () => {
  if (hostedBuild || !control.value || !ready.value || sent.value || busy.value) return
  sent.value = true
  hostAction({ type: 'winner' })
}, { immediate: true })
const retry = () => hostAction({ type: 'winner' })

const standings = computed(() => {
  if (finished.value) return view.value?.standings ?? []
  if (mode.value === 'offline') return recording?.standings ?? []
  return []
})
const winner = computed(() => standings.value[0] ?? null)
</script>

<template>
  <div class="live-quiz quiz-winner">
    <template v-if="winner">
      <div class="quiz-winner-main">
        <p class="quiz-eyebrow">New high score</p>
        <h2 class="quiz-title"><span class="quiz-nick">{{ winner.nickname }}</span> wins!</h2>
        <p class="quiz-score">{{ winner.score.toLocaleString('en-GB') }} points · {{ quiz.questions.length }} rounds</p>
      </div>
      <QuizLeaderboard :standings="standings" :top="3" />
    </template>
    <p v-else class="quiz-muted">
      {{ mode === 'offline' ? 'No recorded results for this talk.' : finished ? 'No players this time.' : 'Final standings appear after the last leaderboard.' }}
    </p>
    <button v-if="hostedPresenter && ready" type="button" class="quiz-retry" :disabled="busy" @click="retry">Show winner</button>
    <button v-if="mode === 'live' && control && finished && (hostError || !sent)" type="button" class="quiz-retry" :disabled="busy" @click="retry">
      {{ hostError ? 'Retry saving results' : 'Save results again' }}
    </button>
    <button v-if="hostedPresenter && finished && winner" type="button" class="quiz-retry" :disabled="busy" @click="downloadRecording">Download quiz-results.json</button>
    <p v-if="recordingError" class="quiz-status" role="status">{{ recordingError }}</p>
    <QuizStatus />
  </div>
</template>
