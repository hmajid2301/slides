---
theme: default
addons:
  - slidev-addon-live-quiz
title: 'The Fast and the Floatiest: SIMD in Go 1.27'
author: Haseeb Majid
presenter: true
duration: 20min
timer: countdown
download: false
lineNumbers: false
monaco: false
twoslash: false
colorSchema: dark
routerMode: hash
canvasWidth: 1280
aspectRatio: 16/9
transition: fade
fonts:
  provider: none
  sans: 'DM Sans, sans-serif'
  mono: 'MonoLisa, JetBrains Mono, monospace'
drawings:
  enabled: true
  presenterOnly: true
layout: cover
---

<div class="grid-2-wide">
<div>

# The Fast and the Floatiest

### SIMD in Go 1.27.

<p class="press-start">▶ PRESS START</p>

</div>
<CoinGopher :size="300" />
</div>

<!--
-->

---
layout: statement
clicks: 1
---

<p class="simd-acronym"><b>S</b>ingle <b>I</b>nstruction · <b>M</b>ultiple <b>D</b>ata</p>

# Your loop adds **one** number at a time.

<p v-click class="muted">The CPU next to it could do <strong>eight</strong>. Or sixteen.</p>

<!--
- Pause before the click.
- [click] Today: how Go 1.27 lets you use the other seven, in plain Go.
-->

---
layout: default
---

## The loop we all write

<div class="dialog" data-name="add.go">

```go {2-4}
func AddScalar(dst, a, b []float32) {
	for i := range dst {
		dst[i] = a[i] + b[i]
	}
}
```

</div>

<div v-click class="hint-box" style="margin-top: 28px">
4,096 floats → <b>4,096</b> adds
</div>

<!--
- Nothing wrong with this; it is correct and readable.
- [click] One trip round the loop per float, one add each.
- The question: how many adds per instruction?
-->

---
layout: section
level: 1
---

# Inside the CPU

<!--
- Two minutes of hardware, no more.
-->

---
layout: default
clicks: 4
---

## Zoom in

<ChipZoom :step="$clicks" />

<GameCameo :show="$clicks >= 1" :delay="1000" :hold="2800" :spots="[{ right: '0', top: '0' }, { left: '0', bottom: '10px' }]"><UavRadar /></GameCameo>

<!--
- Top-down view of a desktop CPU, not to scale.
- [click] Lid off: 2 chiplets × 8 cores + I/O die. (CoD4 cameo: UAV online.)
- [click] One chiplet: 8 cores share a big L3.
- [click] One core: integer side, vector side. Float maths lives in the vector unit.
- [click] Registers: Z0, Z1, … one float32 per lane, side by side.
-->

---
layout: default
clicks: 3
---

## Registers have lanes

<LaneDiagram :step="$clicks" />

<!--
- Register = tiny storage slot the CPU does maths in.
- Drawn with 8 lanes; real registers have 4, 8 or 16 depending on the CPU.
- [click] Normal add uses one slot. Rest sits idle. 8 pairs = 8 adds.
- [click] Load 8 floats into each register: one "lane" each.
- [click] One SIMD add does all eight pairs at once. 8 → 1. That's SIMD.
-->

---
layout: default
---

## Different CPUs, different widths

<WidthLadder />

<!--
- Only takeaway: wider register = more lanes = more work per instruction.
- 128-bit: almost everywhere (SSE, Arm NEON, wasm). AVX2: most x86 since ~2013. AVX-512: Intel Xeon (not most Intel laptops/desktops), AMD Zen 4+.
- Same Go loop: 4, 8 or 16 numbers per add depending on the machine.
- That variation is why SIMD used to be painful. Remember it.
-->

---
layout: default
clicks: 3
liveOnly: true
---

<QuizQuestion id="w1-lanes" :step="$clicks" />

<!--
- [click] Open, 15 s. [click] Reveal. [click] Leaderboard.
-->

---
layout: section
level: 2
lives: 1
---

# The old way

<!--
- Before Go 1.26: write the assembly yourself.
-->

---
layout: default
clicks: 4
---

<CpuMachine :step="$clicks" />

<!--
- Hard mode: talking to the CPU yourself.
- Assembly = the CPU's own instructions. Simplified names; real file (add_amd64.s) is ~30 lines.
- "Step" = one instruction; real timing is messier.
- [click] Load: 8 numbers memory → register Z0.
- [click] Load b into Z1.
- [click] One add, eight sums. This is the whole point.
- [click] Store back. 4 instructions for 8 floats.
-->

---
layout: default
clicks: 2
hurtAt: 2
---

## Boss fight: one file per CPU

<BossFiles :step="$clicks" />

<p v-click="2" class="game-over" style="font-size: 40px; margin: 22px auto 0; transition-delay: 1.4s">GAME OVER <span class="muted" style="font-size: 24px">(for most teams)</span></p>

<!--
- Assembly only runs on the CPU it was written for.
- [click] Files drop in: Intel/AMD, ARM, IBM, Go fallback. Plus CPU checks and tests for every combo.
- [click] Bee stings the gopher. Worth it for crypto in the stdlib, not your service.
-->

---
layout: default
clicks: 3
liveOnly: true
---

<QuizQuestion id="w2-assembly" :step="$clicks" />

<!--
- [click] Open, 15 s. [click] Reveal. [click] Leaderboard.
-->

---
layout: section
level: 3
lives: 3
clicks: 1
heal: true
---

# Power-up

<PowerCrate :hit="$clicks >= 1" :size="110">
  <span class="combo-badge">import "simd"</span>
</PowerCrate>

<GameCameo :show="$clicks >= 1" :delay="900" :hold="2600" :spots="[{ left: '60px', bottom: '40px' }, { right: '60px', bottom: '40px' }, { right: '60px', top: '20px' }]"><WeaponGet on /></GameCameo>

<!--
- Go 1.27 adds portable simd.
- [click] Crate pops, gopher gets the new weapon: the simd package. Build with GOEXPERIMENT=simd.
-->

---
layout: default
---

## Same loop, now with lanes

<div class="dialog code-sm" data-name="add_simd.go" style="max-width: 820px">

````md magic-move {lines: false}
```go
func AddScalar(dst, a, b []float32) {
	for i := range dst {
		dst[i] = a[i] + b[i]
	}
}
```
```go {*|2-3|5-8}
func AddSIMD(dst, a, b []float32) {
	var v simd.Float32s
	n := v.Len() // 4, 8 or 16
	i := 0
	for ; i < len(dst)-n+1; i += n {
		x := simd.LoadFloat32s(a[i : i+n])
		y := simd.LoadFloat32s(b[i : i+n])
		x.Add(y).Store(dst[i : i+n])
	}
}
```
```go {10-14}
func AddSIMD(dst, a, b []float32) {
	var v simd.Float32s
	n := v.Len() // 4, 8 or 16
	i := 0
	for ; i < len(dst)-n+1; i += n {
		x := simd.LoadFloat32s(a[i : i+n])
		y := simd.LoadFloat32s(b[i : i+n])
		x.Add(y).Store(dst[i : i+n])
	}
	if i < len(dst) { // tail
		x, _ := simd.LoadFloat32sPart(a[i:])
		y, _ := simd.LoadFloat32sPart(b[i:])
		x.Add(y).StorePart(dst[i:])
	}
}
```
````

</div>

<GameCameo :show="$clicks >= 1" :delay="600" :hold="3400" :spots="[{ right: '0', bottom: '40px' }, { right: '0', top: '0' }]"><EvolveLizard :step="1" /></GameCameo>

<!--
- Start: our scalar loop.
- [click] What? AddScalar is evolving! Same signature. Float32s has no fixed size.
- [click] Empty vector, only used to ask its size. n is fixed at startup: 4, 8 or 16.
- [click] Load a chunk, Add, Store. Odd bound `len-n+1` lets the compiler drop bounds checks.
- [click] Tail: leftovers that don't fill a vector. Missing lanes are zero-filled; _ = how many loaded.
-->

---
layout: default
clicks: 4
---

## Walking the slice

<SliceWalk :step="$clicks" />

<GameCameo :show="$clicks >= 4" :delay="1000" :hold="2800" :spots="[{ right: '0', top: '0' }, { right: '0', bottom: '10px' }]"><ForcedLaugh /></GameCameo>

<!--
- 20 floats on an AVX2 box (n = 8).
- [click] Chunk 1: one load/add/store for 8 floats.
- [click] Chunk 2.
- [click] 4 left: LoadPart fills the missing lanes with zeros, StorePart writes only 4.
- [click] 3 vector adds instead of 20. (FFX cameo: the forced laugh.)
-->

---
layout: default
clicks: 2
---

## Choose your fighter

<CharacterSelect :step="$clicks" />

<p class="hint-box" style="margin: 30px auto 0; width: fit-content">
<span v-if="$clicks === 0">One function → <b>4 builds</b>, each with its own <code>v.Len()</code></span>
<span v-else-if="$clicks === 1">At startup the CPU picks the <b>widest it supports</b></span>
<span v-else><code>GODEBUG=simd=256</code> picks one <b>for you</b></span>
</p>

<!--
- Where n = v.Len() comes from. The compiler copies any function that uses simd types, once per width.
- [click] Runtime checks the CPU once at startup and picks the widest copy. Calls go straight to it; no per-call check.
- [click] GODEBUG=simd=0|128|256|512 overrides; handy for testing other widths. Verified: probe prints 4/4/8/16.
- The @simd suffix shows up in profiles and stack traces.
-->

---
layout: default
clicks: 3
---

## Rematch: same bee, new weapon

<BossBattle :step="$clicks" />

<!--
- The World 2 boss again, now we fight in plain Go.
- One shot = one add instruction (simplified).
- [click] Scalar: one add per instruction, one hit.
- [click] simd: 8 adds per instruction, 8 hits. FINISH HIM!
- [click] Second volley, K.O. 2 add instructions instead of 16. Bee drops to the floor.
-->

---
layout: default
---

## Build it

<div class="dialog" data-name="terminal">

```sh
GOEXPERIMENT=simd go build ./...
```

</div>

<!--
- Experiment flag at build time; no cgo, no .s files.
- No SIMD hardware? Still runs, emulated: fine for tests, never a speed-up.
-->

---
layout: default
clicks: 3
liveOnly: true
---

<QuizQuestion id="w3-dispatch" :step="$clicks" />

<!--
- [click] Open, 15 s. [click] Reveal. [click] Leaderboard.
-->

---
layout: section
level: 4
---

# High scores

<p>Adding 4,096 floats</p>

<GameCameo :delay="2600" :hold="2800" :spots="[{ left: '0', bottom: '30px' }, { right: '0', bottom: '30px' }, { right: '0', top: '20px' }]"><div style="width: 350px"><WhipWall /></div></GameCameo>

<!--
- Castlevania cameo a moment later: whip the wall, find the hidden roast.
- Now find the reward in the benchmark numbers.
-->

---
layout: default
clicks: 3
---

## Adding 4,096 floats

<div v-show="$clicks < 3" style="position: relative">

<BenchChart :step="$clicks" />

<p v-click="2" style="margin-top: 22px"><span class="combo-badge">NEW RECORD · ~10× FASTER</span></p>

<SpeedDash :go="$clicks >= 2" />
</div>

<GameCameo :show="$clicks === 2" :delay="1400" :hold="2800" :spots="[{ right: '0', bottom: '10px' }]"><StonksMeme /></GameCameo>

<GameCameo :show="$clicks === 2" :delay="4600" :hold="2800" :spots="[{ right: '0', top: '40px' }, { right: '0', bottom: '20px' }]"><BeybladeSpin /></GameCameo>

<TripCost :on="$clicks >= 3" />


<!--
- Go 1.27.0, mean of 5 runs, examples/bench-output.txt.
- High-score table fills bottom-up. Scalar baseline: ~3.3 µs.
- [click] Hand-written AVX2 assembly (8 lanes, the add_amd64.s file): ~10× faster.
- [click] Go simd, no assembly; the runtime picked AVX-512, 16 lanes here. Same speed. New record. (Stonks, then Beyblade: let it rip.)
- [click] Why ~10× with 8 lanes: each load, add and store moves 8 floats (8×), and the loop counter, check and bounds checks are paid once per 8, not per float (~2×).
- 16 vs 8 lanes barely changes (308 vs 329 ns): next slide.
- GODEBUG=simd=0 (emulated) ~10.7 µs: slower than scalar.
-->

---
layout: default
clicks: 1
---

## The chef and the fridge

<ChefBelt :step="$clicks" />

<GameCameo :show="$clicks >= 1" :delay="1400" :hold="3200" :spots="[{ right: '0', top: '0' }, { left: '0', bottom: '10px' }]"><ArrowKnee /></GameCameo>

<!--
- Chef = the add. Fridge = cache. Grab = load, put back = store.
- Watch the chef: almost all the time is loading and storing, chopping is a blink.
- One chop, all the tomatoes: that's SIMD. Single Instruction, Multiple Data.
- [click] Go simd: 16 per trip, one chop. But grabbing 16 takes twice as long: same bytes.
- Bars: chopping got cheaper, walking didn't. 329 → 308 ns.
- The maths was never the slow part.
- 3 × 16 KB = 48 KB: misses L1 (32 KB), fits L2. Cache bandwidth, not RAM.
- Skyrim cameo after the click: L1 miss to the knee.
-->

---
layout: default
clicks: 3
liveOnly: true
---

<QuizQuestion id="w4-bandwidth" :step="$clicks" />

<!--
- [click] Open, 15 s. [click] Reveal. [click] Leaderboard.
-->

---
layout: default
clicks: 1
---

## Real-life use cases

<SIMDUseCases :play="$clicks >= 1" />

<!--
- Three quick examples; sketches, not instruction counts or measured speedups.
- [click] All three play in turn, ~2.5 s apart:
- Dot product: lane-wise multiply, then combine the products. Vector-search scores.
- Matrix × vertex positions: rotate the little ship. CPU-side graphics example, not a GPU claim.
- Image processing: add brightness across pixel values. Real code must handle range limits.
- If asked: Go 1.27 portable simd has no ReduceSum; combine lanes explicitly or use a suitable implementation.
-->

---
layout: default
clicks: 1
---

## Do I need this?

<RequestBar :step="$clicks" />

<!--
- One HTTP request. Bars are illustrative, not measured.
- Most of the time: network and the database. Your code is a sliver.
- [click] SIMD makes your loop 10× faster. The request barely notices.
- Where it pays: the libraries under you. JSON, hashing, compression, vector search, images. Plus Go's own runtime: the Green Tea GC already uses SIMD.
- Why it matters for Go: library authors drop assembly for plain Go. You upgrade, you get faster.
- Do reach for it yourself when a profile shows one hot loop over numbers or bytes.
-->

---
layout: default
clicks: 1
---

<TrapCard :show="$clicks >= 1" />

<GameCameo :show="$clicks >= 1" :delay="5000" :hold="2800" :spots="[{ right: '0', top: '0' }, { left: '0', top: '0' }]"><ClickerHead /></GameCameo>

## When SIMD won't save you

<div class="grid-2 traps" :class="{ shown: $clicks >= 1 }" style="gap: 28px">
<div class="cart pink">

### Branchy loops
`if` per element

</div>
<div class="cart pink">

### Tiny slices
16 floats? Not worth it

</div>
<div class="cart pink">

### Pointer chasing
maps, `[]*T`, lists

</div>
<div class="cart pink">

### Load/store-bound
16 ≈ 8 lanes

</div>
</div>

<!--
- SIMD wants: long, flat slices of numbers, same op on every element.
- [click] All four appear in turn, ~2 s apart:
- Branchy: lanes disagree on the if: run both paths, mask off half each time. You pay for both.
- Tiny slices: tail and setup cost more than the loop.
- Pointer chasing: data isn't side by side: nothing to load as a chunk. (A Clicker gives chase as this card lands: The Last of Us.)
- Load/store-bound: waiting on loads/stores (cache or RAM): wider lanes won't help.
- Rule: profile, find the hot loop, benchmark both.
- A faded trap card flips somewhere after the first click (Yu-Gi-Oh! cameo).
-->

---
layout: default
---

## Before you ship it

<div class="grid-2-wide" style="margin-top: 24px">
<ul>
<li v-click><strong>Experiment</strong>: the API can change</li>
<li v-click>Test every width: <code>GODEBUG=simd=…</code></li>
<li v-click><code>simd=0</code> is slower than scalar</li>
<li v-click>Vectors in locals, not structs</li>
<li v-click>Never hard-code 8: use <code>Len()</code></li>
<li v-click>Benchmark first</li>
</ul>
<SavePoint />
</div>

<GameCameo :show="$clicks >= 3" :delay="900" :hold="2600" :spots="[{ left: '0', bottom: '20px' }, { right: '0', bottom: '20px' }, { right: '0', top: '0' }]"><PortalCake /></GameCameo>

<!--
- [click] Build with GOEXPERIMENT=simd. [click] simd=0|128|256|512.
- [click] simd=0 is emulated: ~3× slower than scalar. The speed-up is a lie (cake cameo).
- [click] Structs/arrays of vectors spill to memory → slow.
- [click] Len() varies by machine. [click] Load/store-bound loops won't speed up.
- No horizontal sum (ReduceSum) in portable simd yet.
-->

---
layout: default
clicks: 3
liveOnly: true
---

<QuizQuestion id="bonus-references" :step="$clicks" />

<!--
- Read the counting rule out loud.
- [click] Open, 15 s. [click] Reveal: all 16 names. [click] Leaderboard.
-->

---
layout: default
liveOnly: true
---

<QuizWinner />

<!--
- Winner is saved on arrival. If "Save results again" shows, click it.
- Congratulate, then on.
-->

---
layout: default
---

## Special thanks

<div class="credits">
<span><CreditIcon name="mario" /><b>Super Mario Bros.</b> the world</span>
<span><CreditIcon name="cod4" /><b>Call of Duty 4</b> UAV online</span>
<span><CreditIcon name="megaman" /><b>Mega Man</b> weapon get</span>
<span><CreditIcon name="pokemon" /><b>Pokémon</b> evolution</span>
<span><CreditIcon name="ffx" /><b>Final Fantasy X</b> the laugh</span>
<span><CreditIcon name="mortalkombat" /><b>Mortal Kombat</b> finish him</span>
<span><CreditIcon name="castlevania" /><b>Castlevania</b> wall roast</span>
<span><CreditIcon name="skyrim" /><b>Skyrim</b> arrow to the knee</span>
<span><CreditIcon name="lastofus" /><b>The Last of Us</b> clickers</span>
<span><CreditIcon name="portal" /><b>Portal</b> the speed-up is a lie</span>
<span><CreditIcon name="beyblade" /><b>Beyblade</b> let it rip</span>
<span><CreditIcon name="yugioh" /><b>Yu-Gi-Oh!</b> trap cards</span>
</div>

<!--
- How many did you spot?
-->

---
layout: default
---

## More side quests

- **CPU-specific instructions** — `simd/archsimd`
- **Masks** — comparisons and per-lane selection
- **Reductions** — dot products, sums and floating-point accuracy
- **Data layout** — contiguous slices, cache and bandwidth

<p class="muted" style="margin-top: 32px; font-size: 24px">
Read more: <a href="https://go.dev/blog/simd-experiment">go.dev/blog/simd-experiment</a><br>
CPU-specific API: <a href="https://go.dev/blog/archsimd">go.dev/blog/archsimd</a>
</p>

<!--
- Optional next steps, not another API walkthrough.
- archsimd: explicit vector shapes, feature checks and fallback paths; example stays in examples/.
- Masks select lanes; reductions combine lanes and need care with rounding and inactive lanes.
- Data layout and bandwidth often matter as much as arithmetic width. Measure first.
-->

---
layout: statement
---

<PixelGopher :size="140" bob />

# <span class="glitch">Find a hot loop. Try `simd`.</span>

<ContinueCountdown />

<!--
- One action: pick a numeric hot path, benchmark scalar vs simd.
- Questions.
-->
