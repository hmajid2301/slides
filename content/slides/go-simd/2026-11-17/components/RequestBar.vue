<script setup lang="ts">
import { computed } from 'vue'

// "Do I need this?" for an HTTP service. Proportions are illustrative, not measured. Clicks:
// 0 one request: mostly waiting on network + DB · 1 SIMD shrinks your loop, the request barely moves
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => props.step)
const parts = computed(() => [
  { k: 'net', w: 110, label: 'network' },
  { k: 'db', w: 470, label: 'database' },
  { k: 'json', w: 90, label: 'JSON' },
  { k: 'loop', w: s.value >= 1 ? 6 : 50, label: 'your loop' },
  { k: 'net', w: 110, label: 'network' },
])
</script>

<template>
  <div class="req">
    <div class="row">
      <span class="verb">GET /orders</span>
      <span class="bar">
        <i v-for="(p, i) in parts" :key="i" :class="p.k" :style="{ width: `${p.w}px` }">
          <b v-if="p.w > 60">{{ p.label }}</b>
          <b v-else-if="p.k === 'loop' && p.w > 20">you</b>
        </i>
        <span v-if="s >= 1" class="zap">⚡</span>
      </span>
    </div>
    <p class="wait" :class="{ on: s >= 1 }"><span class="z">zzz</span></p>
  </div>
</template>

<style scoped>
.req { display: flex; flex-direction: column; gap: 10px; }
.row { display: flex; align-items: center; gap: 18px; }
.verb { font: 700 22px var(--arc-mono); color: var(--arc-yellow); white-space: nowrap; }
.bar { position: relative; display: flex; gap: 3px; }
.bar i { display: flex; align-items: center; justify-content: center; height: 46px; outline: 3px solid #04121c; transition: width 500ms steps(6, end); }
.bar b { font: 700 19px var(--arc-pixel); letter-spacing: .06em; color: #04121c; }
.net { background: #eaf2ff; }
.db { background: var(--arc-pink); }
.db b { color: #fff; }
.json { background: var(--arc-blue); }
.loop { background: var(--arc-yellow); }
.zap { position: absolute; right: 104px; top: -34px; font-size: 26px; animation: zap 500ms steps(2, jump-none) 3; }
@keyframes zap { 50% { transform: translateY(-6px) } }
.wait { margin: 0 0 0 330px; height: 30px; opacity: 0; }
.wait.on { opacity: 1; }
.z { font: 700 24px var(--arc-pixel); color: #fff; text-shadow: 2px 2px 0 #04121c; animation: blink 800ms steps(2, jump-none) infinite; }
@keyframes blink { 50% { opacity: .3 } }

@media (prefers-reduced-motion: reduce) { .bar i { transition: none } .zap, .z { animation: none } }
</style>
