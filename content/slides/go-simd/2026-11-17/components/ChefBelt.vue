<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// Analogy for "16 lanes ≈ 8 lanes": the chef (the add) chops a whole board in one go, but every
// tomato has to be grabbed from the fridge (cache) one at a time, and put back one at a time (store). Go simd carries 16 per trip,
// yet grabbing 16 takes twice as long as grabbing 8: same bytes, same load bandwidth.
// Clicks: 0 knife ×8 (AVX2 asm) · 1 knife ×16 (Go simd on AVX-512).
// Animation timings are schematic; the bars use the benchmark numbers (329 vs 308 ns).
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const wide = computed(() => props.step >= 1)
const batch = computed(() => (wide.value ? 16 : 8))
const rows = [
  { name: '×8', ns: '329 ns', parts: ['fetch', 'chop', 'fetch', 'chop'], from: 0 },
  { name: '×16', ns: '308 ns', parts: ['fetch2', 'chop'], from: 1 },
]

// Seconds: per tomato grabbed, per walk, per chop. Ticks at 12 fps for a pixel-art feel.
const GRAB = 0.3, WALK = 0.4, CHOP = 0.45
const FRIDGE = 110, BOARD = 830
const t = ref(0)
const still = ref(false)
let t0 = 0
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  still.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still.value) return
  t0 = performance.now()
  timer = setInterval(() => { t.value = (performance.now() - t0) / 1000 }, 1000 / 12)
})
onUnmounted(() => clearInterval(timer))
watch(wide, () => { t0 = performance.now(); t.value = 0 })

// One loop = load (grab one at a time) → walk → chop → carry back → store (put away one at a time).
const scene = computed(() => {
  const b = batch.value
  const grab = b * GRAB
  const base = { flip: false, held: 0, heldSliced: false, count: '', board: 0, sliced: false, hop: 0, slam: '' }
  let s = still.value ? grab + WALK + CHOP * 0.9 : t.value % (2 * grab + 2 * WALK + CHOP)
  const tick = Math.floor(t.value * 12) % 2
  if (s < grab) {
    const n = Math.min(b, Math.floor(s / GRAB) + 1)
    return { ...base, x: FRIDGE, flip: true, held: n, count: `load ${n}/${b}` }
  }
  s -= grab
  if (s < WALK)
    return { ...base, x: FRIDGE + (BOARD - FRIDGE) * s / WALK, held: b, hop: tick * -4 }
  s -= WALK
  if (s < CHOP) {
    const down = s > CHOP * 0.4
    return { ...base, x: BOARD, board: b, sliced: down, hop: down ? 0 : -5, slam: down ? 'down' : 'up' }
  }
  s -= CHOP
  if (s < WALK)
    return { ...base, x: BOARD - (BOARD - FRIDGE) * s / WALK, flip: true, held: b, heldSliced: true, hop: tick * -4 }
  s -= WALK
  const put = Math.min(b, Math.floor(s / GRAB) + 1)
  return { ...base, x: FRIDGE, flip: true, held: b - put, heldSliced: true, count: `store ${put}/${b}` }
})

// Original 6×6 tomato sprites: whole, and cut showing pulp and seeds.
const sprite = (art: string[]) => art.flatMap((r, y) => [...r].flatMap((c, x) =>
  c === '.' ? [] : [{ x, y, fill: { G: '#46c84a', R: '#e8342a', H: '#ff8a7a', D: '#a81f1a', P: '#ff6b5b', S: '#ffd84a' }[c]! }]))
const whole = sprite(['..GG..', '.RGGR.', 'RHRRRR', 'RHRRRR', 'RRRRRD', '.RDDD.'])
const sliced = sprite(['......', '.RRRR.', 'RPSPSR', 'RPPPPR', 'RSPSPR', '.RRRR.'])
</script>

<template>
  <div class="kitchen">
    <div class="stage" aria-hidden="true">
      <div class="fridge"><i /><span>cache</span></div>
      <div class="floor" />
      <div class="chef" :style="{ transform: `translate(${scene.x}px, ${scene.hop}px)` }">
        <span v-if="scene.count" class="count">{{ scene.count }}</span>
        <div class="arms">
          <svg v-for="n in scene.held" :key="n" viewBox="0 0 6 6" width="16" height="16" shape-rendering="crispEdges">
            <rect v-for="(p, i) in (scene.heldSliced ? sliced : whole)" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
          </svg>
        </div>
        <svg class="body" :class="{ flip: scene.flip }" viewBox="0 0 12 16" width="72" height="96" shape-rendering="crispEdges">
          <!-- original pixel chef: hat, face, apron -->
          <rect x="2" y="0" width="8" height="4" fill="#fff" /><rect x="3" y="4" width="6" height="1" fill="#fff" />
          <rect x="3" y="5" width="6" height="4" fill="#f6d2a2" /><rect x="7" y="6" width="1" height="1" fill="#04121c" />
          <rect x="2" y="9" width="8" height="5" fill="#fff" /><rect x="4" y="10" width="4" height="4" fill="#00add8" />
          <rect x="3" y="14" width="2" height="2" fill="#04121c" /><rect x="7" y="14" width="2" height="2" fill="#04121c" />
        </svg>
      </div>
      <div class="station">
        <span class="knife-tag">CHOP ×{{ batch }}</span>
        <span v-if="scene.sliced" class="pow">1 chop · {{ batch }} tomatoes</span>
        <div class="board" :class="{ two: wide }">
          <!-- one wide cleaver: a single chop cuts every tomato on the board at once -->
          <span v-if="scene.slam" class="cleaver" :class="scene.slam"><i class="handle" /><i class="steel" /></span>
          <svg v-for="n in scene.board" :key="n" viewBox="0 0 6 6" width="24" height="24" shape-rendering="crispEdges">
            <rect v-for="(p, i) in (scene.sliced ? sliced : whole)" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
          </svg>
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
        <i class="fetch" />load/store <i class="chop" />chop
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

.chef { position: absolute; left: 0; bottom: 6px; z-index: 2; }
.chef .body { display: block; }
.chef .body.flip { transform: scaleX(-1); }
/* Armful stacks bottom-up, 4 per row: the pile grows with every grab. */
.arms { position: absolute; bottom: 100px; left: 4px; display: flex; flex-wrap: wrap-reverse; width: 64px; }
.count { position: absolute; bottom: 168px; left: 50%; transform: translateX(-50%); font: 700 20px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; white-space: nowrap; }
.arms svg { display: block; }

.station { position: absolute; right: 0; bottom: 6px; width: 290px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pow {
  position: absolute; left: 0; right: 0; top: -6px; width: fit-content; margin: 0 auto; z-index: 4; padding: 4px 10px; transform: rotate(-6deg);
  white-space: nowrap; font: 700 24px var(--arc-pixel); color: #04121c; background: var(--arc-yellow); outline: 4px solid #04121c; box-shadow: 5px 5px 0 #04121c;
}
.knife-tag { font: 700 20px var(--arc-pixel); color: #fff; background: var(--arc-pink); padding: 2px 8px; outline: 3px solid #04121c; }
.board {
  position: relative; display: grid; grid-template-columns: repeat(8, 26px); gap: 4px; padding: 30px 8px 8px;
  min-height: 62px; background: #c9a36b; outline: 4px solid #04121c; align-content: end; justify-items: center;
}
.board.two { min-height: 90px; }

/* Cleaver spans the whole board: raised, then slammed onto every tomato at once. */
.cleaver { position: absolute; left: -22px; right: -6px; top: -14px; height: 16px; z-index: 3; display: flex; }
.cleaver.up { transform: translateY(-30px); }
.cleaver.down { transform: translateY(34px); }
.board.two .cleaver.down { transform: translateY(50px); }
.handle { width: 30px; background: #6b3a1b; outline: 3px solid #04121c; }
.steel { flex: 1; background: linear-gradient(#eaf2ff 0 70%, #9fb3c8 70%); outline: 3px solid #04121c; }

/* Time bars from the benchmark: ×16 fetches the same bytes in one long trip. */
.bars { display: grid; gap: 8px; }
.row { display: grid; grid-template-columns: 70px auto 1fr; align-items: center; gap: 16px; opacity: .2; transition: opacity 200ms steps(2, end); }
.row.on { opacity: 1; }
.who { font: 700 22px var(--arc-pixel); color: #fff; text-align: right; text-shadow: 2px 2px 0 #04121c; }
.bar { display: flex; gap: 3px; }
.bar i, .key i { display: inline-block; height: 26px; outline: 3px solid #04121c; }
.fetch { width: 260px; background: var(--arc-blue); }
.fetch2 { width: 523px; background: var(--arc-blue); }
.chop { width: 40px; background: var(--arc-yellow); }
.ns { font: 700 24px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 2px 2px 0 #04121c; }
.key { display: flex; align-items: center; gap: 8px; margin-left: 86px; font: 500 19px var(--arc-pixel); letter-spacing: .08em; }
.key i { height: 14px; width: 14px; margin-left: 10px; }
.simd { margin-left: auto; font: 700 22px var(--arc-pixel); letter-spacing: .08em; color: #fff; text-shadow: 2px 2px 0 #04121c; }
.simd b { color: var(--arc-yellow); }
</style>
