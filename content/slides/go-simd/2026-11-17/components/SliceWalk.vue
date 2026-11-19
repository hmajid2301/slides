<script setup lang="ts">
import { computed } from 'vue'

// 20 floats walked in chunks of n = 8 (AVX2). Clicks:
// 0 slice · 1 chunk 1 · 2 chunk 2 · 3 tail (4 left, LoadPart pads 4 zeros) · 4 done
// Falling-blocks nod: the current chunk drops in as a line, then flash-clears when done.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const len = 20
const n = 8
const cell = 44
const x0 = 40
// Chunk c (0, 1, 2) is "now" on click c + 1 and "done" after it.
const state = (i: number) => {
  const c = Math.floor(i / n)
  return props.step - 1 === c ? 'now' : props.step - 1 > c ? 'done' : ''
}
const cursorX = computed(() => x0 + Math.min(props.step - 1, 2) * n * (cell + 4))
const label = computed(() => [
  'len(dst) = 20, n = v.Len() = 8',
  'i = 0 · LoadFloat32s(a[0:8]) · Add · Store',
  'i = 8 · LoadFloat32s(a[8:16]) · Add · Store',
  'i = 16 · only 4 left → LoadFloat32sPart pads with 0s',
  '3 vector adds instead of 20 scalar adds',
][Math.min(props.step, 4)])
</script>

<template>
  <svg class="walk" viewBox="0 0 1200 250" shape-rendering="crispEdges" role="img"
    aria-label="A 20 element slice processed as two full 8-lane chunks and one partial tail">
    <g v-for="i in len" :key="i">
      <rect :x="x0 + (i - 1) * (cell + 4)" y="70" :width="cell" :height="cell" class="cell" :class="state(i - 1)" />
      <text :x="x0 + (i - 1) * (cell + 4) + cell / 2" y="100" text-anchor="middle" class="idx">{{ i - 1 }}</text>
    </g>
    <g v-if="step === 3">
      <rect v-for="p in 4" :key="p" :x="x0 + (len + p - 1) * (cell + 4)" y="70" :width="cell" :height="cell" class="cell pad" />
      <text v-for="p in 4" :key="`t${p}`" :x="x0 + (len + p - 1) * (cell + 4) + cell / 2" y="100" text-anchor="middle" class="idx pad-t">0</text>
    </g>
    <g v-if="step >= 1 && step <= 3" class="cursor" :style="{ transform: `translateX(${cursorX - x0}px)` }">
      <rect :x="x0 - 6" y="58" :width="n * (cell + 4) + 8" :height="cell + 24" class="frame" />
      <text :x="x0" y="48" class="frame-t">{{ step === 3 ? 'PART' : `CHUNK ${step}` }}</text>
    </g>
    <text :x="x0" y="190" class="caption">{{ label }}</text>
    <text v-if="step >= 4" x="1160" y="190" text-anchor="end" class="combo">COMBO ×3!</text>
    <text v-if="step >= 2 && step <= 4" :key="`line${step}`" :x="x0 + (Math.min(step, 4) - 2) * n * (cell + 4) + 4 * (cell + 4)" y="148"
      text-anchor="middle" class="line-pop">LINE!</text>
  </svg>
</template>

<style scoped>
.walk { width: 100%; height: auto; overflow: visible; }
.cell { fill: var(--arc-panel); stroke: var(--arc-line); stroke-width: 3; transition: fill 160ms steps(2, end); }
.cell.now { fill: var(--arc-yellow); animation: drop 300ms steps(5, end) both; }
.cell.done { fill: #7ee787; animation: clear 360ms steps(1, end) both; }
.cell.pad { animation: drop 300ms steps(5, end) both; }
@keyframes drop { from { transform: translateY(-60px) } }
@keyframes clear { 0%, 50% { fill: #fff } 25%, 75% { fill: var(--arc-yellow) } }
.line-pop { font: 700 24px var(--arc-pixel); fill: #fff; stroke: #04121c; stroke-width: 6; paint-order: stroke; letter-spacing: .1em; animation: pop 700ms steps(7, end) both; }
@keyframes pop { 0% { opacity: 0; transform: translateY(12px) } 20% { opacity: 1 } 80% { opacity: 1 } 100% { opacity: 0; transform: translateY(-16px) } }
@media (prefers-reduced-motion: reduce) { .cell.now, .cell.done, .cell.pad, .line-pop { animation: none } .line-pop { display: none } }
.cell.pad { fill: none; stroke: var(--arc-hud); stroke-dasharray: 6 4; }
.idx { font: 600 18px var(--arc-mono); fill: var(--arc-ink); pointer-events: none; }
.cell.now + .idx, .cell.done + .idx { fill: #0b1b2b; }
.pad-t { fill: var(--arc-hud); }
.cursor { transition: transform 300ms steps(6, end); }
.frame { fill: none; stroke: var(--arc-ink); stroke-width: 4; }
.frame-t { font: 700 20px var(--arc-pixel); fill: var(--arc-ink); letter-spacing: .1em; }
.caption { font: 600 24px var(--arc-mono); fill: var(--arc-ink); }
.combo { font: 700 30px var(--arc-pixel); fill: var(--arc-yellow); }
</style>
