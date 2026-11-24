<script setup lang="ts">
// Mortal Kombat nod (original sprite): yellow-hooded ninja bust, glowing white eyes, black mask, crossed gi. 16×16.
withDefaults(defineProps<{ size?: number }>(), { size: 40 })
const rows = ['....DDDDDDDD....', '...DYYYYYYYYD...', '..DYYYYYYYYYYD..', '..DYYYYYYYYYYD..', '..DYDDDDDDDDYD..',
  '..DYTWWTTWWTYD..', '..DYDDDDDDDDYD..', '..DYKKKKKKKKYD..', '..DYKKKKKKKKYD..', '...DYKKKKKKYD...',
  '..DDDYYYYYYDDD..', '.DYYYDKKKKDYYYD.', 'DYYYYYDKKDYYYYYD', 'DYYYYYYDDYYYYYYD', 'DKKKKKKKKKKKKKKD', 'DYYYYYYYYYYYYYYD']
const colours: Record<string, string> = { D: '#04121c', Y: '#ffd84a', T: '#f6d2a2', W: '#fff', K: '#1a1a1a' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
</script>

<template>
  <svg viewBox="0 0 16 16" :width="size" :height="size" shape-rendering="crispEdges" aria-hidden="true">
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
  </svg>
</template>
