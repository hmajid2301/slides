<script setup lang="ts">
// Skyrim nod (original sprite): an arrow, "took an L1 miss to the knee". Diagonal, 12×12.
// D outline, B brown shaft, S steel head, F white fletching.
const rows = ['.........DD.', '........DSSD', '.......DSSSD', '......DBSSD.', '.....DBDDD..', '....DBD.....',
  '...DBD......', 'DFDBD.......', 'DFFBD.......', '.DFFFD......', '..DFFD......', '...DD.......']
const colours: Record<string, string> = { D: '#04121c', B: '#8a5a2b', S: '#c9d3df', F: '#fff' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 72, label: true })
</script>

<template>
  <div class="knee">
    <svg viewBox="0 0 12 12" :width="size" :height="size" shape-rendering="crispEdges" aria-hidden="true">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
    <span v-if="label">I used to be fast like you,<br>then I took an L1 miss<br>to the knee</span>
  </div>
</template>

<style scoped>
.knee { display: flex; align-items: center; gap: 12px; }
.knee svg { filter: drop-shadow(3px 3px 0 #04121c); }
.knee span { font: 700 16px/1.4 var(--arc-pixel); letter-spacing: .06em; color: #e6dcc3; text-shadow: 2px 2px 0 #04121c; }
</style>
