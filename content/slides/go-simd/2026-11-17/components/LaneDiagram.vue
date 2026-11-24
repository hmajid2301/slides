<script setup lang="ts">
import { computed } from 'vue'
import { a, b, fmt } from './laneValues'

// Simplified: a register drawn with 8 float32 lanes (real width varies by CPU: 4, 8 or 16).
// step 0: empty registers · 1: scalar (1 lane) · 2: load 8 lanes · 3: add all 8
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => props.step)

const cell = 72
const gap = 8
const x0 = 190
const xs = a.map((_, i) => x0 + i * (cell + gap))
const rows = [
  { y: 20, label: 'Z0 · a[i:i+8]' },
  { y: 120, label: 'Z1 · b[i:i+8]' },
  { y: 250, label: 'Z0 + Z1' },
]

const scalar = computed(() => s.value === 1)
const loaded = (i: number) => s.value >= 2 || (scalar.value && i === 0)
const added = (i: number) => s.value >= 3 || (scalar.value && i === 0)
// Instruction counter (the old "race"): adds needed for these 8 pairs.
const tally = [
  { y: 392, name: 'SCALAR', count: 8, from: 1 }, // from = click
  { y: 432, name: 'SIMD', count: 1, from: 3 },
]
</script>

<template>
  <svg class="lane-diagram" viewBox="0 0 840 450" shape-rendering="crispEdges"
    role="img" aria-label="Two registers of eight float32 lanes added in one instruction">
    <g v-for="(row, r) in rows" :key="r">
      <text :x="x0 - 16" :y="row.y + 44" text-anchor="end" class="reg">{{ row.label }}</text>
      <g v-for="(x, i) in xs" :key="i">
        <rect :x="x" :y="row.y" :width="cell" :height="cell" class="slot" />
        <rect v-if="r < 2 ? loaded(i) : added(i)" :x="x + 6" :y="row.y + 6"
          :width="cell - 12" :height="cell - 12"
          :class="['fill', r === 2 ? 'sum' : r === 0 ? 'a' : 'b']"
          :style="{ transitionDelay: scalar ? '0ms' : `${i * 40}ms` }" />
        <text v-if="r < 2 ? loaded(i) : added(i)" :x="x + cell / 2" :y="row.y + 46"
          text-anchor="middle" class="val">{{ fmt(r === 0 ? a[i] : r === 1 ? b[i] : a[i] + b[i]) }}</text>
      </g>
    </g>
    <text :x="x0 + 4 * (cell + gap) - gap / 2" y="226" text-anchor="middle" class="op"
      :class="{ on: s >= 1 }">{{ s === 1 ? 'normal ADD = 1 number' : 'SIMD ADD = 8 numbers, 1 instruction' }}</text>
    <text :x="x0" y="352" class="bits">◀ 8 lanes × float32 ▶</text>
    <g v-for="t in tally" :key="t.name" :class="['tally', { on: s >= t.from }]">
      <text :x="x0 - 16" :y="t.y" text-anchor="end" class="reg">{{ t.name }}</text>
      <rect v-for="n in t.count" :key="n" :x="x0 + (n - 1) * 30" :y="t.y - 20" width="22" height="22"
        :style="{ transitionDelay: `${n * 120}ms` }" />
      <text :x="x0 + 8 * 30 + 12" :y="t.y" class="count">{{ t.count }} add instruction{{ t.count > 1 ? 's' : '' }}</text>
    </g>
  </svg>
</template>

<style scoped>
.lane-diagram { width: 100%; max-width: 860px; height: auto; }
.slot { fill: var(--arc-panel); stroke: var(--arc-line); stroke-width: 3; vector-effect: non-scaling-stroke; }
.fill { transition: opacity 160ms steps(2, end); }
.fill.a { fill: var(--arc-blue); }
.fill.b { fill: var(--arc-sky); }
.fill.sum { fill: var(--arc-yellow); }
.val { font: 700 22px var(--arc-mono); fill: var(--arc-bg); }
.reg { font: 500 18px var(--arc-mono); fill: var(--arc-muted); }
.op { font: 700 24px var(--arc-pixel); fill: var(--arc-line); letter-spacing: .06em; }
.op.on { fill: var(--arc-hud); }
.tally { opacity: .25; }
.tally rect { fill: var(--arc-line); transition: fill 120ms steps(1, end); }
.tally.on { opacity: 1; }
.tally.on rect { fill: var(--arc-yellow); }
.count { font: 700 20px var(--arc-pixel); fill: var(--arc-ink); letter-spacing: .06em; }
.bits { font: 500 18px var(--arc-pixel); fill: var(--arc-muted); letter-spacing: .1em; }

</style>
