<script setup lang="ts">
// Speed-runner nod: when `go` turns true, the gopher dashes across with speed lines.
import PixelGopher from './PixelGopher.vue'
withDefaults(defineProps<{ go?: boolean }>(), { go: false })
</script>

<template>
  <div class="dash" aria-hidden="true">
    <div v-if="go" class="runner">
      <span class="lines"><i /><i /><i /></span>
      <PixelGopher :size="64" />
    </div>
  </div>
</template>

<style scoped>
.dash { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.runner { position: absolute; top: 50%; left: 0; display: flex; align-items: center; animation: run 900ms steps(12, end) both; }
.lines { display: flex; flex-direction: column; gap: 8px; margin-right: 6px; }
.lines i { display: block; height: 6px; background: #fff; outline: 2px solid #04121c; }
.lines i:nth-child(1) { width: 70px; margin-left: 30px } .lines i:nth-child(2) { width: 100px } .lines i:nth-child(3) { width: 60px; margin-left: 40px }
@keyframes run { from { transform: translate(-200px, -50%) } to { transform: translate(1300px, -50%) } }
@media (prefers-reduced-motion: reduce) { .runner { display: none } }
</style>
