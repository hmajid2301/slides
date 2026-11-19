<script setup lang="ts">
import { computed, ref } from 'vue'

// Live `go test -bench` per GODEBUG=simd width, via the dev-only /__bench
// middleware in vite.config.ts. Built decks have no endpoint, so they show the
// recorded means from examples/bench-output.txt instead.
type Result = { name: string, ns: number }
const recorded: Record<string, Result[]> = {
  0: [{ name: 'scalar', ns: 3283 }, { name: 'simd', ns: 10728 }],
  128: [{ name: 'scalar', ns: 3283 }, { name: 'simd', ns: 593 }],
  256: [{ name: 'scalar', ns: 3283 }, { name: 'simd', ns: 329 }],
  512: [{ name: 'scalar', ns: 3283 }, { name: 'simd', ns: 308 }],
}
const widths = [
  { simd: '0', label: 'OFF', lanes: 'emulated' },
  { simd: '128', label: '128', lanes: '4 lanes' },
  { simd: '256', label: '256', lanes: '8 lanes' },
  { simd: '512', label: '512', lanes: '16 lanes' },
]

const width = ref('')
const results = ref<Result[]>([])
const running = ref(false)
const live = ref(false)
const note = ref('Pick a width.')

const command = computed(() =>
  `GODEBUG=simd=${width.value || 'N'} go test -bench 'Add/(scalar|simd)' -benchtime 300ms`)

async function run(simd: string) {
  if (running.value) return
  width.value = simd
  results.value = []
  running.value = true
  note.value = 'RUNNING…'
  try {
    const res = await fetch(`/__bench?simd=${simd}`)
    const body = await res.json()
    if (!res.ok || !body.results?.length) throw new Error(body.error ?? `HTTP ${res.status}`)
    results.value = body.results
    live.value = true
    note.value = `LIVE · ${body.cpu ?? 'this machine'}`
  }
  catch {
    results.value = recorded[simd]
    live.value = false
    note.value = 'REPLAY · recorded on Ryzen 9 7950X3D'
  }
  finally {
    running.value = false
  }
}

const max = computed(() => Math.max(3300, ...results.value.map(r => r.ns)))
const blocks = (ns: number) => Math.max(1, Math.round(32 * Math.min(ns, max.value) / max.value))
const speedup = computed(() => {
  const s = results.value.find(r => r.name === 'scalar')
  const v = results.value.find(r => r.name === 'simd')
  return s && v ? s.ns / v.ns : 0
})
const fmt = (ns: number) => ns >= 1000 ? `${(ns / 1000).toFixed(1)} µs` : `${Math.round(ns)} ns`
</script>

<template>
  <div class="live-bench">
    <div class="pads" role="group" aria-label="GODEBUG simd width">
      <button v-for="w in widths" :key="w.simd" type="button" class="pad"
        :class="{ on: width === w.simd }" :disabled="running" @click.stop="run(w.simd)">
        <b>{{ w.label }}</b><small>{{ w.lanes }}</small>
      </button>
    </div>

    <div class="term">
      <p class="cmd"><span class="ps">$</span> {{ command }}</p>
      <div v-for="r in results" :key="r.name" class="row">
        <span class="name">{{ r.name }}</span>
        <span class="bar"><i v-for="n in blocks(r.ns)" :key="n" :class="r.name"
          :style="{ animationDelay: `${n * 18}ms` }" /></span>
        <span class="ns">{{ fmt(r.ns) }}</span>
      </div>
      <p v-if="running" class="row wait">▮▮▮ <span>benchmarking</span></p>
      <p class="status" :class="{ live }">{{ note }}</p>
    </div>

    <!-- Pokémon battle text box nod. -->
    <p class="verdict" :class="{ show: speedup > 0 }">
      <template v-if="speedup >= 1">It's super effective! <b>{{ speedup.toFixed(1) }}×</b> faster</template>
      <template v-else-if="speedup > 0">It's not very effective… <b class="bad">{{ (1 / speedup).toFixed(1) }}× slower</b></template>
      <template v-else>&nbsp;</template>
    </p>
  </div>
</template>

<style scoped>
.live-bench { display: grid; gap: 18px; }
.pads { display: flex; gap: 16px; }
.pad {
  display: flex; flex-direction: column; align-items: center; min-width: 150px; padding: 10px 16px;
  font: 700 30px var(--arc-pixel); color: #fff; cursor: pointer;
  background: var(--arc-panel); border: 4px solid #fff; outline: 4px solid #04121c; box-shadow: 6px 6px 0 #04121c;
}
.pad small { font: 500 18px var(--arc-pixel); letter-spacing: .1em; color: #eaf2ff; }
.pad:hover:not(:disabled) { transform: translate(-2px, -2px); }
.pad:active:not(:disabled), .pad.on { background: var(--arc-yellow); color: #04121c; transform: translate(4px, 4px); box-shadow: 2px 2px 0 #04121c; }
.pad.on small { color: #04121c; }
.pad:disabled { cursor: progress; }

.term { background: #0b1b2b; outline: 4px solid #04121c; box-shadow: 8px 8px 0 #04121c; padding: 16px 22px; min-height: 196px; }
.cmd { margin: 0 0 14px; font: 500 19px var(--arc-mono); color: #e8f6fb; }
.ps { color: var(--arc-yellow); }
.row { display: grid; grid-template-columns: 110px 1fr 120px; align-items: center; gap: 16px; margin: 8px 0; font: 600 22px var(--arc-mono); color: #fff; }
.bar { display: flex; gap: 3px; }
.bar i { width: 18px; height: 26px; background: #e8f6fb; animation: pop 1ms steps(1) both; }
.bar i.simd { background: var(--arc-yellow); }
.ns { text-align: right; font-family: var(--arc-pixel); color: var(--arc-yellow); }
.wait { color: var(--arc-yellow); animation: blink 500ms steps(2, jump-none) infinite; }
.wait span { font: 500 18px var(--arc-pixel); letter-spacing: .12em; }
.status { margin: 12px 0 0; font: 500 19px var(--arc-pixel); letter-spacing: .12em; color: #93abc2; text-transform: uppercase; }
.status.live { color: #7ee787; }

.verdict {
  position: relative; margin: 0; padding: 10px 48px 10px 20px; font: 700 28px var(--arc-pixel); color: #04121c;
  background: #fff; border: 4px solid #04121c; outline: 4px solid #fff; box-shadow: 0 0 0 8px #04121c; visibility: hidden;
}
.verdict.show { visibility: visible; }
.verdict.show::after { content: '▼'; position: absolute; right: 16px; bottom: 6px; font-size: 18px; animation: blink 600ms steps(2, jump-none) infinite; }
.verdict b { color: #1d6fd0; }
.verdict b.bad { color: #ce3262; }

@keyframes pop { from { opacity: 0 } }
@keyframes blink { 50% { opacity: .3 } }
@media (prefers-reduced-motion: reduce) { .bar i, .wait, .verdict::after { animation: none } }
</style>
