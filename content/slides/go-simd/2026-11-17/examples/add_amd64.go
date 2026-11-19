package gosimd

// AddAsm is implemented in add_amd64.s (AVX2). len(a), len(b) >= len(dst).
//
//go:noescape
func AddAsm(dst, a, b []float32)
