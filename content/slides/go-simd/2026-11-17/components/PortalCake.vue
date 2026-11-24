<script setup lang="ts">
// Portal nod for the emulated width (original sprite): chocolate layer cake, cherries, one candle, "the cake is a lie". 17×16.
// Y/O flame, W cream/candle, R cherry, C chocolate, P plate, D outline.
withDefaults(defineProps<{ size?: number, label?: boolean }>(), { size: 80, label: true })
const rows = ['........Y........', '.......YOY.......', '........Y........', '.......DWD.......', '...RR..DWD..RR...',
  '..DRRDDDWDDDRRD..', '..DWWWWRRWWWWWD..', '.DWWWWWWWWWWWWWD.', '.DCWWCWWCWWCWWCD.', '.DCCCCCCCCCCCCCD.',
  '.DCCCCCCCCCCCCCD.', '.DWWWWWWWWWWWWWD.', '.DCCCCCCCCCCCCCD.', '.DCCCCCCCCCCCCCD.', 'DPPPPPPPPPPPPPPPD', '.DDDDDDDDDDDDDDD.']
const colours: Record<string, string> = { Y: '#ffd84a', O: '#ff8a1f', W: '#fff', R: '#e8342a', C: '#5a2a14', P: '#c9d3df', D: '#04121c' }
const pixels = rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))
</script>

<template>
  <div class="cake">
    <svg viewBox="0 0 17 16" :width="size" :height="size * 16 / 17" shape-rendering="crispEdges" aria-hidden="true">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
    <span v-if="label">the cake<br>is a lie</span>
  </div>
</template>

<style scoped>
.cake { display: flex; align-items: center; gap: 10px; }
.cake svg { filter: drop-shadow(3px 3px 0 #04121c); }
.cake span { font: 700 18px/1.3 var(--arc-pixel); letter-spacing: .08em; color: #ffd0e0; text-shadow: 2px 2px 0 #04121c; }
</style>
