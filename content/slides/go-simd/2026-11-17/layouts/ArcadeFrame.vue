<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { slides } from '#slidev/slides'

defineProps<{ variant?: string }>()

const { $page, $frontmatter, $clicks } = useSlideContext()
// Use the rendered slide's page so presenter previews/exports stay correct.
const world = computed(() => slides.value
  .filter(s => s.no <= $page.value && s.meta.slide?.frontmatter.layout === 'section')
  .at(-1))
const kicker = computed(() => {
  if ($frontmatter.label && !world.value) return $frontmatter.label
  if (!world.value) return ''
  const fm = world.value.meta.slide!.frontmatter
  const stage = $page.value - world.value.no
  return stage === 0 ? `WORLD ${fm.level}` : `WORLD ${fm.level}-${stage} · ${fm.label}`
})
// HUD: hearts drop to 2 from click `hurtAt` (boss slide); `heal` flashes them back on the power-up.
const hearts = computed(() => $frontmatter.hurtAt != null && $clicks.value >= $frontmatter.hurtAt ? 2 : 3)
// Background critters: offset each loop by page so they don't all appear at slide start.
const bgDelay = computed(() => `${-(($page.value * 13) % 40)}s`)
const blocks = 20
const filled = computed(() => Math.round(blocks * $page.value / Math.max(1, slides.value.length)))
</script>

<template>
  <div class="slidev-layout arcade" :class="variant">
    <header class="arcade-top">
      <span class="arcade-kicker">{{ kicker }}</span>
      <span class="arcade-player">
        <span class="hud-hearts" :class="{ heal: $frontmatter.heal }" aria-hidden="true">
          <svg v-for="h in 3" :key="h" viewBox="0 0 7 6" width="21" height="18" shape-rendering="crispEdges" :class="{ empty: h > hearts }">
            <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" />
          </svg>
        </span>
        <span class="hud-coins" aria-hidden="true"><i />×{{ String($page).padStart(2, '0') }}</span>
        GO 1.27
      </span>
    </header>
    <main class="arcade-body"><slot /></main>
    <footer class="arcade-footer">
      <span>SIMD WITHOUT ASSEMBLY</span>
      <span class="arcade-bar" aria-hidden="true">
        <i v-for="n in blocks" :key="n" :class="{ on: n <= filled }" />
      </span>
      <span>SCORE {{ String($page).padStart(2, '0') }}/{{ String(slides.length).padStart(2, '0') }}</span>
    </footer>
    <div class="arcade-bg" aria-hidden="true" :style="{ '--bg-delay': bgDelay }">
      <i class="bg-qblock" :class="{ hit: variant === 'section' }" />
      <i class="bg-ufo" /><i class="bg-duck" /><i class="bg-ghost" />
    </div>
    <slot name="overlay" />
  </div>
</template>
