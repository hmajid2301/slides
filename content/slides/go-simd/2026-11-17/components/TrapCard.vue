<script setup lang="ts">
// Yu-Gi-Oh! nod for the traps slide (original art). Background cameo: a while after `show` turns
// true, a faded face-down card pops up somewhere empty, flips with "You've activated my trap card!",
// then disappears.
import { useIsSlideActive } from '@slidev/client'
import { useCameo } from './useCameo'

const props = defineProps<{ show?: boolean }>()
const active = useIsSlideActive()
// Empty corners on the traps slide: beside the title, and over the hills below the cards.
const { shown, spot } = useCameo(() => active.value && !!props.show, [
  { top: '50px', right: '0' },
  { top: '488px', left: '0' },
  { top: '488px', left: '420px' },
  { top: '488px', right: '0' },
], 1800, 2800)

// Original 10×8 bear-trap sprite for the card art. D dark, S steel, T teeth.
const art = ['T.T.T.T.T.', 'SSSSSSSSSS', 'S........S', 'S...DD...S', 'S...DD...S', 'S........S', 'SSSSSSSSSS', '.T.T.T.T.T']
  .flatMap((r, y) => [...r].flatMap((c, x) => c === '.' ? [] : [{ x, y, fill: { D: '#04121c', S: '#c9d3df', T: '#eaf2ff' }[c]! }]))
</script>

<template>
  <div v-if="shown" class="trap" :style="spot" aria-hidden="true">
    <p class="shout">You've activated<br>my trap card!</p>
    <div class="card">
      <div class="face back"><i /></div>
      <div class="face front">
        <b class="name">TRAP <span>↯</span></b>
        <svg class="art" viewBox="0 0 10 8" shape-rendering="crispEdges">
          <rect width="10" height="8" fill="#3a1630" />
          <rect v-for="(p, i) in art" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
        </svg>
        <span class="text"><i /><i /></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trap {
  position: absolute; z-index: 0; display: flex; align-items: center; gap: 16px; pointer-events: none;
  opacity: .55; animation: cameo 2.8s steps(1, end) both;
}
.shout { margin: 0; text-align: right; font: 700 18px/1.3 var(--arc-pixel); letter-spacing: .06em; color: #ffd0e0; text-shadow: 2px 2px 0 #04121c; opacity: 0; animation: shout 1ms 900ms forwards; }
.card { position: relative; width: 72px; height: 104px; transform-style: preserve-3d; transform: rotateY(180deg); animation: flip 400ms steps(4, end) 400ms forwards; }
.face { position: absolute; inset: 0; backface-visibility: hidden; outline: 3px solid #04121c; box-shadow: 4px 4px 0 #04121c; }
.back { transform: rotateY(180deg); background: #8f5a2b; display: grid; place-items: center; }
.back i { width: 70%; height: 80%; border-radius: 50%; background: repeating-conic-gradient(#5c3417 0 25%, #7a4a22 0 50%) 0 0 / 10px 10px; outline: 3px solid #c08a3e; }
.front { background: #b0307a; padding: 5px; display: flex; flex-direction: column; gap: 4px; }
.name { font: 700 10px var(--arc-pixel); letter-spacing: .06em; color: #fff; background: #6e1a4c; padding: 1px 3px; display: flex; justify-content: space-between; }
.art { width: 100%; height: auto; outline: 2px solid #04121c; }
.text { flex: 1; background: #f3e3c3; outline: 2px solid #04121c; display: flex; flex-direction: column; gap: 4px; padding: 4px; }
.text i { height: 2px; background: #8f7a5a; }
.text i:last-child { width: 60%; }
@keyframes flip { to { transform: none } }
@keyframes shout { to { opacity: 1 } }
@keyframes cameo { 0% { opacity: 0 } 5% { opacity: .55 } 95% { opacity: .55 } 100% { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .card { animation: none; transform: none } .shout { animation: none; opacity: 1 } }
</style>
