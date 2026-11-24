<script setup lang="ts">
import PixelSprite from './PixelSprite.vue'

// Pokémon-style evolution nod (original sprites): scalar lizard evolves at step 1.
// Used as a background <Cameo>, so it sizes itself and is positioned by the wrapper.
defineProps<{ step: number }>()
</script>

<template>
  <div class="evolve-lizard" :class="{ evolving: step === 1, evolved: step >= 1 }">
    <div class="stage" aria-hidden="true">
      <span class="before"><PixelSprite name="ember" :size="150" /></span>
      <span class="after"><PixelSprite name="blaze" :size="170" /></span>
    </div>
    <p class="textbox">
      <template v-if="step === 1">What? <b>AddScalar</b> is evolving!</template>
      <template v-else-if="step >= 2"><b>AddScalar</b> evolved into <b>AddSIMD</b>!</template>
      <template v-else>A wild <b>AddScalar</b> appeared!</template>
    </p>
  </div>
</template>

<style scoped>
.evolve-lizard {
  width: 300px;
  display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none;
}
.stage { position: relative; width: 170px; height: 170px; }
/* Grass ellipse the sprite stands on, like a battle platform. */
.stage::before { content: ''; position: absolute; left: -10px; right: -10px; bottom: -6px; height: 28px; border-radius: 50%; background: #7ee787; box-shadow: inset 0 -6px 0 #189a3c; }
.stage > span { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); }
.after { opacity: 0; }
.evolved .before { opacity: 0; }
.evolved .after { opacity: 1; }
/* Pokémon text box: white panel, dark rounded double border. */
.textbox {
  margin: 0; width: 100%; padding: 10px 14px; min-height: 2.9em;
  font: 600 18px/1.4 var(--arc-mono); color: #04121c; background: #f8f8f8;
  border: 4px solid #04121c; border-radius: 8px; box-shadow: inset 0 0 0 3px #f8f8f8, inset 0 0 0 6px #5d6b7a;
}
.textbox b { color: #c62828; }
/* Flicker between white silhouettes, faster each time, then reveal the new form. */
.evolving .before, .evolving .after { filter: brightness(0) invert(1); animation: flick 1.6s steps(1, end) both; }
.evolving .after { animation-name: flick-after; }
@keyframes flick {
  0%, 20%, 40%, 55%, 70%, 80%, 90% { opacity: 1 }
  10%, 30%, 48%, 62%, 75%, 85%, 95%, 100% { opacity: 0 }
}
@keyframes flick-after {
  0%, 20%, 40%, 55%, 70%, 80%, 90% { opacity: 0 }
  10%, 30%, 48%, 62%, 75%, 85%, 95% { opacity: 1 }
  99% { filter: brightness(0) invert(1) }
  100% { opacity: 1; filter: none }
}
@media (prefers-reduced-motion: reduce) {
  .evolving .before, .evolving .after { animation: none; filter: none; }
}
</style>
