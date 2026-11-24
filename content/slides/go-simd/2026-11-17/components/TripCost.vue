<script setup lang="ts">
// Why ~10× and not 8×: instructions per 8 floats, from the compiled AddScalar vs the hand-written AVX2 loop.
// Lanes: each load/add/store moves 8 floats. Overhead: the loop's bookkeeping is paid once per 8, not per float.
withDefaults(defineProps<{ on?: boolean }>(), { on: false })
const rows = [
  { who: 'scalar', work: ['load 1', 'add 1', 'store 1'], tax: ['i++', 'check', 'bounds', 'bounds'], times: '× 8' },
  { who: 'simd', work: ['load 8', 'add 8', 'store 8'], tax: ['i++', 'check'], times: '× 1' },
]
</script>

<template>
  <div class="trips" :class="{ on }">
    <p class="head">per 8 floats</p>
    <div v-for="r in rows" :key="r.who" class="row">
      <span class="who">{{ r.who }}</span>
      <span class="chips">
        <i v-for="w in r.work" :key="w" class="work">{{ w }}</i>
        <i v-for="(t, n) in r.tax" :key="n" class="tax">{{ t }}</i>
      </span>
      <span class="times">{{ r.times }}</span>
    </div>
    <p class="sum"><b>8×</b> from lanes · <b>~2×</b> less loop overhead · <b>≈ 10×</b></p>
  </div>
</template>

<style scoped>
.trips { display: grid; gap: 14px; margin-top: 30px; opacity: 0; transition: opacity 160ms steps(2, end); }
.trips:not(.on) { display: none; }
.trips.on { opacity: 1; }
.head { margin: 0 0 0 126px; font: 500 16px var(--arc-pixel); letter-spacing: .1em; text-transform: uppercase; color: var(--arc-muted); }
.row { display: grid; grid-template-columns: 110px auto 1fr; align-items: center; gap: 16px; }
.who { font: 700 22px var(--arc-pixel); text-align: right; }
.chips { display: flex; gap: 4px; }
.chips i { font: 600 17px var(--arc-mono); font-style: normal; padding: 2px 8px; color: #04121c; outline: 2px solid #04121c; }
.work { background: var(--arc-yellow); }
.tax { background: var(--arc-pink); color: #fff !important; }
.times { font: 700 22px var(--arc-pixel); color: var(--arc-yellow); }
.sum { margin: 6px 0 0 126px; font: 600 20px var(--arc-mono); }
.sum b { color: var(--arc-yellow); }
</style>
