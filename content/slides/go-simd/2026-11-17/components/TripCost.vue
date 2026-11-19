<script setup lang="ts">
// Why more than 8×: every loop trip pays fixed overhead (bounds check + jump).
// Scalar pays it per float; SIMD pays it once per 8. Both rows show 16 floats.
withDefaults(defineProps<{ on?: boolean }>(), { on: false })
const scalarTrips = 16
const simdTrips = 2
</script>

<template>
  <div class="trips" :class="{ on }" aria-label="Scalar: 16 trips, each with an add and overhead. SIMD: 2 trips covering 8 floats each.">
    <div class="row">
      <span class="who">scalar</span>
      <span class="track">
        <span v-for="t in scalarTrips" :key="t" class="trip" :style="{ animationDelay: `${t * 40}ms` }"><i class="add" /><i class="tax" /></span>
      </span>
    </div>
    <div class="row">
      <span class="who">simd</span>
      <span class="track">
        <span v-for="t in simdTrips" :key="t" class="trip wide" :style="{ animationDelay: `${t * 40}ms` }"><i class="add" /><i class="tax" /></span>
      </span>
    </div>
    <div class="key"><i class="add" />add <i class="tax" />check + jump</div>
  </div>
</template>

<style scoped>
.trips { display: grid; gap: 8px; margin-top: 16px; opacity: 0; transition: opacity 160ms steps(2, end); }
.trips.on { opacity: 1; }
.row { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 16px; }
.who { font: 700 22px var(--arc-pixel); text-align: right; }
.track { display: flex; gap: 3px; }
.trip { display: flex; gap: 2px; }
.on .trip { animation: in 120ms steps(2, end) both; }
@keyframes in { from { opacity: 0 } }
.trip i, .key i { display: inline-block; height: 22px; outline: 2px solid #04121c; }
.add { width: 14px; background: var(--arc-yellow); }
.wide .add { width: 128px; }
.tax { width: 20px; background: var(--arc-pink); }
.key { display: flex; align-items: center; gap: 8px; margin-left: 126px; font: 500 19px var(--arc-pixel); letter-spacing: .08em; }
.key i { height: 14px; margin-left: 10px; }
.key .add { width: 14px; }
@media (prefers-reduced-motion: reduce) { .on .trip { animation: none } }
</style>
