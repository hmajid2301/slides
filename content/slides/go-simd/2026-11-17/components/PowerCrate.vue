<script setup lang="ts">
// Original pixel "power-up crate": Go-blue box with a lightning bolt.
// When `hit` turns true it bumps and pops out its slot (the power-up).
withDefaults(defineProps<{ hit?: boolean, size?: number }>(), { hit: false, size: 96 })
const bolt = [[8, 2], [7, 3], [6, 4], [5, 5], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [9, 7], [8, 8], [7, 9], [6, 10]]
</script>

<template>
  <div class="crate-wrap">
    <div class="reward" :class="{ out: hit }"><slot /></div>
    <svg class="crate" :class="{ hit }" viewBox="0 0 16 14" :width="size" :height="size * 14 / 16" shape-rendering="crispEdges" aria-hidden="true">
      <rect width="16" height="14" fill="#04121c" />
      <rect x="1" y="1" width="14" height="12" :fill="hit ? '#2a5574' : '#00add8'" />
      <rect x="1" y="1" width="14" height="1" :fill="hit ? '#3d6d8f' : '#7fd5ea'" />
      <rect x="1" y="12" width="14" height="1" fill="#006a85" />
      <g fill="#04121c"><rect x="2" y="2" width="1" height="1" /><rect x="13" y="2" width="1" height="1" /><rect x="2" y="11" width="1" height="1" /><rect x="13" y="11" width="1" height="1" /></g>
      <g v-if="!hit" fill="#fddd00"><rect v-for="([x, y], i) in bolt" :key="i" :x="x" :y="y" width="1" height="1" /></g>
    </svg>
  </div>
</template>

<style scoped>
.crate-wrap { display: inline-flex; flex-direction: column; align-items: center; }
.crate { image-rendering: pixelated; filter: drop-shadow(4px 4px 0 #04121c); }
.crate.hit { animation: bump 260ms steps(3, end); }
@keyframes bump { 50% { transform: translateY(-16px) } }
.reward { opacity: 0; transform: translateY(20px); transition: opacity 360ms steps(4, end), transform 360ms steps(4, end); margin-bottom: 10px; }
.reward.out { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .crate.hit { animation: none } .reward { transition: none } }
</style>
