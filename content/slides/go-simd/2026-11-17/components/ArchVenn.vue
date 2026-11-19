<script setup lang="ts">
// simd vs archsimd as a Venn: three CPU families; the shared middle is `simd`,
// a whole circle (everything one CPU can do) is `archsimd`. Clicks:
// 0 circles · 1 middle lights up: simd · 2 amd64 circle lights up: archsimd (+ extras inside it)
withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const circles = [
  { id: 'amd64', cx: 150, cy: 140, lx: 70, ly: 70 },
  { id: 'arm64', cx: 250, cy: 140, lx: 330, ly: 70 },
  { id: 'wasm', cx: 200, cy: 225, lx: 200, ly: 330 },
]
</script>

<template>
  <svg class="venn" viewBox="0 0 400 350" role="img"
    aria-label="Three overlapping CPU families: the shared middle is simd, a whole circle is archsimd">
    <defs>
      <clipPath id="v-a"><circle cx="150" cy="140" r="95" /></clipPath>
      <clipPath id="v-b"><circle cx="250" cy="140" r="95" /></clipPath>
    </defs>
    <circle cx="150" cy="140" r="95" class="arch" :class="{ on: step >= 2 }" />
    <g v-for="c in circles" :key="c.id">
      <circle :cx="c.cx" :cy="c.cy" r="95" class="ring" />
      <text :x="c.lx" :y="c.ly" text-anchor="middle" class="cpu">{{ c.id }}</text>
    </g>
    <!-- intersection of all three: clip wasm by amd64, then by arm64 -->
    <g clip-path="url(#v-a)">
      <g clip-path="url(#v-b)">
        <circle cx="200" cy="225" r="95" class="mid" :class="{ on: step >= 1 }" />
      </g>
    </g>
    <text x="200" y="176" text-anchor="middle" class="tag simd" :class="{ on: step >= 1 }">simd</text>
    <g class="extras" :class="{ on: step >= 2 }">
      <text x="98" y="128" text-anchor="middle" class="extra">GFNI</text>
      <text x="104" y="160" text-anchor="middle" class="extra">AES</text>
      <text x="150" y="250" text-anchor="middle" class="tag archsimd">archsimd</text>
    </g>
  </svg>
</template>

<style scoped>
.venn { width: 100%; max-width: 420px; height: auto; overflow: visible; }
.ring { fill: none; stroke: #fff; stroke-width: 4; }
.cpu { font: 700 22px var(--arc-pixel); fill: #fff; letter-spacing: .08em; paint-order: stroke; stroke: #04121c; stroke-width: 5px; }
.mid { fill: var(--arc-yellow); opacity: 0; transition: opacity 200ms steps(2, end); }
.mid.on { opacity: 1; }
.arch { fill: var(--arc-pink); opacity: 0; transition: opacity 200ms steps(2, end); }
.arch.on { opacity: .85; }
.tag { font: 700 26px var(--arc-mono); opacity: 0; transition: opacity 200ms steps(2, end); }
.tag.on, .extras.on .tag { opacity: 1; }
.simd { fill: #04121c; }
.archsimd { fill: #fff; paint-order: stroke; stroke: #04121c; stroke-width: 5px; }
.extras .extra { font: 700 18px var(--arc-mono); fill: #fff; opacity: 0; transition: opacity 200ms steps(2, end) 200ms; }
.extras.on .extra { opacity: 1; }
</style>
