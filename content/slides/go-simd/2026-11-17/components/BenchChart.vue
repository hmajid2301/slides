<script setup lang="ts">
// Mean ns/op from examples/bench-output.txt, n=4096 float32, Ryzen 9 7950X3D.
// Arcade high-score table: slots are ranked fastest first and fill bottom-up, one per click
// (0 plain loop · 1 asm · 2 simd). The new entry types its initials in, like a name-entry screen.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 99 })

const scalar = 3283
const rows = [
  { rank: '1ST', name: 'SIMD', what: 'Go simd', ns: 308, shownAt: 2 },
  { rank: '2ND', name: 'ASM', what: 'hand-written asm', ns: 316, shownAt: 1 },
  { rank: '3RD', name: 'LOOP', what: 'plain Go loop', ns: 3283, shownAt: 0 },
]
const speedup = (ns: number) => `${(scalar / ns).toFixed(1)}×`
</script>

<template>
  <div class="scores">
    <div class="head"><span>RANK</span><span>NAME</span><span /><span>TIME</span><span>SPEED</span></div>
    <div v-for="r in rows" :key="r.rank" class="row" :class="{ shown: props.step >= r.shownAt, fresh: props.step === r.shownAt }">
      <span class="rank">{{ r.rank }}</span>
      <template v-if="props.step >= r.shownAt">
        <span class="name"><i v-for="(c, n) in r.name" :key="n" :style="{ animationDelay: `${n * 160}ms` }">{{ c }}</i></span>
        <span class="what">{{ r.what }}</span>
        <span class="ns">{{ r.ns.toLocaleString('en-GB') }} ns</span>
        <span class="x">{{ speedup(r.ns) }}</span>
      </template>
      <template v-else>
        <span class="name empty">---</span><span /><span class="ns empty">----- ns</span><span class="x empty">--</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scores { display: grid; gap: 14px; padding: 18px 26px; background: #0b1b2b; outline: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c; }
.head, .row { display: grid; grid-template-columns: 90px 130px 1fr 190px 120px; align-items: center; gap: 20px; }
.head { font: 500 18px var(--arc-pixel); letter-spacing: .14em; color: var(--arc-muted); }
.head span:nth-child(n+4), .ns, .x { text-align: right; }
.row { font: 700 30px var(--arc-pixel); letter-spacing: .08em; color: #fff; }
.rank { color: var(--arc-yellow); }
.name { color: var(--arc-blue); letter-spacing: .2em; }
.name i { font-style: normal; }
.fresh .name i { animation: type 1ms steps(1) both; }
.what { font: 500 20px var(--arc-mono); color: #93abc2; letter-spacing: 0; }
.ns { color: var(--arc-yellow); }
.x { color: #7ee787; }
.empty { color: #3a5574; }
.row:not(.shown) .rank { opacity: .5; }
/* The record holder blinks once its name is in. */
.row.fresh:nth-child(2) { animation: blink 500ms steps(2, jump-none) 800ms 4; }
@keyframes type { from { visibility: hidden } }
@keyframes blink { 50% { opacity: .35 } }
@media (prefers-reduced-motion: reduce) { .fresh .name i, .row.fresh { animation: none } }
</style>
