<script setup lang="ts">
// Call of Duty 4 nod (original sprite): a UAV minimap sweep with enemy dots, "UAV ONLINE". 12×12.
// D outline, G radar green, g grid, R enemy dot, Y you (centre).
const rows = ['...DDDDDD...', '..DGGgGGGD..', '.DGRGgGGGGD.', 'DGGGGgGGGRGD', 'DGGGGgGGGGGD', 'DggggYggggGD',
  'DGGGGgGGGGgD', 'DGGRGgGGGGGD', 'DGGGGgGGRGGD', '.DGGGgGGGGD.', '..DGGgGGGD..', '...DDDDDD...']
const colours: Record<string, string> = { D: '#04121c', G: '#1f5a2a', g: '#3f9a4a', R: '#ff3b30', Y: '#ffd84a' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 72, label: true })
</script>

<template>
  <div class="uav">
    <svg viewBox="0 0 12 12" :width="size" :height="size" shape-rendering="crispEdges" aria-hidden="true">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
      <path class="sweep" d="M6 6 L6 1 A5 5 0 0 1 10 3.5 Z" fill="#7ee787" opacity=".45" />
    </svg>
    <span v-if="label">UAV<br>ONLINE</span>
  </div>
</template>

<style scoped>
.uav { display: flex; align-items: center; gap: 12px; }
.uav svg { filter: drop-shadow(3px 3px 0 #04121c); }
.uav .sweep { transform-origin: 6px 6px; animation: sweep 1.2s steps(8, end) infinite; }
.uav span { font: 700 22px/1.2 var(--arc-pixel); letter-spacing: .08em; color: #7ee787; text-shadow: 2px 2px 0 #04121c; }
@keyframes sweep { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .uav .sweep { animation: none } }
</style>
