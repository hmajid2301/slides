<script setup lang="ts">
// Branchy lanes: 8 lanes disagree on `if`, so the vector runs BOTH paths and masks
// off the lanes that didn't want each one. Loops: if-pass, else-pass, merge.
const takesIf = [true, false, true, true, false, true, false, false]
</script>

<template>
  <div class="branch" aria-label="Eight lanes: both the if path and the else path run, each with half the lanes masked off">
    <div class="pass if"><span>if</span><i v-for="(t, n) in takesIf" :key="n" :class="{ off: !t }" /></div>
    <div class="pass else"><span>else</span><i v-for="(t, n) in takesIf" :key="n" :class="{ off: t }" /></div>
  </div>
</template>

<style scoped>
.branch { display: grid; gap: 6px; margin-top: 10px; }
.pass { display: flex; align-items: center; gap: 4px; }
.pass span { width: 54px; font: 600 16px var(--arc-mono); }
.pass i { width: 22px; height: 18px; outline: 2px solid #04121c; }
.if i { background: var(--arc-yellow); }
.else i { background: var(--arc-blue); }
.pass i.off { background: #1d3d6b; }
/* The two passes run one after the other: both always cost time. */
.if { animation: pass 2s steps(1, end) infinite; }
.else { animation: pass 2s steps(1, end) 1s infinite; }
@keyframes pass { 0% { opacity: 1 } 50%, 100% { opacity: .35 } }
@media (prefers-reduced-motion: reduce) { .if, .else { animation: none } }
</style>
