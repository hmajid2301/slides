<script setup lang="ts">
import { computed } from 'vue'

// Runtime dispatch as a fighter-select screen. Clicks:
// 0 roster (compiler built 4 copies, each with its own v.Len()) · 1 CPU picks the widest it has · 2 GODEBUG override
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const fighters = [
  { id: 'simd0', lanes: 4, label: 'EMULATED' },
  { id: 'simd128', lanes: 4, label: '128-bit' },
  { id: 'simd256', lanes: 8, label: '256-bit' },
  { id: 'simd512', lanes: 16, label: '512-bit' },
]
const picked = computed(() => props.step >= 2 ? 2 : props.step === 1 ? 3 : -1)
</script>

<template>
  <div class="source" aria-hidden="true"><code>func AddSIMD(…)</code><span class="split">▼ go build ▼</span></div>
  <div class="select">
    <div v-for="(f, i) in fighters" :key="f.id" class="card" :class="{ picked: picked === i, dim: picked >= 0 && picked !== i }"
      :style="{ animationDelay: `${i * 160}ms`, '--from': `${(1.5 - i) * 100}%`, '--d': `${600 + i * 120}ms` }">
      <div class="p1" v-if="picked === i">{{ step >= 2 ? '▼ GODEBUG' : '▼ CPU PICKS' }}</div>
      <div class="lanes"><i v-for="l in f.lanes" :key="l" /></div>
      <div class="name">AddSIMD<b>@{{ f.id }}</b></div>
      <div class="label">{{ f.label }}</div>
      <div class="len"><code>v.Len()</code> = <b>{{ f.lanes }}</b></div>
    </div>
  </div>
</template>

<style scoped>
/* Compiler split: one source block, then four copies fan out of it. */
.source { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 52px; animation: src 500ms steps(4, end) both; }
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
.card.dim { opacity: .45; }
.card.picked { border-color: var(--arc-yellow); transform: translateY(-10px); box-shadow: 6px 16px 0 var(--arc-shadow); }
.p1 {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 2px 10px;
  font: 700 18px var(--arc-pixel); letter-spacing: .1em; background: var(--arc-yellow); color: #0b1b2b;
  outline: 3px solid #04121c;
}
.lanes { display: flex; flex-wrap: wrap; gap: 3px; height: 44px; align-content: flex-start; }
.lanes i { width: 18px; height: 18px; background: var(--arc-blue); }
.picked .lanes i { background: var(--arc-yellow); }
.name { font: 600 18px var(--arc-mono); color: var(--arc-ink); }
.name b { color: #5dc9e2; font-weight: 700; }
.label { font: 700 18px var(--arc-pixel); color: #ffffff; letter-spacing: .06em; }
.len { font: 600 18px var(--arc-mono); color: #eaf2ff; }
.len b { color: var(--arc-yellow); }
@media (prefers-reduced-motion: reduce) { .card, .source { animation: none } }
</style>
