<script setup lang="ts">
// Mean ns/op from examples/bench-output.txt, n=4096 float32, Ryzen 9 7950X3D.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 99 })

const rows = [
  { name: 'scalar loop', ns: 3283, tone: 'muted' },
  { name: 'AVX2 assembly', ns: 316, tone: 'pink' },
  { name: 'simd (portable)', ns: 308, tone: 'blue' },
  { name: 'archsimd AVX2', ns: 313, tone: 'sky' },
]
const max = Math.max(...rows.map(r => r.ns))
const pixels = 36
const blocks = (ns: number) => Math.max(1, Math.round(pixels * ns / max))
</script>

<template>
  <div class="bench">
    <div v-for="(r, i) in rows" :key="r.name" class="bench-row" :class="{ shown: props.step >= i }">
      <span class="bench-name">{{ r.name }}</span>
      <span class="bench-bar">
        <i v-for="n in blocks(r.ns)" :key="n" :class="r.tone" :style="{ transitionDelay: `${n * 12}ms` }" />
      </span>
      <span class="bench-ns">{{ r.ns.toLocaleString('en-GB') }} ns</span>
    </div>
  </div>
</template>

<style scoped>
.bench { display: grid; gap: 18px; }
.bench-row { display: grid; grid-template-columns: 260px 1fr 150px; padding-right: 8px; align-items: center; gap: 20px; }
.bench-name { font: 700 26px var(--arc-pixel); letter-spacing: .04em; }
.bench-ns { font: 700 26px var(--arc-pixel); color: var(--arc-yellow); text-align: right; }
.bench-bar { display: flex; gap: 3px; }
.bench-bar i { width: 16px; height: 36px; opacity: 0; transition: opacity 80ms steps(1, end); }
.shown .bench-bar i { opacity: 1; }
.bench-row:not(.shown) .bench-ns, .bench-row:not(.shown) .bench-name { opacity: .2; }
.muted { background: var(--arc-muted); }
.pink { background: var(--arc-pink); }
.blue { background: var(--arc-blue); }
.sky { background: var(--arc-sky); }
</style>
