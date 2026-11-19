<script setup lang="ts">
// RPG save-point nod for "Before you ship it": save before the boss.
// Original 12×12 floppy sprite. D outline, B body, S shutter, L label, H hole.
const floppy = [
  'DDDDDDDDDDD.',
  'DBBSSSSSHSBD',
  'DBBSSSSSHSBD',
  'DBBSSSSSSSBD',
  'DBBBBBBBBBBD',
  'DBLLLLLLLLBD',
  'DBLLLLLLLLBD',
  'DBLLLLLLLLBD',
  'DBLLLLLLLLBD',
  'DBLLLLLLLLBD',
  'DBBBBBBBBBBD',
  'DDDDDDDDDDDD',
].flatMap((r, y) => [...r].flatMap((c, x) => c === '.' ? [] : [{ x, y, c }]))
const fill: Record<string, string> = { D: '#04121c', B: '#00add8', S: '#eaf2ff', H: '#04121c', L: '#fff' }
</script>

<template>
  <div class="save" role="img" aria-label="Save point: save your game before the boss">
    <svg viewBox="0 0 12 12" width="132" height="132" shape-rendering="crispEdges" class="disk">
      <rect v-for="(p, i) in floppy" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="fill[p.c]" />
    </svg>
    <div class="box">
      <p>Save before the boss?</p>
      <p class="opts"><span class="on">▶ YES</span><span>NO</span></p>
    </div>
  </div>
</template>

<style scoped>
.save { display: flex; flex-direction: column; align-items: center; gap: 22px; }
.disk { filter: drop-shadow(6px 6px 0 #04121c); animation: float 1.2s steps(2, jump-none) infinite; }
.box {
  padding: 14px 22px; background: #0b1b2b; border: 4px solid #fff; outline: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c;
  font: 700 24px var(--arc-pixel); color: #fff; text-align: center;
}
.box p { margin: 4px 0 !important; }
.opts { display: flex; justify-content: center; gap: 36px; }
.opts .on { color: var(--arc-yellow); animation: blink 700ms steps(2, jump-none) infinite; }
@keyframes float { 50% { transform: translateY(-8px) } }
@keyframes blink { 50% { opacity: .4 } }
@media (prefers-reduced-motion: reduce) { .disk, .opts .on { animation: none } }
</style>
