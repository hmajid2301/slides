<script setup lang="ts">
import { computed } from 'vue'

// Camera dive into a CPU, one click per level:
// 0 package (lid on) · 1 lid off: chiplets · 2 one chiplet · 3 one core · 4 vector registers.
// Every scene is a 1000×500 drawing. Each level is also drawn as a miniature inside
// the previous one, so zooming into its focus rect lands on the same picture.
// Loosely based on a Zen 4 desktop part (7950X3D): 2 × 8-core chiplets + I/O die,
// 32 MB L3 per chiplet (+64 MB stacked on one), 1 MB L2, 32 KB L1D, 32 × 512-bit registers.
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => Math.min(Math.max(props.step, 0), 4))

type Rect = { x: number, y: number, w: number, h: number }
// Focus rect in scene k that becomes scene k+1 (all 2:1, like the frame).
const focus: Rect[] = [
  { x: 300, y: 150, w: 400, h: 200 },
  { x: 120, y: 60, w: 320, h: 160 },
  { x: 20, y: 30, w: 230, h: 115 },
  { x: 360, y: 70, w: 240, h: 120 },
]
const scale = focus.map(f => 1000 / f.w)
const zoom = [1, ...scale.map((_, k) => scale.slice(0, k + 1).reduce((p, z) => p * z, 1))]

// Origin is 0 0; percentages are of the frame (viewBox 1000 × 500).
// Past: blow scene k up until its focus rect fills the frame.
// Future: shrink scene k into the focus rect of scene k-1.
function sceneStyle(k: number) {
  if (k === s.value) return { transform: 'translate(0, 0) scale(1)', opacity: 1 }
  if (k < s.value) {
    const f = focus[k], z = scale[k]
    return { transform: `translate(${(-z * f.x) / 10}%, ${(-z * f.y) / 5}%) scale(${z})`, opacity: 0 }
  }
  const f = focus[k - 1]
  return { transform: `translate(${f.x / 10}%, ${f.y / 5}%) scale(${1 / scale[k - 1]})`, opacity: 0 }
}
const sceneClass = (k: number) => ({ now: k === s.value, past: k < s.value })

// Scene 2: one chiplet (CCD).
const cores = Array.from({ length: 8 }, (_, i) => ({
  x: 20 + (i % 4) * 245, y: i < 4 ? 30 : 355, w: 230, h: 115,
}))
const l3 = { x: 20, y: 165, w: 965, h: 170 }

// Scene 3: one core.
const blocks = [
  { x: 20, y: 20, w: 300, h: 140, c: 'front', t: 'FRONT END', sub: 'fetch · decode' },
  { x: 20, y: 180, w: 300, h: 140, c: 'int', t: 'INTEGER ×4', sub: 'ints · pointers · i++' },
  { x: 20, y: 340, w: 300, h: 140, c: 'ls', t: 'LOAD / STORE', sub: 'to and from memory' },
  { x: 340, y: 20, w: 420, h: 300, c: 'vec', t: 'VECTOR UNIT', sub: 'floats + SIMD' },
  { x: 340, y: 340, w: 420, h: 140, c: 'l1', t: 'L1 CACHE', sub: '32 KB' },
  { x: 780, y: 20, w: 200, h: 460, c: 'l2', t: 'L2', sub: '1 MB' },
]
// Zen 4: 2 FMA (also does MUL) + 2 FADD pipes, 256-bit each.
const pipes = ['FMA', 'FMA', 'ADD', 'ADD']

// Scene 4: register file. 8 of 32 rows drawn, 16 × 32-bit lanes each.
const rows = Array.from({ length: 8 }, (_, r) => r)
const lanes = Array.from({ length: 16 }, (_, l) => l)

const captions = [
  'My CPU, <b>lid on</b>',
  '<b>2 chiplets</b> × 8 cores',
  'One chiplet: <b>8 cores</b>',
  'One core: the <b>vector unit</b>',
  '<b>32</b> registers × <b>16</b> floats',
]
</script>

<template>
  <div class="chip-zoom">
    <span class="zoom">ZOOM ×{{ Math.round(zoom[s]) }}</span>
    <div class="stage" role="img"
      aria-label="Zooming from a CPU package into a chiplet, one core, and its vector registers">
      <!-- 0 · package, lid on -->
      <svg class="scene" :class="sceneClass(0)" :style="sceneStyle(0)" viewBox="0 0 1000 500" shape-rendering="crispEdges">
        <rect x="270" y="20" width="460" height="460" class="pcb" />
        <g class="pad">
          <rect v-for="p in 13" :key="`pt${p}`" :x="262 + p * 32" y="28" width="14" height="10" />
          <rect v-for="p in 13" :key="`pb${p}`" :x="262 + p * 32" y="462" width="14" height="10" />
        </g>
        <g class="cap">
          <rect v-for="p in 6" :key="`cl${p}`" x="280" :y="100 + p * 44" width="10" height="20" />
          <rect v-for="p in 6" :key="`cr${p}`" x="710" :y="100 + p * 44" width="10" height="20" />
        </g>
        <path d="M300 50h400v120h-30v160h30v120H300V330h30V170h-30Z" class="lid" />
        <rect x="300" y="50" width="400" height="8" class="lid-hi" />
        <rect x="300" y="50" width="8" height="120" class="lid-hi" />
        <text x="500" y="236" text-anchor="middle" class="etch">16 CORES</text>
        <text x="500" y="276" text-anchor="middle" class="etch small">x86-64 · AVX-512</text>
      </svg>

      <!-- 1 · lid off: chiplets -->
      <svg class="scene" :class="sceneClass(1)" :style="sceneStyle(1)" viewBox="0 0 1000 500" shape-rendering="crispEdges">
        <rect width="1000" height="500" class="pcb" />
        <g v-for="(cy, n) in [60, 280]" :key="`ccd${n}`">
          <rect x="120" :y="cy" width="320" height="160" class="die" />
          <svg x="120" :y="cy" width="320" height="160" viewBox="0 0 1000 500">
            <rect v-for="(c, i) in cores" :key="i" :x="c.x" :y="c.y" :width="c.w" :height="c.h" class="core" />
            <rect :x="l3.x" :y="l3.y" :width="l3.w" :height="l3.h" class="l3" />
          </svg>
        </g>
        <rect x="560" y="80" width="320" height="340" class="die io" />
        <rect v-for="n in 6" :key="`io${n}`" x="590" :y="100 + n * 42" width="260" height="20" class="io-lane" />
        <text x="280" y="250" text-anchor="middle" class="tag">CORE CHIPLETS</text>
        <text x="720" y="70" text-anchor="middle" class="tag">I/O DIE</text>
      </svg>

      <!-- 2 · one chiplet -->
      <svg class="scene" :class="sceneClass(2)" :style="sceneStyle(2)" viewBox="0 0 1000 500" shape-rendering="crispEdges">
        <rect width="1000" height="500" class="die" />
        <g v-for="(c, i) in cores" :key="i">
          <rect :x="c.x" :y="c.y" :width="c.w" :height="c.h" class="core" />
          <svg :x="c.x" :y="c.y" :width="c.w" :height="c.h" viewBox="0 0 1000 500">
            <rect v-for="b in blocks" :key="b.c" :x="b.x" :y="b.y" :width="b.w" :height="b.h" :class="['blk', b.c]" />
          </svg>
          <text :x="c.x + c.w - 10" :y="c.y + c.h - 10" text-anchor="end" class="core-n">CORE {{ i }}</text>
        </g>
        <rect :x="l3.x" :y="l3.y" :width="l3.w" :height="l3.h" class="l3" />
        <rect v-for="n in 22" :key="`l3c${n}`" :x="l3.x + n * 42 - 22" :y="l3.y + 14" width="30" height="142" class="l3-cell" />
        <text x="500" y="244" text-anchor="middle" class="tag big">L3 CACHE · 32 MB</text>
        <text x="500" y="282" text-anchor="middle" class="tag">+64 MB stacked on top (X3D)</text>
      </svg>

      <!-- 3 · one core -->
      <svg class="scene" :class="sceneClass(3)" :style="sceneStyle(3)" viewBox="0 0 1000 500" shape-rendering="crispEdges">
        <rect width="1000" height="500" class="die" />
        <g v-for="b in blocks" :key="b.c">
          <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" :class="['blk', b.c]" />
          <text v-if="b.c !== 'vec'" :x="b.x + 16" :y="b.y + 38" class="blk-t">{{ b.t }}</text>
          <text v-if="b.c !== 'vec'" :x="b.x + 16" :y="b.y + 68" class="blk-s">{{ b.sub }}</text>
        </g>
        <text x="356" y="56" class="blk-t hot">VECTOR UNIT</text>
        <text x="356" y="300" class="blk-s">floats + SIMD live here</text>
        <rect x="360" y="70" width="240" height="120" class="regfile" />
        <svg x="360" y="70" width="240" height="120" viewBox="0 0 1000 500">
          <g v-for="r in rows" :key="r">
            <rect v-for="l in lanes" :key="l" :x="100 + l * 54" :y="40 + r * 52" width="50" height="40"
              :class="['lane', { z0: r === 0 }]" />
          </g>
        </svg>
        <text x="360" y="222" class="blk-s">registers</text>
        <g v-for="(p, i) in pipes" :key="p">
          <rect x="620" :y="70 + i * 42" width="120" height="34" class="pipe" />
          <text x="680" :y="94 + i * 42" text-anchor="middle" class="pipe-t">{{ p }}</text>
        </g>
      </svg>

      <!-- 4 · vector registers -->
      <svg class="scene" :class="sceneClass(4)" :style="sceneStyle(4)" viewBox="0 0 1000 500" shape-rendering="crispEdges">
        <rect width="1000" height="500" class="regfile" />
        <g v-for="r in rows" :key="r">
          <text x="84" :y="70 + r * 52" text-anchor="end" class="reg-n" :class="{ hot: r === 0 }">Z{{ r }}</text>
          <rect v-for="l in lanes" :key="l" :x="100 + l * 54" :y="40 + r * 52" width="50" height="40"
            :class="['lane', { z0: r === 0 }]" :style="r === 0 ? { animationDelay: `${l * 50}ms` } : undefined" />
        </g>
        <text x="500" y="482" text-anchor="middle" class="tag">… Z8 – Z31</text>
      </svg>

      <i class="corner tl" /><i class="corner tr" /><i class="corner bl" /><i class="corner br" />
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="caption" v-html="captions[s]" />
  </div>
</template>

<style scoped>
.chip-zoom { position: relative; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.stage {
  position: relative; margin-top: 8px; width: 900px; aspect-ratio: 2 / 1; overflow: hidden;
  background: #0b1b2b; outline: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c;
}
.scene {
  position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 0 0;
  transition: transform 900ms cubic-bezier(.55, 0, .35, 1), opacity 300ms linear 250ms;
}
.scene.past { transition: transform 900ms cubic-bezier(.55, 0, .35, 1), opacity 250ms linear 600ms; }
.scene:not(.now) { pointer-events: none; }

.pcb { fill: #1d6b3a; }
.pad rect { fill: #e0b23a; }
.cap rect { fill: #8b6a3a; }
.lid { fill: #b8bec8; stroke: #5c6470; stroke-width: 4; vector-effect: non-scaling-stroke; }
.lid-hi { fill: #e6eaf0; }
.etch { font: 700 40px var(--arc-pixel); fill: #6e7682; letter-spacing: .12em; }
.etch.small { font-size: 22px; }

.die { fill: #232838; stroke: #04121c; stroke-width: 3; vector-effect: non-scaling-stroke; }
.die.io { fill: #2b2440; }
.io-lane { fill: #4a3f6b; }
.core { fill: #1f3d63; stroke: #5dc9e2; stroke-width: 2; vector-effect: non-scaling-stroke; }
.l3 { fill: #5a4a1a; stroke: #04121c; stroke-width: 2; vector-effect: non-scaling-stroke; }
.l3-cell { fill: #7a6526; }
.core-n { font: 700 18px var(--arc-pixel); fill: #fff; letter-spacing: .1em; }

.blk { stroke: #04121c; stroke-width: 2; vector-effect: non-scaling-stroke; }
.blk.front { fill: #3b4f7a; }
.blk.int { fill: #2f6b5a; }
.blk.ls { fill: #5a3b6b; }
.blk.vec { fill: #1d4f7a; stroke: var(--arc-yellow); }
.blk.l1, .blk.l2 { fill: #5a4a1a; }
.blk-t { font: 700 24px var(--arc-pixel); fill: #fff; letter-spacing: .08em; }
.blk-t.hot { fill: var(--arc-yellow); }
.blk-s { font: 500 18px var(--arc-mono); fill: #eaf2ff; }
.regfile { fill: #0b1b2b; stroke: var(--arc-yellow); stroke-width: 3; vector-effect: non-scaling-stroke; }
.pipe { fill: #2c5cc5; stroke: #04121c; stroke-width: 2; vector-effect: non-scaling-stroke; }
.pipe-t { font: 700 20px var(--arc-pixel); fill: #fff; letter-spacing: .1em; }

.lane { fill: #1f3d63; stroke: #5dc9e2; stroke-width: 1; vector-effect: non-scaling-stroke; }
.lane.z0 { fill: var(--arc-yellow); stroke: #04121c; }
.scene.now .lane.z0 { animation: lane-pop 360ms steps(3, end) both; }
.reg-n { font: 700 24px var(--arc-mono); fill: #eaf2ff; }
.reg-n.hot { fill: var(--arc-yellow); }

.tag { font: 700 22px var(--arc-pixel); fill: #fff; letter-spacing: .12em; }
.tag.big { font-size: 36px; }

.corner { position: absolute; width: 22px; height: 22px; border: 4px solid var(--arc-yellow); z-index: 2; }
.corner.tl { top: 10px; left: 10px; border-right: 0; border-bottom: 0; }
.corner.tr { top: 10px; right: 10px; border-left: 0; border-bottom: 0; }
.corner.bl { bottom: 10px; left: 10px; border-right: 0; border-top: 0; }
.corner.br { bottom: 10px; right: 10px; border-left: 0; border-top: 0; }
.zoom {
  position: absolute; top: -40px; right: 30px; z-index: 2;
  font: 700 18px var(--arc-pixel); letter-spacing: .12em; color: var(--arc-yellow); text-shadow: 2px 2px 0 #000;
}

.caption { margin: 0; font: 500 26px 'DM Sans', sans-serif; text-align: center; min-height: 1.4em; }
.caption :deep(b) { color: var(--arc-yellow); }

@keyframes lane-pop { from { opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  .scene, .scene.past { transition: opacity 150ms linear; }
  .scene.now .lane.z0 { animation: none; }
}
</style>
