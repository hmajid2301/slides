---
theme: default
title: 'The Fast and the Floatiest: SIMD in Go 1.27'
author: Haseeb Majid
presenter: true
duration: 15min
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
label: 'INSERT COIN'
---

<div class="grid-2-wide">
<div>

# The Fast and the Floatiest

### SIMD in Go 1.27. No assembly.

<p class="muted">Haseeb Majid · haseebmajid.dev</p>

<p class="press-start">▶ PRESS START</p>

</div>
<CoinGopher :size="300" />
</div>

<!--
- 15 min. You write Go daily; no CPU knowledge assumed.
- One example all the way through: add two []float32 slices.
- Easter egg: click the gopher for a coin.
- Pixel gopher: own sprite after the Go gopher by Renée French (CC BY 4.0).
-->

---
layout: statement
label: 'TITLE SCREEN'
clicks: 1
---

<InvaderRow :shot="$clicks >= 1" />

# Your loop adds **one** number at a time.

<p v-click class="muted">The CPU next to it could do <strong>eight</strong>. Or sixteen.</p>

<!--
- Pause before the click.
- [click] One beam clears the row. Today: how Go 1.27 lets you use the other seven, in plain Go.
-->

---
layout: default
label: 'TUTORIAL'
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
label: 'INSIDE THE CPU'
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

<!--
- Top-down view, not to scale. Roughly my Ryzen 9 7950X3D.
- [click] Lid off: 2 chiplets × 8 cores + I/O die.
- [click] One chiplet: 8 cores share a big L3.
- [click] One core: integer side, vector side. Float maths lives in the vector unit.
- [click] Registers: 32 × 512-bit. Each one holds 16 floats.
-->

---
layout: default
clicks: 4
---

## Registers have lanes

<LaneDiagram :step="$clicks" />

<!--
- Register = tiny storage slot the CPU does maths in.
- Z0 from the last slide. Its lower half has its own name: Y0.
- [click] Zoom into Y0: 8 lanes, easier to see than 16.
- [click] Scalar: ADDSS uses one float slot. Rest sits idle. 8 pairs = 8 adds.
- [click] Wide registers: 256 bits = 8 float32 "lanes".
- [click] One VADDPS adds all eight pairs at once. 8 → 1. That's SIMD.
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
layout: section
level: 2
label: 'THE OLD WAY'
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

## Hard mode: talking to the CPU yourself

<CpuMachine :step="$clicks" />

<!--
- Assembly = the CPU's own instructions. Simplified; real file is ~30 lines.
- "Step" = one instruction; real timing is messier.
- [click] Load: 8 numbers memory → register Y0.
- [click] Load b into Y1.
- [click] One add, eight sums. This is the whole point.
- [click] Store back. 4 instructions for 8 floats.
-->

---
layout: default
clicks: 6
hurtAt: 6
---

## Boss fight: one file per CPU

<BossFiles :step="$clicks" />

<p v-click="6" class="game-over" style="font-size: 40px; margin: 22px auto 0; transition-delay: 1.4s">GAME OVER <span class="muted" style="font-size: 24px">(for most teams)</span></p>

<!--
- Assembly only runs on the CPU it was written for.
- [click] Intel/AMD file. [click] ARM file. [click] another. [click] Go fallback.
- [click] Plus runtime CPU checks and tests for every combo.
- [click] Bee stings the gopher. Worth it for crypto in the stdlib, not your service.
-->

---
layout: section
level: 3
label: 'GO 1.27'
lives: 3
clicks: 1
heal: true
---

# Power-up get!

<PowerCrate :hit="$clicks >= 1" :size="110">
  <span class="combo-badge">import "simd"</span>
</PowerCrate>

<WeaponGet :on="$clicks >= 1" />

<!--
- Go 1.26 shipped simd/archsimd; Go 1.27 adds portable simd.
- [click] Crate pops, gopher gets the new weapon: the simd package. Build with GOEXPERIMENT=simd.
-->

---
layout: default
---

## Same loop, now with lanes

<div class="dialog code-sm" data-name="add_simd.go">

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

<!--
- Start: our scalar loop.
- [click] Same signature. Float32s has no fixed size.
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

<!--
- 20 floats on an AVX2 box (n = 8).
- [click] Chunk 1: one load/add/store for 8 floats.
- [click] Chunk 2.
- [click] 4 left: LoadPart fills the missing lanes with zeros, StorePart writes only 4.
- [click] 3 vector adds instead of 20.
-->

---
layout: default
clicks: 3
label: 'REMATCH'
---

## Rematch: same bee, new weapon

<BossBattle :step="$clicks" />

<!--
- The World 2 boss again, now we fight in plain Go.
- One shot = one add instruction (simplified).
- [click] Scalar: one add per instruction, one hit.
- [click] simd: 8 adds per instruction, 8 hits.
- [click] Second volley, K.O. 2 add instructions instead of 16. Bee drops to the floor.
-->

---
layout: default
---

## Inventory

<div class="grid-2">
<div>

- `simd.Float32s`: **no size in the type**
- `LoadFloat32s` / `Store`
- `.Add` `.Mul` `.MulAdd` `.Max` …
- `LoadFloat32sPart` / `StorePart`

</div>
<div>
<div class="dialog" data-name="build it">

```sh
GOEXPERIMENT=simd go build ./...
```

</div>

<p class="hint-box">No SIMD hardware? Still runs, <b>emulated</b>.</p>

<RexRun />
</div>
</div>

<!--
- Types are plural Go types: Float32s, Int8s, Uint64s.
- Load/Store: slices in and out. Part variants: tails.
- Experiment flag at build time; no cgo, no .s files.
- T-rex: like the offline browser game, it still plays without the fancy hardware.
- Emulated: fine for tests, never a speed-up. Numbers on the live slide.
-->

---
layout: default
clicks: 3
---

## Choose your fighter

<CharacterSelect :step="$clicks" />

<p class="muted" style="font-size: 22px; margin-top: 22px">
<span v-if="$clicks < 2">&nbsp;</span>
<span v-else-if="$clicks < 3">Startup: the CPU picks</span>
<span v-else><code>GODEBUG=simd=256</code> overrides</span>
</p>

<!--
- One function in, four out: the compiler copies any function that mentions simd types, once per width.
- My Ryzen picks AVX-512, 16 lanes. GODEBUG is handy for testing other widths.
- Suffix shows up in profiles and stack traces.
- [click] The Go runtime checks the CPU at startup...
- [click] ...and picks the best. Calls between copies are direct; no per-call dispatch.
- [click] GODEBUG=simd=0|128|256|512 overrides. Verified: probe prints 4/4/8/16.
-->

---
layout: default
clicks: 2
---

## Secret exit: `archsimd`

<div class="grid-2-wide code-sm">
<div class="dialog" data-name="add_archsimd_amd64.go">

```go {2-5|7-11}
func AddArch(dst, a, b []float32) {
	if !archsimd.X86.AVX2() {
		AddScalar(dst, a, b)
		return
	}
	i := 0
	for ; i < len(dst)-8+1; i += 8 {
		x := archsimd.LoadFloat32x8(a[i : i+8])
		y := archsimd.LoadFloat32x8(b[i : i+8])
		x.Add(y).Store(dst[i : i+8])
	}
	AddScalar(dst[i:], a[i:], b[i:])
}
```

</div>
<div>

<ArchVenn :step="$clicks" />

<WhipWall />

</div>
</div>

<!--
- amd64 since Go 1.26; Go 1.27 adds arm64 (NEON) and wasm. Fixed sizes (Float32x8); you check the CPU. Skip the check → SIGILL.
- If asked about arm64: archsimd.ARM64.* checks; NEON is always there. SVE is coming in 1.28+.
- Venn: three CPU families.
- [click] Code: size and CPU are explicit. Middle lights up = simd, what every CPU shares.
- [click] Whole circle = archsimd: everything this CPU can do (GFNI, AES…).
- Default to simd. Drop down for one op via v.ToArch() / FromArch.
- Whip the wall, find the roast: the hidden room only some CPUs have.
-->

---
layout: section
level: 4
label: 'HIGH SCORES'
---

# High scores

<p>4,096 floats · Ryzen 9 7950X3D</p>

---
layout: default
clicks: 4
---

## Adding 4,096 floats

<div style="position: relative">

<BenchChart :step="$clicks" />

<p v-click="3" style="margin-top: 22px"><span class="combo-badge">NEW RECORD · ~10× FASTER</span></p>

<SpeedDash :go="$clicks >= 3" />
</div>

<TripCost :on="$clicks >= 4" />


<!--
- Go 1.27.0, mean of 5 runs, examples/bench-output.txt.
- Scalar baseline: ~3.3 µs.
- [click] Hand-written AVX2: ~10× faster.
- [click] Portable simd (16 lanes here): same speed. Plain Go.
- [click] archsimd: also the same. Portable costs nothing here.
- [click] Why >8×: every loop trip pays a check + jump (pink). Scalar pays it per float; SIMD once per 8.
- 16 vs 8 lanes barely changes (308 vs 329 ns): next slide.
- GODEBUG=simd=0 (emulated) ~10.7 µs: slower than scalar.
-->

---
layout: default
clicks: 3
label: 'CACHE WALL'
---

## Cache me if you can

<MemoryWall :step="$clicks" />

<!--
- Each chunk: load a and b, add, store. Blue = moving data, yellow = the add.
- [click] 8 lanes: the add is a sliver; loads/stores dominate.
- [click] 16 lanes: half the adds, same bytes to move. 329 → 308 ns.
- [click] The vector unit sits idle waiting on data. Load/store-bound, not maths-bound.
- 3 × 16 KB = 48 KB: misses L1 (32 KB), fits L2. Not RAM: cache bandwidth.
- Zen 4: 512-bit ops run on 256-bit units; L1 does 2×256-bit loads + 1 store per cycle.
- Diagram is schematic, not to scale.
-->

---
layout: default
clicks: 1
label: 'KITCHEN'
---

## The chef and the fridge

<ChefBelt :step="$clicks" />

<!--
- Chef = the add. Fridge = cache. Walking = loads/stores.
- Watch the chef: almost all the time is walking, chopping is a blink.
- One chop, all the carrots: that's SIMD. Single Instruction, Multiple Data.
- [click] New knife chops 16 at once, but he still carries 8 per trip: two walks per chop.
- Bars: chopping got cheaper, walking didn't. 329 → 308 ns.
- The maths was never the slow part.
-->

---
layout: default
label: 'LIVE PLAY'
---

## Live: pick a width

<LiveBench />

<!--
- Needs `pnpm dev` (runs go test in examples/ with Go 1.27). Static build replays recorded numbers.
- Click 512, then 256, 128, OFF. ~1 s each.
- OFF: emulated, slower than scalar: "not very effective". Never ship that without testing.
- If live fails, the status line says REPLAY: just keep talking.
-->

---
layout: default
clicks: 3
label: 'SIDE QUEST'
---

## Do I need this?

<RequestBar :step="$clicks" />

<!--
- One HTTP request. Bars are illustrative, not measured.
- Most of the time: network and the database. Your code is a sliver.
- [click] SIMD makes your loop 10× faster. The request barely notices.
- [click] Where it pays: the libraries under you. JSON, hashing, compression, vector search, images. Plus Go's own runtime: the Green Tea GC already uses SIMD.
- [click] Why it matters for Go: library authors drop assembly for plain Go. You upgrade, you get faster.
- Do reach for it yourself when a profile shows one hot loop over numbers or bytes.
-->

---
layout: default
label: 'TRAPS'
---

## When SIMD won't save you

<div class="grid-2 traps" style="gap: 28px">
<div v-click class="cart pink">

### Branchy loops
`if` per element
<BranchLanes />

</div>
<div v-click class="cart pink">

### Tiny slices
16 floats? Not worth it

</div>
<div v-click class="cart pink">

### Pointer chasing
maps, `[]*T`, lists
<ChompDots />

</div>
<div v-click class="cart pink">

### Load/store-bound
16 ≈ 8 lanes

</div>
</div>

<!--
- You activated my trap card! SIMD wants: long, flat slices of numbers, same op on every element.
- [click] Lanes disagree on the if: run both paths, mask off half each time. You pay for both.
- [click] Tail and setup cost more than the loop.
- [click] Data isn't side by side: nothing to load as a chunk.
- [click] Waiting on loads/stores (cache or RAM): wider lanes won't help.
- Rule: profile, find the hot loop, benchmark both.
-->

---
layout: default
label: 'BOSS TIPS'
---

## Before you ship it

<div class="grid-2-wide" style="margin-top: 24px">
<ul>
<li v-click><strong>Experiment</strong>: the API can change</li>
<li v-click>Test every width: <code>GODEBUG=simd=…</code></li>
<li v-click>Vectors in locals, not structs</li>
<li v-click>Never hard-code 8: use <code>Len()</code></li>
<li v-click>Benchmark first</li>
</ul>
<SavePoint />
</div>

<!--
- [click] Build with GOEXPERIMENT=simd. [click] simd=0|128|256|512.
- [click] Structs/arrays of vectors spill to memory → slow.
- [click] Len() varies by machine. [click] Load/store-bound loops won't speed up.
- No horizontal sum (ReduceSum) in portable simd yet.
- simd=0 forces emulation: run tests there too.
-->

---
layout: statement
label: 'CONTINUE?'
---

<PixelGopher :size="140" bob />

# <span class="glitch">Find a hot loop. Try `simd`.</span>

<ContinueCountdown />

<p class="muted" style="font-size: 24px; line-height: 1.7">
go.dev/blog/simd-experiment · go.dev/blog/archsimd<br>
code: gitlab.com/hmajid2301/slides · <code>content/slides/go-simd/2026-11-17/examples</code>
</p>

<!--
- One action: pick a numeric hot path, benchmark scalar vs simd.
- Questions.
-->
