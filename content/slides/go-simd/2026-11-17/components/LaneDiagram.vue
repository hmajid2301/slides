<script setup lang="ts">
import { computed } from 'vue'

// step 0: Z0 as 16 lanes, low half marked Y0 · 1: zoom into Y0, rows appear
// 2: scalar (1 lane) · 3: load 8 lanes · 4: add all 8
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => props.step - 1) // lane story starts after the zoom
const zoomed = computed(() => props.step >= 1)

const a = [1, 2, 3, 4, 5, 6, 7, 8]
const b = [10, 20, 30, 40, 50, 60, 70, 80]
const cell = 72
const gap = 8
const x0 = 190
const xs = a.map((_, i) => x0 + i * (cell + gap))
const rows = [
  { y: 20, label: 'Y0 · a[i:i+8]' },
  { y: 120, label: 'Y1 · b[i:i+8]' },
  { y: 250, label: 'Y0 + Y1' },
]

const scalar = computed(() => s.value === 1)
const loaded = (i: number) => s.value >= 2 || (scalar.value && i === 0)
const added = (i: number) => s.value >= 3 || (scalar.value && i === 0)
// Z0 = the Y0 row plus 8 more lanes to its left (bits 511..256), drawn off-canvas.
// Zoomed out at half size it fits centred; zooming in pushes the high half off the left edge.
const hi = a.map((_, i) => x0 - (8 - i) * (cell + gap))
const zoomOut = 'translate(327px, 95px) scale(.5)'
// Instruction counter (the old "race"): adds needed for these 8 pairs.
const tally = [
  { y: 392, name: 'SCALAR', count: 8, from: 1 }, // from = lane-story step
  { y: 432, name: 'SIMD', count: 1, from: 3 },
]
</script>

<template>
  <svg class="lane-diagram" viewBox="0 0 840 450" shape-rendering="crispEdges"
    role="img" :class="{ zoomed }" aria-label="Zoom from 512-bit Z0 into its lower half Y0, then two 256-bit registers of eight float32 lanes added in one instruction">
    <g class="z0-intro" :class="{ gone: zoomed }">
      <text x="92" y="130" text-anchor="end" class="zlabel">Z0</text>
      <path d="M420 152 v10 h318 v-10" class="bracket" />
      <text x="579" y="196" text-anchor="middle" class="zlabel hot">Y0</text>
    </g>
    <g class="zoom" :class="{ zoomed }" :style="{ transform: zoomed ? 'none' : zoomOut }">
      <rect v-for="(x, i) in hi" :key="i" :x="x" :y="rows[0].y" :width="cell" :height="cell" class="slot ghost" />
    </g>
    <g v-for="(row, r) in rows" :key="r" :class="{ zoom: r === 0, zoomed, later: r > 0 }"
      :style="r === 0 ? { transform: zoomed ? 'none' : zoomOut } : undefined">
      <text :x="x0 - 16" :y="row.y + 44" text-anchor="end" class="reg">{{ row.label }}</text>
      <g v-for="(x, i) in xs" :key="i">
        <rect :x="x" :y="row.y" :width="cell" :height="cell" :class="['slot', { y0: r === 0 && !zoomed }]" />
        <rect v-if="r < 2 ? loaded(i) : added(i)" :x="x + 6" :y="row.y + 6"
          :width="cell - 12" :height="cell - 12"
          :class="['fill', r === 2 ? 'sum' : r === 0 ? 'a' : 'b']"
          :style="{ transitionDelay: scalar ? '0ms' : `${i * 40}ms` }" />
        <text v-if="r < 2 ? loaded(i) : added(i)" :x="x + cell / 2" :y="row.y + 46"
          text-anchor="middle" class="val">{{ r === 0 ? a[i] : r === 1 ? b[i] : a[i] + b[i] }}</text>
      </g>
    </g>
    <text :x="x0 + 4 * (cell + gap) - gap / 2" y="226" text-anchor="middle" class="op later"
      :class="{ on: s >= 1 }">{{ s === 1 ? 'ADDSS = add 1 number' : 'VADDPS = add 8 numbers, 1 instruction' }}</text>
    <text :x="x0" y="352" class="bits later">◀ 256 bits = 8 × float32 ▶</text>
    <g v-for="t in tally" :key="t.name" :class="['tally', 'later', { on: s >= t.from }]">
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
.slot.ghost { fill: #0b1b2b; transition: opacity 300ms steps(3, end) 300ms; }
.zoomed .slot.ghost { opacity: 0; }
.slot.y0 { stroke: var(--arc-yellow); animation: pulse 700ms steps(2, jump-none) infinite; }
@keyframes pulse { 50% { stroke: var(--arc-line) } }
.zoom { transform-box: view-box; transform-origin: 0 0; transition: transform 600ms steps(8, end); }
.zoom .reg { opacity: 0; transition: opacity 120ms steps(2, end) 600ms; }
.zoom.zoomed .reg { opacity: 1; }
.later { transition: opacity 160ms steps(2, end) 600ms; }
svg:not(.zoomed) .later { opacity: 0; transition: none; }
.z0-intro { transition: opacity 120ms steps(2, end); }
.z0-intro.gone { opacity: 0; }
.zlabel { font: 700 32px var(--arc-pixel); fill: var(--arc-ink); letter-spacing: .06em; }
.zlabel.hot { fill: var(--arc-yellow); }
.bracket { fill: none; stroke: var(--arc-yellow); stroke-width: 4; }
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
@media (prefers-reduced-motion: reduce) { .zoom, .later { transition: none } .slot.y0 { animation: none } }
</style>
