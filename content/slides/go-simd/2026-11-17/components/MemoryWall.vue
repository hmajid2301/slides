<script setup lang="ts">
import { computed } from 'vue'

// Timeline for 64 floats. LOAD/STORE track = moving data through the cache,
// ADD track = the vector unit. Wider registers shrink the adds, not the data.
// 0: empty · 1: 8 lanes · 2: 16 lanes · 3: highlight idle time
// Road-crossing nod at step 3: traffic streams along LOAD/STORE, a frog on the ADD lane waits, then hops to the next add.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => props.step)

const x0 = 230
const span = 600
const add = 14
const runs = [
  { y: 30, name: '8 LANES', chunks: 8, from: 1, ns: '329 ns' },
  { y: 190, name: '16 LANES', chunks: 4, from: 2, ns: '308 ns' },
]
// Original 8×7 frog.
const frog = [
  '.XX..XX.',
  'XEXXXXEX',
  'XXXXXXXX',
  '.XXXXXX.',
  'XXXXXXXX',
  'X.XXXX.X',
  'XX....XX',
].flatMap((r, y) => [...r].flatMap((c, x) => c === '.' ? [] : [{ x, y, eye: c === 'E' }]))
const slots = (chunks: number) => Array.from({ length: chunks }, (_, i) => {
  const w = span / chunks
  return { x: x0 + i * w, w }
})
</script>

<template>
  <svg class="memory-wall" viewBox="0 0 960 360" shape-rendering="crispEdges" role="img"
    aria-label="With 8 or 16 lanes, loads and stores take the same time; only the short adds shrink">
    <g v-for="r in runs" :key="r.name" class="run" :class="{ on: s >= r.from }">
      <text x="20" :y="r.y + 22" class="name">{{ r.name }}</text>
      <text :x="x0 - 16" :y="r.y + 58" text-anchor="end" class="track">LOAD/STORE</text>
      <text :x="x0 - 16" :y="r.y + 108" text-anchor="end" class="track">ADD</text>
      <rect :x="x0" :y="r.y + 36" :width="span" height="34" class="lane-bg" />
      <rect :x="x0" :y="r.y + 86" :width="span" height="34" class="lane-bg" :class="{ idle: s >= 3 }" />
      <g v-for="(c, i) in slots(r.chunks)" :key="i" class="chunk" :style="{ transitionDelay: `${i * 70}ms` }">
        <rect :x="c.x + 2" :y="r.y + 38" :width="c.w - 4" height="30" class="mem" />
        <rect :x="c.x + c.w - add - 2" :y="r.y + 88" :width="add" height="30" class="alu" />
      </g>
      <text :x="x0 + span + 18" :y="r.y + 108" class="ns">{{ r.ns }}</text>
      <g v-if="s >= 3 && r.chunks === 4" class="road" aria-hidden="true">
        <clipPath id="mw-road"><rect :x="x0" :y="r.y + 36" :width="span" height="34" /></clipPath>
        <g clip-path="url(#mw-road)">
          <rect v-for="k in 12" :key="k" :x="x0 + (k - 2) * 60" :y="r.y + 50" width="26" height="6" class="car" />
        </g>
        <g class="frog" :style="{ '--fx': `${x0 + 96}px`, '--fy': `${r.y + 89}px` }">
          <rect v-for="(p, i) in frog" :key="i" :x="p.x * 4" :y="p.y * 4" width="4" height="4" :class="p.eye ? 'eye' : 'skin'" />
        </g>
      </g>
    </g>
    <text :x="x0 + span / 2" y="352" text-anchor="middle" class="caption" :class="{ on: s >= 3 }">
      the adds got faster · the data didn't
    </text>
  </svg>
</template>

<style scoped>
.memory-wall { width: 100%; max-width: 980px; height: auto; }
.run { opacity: .2; transition: opacity 200ms steps(2, end); }
.run.on { opacity: 1; }
.name { font: 700 24px var(--arc-pixel); fill: var(--arc-yellow); letter-spacing: .1em; }
.track { font: 700 20px var(--arc-pixel); letter-spacing: .06em; fill: #eaf2ff; }
.lane-bg { fill: #0b1b2bcc; stroke: #04121c; stroke-width: 3; }
.lane-bg.idle { fill: #3a1830; stroke: #ff7aa2; animation: blink 700ms steps(2, jump-none) infinite; }
.mem { fill: var(--arc-blue); stroke: #04121c; stroke-width: 2; }
.alu { fill: var(--arc-yellow); stroke: #04121c; stroke-width: 2; }
.chunk { opacity: 0; transition: opacity 120ms steps(2, end); }
.run.on .chunk { opacity: 1; }
.car { fill: #fff; opacity: .85; animation: traffic 900ms linear infinite; }
@keyframes traffic { to { transform: translateX(60px) } }
.skin { fill: #7ee787; stroke: #04121c; stroke-width: .5; }
.eye { fill: #04121c; }
/* Waits beside each add, then hops to the next one; slots are 150 px apart. */
.frog { transform: translate(var(--fx), var(--fy)); animation: hop 4s steps(1, end) infinite; }
@keyframes hop {
  0% { transform: translate(var(--fx), var(--fy)) }
  20% { transform: translate(calc(var(--fx) + 70px), calc(var(--fy) - 14px)) }
  24% { transform: translate(calc(var(--fx) + 150px), var(--fy)) }
  45% { transform: translate(calc(var(--fx) + 220px), calc(var(--fy) - 14px)) }
  49% { transform: translate(calc(var(--fx) + 300px), var(--fy)) }
  70% { transform: translate(calc(var(--fx) + 370px), calc(var(--fy) - 14px)) }
  74% { transform: translate(calc(var(--fx) + 450px), var(--fy)) }
  96% { transform: translate(calc(var(--fx) + 450px), var(--fy)) }
}
.ns { font: 700 24px var(--arc-pixel); fill: #fff; }
.caption { font: 700 26px var(--arc-pixel); fill: #fff; opacity: 0; letter-spacing: .06em; }
.caption.on { opacity: 1; }
@keyframes blink { 50% { opacity: .55 } }
@media (prefers-reduced-motion: reduce) { .lane-bg.idle, .car, .frog { animation: none } .chunk, .run { transition: none } }
</style>
