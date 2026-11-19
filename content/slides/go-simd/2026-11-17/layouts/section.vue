<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIsSlideActive, useSlideContext } from '@slidev/client'
import ArcadeFrame from './ArcadeFrame.vue'
import PixelGopher from '../components/PixelGopher.vue'

// "Next level": the gopher hops down a warp pipe on the overworld, an iris
// closes on the pipe, then the underground WORLD n card pops in.
const { $frontmatter } = useSlideContext()
const active = useIsSlideActive()
const run = ref(0)
watch(active, now => { if (now) run.value++ }, { immediate: true })
</script>

<template>
  <ArcadeFrame variant="section">
    <div :key="run" class="intermission">
      <p class="world">WORLD {{ $frontmatter.level }}</p>
      <slot />
      <p class="lives"><PixelGopher :size="56" /> <span>× {{ $frontmatter.lives ?? 3 }}</span></p>
    </div>
    <template #overlay>
      <div v-if="active" :key="run" class="warp" aria-hidden="true">
        <div class="warp-gopher"><PixelGopher :size="112" /></div>
        <div class="warp-pipe"><i class="lip" /><i class="body" /></div>
      </div>
    </template>
  </ArcadeFrame>
</template>
