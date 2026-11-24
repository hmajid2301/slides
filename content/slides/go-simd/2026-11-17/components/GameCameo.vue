<script setup lang="ts">
// Background game cameo: a while after `show` turns true (and the slide is active), the slot
// appears faded behind the slide content at a random spot, then disappears.
import type { CSSProperties } from 'vue'
import { useIsSlideActive } from '@slidev/client'
import { useCameo } from './useCameo'

const props = withDefaults(defineProps<{ show?: boolean, delay?: number, hold?: number, spots?: CSSProperties[] }>(), {
  show: true, delay: 1500, hold: 2600,
  spots: () => [{ top: '0', right: '0' }, { bottom: '0', right: '0' }, { bottom: '0', left: '0' }],
})
const active = useIsSlideActive()
const { shown, spot } = useCameo(() => active.value && props.show, props.spots, props.delay, props.hold)
</script>

<template>
  <div v-if="shown" class="arc-cameo" :style="[spot, { animation: `arc-cameo ${hold}ms steps(1, end) both` }]" aria-hidden="true"><slot /></div>
</template>

<style>
/* z-index -1: behind the slide's own content, above the overworld background.
   The animation is inline so layout rules like `.intermission > *` can't override it. */
.arc-cameo { position: absolute; z-index: -1; pointer-events: none; }
@keyframes arc-cameo { 0% { opacity: 0 } 6% { opacity: .5 } 94% { opacity: .5 } 100% { opacity: 0 } }
</style>
