<script setup lang="ts">
// Beyblade nod (original sprite): a battling top seen from the side, spinning on its tip, "LET IT RIP!". 20×13.
// D outline, Y yellow bit chip, G grey metal, R red attack ring, B blue base, W speed streaks, S floor sparks.
const rows = [
  '........DDDD........',
  '.......DYYYYD.......',
  '.....DDDGGGGDDD.....',
  'WW..DRRRGGGGRRRD..WW',
  '...DRRDRRRRRRDRRD...',
  'WWWDRRRRRRRRRRRRDWWW',
  '....DDRRRRRRRRDD....',
  '......DGGGGGGD......',
  '.......DBBBBD.......',
  '........DBBD........',
  '.........DD.........',
  '......S..DD..S......',
  '....S...DDDD...S....',
]
const colours: Record<string, string> = { D: '#04121c', Y: '#ffd84a', G: '#c9d3df', R: '#e8342a', B: '#1f6fe0', W: '#ffffff', S: '#ffd84a' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, c, fill: colours[c] }] : []))
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 140, label: true })
</script>

<template>
  <div class="bey">
    <svg viewBox="0 0 20 13" :width="size" :height="size * 13 / 20" shape-rendering="crispEdges" aria-hidden="true">
      <g class="top">
        <rect v-for="(p, i) in pixels.filter(p => p.c !== 'W' && p.c !== 'S')" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
      </g>
      <g class="fx">
        <rect v-for="(p, i) in pixels.filter(p => p.c === 'W' || p.c === 'S')" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
      </g>
    </svg>
    <span v-if="label">LET IT<br>RIP!</span>
  </div>
</template>

<style scoped>
.bey { display: flex; align-items: center; gap: 14px; }
.bey svg { filter: drop-shadow(4px 4px 0 #04121c); overflow: visible; }
/* Wobble on its tip, streaks and sparks flicker: reads as spinning from the side. */
.bey .top { transform-origin: 10px 12px; animation: wobble 240ms steps(2, jump-none) infinite; }
.bey .fx { animation: flicker 160ms steps(2, jump-none) infinite; }
.bey span { font: 700 26px/1.2 var(--arc-pixel); letter-spacing: .08em; color: var(--arc-yellow); text-shadow: 3px 3px 0 #04121c; }
@keyframes wobble { 0% { transform: rotate(-4deg) } 100% { transform: rotate(4deg) } }
@keyframes flicker { 50% { opacity: .2 } }
@media (prefers-reduced-motion: reduce) { .bey .top, .bey .fx { animation: none } }
</style>
