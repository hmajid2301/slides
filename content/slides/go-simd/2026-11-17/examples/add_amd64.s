#include "textflag.h"

// func AddAsm(dst, a, b []float32)
TEXT ·AddAsm(SB), NOSPLIT, $0-72
	MOVQ dst_base+0(FP), DI
	MOVQ dst_len+8(FP), CX
	MOVQ a_base+24(FP), SI
	MOVQ b_base+48(FP), DX
	XORQ AX, AX

loop8:
	LEAQ 8(AX), BX
	CMPQ BX, CX
	JG   tail
	VMOVUPS (SI)(AX*4), Y0
	VADDPS  (DX)(AX*4), Y0, Y0
	VMOVUPS Y0, (DI)(AX*4)
	MOVQ BX, AX
	JMP  loop8

tail:
	CMPQ AX, CX
	JGE  done
	MOVSS (SI)(AX*4), X0
	ADDSS (DX)(AX*4), X0
	MOVSS X0, (DI)(AX*4)
	INCQ AX
	JMP  tail

done:
	VZEROUPPER
	RET
