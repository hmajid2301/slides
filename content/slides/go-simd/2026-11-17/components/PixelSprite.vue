<script setup lang="ts">
import { computed } from 'vue'

// Original 16×16 sprites. '.' is transparent.
const sprites: Record<string, { rows: string[], colours: Record<string, string> }> = {
  bee: {
    rows: [
      '......LL..LL....',
      '.....LWWLLWWL...',
      '.....LWWWLWWL...',
      '......LLL.LL....',
      '...DDDDDDDDDD...',
      '..DYYYKKYYKKYD..',
      '.DYWWYKKYYKKYYD.',
      '.DYWKYKKYYKKYYDD',
      '.DYYYYKKYYKKYYSS',
      '.DYYYYKKYYKKYYD.',
      '..DYYYKKYYKKYD..',
      '...DDDDDDDDDD...',
      '....D...D...D...',
    ],
    colours: { D: '#04121c', Y: '#fddd00', K: '#1a1a1a', W: '#ffffff', L: '#bfe9ff', S: '#c9c9c9' },
  },
  ember: {
    rows: [
      '................',
      '.......KKKK.....',
      '......KOOOOK....',
      '.....KOOOOOOK...',
      '.....KOOOOWKOK..',
      '.....KOOOOWKOOK.',
      '......KOOOOOOOK.',
      '.F.....KOOOOKK..',
      'FRF...KOOCCOK...',
      'FYF..KOOCCCOK...',
      '.R...KOOCCCOOK..',
      '.K..KOOOCCCOK...',
      '.KKKOOOOCCOK....',
      '..KOOOOOOOK.....',
      '....KOOK.KOOK...',
      '....KKK..KKK....',
    ],
    colours: { K: '#04121c', O: '#ff8a2a', W: '#ffffff', C: '#ffe08a', F: '#ff3b1f', R: '#ff7a1a', Y: '#fddd00' },
  },
  blaze: {
    rows: [
      '...........K....',
      '......KKKKKRK...',
      '.....KRRRRRRK...',
      '....KRRRRRRRRK..',
      '....KRRRRRWKRK..',
      '....KRRRRRWKRRK.',
      '.F...KRRRRRRRRRK',
      'FYF...KRRRRRKKK.',
      'FYYF.KRRCCRK....',
      'FRYF.KRCCCRRK...',
      '.FF.KRRCCCRWK...',
      '.K..KRRCCCRK....',
      '.KKKRRRCCCRK....',
      '..KRRRRRRRK.....',
      '...KRRK..KRRK...',
      '...KKWK..KWKK...',
    ],
    colours: { K: '#04121c', R: '#d8362a', W: '#ffffff', C: '#ffe08a', F: '#ff3b1f', Y: '#fddd00' },
  },
}

const props = withDefaults(defineProps<{ name: 'bee' | 'ember' | 'blaze', size?: number }>(), { size: 96 })
const pixels = computed(() => {
  const s = sprites[props.name]
  return s.rows.flatMap((row, y) => [...row].flatMap((c, x) =>
    s.colours[c] ? [{ x, y, fill: s.colours[c] }] : []))
})
</script>

<template>
  <svg class="pixel-sprite" viewBox="0 0 16 16" :width="size" :height="size"
    shape-rendering="crispEdges" role="img" :aria-label="`Pixel-art ${name}`">
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
  </svg>
</template>

<style scoped>
.pixel-sprite { image-rendering: pixelated; filter: drop-shadow(5px 5px 0 #04121c); }
</style>
