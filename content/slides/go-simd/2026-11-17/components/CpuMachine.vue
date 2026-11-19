<script setup lang="ts">
import { computed } from 'vue'

// Memory ↔ CPU, one click per instruction. Numbers hop between boxes.
// 0 idle · 1 load a → Y0 · 2 load b → Y1 · 3 add · 4 store → dst
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => props.step)

const a = [1, 2, 3, 4, 5, 6, 7, 8]
const b = [10, 20, 30, 40, 50, 60, 70, 80]
const cell = 38
const gap = 4
const memX = 70
const regX = 470
const x = (base: number, i: number) => base + i * (cell + gap)
const rows = { a: 70, b: 150, dst: 300, y0: 120, y1: 210 }

const code = [
  ['VMOVUPS', 'a, Y0', 'load'],
  ['VMOVUPS', 'b, Y1', 'load'],
  ['VADDPS', 'Y1, Y0, Y0', 'add ×8'],
  ['VMOVUPS', 'Y0, dst', 'store'],
]
const caption = computed(() => [
  '<b>memory</b> → <b>registers</b>',
  '<b>LOAD</b> a → Y0',
  '<b>LOAD</b> b → Y1',
  '<b>ADD</b> · 8 sums',
  '<b>STORE</b> → dst',
][Math.min(s.value, 4)])

// Each number is a token that sits in memory, then hops into a register.
const at = (px: number, py: number) => ({ transform: `translate(${px}px, ${py}px)` })
const aTok = (i: number) => s.value >= 1 ? at(x(regX, i), rows.y0) : at(x(memX, i), rows.a)
const bTok = (i: number) => s.value >= 3 ? at(x(regX, i), rows.y0)
  : s.value >= 2 ? at(x(regX, i), rows.y1) : at(x(memX, i), rows.b)
const lag = (i: number) => ({ transitionDelay: `${(i - 1) * 45}ms` })
const outTok = (i: number) => s.value >= 4 ? at(x(memX, i), rows.dst) : at(x(regX, i), rows.y0)
</script>

<template>
  <div class="cpu-machine">
    <div class="listing" aria-label="Simplified AVX2 assembly">
      <p class="tag">add_amd64.s · simplified</p>
      <div v-for="(l, i) in code" :key="i" class="asm" :class="{ now: s === i + 1, done: s > i + 1 }">
        <span class="ptr">▶</span><span class="op">{{ l[0] }}</span> <span class="args">{{ l[1] }}</span>
        <span class="what">{{ l[2] }}</span>
      </div>
    </div>

    <svg viewBox="0 0 860 370" shape-rendering="crispEdges" role="img"
      aria-label="Eight floats load from memory into CPU registers, add in one step, and store back">
      <!-- memory stick -->
      <rect x="20" y="30" width="370" height="320" class="ram" />
      <rect v-for="p in 9" :key="`rp${p}`" :x="20 + p * 38" y="350" width="16" height="12" class="pin" />
      <text x="36" y="56" class="title">MEMORY</text>
      <text :x="memX - 12" :y="rows.a + 26" text-anchor="end" class="lbl">a</text>
      <text :x="memX - 12" :y="rows.b + 26" text-anchor="end" class="lbl">b</text>
      <text :x="memX - 12" :y="rows.dst + 26" text-anchor="end" class="lbl">dst</text>
      <template v-for="i in 8" :key="`m${i}`">
        <rect :x="x(memX, i - 1)" :y="rows.a" :width="cell" :height="cell" class="slot" />
        <rect :x="x(memX, i - 1)" :y="rows.b" :width="cell" :height="cell" class="slot" />
        <rect :x="x(memX, i - 1)" :y="rows.dst" :width="cell" :height="cell" class="slot" />
      </template>

      <!-- bus -->
      <rect x="390" y="180" width="44" height="16" class="bus" :class="{ on: s >= 1 && s !== 3 }" />

      <!-- CPU chip -->
      <g class="chip">
        <rect v-for="p in 8" :key="`ct${p}`" :x="440 + p * 42" y="22" width="14" height="14" class="pin" />
        <rect v-for="p in 8" :key="`cb${p}`" :x="440 + p * 42" y="334" width="14" height="14" class="pin" />
        <rect x="434" y="36" width="410" height="298" class="die" />
        <text x="452" y="66" class="title">CPU</text>
        <text x="830" y="66" text-anchor="end" class="clock" :class="{ tick: s > 0 }">STEP {{ Math.min(s, 4) }}</text>
        <text :x="regX - 10" :y="rows.y0 + 26" text-anchor="end" class="lbl">Y0</text>
        <text :x="regX - 10" :y="rows.y1 + 26" text-anchor="end" class="lbl">Y1</text>
        <template v-for="i in 8" :key="`r${i}`">
          <rect :x="x(regX, i - 1)" :y="rows.y0" :width="cell" :height="cell" class="slot reg" />
          <rect :x="x(regX, i - 1)" :y="rows.y1" :width="cell" :height="cell" class="slot reg" />
        </template>
        <text :x="x(regX, 4) - gap / 2" :y="rows.y1 + 86" text-anchor="middle" class="alu" :class="{ hot: s === 3 }">
          {{ s === 3 ? '+ + + + + + + +' : '◀ 256 bits ▶' }}
        </text>
      </g>

      <!-- tokens (drawn last so they fly over everything) -->
      <g v-for="i in 8" :key="`t${i}`">
        <g class="tok" :style="[bTok(i - 1), lag(i)]" :class="{ gone: s >= 3 }">
          <rect :width="cell" :height="cell" class="chipval b" />
          <text :x="cell / 2" y="26" text-anchor="middle" class="num">{{ b[i - 1] }}</text>
        </g>
        <g class="tok" :style="[aTok(i - 1), lag(i)]">
          <rect :width="cell" :height="cell" class="chipval" :class="s >= 3 ? 'sum' : 'a'" />
          <text :x="cell / 2" y="26" text-anchor="middle" class="num">{{ s >= 3 ? a[i - 1] + b[i - 1] : a[i - 1] }}</text>
        </g>
        <g v-if="s >= 3" class="tok" :style="[outTok(i - 1), lag(i)]">
          <rect :width="cell" :height="cell" class="chipval sum" />
          <text :x="cell / 2" y="26" text-anchor="middle" class="num">{{ a[i - 1] + b[i - 1] }}</text>
        </g>
      </g>
    </svg>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="caption" v-html="caption" />
  </div>
</template>

<style scoped>
.cpu-machine { display: grid; grid-template-columns: 330px 1fr; grid-template-rows: auto auto; gap: 8px 28px; align-items: center; }
svg { width: 100%; height: auto; }
.caption { grid-column: 1 / -1; margin: 0; font: 500 26px var(--arc-mono); text-align: center; min-height: 1.4em; }
.caption :deep(b) { color: var(--arc-yellow); }

.listing { background: var(--arc-panel); border: 4px solid #fff; outline: 4px solid var(--arc-shadow); box-shadow: 8px 8px 0 var(--arc-shadow); padding: 14px 8px 14px 6px; }
.listing .tag { margin: 0 0 10px 10px; font-size: 17px; }
.asm { font: 500 19px/1.9 var(--arc-mono); color: #e8f6fb; opacity: .45; white-space: nowrap; transition: opacity 120ms steps(2, end); }
.asm.done { opacity: .7; }
.asm.now { opacity: 1; }
.asm .ptr { display: inline-block; width: 22px; color: var(--arc-yellow); visibility: hidden; }
.asm.now .ptr { visibility: visible; animation: blink 600ms steps(2, jump-none) infinite; }
.asm .op { color: #ff7aa2; font-weight: 700; display: inline-block; min-width: 92px; }
.asm .args { color: #5dc9e2; }
.asm .what { display: block; padding-left: 22px; margin-top: -10px; font: 500 17px var(--arc-pixel); letter-spacing: .1em; text-transform: uppercase; color: #93abc2; }
.asm.now .what { color: var(--arc-yellow); }

.ram { fill: #0f3d2a; stroke: #04121c; stroke-width: 4; }
.die { fill: #1b1f2a; stroke: #04121c; stroke-width: 4; }
.pin { fill: #c9a227; }
.bus { fill: var(--arc-line); }
.bus.on { fill: var(--arc-yellow); animation: blink 300ms steps(2, jump-none) infinite; }
.slot { fill: #0000004d; stroke: #ffffff40; stroke-width: 2; }
.slot.reg { stroke: #5dc9e266; }
.title { font: 700 22px var(--arc-pixel); fill: #fff; letter-spacing: .15em; }
.lbl { font: 700 22px var(--arc-pixel); letter-spacing: .06em; fill: #eaf2ff; }
.clock { font: 700 18px var(--arc-pixel); fill: #93abc2; letter-spacing: .1em; }
.clock.tick { fill: var(--arc-yellow); }
.alu { font: 700 22px var(--arc-pixel); fill: #93abc2; letter-spacing: .1em; }
.alu.hot { fill: var(--arc-yellow); animation: blink 300ms steps(2, jump-none) infinite; }

.tok { transition: transform 520ms steps(7, end), opacity 200ms steps(2, end); }
.tok.gone { opacity: 0; }
.chipval { stroke: #04121c; stroke-width: 3; }
.chipval.a { fill: var(--arc-blue); }
.chipval.b { fill: #7ee787; }
.chipval.sum { fill: var(--arc-yellow); }
.num { font: 700 17px var(--arc-mono); fill: #04121c; }

@keyframes blink { 50% { opacity: .35 } }
@media (prefers-reduced-motion: reduce) { .tok { transition: none } .bus.on, .alu.hot, .asm.now .ptr { animation: none } }
</style>
