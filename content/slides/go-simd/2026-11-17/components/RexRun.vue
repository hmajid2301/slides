<script setup lang="ts">
import PixelSprite from './PixelSprite.vue'
// Offline-runner nod: no SIMD hardware, the game still plays (emulated).
</script>

<template>
  <div class="rex-run" aria-hidden="true">
    <div class="rex"><PixelSprite name="rex" :size="88" /></div>
    <div class="cactus"><i /><i /><i /></div>
    <div class="ground" />
    <span class="tag">OFFLINE · EMULATED</span>
  </div>
</template>

<style scoped>
.rex-run {
  position: relative; height: 168px; margin-top: 18px; overflow: hidden;
  background: #0b1b2b; border: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c;
}
.tag { position: absolute; right: 10px; top: 10px; font: 700 18px var(--arc-pixel); letter-spacing: .1em; color: #0b1b2b; background: var(--arc-yellow); padding: 2px 8px; }
.ground { position: absolute; left: 0; right: 0; bottom: 14px; height: 4px; background: repeating-linear-gradient(90deg, #fff 0 18px, transparent 18px 26px); }
.rex { position: absolute; left: 36px; bottom: 16px; animation: jump 2.2s steps(10, end) infinite; }
.cactus { position: absolute; bottom: 18px; left: 100%; width: 30px; height: 48px; transform: scale(1.15); transform-origin: bottom; animation: scroll 2.2s linear infinite; }
.cactus i { position: absolute; background: #189a3c; outline: 3px solid #04121c; }
.cactus i:nth-child(1) { left: 10px; width: 10px; height: 48px; bottom: 0; }
.cactus i:nth-child(2) { left: 0; width: 6px; height: 18px; bottom: 18px; }
.cactus i:nth-child(3) { right: 0; width: 6px; height: 14px; bottom: 24px; }
/* cactus overlaps the rex at ~71-94% of the loop; hang in the air across it */
@keyframes scroll { to { left: -40px } }
@keyframes jump { 0%, 58%, 100% { transform: none } 68%, 94% { transform: translateY(-62px) } }
@media (prefers-reduced-motion: reduce) { .rex, .cactus { animation: none } .cactus { left: 70% } }
</style>
