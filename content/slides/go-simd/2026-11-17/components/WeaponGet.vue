<script setup lang="ts">
// Mega Man "weapon get" nod (original sprite): a beam drops in, the gopher lands in blue armour
// with a helmet and arm cannon, flashes through palettes, then "YOU GOT SIMD!".
withDefaults(defineProps<{ on?: boolean }>(), { on: false })

// 18×16 armoured gopher. D outline, A armour blue, L light blue, H helmet shine, W white, K pupil,
// T tan, N nose, C cannon. Gopher ears poke out of the helmet.
const sprite = [
  '..DD........DD....',
  '.DLLDDDDDDDDLLD...',
  '.DAAAAHHAAAAAAD...',
  'DAAAAAHHAAAAAAAD..',
  'DAADDDDDDDDDDAAD..',
  'DAAWWWWLLWWWWAAD..',
  'DAAWKKWLLWKKWAAD..',
  'DALWWWWLLWWWWLAD..',
  'DALLLLTTTTLLLLADDD',
  'DAALLTTNNTTLLAADCD',
  'DAAAALTWWTLAAAADCD',
  'DAAAAAAWWAAAAAADDD',
  '.DAAAAAAAAAAAAD...',
  '.DAALLLLLLLLAAD...',
  '..DAAD....DAAD....',
  '..DDDD....DDDD....',
]
const colours: Record<string, string> = {
  D: '#04121c', A: '#1f6fe0', L: '#6ad1ff', H: '#ffffff', W: '#ffffff',
  K: '#04121c', T: '#f6d2a2', N: '#3b2416', C: '#9fb3c8',
}
const pixels = sprite.flatMap((row, y) => [...row].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
</script>

<template>
  <div class="weapon" :class="{ on }" aria-hidden="true">
    <p class="banner">WEAPON GET</p>
    <i class="beam" />
    <svg class="g" viewBox="0 0 18 16" width="126" height="112" shape-rendering="crispEdges">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
    <p class="got">YOU GOT <b>SIMD</b>!</p>
  </div>
</template>

<style scoped>
.weapon { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 8px; }
.banner, .got { margin: 0; font: 700 22px var(--arc-pixel); letter-spacing: .12em; color: #fff; text-shadow: 2px 2px 0 #04121c; opacity: 0; }
.got b { color: #6ad1ff; }
.g { opacity: 0; filter: drop-shadow(4px 4px 0 #04121c); }
.beam { position: absolute; left: 50%; top: -380px; width: 16px; height: 60px; margin-left: -8px; background: #fff; outline: 3px solid #1f6fe0; opacity: 0; }
.on .banner { animation: show 1ms 0ms both; }
.on .beam { animation: drop 300ms steps(5, end) 300ms both; }
.on .g { animation: show 1ms 600ms both, swap 1200ms steps(1, end) 600ms both; }
.on .got { animation: show 1ms 1800ms both; }
@keyframes drop { from { opacity: 1; transform: translateY(0) } 99% { opacity: 1 } to { opacity: 0; transform: translateY(420px) } }
@keyframes show { to { opacity: 1 } }
@keyframes swap {
  0% { filter: hue-rotate(0) brightness(2) } 12% { filter: hue-rotate(140deg) }
  25% { filter: hue-rotate(260deg) brightness(1.4) } 37% { filter: hue-rotate(0) brightness(2) }
  50% { filter: hue-rotate(140deg) } 62% { filter: hue-rotate(260deg) brightness(1.4) }
  75% { filter: hue-rotate(60deg) } 100% { filter: drop-shadow(4px 4px 0 #04121c) }
}
@media (prefers-reduced-motion: reduce) { .on .beam { animation: none } .on .g, .on .banner, .on .got { animation: none; opacity: 1 } }
</style>
