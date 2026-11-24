<script setup lang="ts">
import { useQuiz } from '../client/useQuiz'

const { topScore } = useQuiz()
</script>

<template>
  <span class="live-quiz quiz-score-hud" aria-label="Top quiz score">{{ topScore === null ? '–' : topScore.toLocaleString('en-GB') }}</span>
</template>
