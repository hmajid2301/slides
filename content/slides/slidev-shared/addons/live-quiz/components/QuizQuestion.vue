<script setup lang="ts">
import { computed, watch } from 'vue'
import { useHostControl } from '../client/control'
import { useQuiz } from '../client/useQuiz'
import { CHOICES } from '../shared/types'
import type { HostAction } from '../shared/types'
import QuizLeaderboard from './QuizLeaderboard.vue'
import QuizStatus from './QuizStatus.vue'

const props = defineProps<{ id: string; step: number }>()
const quizState = useQuiz()
const { quiz, recording, mode, view, connected, remainingMs, hostAction, busy } = quizState
const control = useHostControl()

const index = quiz.questions.findIndex(q => q.id === props.id)
if (index < 0) throw new Error(`QuizQuestion: unknown id "${props.id}"`)
const q = quiz.questions[index]
const correctIndex = CHOICES.indexOf(q.correct)

const step = computed(() => Math.max(0, Math.min(3, props.step)))
const serverStage = computed(() => quizState.stageOf(props.id))
const current = computed(() => connected.value && view.value?.questionId === props.id ? view.value : null)

// Drive the server forward to the click step, one transition at a time.
// Never backwards; the server rejects skipped rounds with 409.
const ACTIONS = ['open', 'reveal', 'leaderboard'] as const
let attempted = ''
watch([control, step, serverStage, connected], async () => {
  if (!control.value || !connected.value || busy.value) return
  const have = serverStage.value
  if (step.value <= have) return
  const key = `${step.value}:${have}`
  if (attempted === key) return // failed once at this point; wait for a new click
  attempted = key
  const action: HostAction = { type: ACTIONS[have], questionId: props.id }
  await hostAction(action)
}, { immediate: true })

const seconds = computed(() => (remainingMs.value == null ? null : Math.ceil(remainingMs.value / 1000)))
const timerFraction = computed(() => (remainingMs.value == null ? 0 : remainingMs.value / 15000))

const counts = computed<number[] | null>(() => {
  if (current.value?.counts) return current.value.counts
  if (mode === 'offline' && recording) return recording.rounds[index]?.counts ?? null
  return null
})
const totalAnswers = computed(() => counts.value?.reduce((a, b) => a + b, 0) ?? 0)
const showCounts = computed(() => counts.value !== null && totalAnswers.value > 0)
const standings = computed(() => (current.value?.standings?.length ? current.value.standings : null))
</script>

<template>
  <div class="live-quiz quiz-question" :data-step="step">
    <header class="quiz-head">
      <span class="quiz-eyebrow">{{ index === quiz.questions.length - 1 && q.revealItems ? 'Bonus round' : `Checkpoint ${index + 1} / ${quiz.questions.length}` }}</span>
      <span v-if="step === 1 && current" class="quiz-meta" aria-live="off">
        {{ current.answeredCount }} / {{ current.joined }} answered
        <template v-if="seconds !== null"> · <strong class="quiz-timer">{{ seconds }} s</strong></template>
      </span>
    </header>
    <div v-if="step === 1 && current && seconds !== null" class="quiz-bar" aria-hidden="true">
      <span :style="{ width: `${timerFraction * 100}%` }" />
    </div>

    <!-- Leaderboard -->
    <template v-if="step >= 3 && standings">
      <h2 class="quiz-title">Leaderboard</h2>
      <QuizLeaderboard :standings="standings" :top="5" />
    </template>

    <!-- Question / reveal -->
    <template v-else>
      <h2 class="quiz-prompt">{{ q.prompt }}</h2>
      <p v-if="q.rule" class="quiz-rule">{{ q.rule }}</p>

      <div v-if="step >= 2 && q.revealItems?.length" class="quiz-reveal-items">
        <span v-for="item in q.revealItems" :key="item">{{ item }}</span>
      </div>

      <ol v-if="!(step >= 2 && q.revealItems?.length)" class="quiz-options">
        <li
          v-for="(opt, i) in q.options"
          :key="i"
          :class="{ 'quiz-correct': step >= 2 && i === correctIndex, 'quiz-dim': step >= 2 && i !== correctIndex }"
        >
          <b class="quiz-letter">{{ CHOICES[i] }}</b>
          <span class="quiz-opt">{{ opt }}</span>
          <span v-if="step >= 2 && i === correctIndex" class="quiz-tag">Correct</span>
          <span v-if="step >= 2 && showCounts" class="quiz-count">
            {{ counts![i] }}
            <span class="quiz-count-bar" aria-hidden="true"><span :style="{ width: `${(counts![i] / totalAnswers) * 100}%` }" /></span>
          </span>
        </li>
      </ol>

      <p v-if="step >= 2" class="quiz-explain">
        <strong>{{ q.correct }} · {{ q.options[correctIndex] }}.</strong> {{ q.explanation }}
        <span v-if="showCounts" class="quiz-muted"> {{ counts![correctIndex] }} of {{ totalAnswers }} got it right.</span>
      </p>
      <p v-else-if="step === 1" class="quiz-hint">
        {{ current ? 'Answer on your phone · 1,000 → 500 points · wrong answer: 0' : 'Think about your answer…' }}
      </p>
      <p v-if="step >= 3 && !standings" class="quiz-muted">
        {{ mode === 'offline' ? 'Final standings are on the winner slide.' : 'No live scores: leaderboard unavailable.' }}
      </p>
    </template>

    <QuizStatus />
  </div>
</template>
