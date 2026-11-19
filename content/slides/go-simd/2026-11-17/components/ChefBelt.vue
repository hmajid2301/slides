<script setup lang="ts">
import { computed } from 'vue'

// Analogy for "16 lanes ≈ 8 lanes": the chef (the add) chops a batch in a flash, but has to walk
// to the fridge (L2 cache) for every armful, and can only carry 8 at a time (a 256-bit load path).
// Clicks: 0 knife ×8: walk, carry 8, chop · 1 knife ×16: two trips for one chop, total barely changes.
// Timings are scaled from the benchmark ratio (16 per 6.0 s vs 16 per 5.6 s ≈ 329 vs 308 ns).
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const wide = computed(() => props.step >= 1)
const carry = 8
const rows = [
  { name: '×8', ns: '329 ns', parts: ['fetch', 'chop', 'fetch', 'chop'], from: 0 },
  { name: '×16', ns: '308 ns', parts: ['fetch', 'fetch', 'chop'], from: 1 },
]

// Original 5×12 carrot sprites: whole, and sliced into coins with the top cut off.
const sprite = (art: string[]) => art.flatMap((r, y) => [...r].flatMap((c, x) =>
  c === '.' ? [] : [{ x, y, fill: { G: '#46c84a', O: '#ff8a2a', D: '#c45a12' }[c]! }]))
const whole = sprite(['.G.G.', '..G..', '.GGG.', 'OOOOO', 'ODOOO', '.OOO.', '.OOD.', '.OOO.', '.DOO.', '..O..', '..O..', '.....'])
const sliced = sprite(['G.G..', '.G...', 'GGG..', '.....', 'OOOOO', 'ODOOO', '.....', '.OOD.', '.OOO.', '.....', '..O..', '..O..'])
</script>

<template>
  <div class="kitchen" :class="wide ? 'k16' : 'k8'">
    <div class="stage" aria-hidden="true">
      <div class="fridge"><i /><span>cache</span></div>
      <div class="floor" />
      <div :key="wide ? 16 : 8" class="chef">
        <div class="arms">
          <svg v-for="c in carry" :key="c" viewBox="0 0 5 12" width="10" height="24" shape-rendering="crispEdges">
            <rect v-for="(p, i) in whole" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
          </svg>
        </div>
        <svg class="body" viewBox="0 0 12 16" width="72" height="96" shape-rendering="crispEdges">
          <!-- original pixel chef: hat, face, apron -->
          <rect x="2" y="0" width="8" height="4" fill="#fff" /><rect x="3" y="4" width="6" height="1" fill="#fff" />
          <rect x="3" y="5" width="6" height="4" fill="#f6d2a2" /><rect x="7" y="6" width="1" height="1" fill="#04121c" />
          <rect x="2" y="9" width="8" height="5" fill="#fff" /><rect x="4" y="10" width="4" height="4" fill="#00add8" />
          <rect x="3" y="14" width="2" height="2" fill="#04121c" /><rect x="7" y="14" width="2" height="2" fill="#04121c" />
        </svg>
      </div>
      <div class="station">
        <span class="knife-tag">CHOP ×{{ wide ? 16 : 8 }}</span>
        <span :key="`p${wide}`" class="pow">1 chop · {{ wide ? 16 : 8 }} carrots</span>
        <div :key="wide ? 16 : 8" class="board">
          <!-- one wide cleaver: a single chop cuts every carrot on the board at once -->
          <span class="cleaver"><i class="handle" /><i class="steel" /></span>
          <div v-for="n in (wide ? 16 : 8)" :key="n" class="carrot" :class="n > carry ? 'b2' : 'b1'">
            <svg class="whole" viewBox="0 0 5 12" width="20" height="48" shape-rendering="crispEdges">
              <rect v-for="(p, i) in whole" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
            </svg>
            <svg class="sliced" viewBox="0 0 5 12" width="20" height="48" shape-rendering="crispEdges">
              <rect v-for="(p, i) in sliced" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
            </svg>
          </div>
        </div>
        <span class="lbl">add</span>
      </div>
    </div>

    <div class="bars">
      <div v-for="r in rows" :key="r.name" class="row" :class="{ on: step >= r.from }">
        <span class="who">{{ r.name }}</span>
        <span class="bar"><i v-for="(p, i) in r.parts" :key="i" :class="p" /></span>
        <span class="ns">{{ r.ns }}</span>
      </div>
      <div class="key">
        <i class="fetch" />fetch <i class="chop" />chop
        <span class="simd"><b>S</b>ingle <b>I</b>nstruction · <b>M</b>ultiple <b>D</b>ata</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kitchen { display: flex; flex-direction: column; gap: 56px; }
.stage { position: relative; height: 210px; }
.floor { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: repeating-linear-gradient(90deg, #fff 0 18px, transparent 18px 26px); }

.fridge { position: absolute; left: 0; bottom: 6px; width: 90px; height: 170px; background: #eaf2ff; outline: 4px solid #04121c; box-shadow: 6px 6px 0 #04121c; }
.fridge i { position: absolute; left: 0; right: 0; top: 56px; height: 4px; background: #04121c; }
.fridge i::after { content: ''; position: absolute; right: 10px; top: 14px; width: 6px; height: 30px; background: #04121c; }
.fridge span, .lbl { position: absolute; bottom: -34px; left: 50%; transform: translateX(-50%); font: 700 18px var(--arc-pixel); letter-spacing: .1em; color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; white-space: nowrap; }

.chef { position: absolute; left: 0; bottom: 6px; }
.chef .body { display: block; }
.arms { display: flex; gap: 0; justify-content: center; height: 26px; margin-left: -4px; margin-right: -4px; margin-bottom: 4px; opacity: 0; }

.station { position: absolute; right: 0; bottom: 6px; width: 290px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pow {
  position: absolute; left: 0; right: 0; top: -6px; width: fit-content; margin: 0 auto; z-index: 4; opacity: 0; padding: 4px 10px;
  white-space: nowrap; font: 700 24px var(--arc-pixel); color: #04121c; background: var(--arc-yellow); outline: 4px solid #04121c; box-shadow: 5px 5px 0 #04121c;
}
.knife-tag { font: 700 20px var(--arc-pixel); color: #fff; background: var(--arc-pink); padding: 2px 8px; outline: 3px solid #04121c; }
.board {
  position: relative; display: grid; grid-template-columns: repeat(8, 26px); gap: 4px 4px; padding: 30px 8px 8px;
  min-height: 70px; background: #c9a36b; outline: 4px solid #04121c; align-content: end; justify-items: center;
}
.carrot { position: relative; width: 20px; height: 48px; }
.carrot svg { position: absolute; inset: 0; opacity: 0; }

/* Cleaver spans the whole board; it rises, then slams down onto every carrot at once. */
.cleaver { position: absolute; left: -22px; right: -6px; top: -14px; height: 16px; z-index: 3; opacity: 0; display: flex; }
.handle { width: 30px; background: #6b3a1b; outline: 3px solid #04121c; }
.steel { flex: 1; background: linear-gradient(#eaf2ff 0 70%, #9fb3c8 70%); outline: 3px solid #04121c; }

/* ×8, 3.0 s loop: walk 1.3 s there, 1.3 s back with 8, chop 0.37 s. */
.k8 .chef { animation: walk8 3s steps(36, end) infinite; }
.k8 .arms { animation: hold8 3s steps(1, end) infinite; }
.k8 .chef .body { animation: busy8 3s steps(1, end) infinite; }
.k8 .cleaver { animation: slam8 3s steps(1, end) infinite; }
.k8 .pow { animation: pow8 3s steps(1, end) infinite; }
.k8 .whole { animation: whole8 3s steps(1, end) infinite; }
.k8 .sliced { animation: sliced8 3s steps(1, end) infinite; }
@keyframes walk8 {
  0% { transform: translateX(830px) scaleX(-1) } 43.3% { transform: translateX(110px) scaleX(-1) }
  43.4% { transform: translateX(110px) } 86.6% { transform: translateX(830px) } 100% { transform: translateX(830px) }
}
@keyframes hold8 { 0% { opacity: 0 } 43.3% { opacity: 1 } 86.6% { opacity: 0 } }
@keyframes busy8 { 0%, 86.5% { transform: none } 87%, 89%, 91%, 93%, 95%, 97% { transform: translateY(-5px) } 88%, 90%, 92%, 94%, 96%, 98%, 100% { transform: none } }
@keyframes slam8 { 0% { opacity: 0 } 86.6% { opacity: 1; transform: translateY(-34px) } 89.5% { transform: translateY(26px) } 93% { transform: translateY(-34px) } 95.5% { transform: translateY(26px) } 99% { opacity: 0 } }
@keyframes pow8 { 0% { opacity: 0 } 86.6% { opacity: 1; transform: rotate(-8deg) scale(1) } 92% { transform: rotate(6deg) scale(1.2) } 96% { transform: rotate(-8deg) scale(1) } 99% { opacity: 0 } }
@keyframes whole8 { 0% { opacity: 0 } 86.6% { opacity: 1 } 89.5% { opacity: 0 } }
@keyframes sliced8 { 0% { opacity: 0 } 89.5% { opacity: 1 } 99% { opacity: 0 } }

/* ×16, 5.6 s loop: two round trips (still 8 per armful), then one 0.37 s chop. */
.k16 .chef { animation: walk16 5.6s steps(64, end) infinite; }
.k16 .arms { animation: hold16 5.6s steps(1, end) infinite; }
.k16 .chef .body { animation: busy16 5.6s steps(1, end) infinite; }
.k16 .cleaver { animation: slam16 5.6s steps(1, end) infinite; }
.k16 .pow { animation: pow16 5.6s steps(1, end) infinite; }
.k16 .b1 .whole { animation: whole16a 5.6s steps(1, end) infinite; }
.k16 .b2 .whole { animation: whole16b 5.6s steps(1, end) infinite; }
.k16 .sliced { animation: sliced16 5.6s steps(1, end) infinite; }
@keyframes walk16 {
  0% { transform: translateX(830px) scaleX(-1) } 23.2% { transform: translateX(110px) scaleX(-1) }
  23.3% { transform: translateX(110px) } 46.4% { transform: translateX(830px) }
  46.5% { transform: translateX(830px) scaleX(-1) } 69.6% { transform: translateX(110px) scaleX(-1) }
  69.7% { transform: translateX(110px) } 92.8% { transform: translateX(830px) } 100% { transform: translateX(830px) }
}
@keyframes hold16 { 0% { opacity: 0 } 23.2% { opacity: 1 } 46.4% { opacity: 0 } 69.6% { opacity: 1 } 92.8% { opacity: 0 } }
@keyframes busy16 { 0%, 92.7% { transform: none } 93%, 94.2%, 95.4%, 96.6%, 97.8% { transform: translateY(-5px) } 93.6%, 94.8%, 96%, 97.2%, 98.4%, 100% { transform: none } }
@keyframes slam16 { 0% { opacity: 0 } 92.8% { opacity: 1; transform: translateY(-34px) } 94.4% { transform: translateY(46px) } 96.3% { transform: translateY(-34px) } 97.6% { transform: translateY(46px) } 99.5% { opacity: 0 } }
@keyframes pow16 { 0% { opacity: 0 } 92.8% { opacity: 1; transform: rotate(-8deg) scale(1) } 95.5% { transform: rotate(6deg) scale(1.2) } 97.8% { transform: rotate(-8deg) scale(1) } 99.5% { opacity: 0 } }
@keyframes whole16a { 0% { opacity: 0 } 46.4% { opacity: 1 } 94.4% { opacity: 0 } }
@keyframes whole16b { 0% { opacity: 0 } 92.8% { opacity: 1 } 94.4% { opacity: 0 } }
@keyframes sliced16 { 0% { opacity: 0 } 94.4% { opacity: 1 } 99.5% { opacity: 0 } }

/* Time bars: 100 px per second, 16 carrots each. */
.bars { display: grid; gap: 8px; }
.row { display: grid; grid-template-columns: 70px auto 1fr; align-items: center; gap: 16px; opacity: .2; transition: opacity 200ms steps(2, end); }
.row.on { opacity: 1; }
.who { font: 700 22px var(--arc-pixel); color: #fff; text-align: right; text-shadow: 2px 2px 0 #04121c; }
.bar { display: flex; gap: 3px; }
.bar i, .key i { display: inline-block; height: 26px; outline: 3px solid #04121c; }
.fetch { width: 260px; background: var(--arc-blue); }
.chop { width: 40px; background: var(--arc-yellow); }
.ns { font: 700 24px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; }
.key { display: flex; align-items: center; gap: 8px; margin-left: 86px; font: 500 19px var(--arc-pixel); letter-spacing: .08em; }
.key i { height: 14px; width: 14px; margin-left: 10px; }
.simd { margin-left: auto; font: 700 22px var(--arc-pixel); letter-spacing: .08em; color: #fff; text-shadow: 2px 2px 0 #04121c; }
.simd b { color: var(--arc-yellow); }
@media (prefers-reduced-motion: reduce) {
  .chef, .chef .body, .arms, .cleaver, .pow, .carrot svg { animation: none !important }
  .chef { transform: translateX(830px) } .sliced { opacity: 1 }
}
</style>
