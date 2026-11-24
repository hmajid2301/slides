<script setup lang="ts">
// Illustrative operations, not instruction counts or a performance model.
// One click (`play`) reveals the three cases one after another, ~2.5 s apart.
import { onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ play?: boolean }>(), { play: false })
const step = ref(0)
let timers: ReturnType<typeof setTimeout>[] = []
const clear = () => { timers.forEach(clearTimeout); timers = [] }
watch(() => props.play, on => {
  clear()
  step.value = 0
  if (on) [1, 2, 3].forEach((n, i) => timers.push(setTimeout(() => { step.value = n }, i * 2500)))
}, { immediate: true })
onUnmounted(clear)
const a = [1, 2, 3, 4]
const b = [2, 3, 4, 5]
const products = a.map((value, i) => value * b[i])
const score = products.reduce((sum, value) => sum + value, 0)
const ship = '-32,-20 -32,20 36,0 -12,0'
// Plain 8×5 greyscale image (diagonal stripes), pixel values 0…180.
const sprite = Array.from({ length: 5 }, (_, y) => Array.from({ length: 8 }, (_, x) => ({ x, y, value: Math.round(((x + y) % 7) * 30) }))).flat()
const grey = (value: number) => `rgb(${value}, ${value}, ${value})`
</script>

<template>
  <ul class="use-cases">
    <li :class="{ 'is-on': step >= 1 }">
      <div class="case-label">
        <span class="case-title">Dot products</span>
        <span class="case-domain">Vector search · multiply, then sum</span>
      </div>
      <svg class="mini" viewBox="0 0 600 120" role="img" aria-label="Four pairs multiply to 2, 6, 12 and 20, then sum to a dot product of 40">
        <g v-for="(value, i) in a" :key="i">
          <rect :x="22 + i * 46" y="10" width="38" height="34" class="cell" />
          <text :x="41 + i * 46" y="34" class="number">{{ value }}</text>
          <text :x="41 + i * 46" y="65" class="times">×</text>
          <rect :x="22 + i * 46" y="76" width="38" height="34" class="cell" />
          <text :x="41 + i * 46" y="100" class="number">{{ b[i] }}</text>
        </g>
        <path d="M218 60H260L248 49M260 60L248 71" class="arrow" />
        <g v-if="step >= 1" class="products">
          <g v-for="(value, i) in products" :key="i">
            <rect :x="282 + i * 46" y="42" width="38" height="36" class="cell product" />
            <text :x="301 + i * 46" y="67" class="number dark">{{ value }}</text>
            <text v-if="i < 3" :x="324 + i * 46" y="101" class="plus">+</text>
          </g>
          <text x="368" y="25" class="caption">lane products</text>
        </g>
        <g v-if="step >= 1" class="score">
          <path d="M479 60H508L496 49M508 60L496 71" class="arrow" />
          <text x="552" y="76" class="total">{{ score }}</text>
          <text x="552" y="103" class="caption">SUM</text>
        </g>
      </svg>
    </li>

    <li :class="{ 'is-on': step >= 2 }">
      <div class="case-label">
        <span class="case-title">Matrix multiplication</span>
        <span class="case-domain">Graphics · transform vertex positions</span>
      </div>
      <svg class="mini" viewBox="0 0 600 120" role="img" aria-label="A rotation matrix transforms a small ship's vertex positions, turning the ship a quarter turn">
        <path d="M37 15H27V101H37M106 15H116V101H106" class="bracket" />
        <text x="50" y="48" class="number">0</text><text x="94" y="48" class="number">−1</text>
        <text x="50" y="86" class="number">1</text><text x="94" y="86" class="number">0</text>
        <text x="148" y="68" class="times">×</text>
        <text x="72" y="118" class="caption">matrix</text>
        <g transform="translate(220 60)">
          <polygon :points="ship" class="ship source" />
          <circle v-for="(point, i) in [[-32, -20], [-32, 20], [36, 0], [-12, 0]]" :key="i" :cx="point[0]" :cy="point[1]" r="3" class="vertex" />
        </g>
        <text x="220" y="118" class="caption">vertices</text>
        <path d="M280 60H328L316 49M328 60L316 71" class="arrow" />
        <g transform="translate(405 60)">
          <polygon :points="ship" class="ghost" />
          <g v-if="step >= 2" class="turn">
            <polygon :points="ship" class="ship transformed" />
            <circle v-for="(point, i) in [[-32, -20], [-32, 20], [36, 0], [-12, 0]]" :key="i" :cx="point[0]" :cy="point[1]" r="3" class="vertex" />
          </g>
        </g>
        <g v-if="step >= 2" class="graphics-result">
          <text x="520" y="55" class="result">¼ TURN</text>
          <text x="520" y="81" class="caption">same transform</text>
          <text x="520" y="101" class="caption">across vertices</text>
        </g>
      </svg>
    </li>

    <li :class="{ 'is-on': step >= 3 }">
      <div class="case-label">
        <span class="case-title">Pixel arithmetic</span>
        <span class="case-domain">Image processing · brighten pixels</span>
      </div>
      <svg class="mini" viewBox="0 0 600 120" shape-rendering="crispEdges" role="img" aria-label="The same small image before and after adding 40 to every pixel's brightness: 0 becomes 40 and 180 becomes 220">
        <g v-for="(pixel, i) in sprite" :key="i">
          <rect :x="46 + pixel.x * 14" :y="22 + pixel.y * 14" width="14" height="14" :fill="grey(pixel.value)" />
        </g>
        <text x="102" y="117" class="caption">before</text>
        <text x="235" y="35" class="result">+40</text>
        <path d="M190 60H280L268 49M280 60L268 71" class="arrow" />
        <g :class="{ brighten: step >= 3 }">
          <rect v-for="(pixel, i) in sprite" :key="i" :x="320 + pixel.x * 14" :y="22 + pixel.y * 14" width="14" height="14" :fill="grey(pixel.value + (step >= 3 ? 40 : 0))" />
        </g>
        <text x="376" y="117" class="caption">after</text>
        <g v-if="step >= 3" class="pixel-result">
          <text x="523" y="50" class="result">0 → 40</text>
          <text x="523" y="80" class="result">180 → 220</text>
          <text x="523" y="105" class="caption">same op per pixel</text>
        </g>
      </svg>
    </li>
  </ul>
</template>

<style scoped>
.use-cases { margin: 0 !important; }
.use-cases li { display: grid; grid-template-columns: 400px 1fr; align-items: center; gap: 12px; margin: 6px 0 !important; padding-left: 38px; min-height: 118px; }
.use-cases li::before { top: 40px; }
.case-label { display: flex; flex-direction: column; gap: 7px; }
.case-title { font: 700 30px var(--arc-pixel); }
.case-domain { font: 500 21px 'DM Sans', sans-serif; color: var(--arc-muted); }
.mini { width: 100%; height: 110px; overflow: visible; }
.is-on .case-title { color: var(--arc-yellow); }
.cell { fill: var(--arc-panel); stroke: var(--arc-sky); stroke-width: 2; }
.number { font: 700 23px var(--arc-mono); fill: var(--arc-ink); text-anchor: middle; }
.times { font: 700 26px var(--arc-mono); fill: var(--arc-yellow); text-anchor: middle; }
.caption { font: 500 17px var(--arc-pixel); fill: var(--arc-muted); text-anchor: middle; }
.arrow, .bracket { fill: none; stroke: var(--arc-ink); stroke-width: 3; }
.plus { font: 700 18px var(--arc-mono); fill: var(--arc-yellow); text-anchor: middle; }
.product { fill: var(--arc-yellow); stroke: var(--arc-yellow); }
.dark { fill: #04121c; }
.products { animation: products-in 350ms steps(4, end) both; }
.total { font: 700 46px var(--arc-pixel); fill: var(--arc-yellow); text-anchor: middle; }
.score { animation: score-pop 550ms steps(5, end) 900ms both; transform-origin: 552px 60px; }
.ship { fill: var(--arc-blue); stroke: #04121c; stroke-width: 4; stroke-linejoin: miter; }
.transformed { fill: var(--arc-yellow); }
.ghost { fill: none; stroke: var(--arc-sky); stroke-width: 2; stroke-dasharray: 4 4; }
.vertex { fill: #fff; }
.turn { transform: rotate(90deg); animation: turn 750ms steps(6, end) both; }
.result { font: 700 24px var(--arc-pixel); fill: var(--arc-yellow); text-anchor: middle; }
.graphics-result { animation: products-in 300ms steps(3, end) 650ms both; }
.brighten { animation: flash 550ms steps(4, end) both; }
.pixel-result { animation: products-in 300ms steps(3, end) 450ms both; }
@keyframes products-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes score-pop { 0% { opacity: 0; transform: scale(.5); } 60% { opacity: 1; transform: scale(1.18); } 100% { opacity: 1; transform: scale(1); } }
@keyframes turn { from { transform: rotate(0); } to { transform: rotate(90deg); } }
@keyframes flash { 0%, 50% { opacity: .3; } 25%, 75%, 100% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .products, .score, .turn, .graphics-result, .brighten, .pixel-result { animation: none; }
}
</style>
