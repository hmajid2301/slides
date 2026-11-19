//go:build goexperiment.simd && amd64

package gosimd

import "simd/archsimd"

// AddArch pins AVX2: 8 float32 lanes per 256-bit register.
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
