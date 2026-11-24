<script setup lang="ts">
import type { Standing } from '../shared/types'

const props = withDefaults(defineProps<{ standings: Standing[]; top?: number; title?: string }>(), {
  top: 3,
  title: 'Top players',
})
</script>

<template>
  <div class="live-quiz quiz-table-wrap">
    <p class="quiz-table-title">{{ props.title }}</p>
    <table class="quiz-table">
      <thead>
        <tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col" class="quiz-num">Points</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in props.standings.slice(0, props.top)" :key="s.rank">
          <td>{{ s.rank }}</td>
          <td class="quiz-nick">{{ s.nickname }}</td>
          <td class="quiz-num">{{ s.score.toLocaleString('en-GB') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
