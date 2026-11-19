<script setup lang="ts">
// Register widths as pixel bars: one block = one float32 lane.
const rungs = [
  { bits: 32, lanes: 1, name: 'plain Go loop', tone: 'grey' },
  { bits: 128, lanes: 4, name: 'SSE · NEON', tone: 'blue' },
  { bits: 256, lanes: 8, name: 'AVX2', tone: 'green' },
  { bits: 512, lanes: 16, name: 'AVX-512', tone: 'yellow' },
]
</script>

<template>
  <div class="ladder" role="img" aria-label="Register widths: 1, 4, 8 or 16 float32 lanes">
    <div v-for="(r, i) in rungs" :key="r.bits" class="rung" :style="{ animationDelay: `${i * 180}ms` }">
      <span class="bits">{{ r.bits }}-bit</span>
      <span class="lanes"><i v-for="n in r.lanes" :key="n" :class="r.tone" /><b class="count">×{{ r.lanes }}</b></span>
      <span class="name">{{ r.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.ladder { display: grid; gap: 16px; }
.rung { display: grid; grid-template-columns: 110px auto 1fr; align-items: center; gap: 18px; animation: drop 360ms steps(4, end) both; }
.bits { font: 700 22px var(--arc-pixel); color: #fff; text-shadow: 2px 2px 0 #04121c; }
.lanes { display: flex; gap: 3px; align-items: center; width: 640px; }
.lanes i { width: 32px; height: 40px; outline: 3px solid #04121c; }
.grey { background: #e8f6fb; } .blue { background: #00add8; } .green { background: #7ee787; } .yellow { background: #fddd00; }
.count { margin-left: 14px; font: 700 28px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; }
.name { font: 600 22px var(--arc-mono); color: #fff; display: flex; flex-direction: column; }
@keyframes drop { from { opacity: 0; transform: translateY(-24px) } }
@media (prefers-reduced-motion: reduce) { .rung { animation: none } }
</style>
