<script setup lang="ts">
// Vampire-hunter nod for the high-scores intermission: whip a wall to reveal a hidden reward.
// Plays each time the slide becomes active.
import { ref, watch } from 'vue'
import { useIsSlideActive } from '@slidev/client'
import PixelGopher from './PixelGopher.vue'

const active = useIsSlideActive()
const run = ref(0)
watch(active, on => { if (on) run.value++ }, { immediate: true })
// 4×3 wall; brick 5 (row 1, col 1) is the breakable one.
const bricks = Array.from({ length: 12 }, (_, i) => ({ x: (i % 4) * 34 + (Math.floor(i / 4) % 2 ? 17 : 0), y: Math.floor(i / 4) * 22 }))
</script>

<template>
  <div :key="run" class="whip-wall" aria-hidden="true">
    <div class="hunter"><PixelGopher :size="64" /></div>
    <i class="whip" />
    <svg class="wall" viewBox="0 0 153 66" width="153" height="66" shape-rendering="crispEdges">
      <rect v-for="(b, i) in bricks" :key="i" :x="b.x" :y="b.y" width="32" height="20"
        :class="['brick', { weak: i === 5 }]" />
    </svg>
    <svg class="roast" viewBox="0 0 12 8" width="48" height="32" shape-rendering="crispEdges">
      <rect x="0" y="3" width="3" height="2" fill="#fff" /><rect x="0" y="2" width="1" height="1" fill="#fff" /><rect x="0" y="5" width="1" height="1" fill="#fff" />
      <rect x="3" y="2" width="8" height="5" fill="#b5541c" /><rect x="4" y="1" width="6" height="1" fill="#b5541c" />
      <rect x="5" y="2" width="4" height="2" fill="#e08a3c" />
    </svg>
  </div>
</template>

<style scoped>
.whip-wall { position: relative; height: 96px; margin-top: 18px; }
.hunter { position: absolute; left: 0; bottom: 0; animation: wind 500ms steps(2, end) 300ms both; }
.whip {
  position: absolute; left: 62px; bottom: 34px; width: 150px; height: 6px; background: #c9a36b;
  outline: 2px solid #04121c; transform-origin: left; transform: scaleX(0);
  animation: crack 360ms steps(4, end) 800ms both;
}
.wall { position: absolute; left: 190px; bottom: 0; }
.brick { fill: #6b7a8f; stroke: #04121c; stroke-width: 2; }
.weak { animation: crumble 300ms steps(3, end) 1060ms both; }
.roast { position: absolute; left: 240px; bottom: 22px; opacity: 0; filter: drop-shadow(2px 2px 0 #04121c); animation: reveal 700ms steps(7, end) 1300ms both; }
@keyframes wind { 50% { transform: translateX(-6px) } }
@keyframes crack { 0% { transform: scaleX(0) } 60% { transform: scaleX(1) } 100% { transform: scaleX(0) } }
@keyframes crumble { 0% { fill: #6b7a8f } 1% { fill: #fff } 60% { transform: translateY(8px); opacity: .5 } 100% { transform: translateY(40px); opacity: 0 } }
@keyframes reveal { 0% { opacity: 0 } 1% { opacity: 1; transform: translateY(0) } 40% { opacity: 1; transform: translateY(-26px) } 100% { opacity: 1; transform: translateY(-4px) } }
@media (prefers-reduced-motion: reduce) {
  .hunter, .whip { animation: none } .weak { animation: none; opacity: 0 } .roast { animation: none; opacity: 1 }
}
</style>
