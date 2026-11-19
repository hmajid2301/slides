//go:build goexperiment.simd && amd64

package gosimd

import (
	"fmt"
	"testing"
)

var impls = []struct {
	name string
	fn   func(dst, a, b []float32)
}{
	{"scalar", AddScalar},
	{"asm", AddAsm},
	{"simd", AddSIMD},
	{"archsimd", AddArch},
}

func inputs(n int) (a, b []float32) {
	a, b = make([]float32, n), make([]float32, n)
	for i := range n {
		a[i], b[i] = float32(i), float32(2*i)+0.5
	}
	return a, b
}

func TestAdd(t *testing.T) {
	for _, n := range []int{0, 1, 7, 8, 9, 31, 1000} {
		a, b := inputs(n)
		want := make([]float32, n)
		AddScalar(want, a, b)
		for _, impl := range impls {
			got := make([]float32, n)
			impl.fn(got, a, b)
			for i := range got {
				if got[i] != want[i] {
					t.Fatalf("%s n=%d i=%d: got %v want %v", impl.name, n, i, got[i], want[i])
				}
			}
		}
	}
}

func BenchmarkAdd(b *testing.B) {
	for _, n := range []int{4096} {
		x, y := inputs(n)
		dst := make([]float32, n)
		for _, impl := range impls {
			b.Run(fmt.Sprintf("%s/n=%d", impl.name, n), func(b *testing.B) {
				b.SetBytes(int64(n * 4 * 3))
				for b.Loop() {
					impl.fn(dst, x, y)
				}
			})
		}
	}
}
