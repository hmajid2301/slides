<script setup lang="ts">
// Space Invaders nod: 8 aliens march; `shot` fires one beam that clears the whole row (8 lanes, 1 instruction).
withDefaults(defineProps<{ shot?: boolean }>(), { shot: false })
// Original 11×8 alien.
const alien = [
  '..X.....X..',
  '...X...X...',
  '..XXXXXXX..',
  '.XX.XXX.XX.',
  'XXXXXXXXXXX',
  'X.XXXXXXX.X',
  'X.X.....X.X',
  '...XX.XX...',
].flatMap((r, y) => [...r].flatMap((c, x) => c === 'X' ? [{ x, y }] : []))
</script>

<template>
  <div class="invaders" :class="{ shot }" aria-hidden="true">
    <div class="row">
      <svg v-for="n in 8" :key="n" class="alien" viewBox="0 0 11 8" width="55" height="40" shape-rendering="crispEdges"
        :style="{ animationDelay: shot ? `${420 + n * 30}ms` : '0ms' }">
        <rect v-for="(p, i) in alien" :key="i" :x="p.x" :y="p.y" width="1" height="1" />
      </svg>
    </div>
    <div class="beam" />
    <p class="acronym"><b>S</b>INGLE <b>I</b>NSTRUCTION · <b>M</b>ULTIPLE <b>D</b>ATA</p>
    <div class="cannon"><i /><i /></div>
  </div>
</template>

<style scoped>
.invaders { position: relative; width: 640px; height: 230px; margin: 0 auto 10px; }
.row { position: absolute; top: 0; left: 0; display: flex; gap: 18px; animation: march 2.4s steps(4, end) infinite alternate; }
.alien { fill: #fff; filter: drop-shadow(3px 3px 0 #04121c); }
.alien:nth-child(odd) { fill: #7ee787; }
.shot .row { animation-play-state: paused; }
.shot .alien { animation: boom 300ms steps(3, end) both; }
.beam {
  position: absolute; left: 0; right: 0; top: 46px; height: 10px; background: var(--arc-yellow);
  outline: 3px solid #04121c; transform: scaleX(0); transform-origin: left;
}
.shot .beam { animation: zap 520ms steps(6, end) 200ms both; }
.acronym {
  position: absolute; left: 0; right: 0; top: 76px; margin: 0; text-align: center;
  font: 700 26px var(--arc-pixel); letter-spacing: .12em; color: #fff; text-shadow: 3px 3px 0 #04121c; opacity: 0;
}
.acronym b { color: var(--arc-yellow); }
.shot .acronym { animation: acro 3s steps(1, end) 700ms both; }
@keyframes acro { 0% { opacity: 0 } 3% { opacity: 1 } 6% { opacity: 0 } 9%, 100% { opacity: 1 } }
.cannon { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); }
.cannon i { display: block; margin: 0 auto; background: #00add8; outline: 3px solid #04121c; }
.cannon i:first-child { width: 12px; height: 14px; }
.cannon i:last-child { width: 60px; height: 22px; }
.shot .cannon { animation: recoil 200ms steps(2, end); }
@keyframes march { to { transform: translateX(60px) } }
@keyframes zap { 40% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1); opacity: 0 } }
@keyframes boom { 0% { fill: var(--arc-yellow); transform: scale(1.3) } 60% { fill: #ff5c78; transform: scale(.6) rotate(45deg) } 100% { opacity: 0; transform: scale(0) } }
@keyframes recoil { 50% { transform: translate(-50%, 6px) } }
@media (prefers-reduced-motion: reduce) {
  .row, .shot .beam, .shot .cannon, .shot .acronym { animation: none } .shot .alien { animation: none; opacity: 0 }
  .shot .acronym { opacity: 1 }
}
</style>
