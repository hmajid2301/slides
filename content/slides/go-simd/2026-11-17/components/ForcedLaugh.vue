<script setup lang="ts">
// Final Fantasy X nod (original sprite): a spiky-haired face forcing a laugh, "HA HA HA HA!". 12×12.
// D outline, H blond hair, S skin, E closed eyes, M open mouth.
const rows = ['.D..D..D..D.', 'DHDDHDDHDDHD', 'DHHHHHHHHHHD', 'DHHHHHHHHHHD', 'DHSSSSSSSSHD', 'DSEESSSSEESD',
  'DSSSSSSSSSSD', 'DSSMMMMMMSSD', 'DSSMDDDDMSSD', '.DSSMMMMSSD.', '..DSSSSSSD..', '...DDDDDD...']
const colours: Record<string, string> = { D: '#04121c', H: '#ffd84a', S: '#f6d2a2', E: '#04121c', M: '#e8342a' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 72, label: true })
</script>

<template>
  <div class="laugh">
    <svg viewBox="0 0 12 12" :width="size" :height="size" shape-rendering="crispEdges" aria-hidden="true">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
    <span v-if="label">HA HA HA HA!</span>
  </div>
</template>

<style scoped>
.laugh { display: flex; align-items: center; gap: 12px; }
.laugh svg { animation: bob 300ms steps(2, end) infinite; filter: drop-shadow(3px 3px 0 #04121c); }
.laugh span { font: 700 22px/1.2 var(--arc-pixel); letter-spacing: .08em; color: #ffd84a; text-shadow: 2px 2px 0 #04121c; }
@keyframes bob { 50% { transform: translateY(-3px) } }
@media (prefers-reduced-motion: reduce) { .laugh svg { animation: none } }
</style>
