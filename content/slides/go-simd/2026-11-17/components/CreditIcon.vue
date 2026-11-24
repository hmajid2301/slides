<script setup lang="ts">
// Small icon per credit on the "Special thanks" slide: the sprite each reference used in the deck.
// Compact copies of the sprites in WeaponGet, WhipWall (roast), PortalCake, NinjaHood, BeybladeSpin, ArrowKnee, ClickerHead, UavRadar and ForcedLaugh.
import ArrowKnee from './ArrowKnee.vue'
import BeybladeSpin from './BeybladeSpin.vue'
import ClickerHead from './ClickerHead.vue'
import ForcedLaugh from './ForcedLaugh.vue'
import NinjaHood from './NinjaHood.vue'
import PortalCake from './PortalCake.vue'
import PixelSprite from './PixelSprite.vue'
import UavRadar from './UavRadar.vue'

defineProps<{ name?: string }>()

const px = (rows: string[], colours: Record<string, string>) =>
  rows.flatMap((r, y) => [...r].flatMap((c, x) => colours[c] ? [{ x, y, fill: colours[c] }] : []))

const art: Record<string, { w: number, h: number, pixels: { x: number, y: number, fill: string }[] }> = {
  mario: { w: 8, h: 8, pixels: px(['DDDDDDDD', 'DYYDDYYD', 'DYDYYDYD', 'DYYYYDYD', 'DYYYDYYD', 'DYYYYYYD', 'DYYYDYYD', 'DDDDDDDD'],
    { D: '#04121c', Y: '#ffd84a' }) },
  megaman: { w: 18, h: 16, pixels: px([
    '..DD........DD....', '.DLLDDDDDDDDLLD...', '.DAAAAHHAAAAAAD...', 'DAAAAAHHAAAAAAAD..',
    'DAADDDDDDDDDDAAD..', 'DAAWWWWLLWWWWAAD..', 'DAAWKKWLLWKKWAAD..', 'DALWWWWLLWWWWLAD..',
    'DALLLLTTTTLLLLADDD', 'DAALLTTNNTTLLAADCD', 'DAAAALTWWTLAAAADCD', 'DAAAAAAWWAAAAAADDD',
    '.DAAAAAAAAAAAAD...', '.DAALLLLLLLLAAD...', '..DAAD....DAAD....', '..DDDD....DDDD....',
  ], { D: '#04121c', A: '#1f6fe0', L: '#6ad1ff', H: '#fff', W: '#fff', K: '#04121c', T: '#f6d2a2', N: '#3b2416', C: '#9fb3c8' }) },
  castlevania: { w: 12, h: 8, pixels: px(['............', '....RRRRRR..', 'W..RRrrrrRR.', 'WWWRRrrrrRR.',
    'W..RRRRRRRR.', '...RRRRRRRR.', '....RRRRRR..', '............'], { W: '#fff', R: '#b5541c', r: '#e08a3c' }) },
  yugioh: { w: 8, h: 11, pixels: px(['MMMMMMMM', 'MmmmmmmM', 'MDDDDDDM', 'MDSTSTDM', 'MDSDDSDM', 'MDSTSTDM', 'MDDDDDDM',
    'MPPPPPPM', 'MPppppPM', 'MPPPPPPM', 'MMMMMMMM'], { M: '#b0307a', m: '#6e1a4c', D: '#3a1630', S: '#c9d3df', T: '#eaf2ff', P: '#f3e3c3', p: '#8f7a5a' }) },
}
</script>

<template>
  <div class="credit-icon" aria-hidden="true">
    <PixelSprite v-if="name === 'pokemon'" name="blaze" :size="40" />
    <NinjaHood v-else-if="name === 'mortalkombat'" :size="40" />
    <BeybladeSpin v-else-if="name === 'beyblade'" :size="44" :label="false" />
    <ArrowKnee v-else-if="name === 'skyrim'" :size="36" :label="false" />
    <ClickerHead v-else-if="name === 'lastofus'" :size="36" :label="false" />
    <UavRadar v-else-if="name === 'cod4'" :size="36" :label="false" />
    <ForcedLaugh v-else-if="name === 'ffx'" :size="36" :label="false" />
    <PortalCake v-else-if="name === 'portal'" :size="38" :label="false" />
    <svg v-else-if="name && art[name]" :viewBox="`0 0 ${art[name].w} ${art[name].h}`" width="40" height="36" shape-rendering="crispEdges">
      <rect v-for="(p, i) in art[name].pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
    </svg>
  </div>
</template>

<style scoped>
.credit-icon { display: inline-flex; width: 48px; height: 40px; align-items: center; justify-content: center; filter: drop-shadow(2px 2px 0 #04121c); }
</style>
