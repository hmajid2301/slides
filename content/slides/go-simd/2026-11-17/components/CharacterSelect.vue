<script setup lang="ts">
import { computed } from 'vue'

// Runtime dispatch as a fighter-select screen. Clicks:
// 0 roster (compiler built 4 copies) · 1 cursor scans · 2 CPU picks @simd512 (this Ryzen) · 3 GODEBUG override shown
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const fighters = [
  { id: 'simd0', lanes: 4, label: 'EMULATED', stat: 'any CPU', bars: 1 },
  { id: 'simd128', lanes: 4, label: 'SSE · NEON · wasm', stat: '4 lanes', bars: 2 },
  { id: 'simd256', lanes: 8, label: 'AVX2', stat: '8 lanes', bars: 3 },
  { id: 'simd512', lanes: 16, label: 'AVX-512', stat: '16 lanes', bars: 4 },
]
const picked = computed(() => props.step >= 3 ? 2 : props.step >= 2 ? 3 : props.step === 1 ? 1 : -1)
</script>

<template>
  <div class="source" aria-hidden="true"><code>func AddSIMD(…)</code><span class="split">▼ go build ▼</span></div>
  <div class="select">
    <div v-for="(f, i) in fighters" :key="f.id" class="card" :class="{ picked: picked === i, scanning: step === 1 }"
      :style="{ animationDelay: `${i * 160}ms`, '--from': `${(1.5 - i) * 100}%`, '--d': `${600 + i * 120}ms` }">
      <div class="p1" v-if="picked === i">{{ step >= 3 ? 'P1 · GODEBUG' : 'P1 · CPU' }}</div>
      <div class="lanes"><i v-for="l in f.lanes" :key="l" /></div>
      <div class="name">AddSIMD<b>@{{ f.id }}</b></div>
      <div class="label">{{ f.label }}</div>
      <div class="stat">POWER <span v-for="b in 4" :key="b" :class="{ on: b <= f.bars }" /></div>
    </div>
  </div>
</template>

<style scoped>
/* Compiler split: one source block, then four copies fan out of it. */
.source { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 30px; animation: src 500ms steps(4, end) both; }
.source code { font-size: 26px !important; padding: 6px 16px !important; outline: 4px solid var(--arc-yellow); }
.split { font: 700 18px var(--arc-pixel); letter-spacing: .12em; color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; }
@keyframes src { from { opacity: 0; transform: translateY(-20px) } }
.card { animation: fan 420ms steps(6, end) var(--d) both; }
@keyframes fan { from { opacity: 0; transform: translate(var(--from), -120px) scale(.4) } }
.select { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.card {
  position: relative; padding: 16px; min-height: 220px;
  background: var(--arc-panel); border: 4px solid var(--arc-line);
  box-shadow: 6px 6px 0 var(--arc-shadow); display: flex; flex-direction: column; gap: 10px;
}
.card.scanning { animation: scan 640ms steps(1, end) 1 both; }
@keyframes scan { 0%, 24% { border-color: var(--arc-yellow) } 25%, 100% { border-color: var(--arc-line) } }
.card.picked { border-color: var(--arc-yellow); transform: translateY(-10px); box-shadow: 6px 16px 0 var(--arc-shadow); }
.p1 {
  position: absolute; top: -18px; left: 10px; padding: 0 8px;
  font: 700 18px var(--arc-pixel); letter-spacing: .1em; background: var(--arc-yellow); color: #0b1b2b;
  animation: blink 600ms steps(2, jump-none) infinite;
}
@keyframes blink { 50% { opacity: .35 } }
.lanes { display: flex; flex-wrap: wrap; gap: 3px; height: 44px; align-content: flex-start; }
.lanes i { width: 18px; height: 18px; background: var(--arc-blue); }
.picked .lanes i { background: var(--arc-yellow); }
.name { font: 600 18px var(--arc-mono); color: var(--arc-ink); }
.name b { color: #5dc9e2; font-weight: 700; }
.label { font: 700 18px var(--arc-pixel); color: #ffffff; letter-spacing: .06em; }
.stat { font: 600 18px var(--arc-pixel); color: #b8d3e0; display: flex; gap: 4px; align-items: center; letter-spacing: .1em; }
.stat span { width: 14px; height: 10px; background: var(--arc-line); }
.stat span.on { background: #7ee787; }
@media (prefers-reduced-motion: reduce) { .card, .source, .card.scanning, .p1 { animation: none } }
</style>
