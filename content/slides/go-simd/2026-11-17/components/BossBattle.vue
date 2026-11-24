<script setup lang="ts">
import { computed } from 'vue'
import NinjaHood from './NinjaHood.vue'
import PixelGopher from './PixelGopher.vue'
import PixelSprite from './PixelSprite.vue'

// Rematch with the World 2 boss. Each shot = one add instruction (simplified).
// 0 boss appears · 1 scalar shot (1 hit) · 2 SIMD volley (8 hits) · 3 volley, boss down
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const maxHp = 16
const hits = [0, 1, 9, 16]
const hp = computed(() => maxHp - hits[Math.min(props.step, 3)])
const shots = computed(() => props.step === 0 ? 0 : props.step === 1 ? 1 : 8)
const dead = computed(() => props.step >= 3)
const caption = computed(() => [
  'A wild <b>ASSEMBLY BEE</b> appears!',
  'Plain loop: <b>1</b> add per instruction. 15 to go…',
  'simd volley: <b>8</b> adds in one instruction!',
  'BOSS DEFEATED · <b>2</b> instructions instead of 16',
][Math.min(props.step, 3)])
</script>

<template>
  <div class="battle">
    <div class="arena">
      <div class="hero"><PixelGopher :size="150" bob /><span class="name">GOPHER · simd</span></div>

      <div :key="step" class="volley" :class="{ wide: shots > 1 }">
        <i v-for="n in shots" :key="n" :style="{ animationDelay: `${(n - 1) * 25}ms` }" />
      </div>

      <div class="boss" :class="{ dead }">
        <div class="hpbar" aria-label="Boss health">
          <span>HP</span>
          <i v-for="n in maxHp" :key="n" :class="{ on: n <= hp }" />
        </div>
        <div :key="step" class="sprite" :class="{ hit: step > 0 }">
          <PixelSprite name="bee" :size="210" />
        </div>
        <span class="name">ASSEMBLY BEE</span>
      </div>

      <div v-if="step === 2" class="finish"><NinjaHood :size="64" />FINISH HIM!</div>
      <div v-if="dead" class="ko">K.O.</div>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="caption" v-html="caption" />
  </div>
</template>

<style scoped>
.battle { display: flex; flex-direction: column; gap: 10px; }
.arena { position: relative; height: 360px; }
.name { font: 700 18px var(--arc-pixel); letter-spacing: .1em; color: #fff; text-shadow: 2px 2px 0 #04121c; }
.hero { position: absolute; left: 40px; bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; }

.boss { position: absolute; right: 60px; top: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.boss .sprite { animation: hover 900ms steps(2, jump-none) infinite; }
.boss .sprite.hit :deep(svg) { animation: flash 420ms steps(1, end) 380ms 1 both; }
.boss.dead .sprite { animation: fall 900ms steps(9, end) 650ms both; }
.hpbar { display: flex; align-items: center; gap: 3px; padding: 6px 8px; background: #0b1b2b; outline: 4px solid #04121c; }
.hpbar span { font: 700 18px var(--arc-pixel); color: var(--arc-yellow); margin-right: 6px; }
.hpbar i { width: 12px; height: 16px; background: #1d3d6b; transition: background 0ms 380ms; }
.hpbar i.on { background: #ff5c78; }

.volley { position: absolute; left: 220px; top: 120px; height: 120px; width: 700px; }
.volley i {
  position: absolute; left: 0; top: 50%; width: 22px; height: 10px; background: var(--arc-yellow);
  outline: 3px solid #04121c; animation: fire 420ms steps(8, end) both;
}
.volley.wide i:nth-child(1) { top: 0 } .volley.wide i:nth-child(2) { top: 16px }
.volley.wide i:nth-child(3) { top: 32px } .volley.wide i:nth-child(4) { top: 48px }
.volley.wide i:nth-child(5) { top: 64px } .volley.wide i:nth-child(6) { top: 80px }
.volley.wide i:nth-child(7) { top: 96px } .volley.wide i:nth-child(8) { top: 112px }

.ko {
  position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%) rotate(-6deg);
  font: 700 110px var(--arc-pixel); color: var(--arc-yellow); text-shadow: 8px 8px 0 var(--arc-pink), 12px 12px 0 #04121c;
  animation: pop 400ms steps(4, end) 1300ms both;
}
.finish {
  position: absolute; left: 50%; top: 4%; transform: translateX(-50%) rotate(-3deg); white-space: nowrap;
  display: flex; align-items: center; gap: 18px;
  font: 700 64px var(--arc-pixel); color: #ff5c78; text-shadow: 5px 5px 0 #04121c;
  opacity: 0; animation: cameo 1.6s steps(1, end) 900ms both;
}
/* Mortal Kombat cameo: faded, gone after a moment. */
@keyframes cameo { 0% { opacity: .5 } 100% { opacity: 0 } }
.caption { margin: 0; text-align: center; font: 500 28px var(--arc-mono); }
.caption :deep(b) { color: var(--arc-yellow); }

@keyframes fire { from { transform: translateX(0); opacity: 1 } 95% { opacity: 1 } to { transform: translateX(560px); opacity: 0 } }
@keyframes hover { 50% { transform: translateY(-10px) } }
@keyframes flash { 0%, 50% { filter: brightness(3) drop-shadow(5px 5px 0 #04121c) } 25%, 75% { opacity: .2 } 100% { filter: none } }
/* Lands upside down on the floor instead of vanishing, so the right side isn't empty. */
@keyframes fall { 0% { transform: rotate(0) } 20% { transform: translateY(-30px) rotate(20deg) } 100% { transform: translateY(110px) rotate(180deg); filter: grayscale(.7) brightness(.8) } }
@keyframes pop { from { opacity: 0; transform: translate(-50%, -50%) scale(.3) } }
@media (prefers-reduced-motion: reduce) { .volley i, .boss .sprite, .ko, .finish { animation: none !important } }
</style>
