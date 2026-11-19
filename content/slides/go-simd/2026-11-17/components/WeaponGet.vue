<script setup lang="ts">
// Blue-bomber "weapon get" nod: beam drops in, the gopher palette-swaps through colours, then settles.
import PixelGopher from './PixelGopher.vue'
withDefaults(defineProps<{ on?: boolean }>(), { on: false })
</script>

<template>
  <div class="weapon" :class="{ on }" aria-hidden="true">
    <i class="beam" />
    <div class="g"><PixelGopher :size="96" /></div>
  </div>
</template>

<style scoped>
.weapon { position: relative; display: inline-flex; flex-direction: column; align-items: center; height: 120px; }
.g { opacity: 0; }
.beam { position: absolute; left: 50%; top: -400px; width: 16px; height: 60px; margin-left: -8px; background: #fff; outline: 3px solid #00add8; opacity: 0; }
.on .beam { animation: drop 300ms steps(5, end) 500ms both; }
.on .g { animation: land 1ms 800ms both, swap 1200ms steps(1, end) 800ms both; }
@keyframes drop { from { opacity: 1; transform: translateY(0) } 99% { opacity: 1 } to { opacity: 0; transform: translateY(420px) } }
@keyframes land { to { opacity: 1 } }
@keyframes swap {
  0% { filter: hue-rotate(0) brightness(2) } 12% { filter: hue-rotate(140deg) }
  25% { filter: hue-rotate(260deg) brightness(1.4) } 37% { filter: hue-rotate(0) brightness(2) }
  50% { filter: hue-rotate(140deg) } 62% { filter: hue-rotate(260deg) brightness(1.4) }
  75% { filter: hue-rotate(60deg) } 100% { filter: none }
}
@media (prefers-reduced-motion: reduce) { .on .beam { animation: none } .on .g { animation: none; opacity: 1 } }
</style>
