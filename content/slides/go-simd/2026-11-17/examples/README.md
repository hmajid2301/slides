# Adding two []float32 slices, four ways

Needs Go 1.27 (pulled automatically by `go.mod`) and amd64 for the asm/archsimd versions.

```sh
GOEXPERIMENT=simd go test ./...
GOEXPERIMENT=simd go test -run x -bench . -count 5
GODEBUG=simd=256 GOEXPERIMENT=simd go test -run x -bench Add/simd
```

`bench-output.txt` holds the numbers used in the slides (Ryzen 9 7950X3D).
