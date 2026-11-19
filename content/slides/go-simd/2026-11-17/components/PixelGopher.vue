<script setup lang="ts">
// 16×16 sprite. D outline, B body, H highlight, S shade, W white, K pupil, T tan, N nose.
const sprite = [
  '..DD........DD..',
  '.DBBDDDDDDDDBBD.',
  '.DBHHHHBBBBBBSD.',
  'DBHWWWWBBWWWWBSD',
  'DBHWKKWBBWKKWBSD',
  'DBBWKKWBBWKKWBSD',
  'DBBWWWWBBWWWWBSD',
  'DBBBBBTTTTBBBBSD',
  'DBBBBTTNNTTBBBSD',
  'DTBBBBTWWTBBBBTD',
  'DTBBBBBWWBBBBSTD',
  'DBBBBBBBBBBBBSSD',
  '.DBBBBBBBBBBBSD.',
  '.DSBBBBBBBBBSSD.',
  '..DTTDDDDDDTTD..',
  '..DDDD....DDDD..',
]
const colours: Record<string, string> = {
  D: '#04121c', B: '#7fd5ea', H: '#c2f0fa', S: '#4aa8c4', W: '#ffffff',
  K: '#04121c', T: '#f6d2a2', N: '#3b2416',
}
const pixels = sprite.flatMap((row, y) => [...row].flatMap((c, x) =>
  colours[c] ? [{ x, y, fill: colours[c] }] : []))

const props = withDefaults(defineProps<{ size?: number, bob?: boolean }>(), { size: 160, bob: false })
// Hard shadow one sprite pixel down-right, in the theme's navy.
const shadow = `drop-shadow(${props.size / 16}px ${props.size / 16}px 0 #04121c80)`
</script>

<template>
  <svg class="pixel-gopher" :class="{ bob }" viewBox="0 0 16 16" :width="size" :height="size"
    shape-rendering="crispEdges" :style="{ filter: shadow }" role="img" aria-label="Pixel-art Go gopher">
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
  </svg>
</template>

<style scoped>
.pixel-gopher { image-rendering: pixelated; }
.bob { animation: bob 1.2s steps(2, jump-none) infinite; }
@keyframes bob { from { transform: translateY(0) } to { transform: translateY(-8px) } }
@media (prefers-reduced-motion: reduce) { .bob { animation: none } }
</style>
