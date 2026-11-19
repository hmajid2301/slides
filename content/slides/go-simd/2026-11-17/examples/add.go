// Package gosimd adds two []float32 slices four ways.
package gosimd

// AddScalar is the loop everyone writes: one float32 per iteration.
func AddScalar(dst, a, b []float32) {
	for i := range dst {
		dst[i] = a[i] + b[i]
	}
}
