<script setup lang="ts">
// The Last of Us nod (original sprite): a Clicker's fungus-split head, "click… click… click…". 12×12.
// D outline, F fungus plates, f darker fungus, S skin, M mouth.
const rows = ['..DD.DD.DD..', '.DFFDFFDFFD.', 'DFfFFfFFfFD.', 'DFFfFFfFFFFD', '.DFFfFFfFFD.', 'DFfFFFFFFfFD',
  'DSSFfFFfFSSD', 'DSSSFFFFSSSD', '.DSSMMMMSSD.', '.DSSMDDMSSD.', '..DSSSSSSD..', '...DDDDDD...']
const colours: Record<string, string> = { D: '#04121c', F: '#d8c39a', f: '#8a6a3c', S: '#9aa58a', M: '#3a1a14' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 72, label: true })
</script>

<template>
  <div class="clicker">
    <svg viewBox="0 0 12 12" :width="size" :height="size" shape-rendering="crispEdges" aria-hidden="true">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
    <span v-if="label">click…<br>click…<br>click…</span>
  </div>
</template>

<style scoped>
.clicker { display: flex; align-items: center; gap: 12px; }
.clicker svg { animation: twitch 600ms steps(2, end) infinite; filter: drop-shadow(3px 3px 0 #04121c); }
.clicker span { font: 700 18px/1.3 var(--arc-pixel); letter-spacing: .08em; color: #d8c39a; text-shadow: 2px 2px 0 #04121c; }
@keyframes twitch { 50% { transform: translateX(2px) rotate(-4deg) } }
@media (prefers-reduced-motion: reduce) { .clicker svg { animation: none } }
</style>
