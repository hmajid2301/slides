//go:build goexperiment.simd

package gosimd

import "simd"

// AddSIMD is portable: the vector width is picked when the program starts.
func AddSIMD(dst, a, b []float32) {
	var v simd.Float32s
	n := v.Len()
	i := 0
	for ; i < len(dst)-n+1; i += n {
		x := simd.LoadFloat32s(a[i : i+n])
		y := simd.LoadFloat32s(b[i : i+n])
		x.Add(y).Store(dst[i : i+n])
	}
	if i < len(dst) {
		x, _ := simd.LoadFloat32sPart(a[i:])
		y, _ := simd.LoadFloat32sPart(b[i:])
		x.Add(y).StorePart(dst[i:])
	}
}
