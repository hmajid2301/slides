<script setup lang="ts">
// Hidden coin-block nod: click the gopher, a coin pops out with "+1UP".
import { ref } from 'vue'
import PixelGopher from './PixelGopher.vue'

withDefaults(defineProps<{ size?: number }>(), { size: 300 })
const coins = ref<number[]>([])
let next = 0
function hit() {
  const id = next++
  coins.value.push(id)
  setTimeout(() => { coins.value = coins.value.filter(c => c !== id) }, 900)
}
</script>

<template>
  <div class="coin-gopher" @click.stop="hit">
    <span v-for="c in coins" :key="c" class="coin" aria-hidden="true"><i /><b>+1UP</b></span>
    <div :key="next" :class="{ bump: next > 0 }"><PixelGopher :size="size" bob /></div>
  </div>
</template>

<style scoped>
.coin-gopher { position: relative; display: inline-block; cursor: pointer; }
.bump { animation: bump 200ms steps(2, end); }
.coin { position: absolute; left: 50%; top: 0; transform: translateX(-50%); animation: pop 900ms steps(9, end) both; pointer-events: none; }
.coin i { display: block; width: 32px; height: 44px; margin: 0 auto; background: var(--arc-yellow); outline: 4px solid #04121c; box-shadow: inset -8px 0 0 #c9a800; animation: spin 300ms steps(3, end) infinite; }
.coin b { display: block; font: 700 24px var(--arc-pixel); color: #fff; text-shadow: 3px 3px 0 #04121c; }
@keyframes bump { 50% { transform: translateY(-14px) } }
@keyframes pop { 0% { transform: translate(-50%, 0); opacity: 1 } 50% { transform: translate(-50%, -140px) } 80% { opacity: 1 } 100% { transform: translate(-50%, -110px); opacity: 0 } }
@keyframes spin { 50% { transform: scaleX(.3) } }
@media (prefers-reduced-motion: reduce) { .bump, .coin, .coin i { animation: none } }
</style>
