<script setup lang="ts">
// Maze-chaser nod for "pointer chasing": the muncher zig-zags between scattered pellets.
const dots = [[20, 30], [80, 8], [130, 40], [190, 12]]
</script>

<template>
  <svg class="chomp" viewBox="0 0 220 52" width="220" height="52" aria-hidden="true">
    <rect v-for="([x, y], i) in dots" :key="i" :x="x" :y="y" width="8" height="8" :class="['dot', `d${i}`]" />
    <g class="muncher"><path d="M0 0 L12 -6 A13 13 0 1 0 12 6 Z" class="body" /></g>
  </svg>
</template>

<style scoped>
.chomp { display: block; margin-top: 10px; overflow: visible; }
.dot { fill: #fff; animation: 2.4s steps(1, end) infinite; }
/* each pellet vanishes as the muncher reaches it (25/50/75/100% of the loop) */
.d0 { animation-name: e0 } .d1 { animation-name: e1 } .d2 { animation-name: e2 } .d3 { animation-name: e3 }
@keyframes e0 { 0%, 24% { opacity: 1 } 25%, 100% { opacity: 0 } }
@keyframes e1 { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
@keyframes e2 { 0%, 74% { opacity: 1 } 75%, 100% { opacity: 0 } }
@keyframes e3 { 0%, 97% { opacity: 1 } 98%, 100% { opacity: 0 } }
.body { fill: var(--arc-yellow); stroke: #04121c; stroke-width: 2; animation: munch 240ms steps(2, jump-none) infinite; transform-origin: 0 0; }
.muncher { animation: chase 2.4s steps(24, end) infinite; }
@keyframes chase {
  0% { transform: translate(0, 34px) }
  25% { transform: translate(24px, 34px) }
  50% { transform: translate(84px, 12px) }
  75% { transform: translate(134px, 44px) }
  100% { transform: translate(194px, 16px) }
}
@keyframes munch { 50% { d: path('M0 0 L13 -1 A13 13 0 1 0 13 1 Z') } }
@media (prefers-reduced-motion: reduce) { .muncher, .body, .dot { animation: none } }
</style>
