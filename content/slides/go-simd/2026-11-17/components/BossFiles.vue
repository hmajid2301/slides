<script setup lang="ts">
// One Go function, then a cartridge per CPU spawns on each click.
// 0 the function · 1 every .s file drops in one after another, then CPU checks + tests · 2 bee stings gopher, GAME OVER
import { onMounted, ref, watch } from 'vue'
import PixelGopher from './PixelGopher.vue'
import PixelSprite from './PixelSprite.vue'

const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
// Unscaled bee→gopher distance, measured when the attack starts (hidden slides measure 0).
const fn = ref<HTMLElement>()
const dx = ref(0)
function measure() {
  const g = fn.value?.querySelector<HTMLElement>('.gopher')
  const b = fn.value?.querySelector<HTMLElement>('.attacker')
  if (g && b) dx.value = g.offsetLeft - b.offsetLeft + 30
}
onMounted(measure)
watch(() => props.step >= 2, measure, { flush: 'post' })
const carts = [
  { file: 'add_amd64.s', cpu: 'Intel / AMD', tone: 'blue' },
  { file: 'add_arm64.s', cpu: 'Apple / Graviton', tone: 'green' },
  { file: 'add_ppc64.s', cpu: 'IBM', tone: 'pink' },
  { file: 'add_generic.go', cpu: 'everything else', tone: 'grey' },
]
</script>

<template>
  <div class="boss">
    <div ref="fn" class="fn" :class="{ lost: step >= 2 }" :style="{ '--dx': `${dx}px` }">
      <span class="gopher"><PixelGopher :size="72" /></span>
      <span class="tag">YOU</span>
      <code>AddAsm(dst, a, b)</code>
      <span class="vs">VS</span>
      <span class="attacker"><span class="bee"><PixelSprite name="bee" :size="72" /></span></span>
      <span class="tag pink">ASSEMBLY BEE</span>
    </div>
    <div class="carts">
      <div v-for="(c, i) in carts" :key="c.file" class="cart-slot" :class="[c.tone, { on: step >= 1 }]"
        :style="{ transitionDelay: step >= 1 ? `${i * 500}ms` : '0ms' }">
        <div class="label">{{ c.file }}</div>
        <div class="cpu">{{ c.cpu }}</div>
        <div class="hp"><i v-for="h in 5" :key="h" /></div>
      </div>
    </div>
    <div class="extras">
      <span class="extra" :class="{ on: step >= 1 }">+ CPU checks</span>
      <span class="extra" :class="{ on: step >= 1 }">+ tests</span>
    </div>
  </div>
</template>

<style scoped>
.boss { display: flex; flex-direction: column; align-items: center; gap: 26px; }
.fn { position: relative; display: flex; align-items: center; gap: 14px; font-size: 30px; }
.gopher, .attacker { display: inline-block; }
.attacker { position: relative; z-index: 2; }
.lost .attacker { animation: dive 1000ms steps(10, end) both; }
.lost .gopher { animation: sting 240ms steps(2, end) 480ms 2, knocked 500ms steps(5, end) 960ms both; }
@keyframes dive {
  15% { transform: translate(24px, -30px) }
  50%, 58% { transform: translate(var(--dx), 0) }
  to { transform: none }
}
@keyframes sting { 50% { filter: brightness(3); transform: translateX(-8px) } }
@keyframes knocked { to { transform: translateY(14px) rotate(180deg); filter: grayscale(1) brightness(.7) } }
.fn code { font-size: 30px !important; }
.vs { font: 700 30px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 3px 3px 0 #04121c; }
.bee { animation: buzz 500ms steps(2, jump-none) infinite; }
@keyframes buzz { 50% { transform: translate(4px, -6px) } }
.carts { display: grid; grid-template-columns: repeat(4, 220px); gap: 24px; }
.cart-slot {
  height: 170px; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px;
  background: #0b1b2b; border: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c;
  opacity: 0; transform: translateY(-60px);
  transition: opacity 120ms steps(2, end), transform 360ms steps(6, end);
  position: relative;
}
.cart-slot::before { /* cartridge notch */
  content: ''; position: absolute; top: -4px; left: 50%; width: 60px; height: 14px;
  transform: translateX(-50%); background: var(--arc-bg); border: 4px solid #04121c; border-top: 0;
}
.cart-slot.on { opacity: 1; transform: none; }
.label { margin-top: 14px; padding: 6px 8px; font: 700 18px var(--arc-mono); color: #04121c; background: var(--c); }
.cpu { font: 500 17px var(--arc-pixel); letter-spacing: .06em; color: #eaf2ff; }
.hp { margin-top: auto; display: flex; gap: 4px; }
.hp i { width: 22px; height: 12px; background: #ff5c78; }
.blue { --c: #00add8; } .green { --c: #7ee787; } .pink { --c: #ff7aa2; } .grey { --c: #e8f6fb; }
.extras { display: flex; gap: 22px; }
.extra {
  font: 600 22px var(--arc-mono); padding: 6px 14px; color: #fff; background: #0b1b2b;
  outline: 4px solid #04121c; opacity: 0; transition: opacity 160ms steps(2, end);
}
.extra.on { opacity: 1; transition-delay: 2.1s; }
@media (prefers-reduced-motion: reduce) {
  .cart-slot { transition: none } .bee, .lost .attacker { animation: none }
  .lost .gopher { animation: none; transform: rotate(180deg); filter: grayscale(1) }
}
</style>
