exports.template = `
.386
.model flat, stdcall
option casemap:none
include \\masm32\\include\\windows.inc
include \\masm32\\include\\kernel32.inc
include \\masm32\\include\\masm32.inc
includelib \\masm32\\lib\\kernel32.lib
includelib \\masm32\\lib\\masm32.lib
include \\masm32\\include\\user32.inc
includelib \\masm32\\lib\\user32.lib

NumToStr PROTO :DWORD,:DWORD
FloatToStr_ PROTO :DWORD,:DWORD
AddSTR PROTO :DWORD,:DWORD,:DWORD
CompareSTR PROTO :DWORD,:DWORD
$HEADER

.const
$CONST

.data
VALUE dd 0
Caption db "Program", 0
Output db 20 dup(?), 0
OutFloat db 20 dup(?), 0

; Created Variables
$DATA

.code
NumToStr PROC uses ESI x:DWORD, TextBuff:DWORD
	LOCAL index
	MOV EAX, x
	MOV EBX, TextBuff
	MOV ECX, 0BH
	MOV index, ECX
@loop:
	XOR EDX, EDX
	DIV VALUE
	DEC ECX
	ADD DX, 48
	CMP DX, 58
	JL @store
	ADD DX, 7
@store:
	MOV BYTE ptr[EBX + ECX], DL
	CMP EAX, 0
	JE @next
	MOV index, ECX
@next:
	CMP ECX, 0
	JNZ @loop
	MOV EAX, TextBuff
	MOV ECX, index	; Save Mantis Position
	DEC ECX
	RET
NumToStr ENDP

FloatToStr_ PROC uses ESI x:DWORD, TextBuff:DWORD
	LOCAL index:DWORD
	MOV EAX, x
	; Get e Value
	MOV ECX, EAX
	SHR ECX, 23
	AND ECX, 0FFH
	; Check on NaN
	JZ @end
	CMP ECX, 0FFH
	JE @end
	AND EAX, 0007FFFFFH
	OR EAX, 000800000H
	; Calculate E = e - 127
	SUB ECX, 127
	MOV index, ECX
	JS @end					; FIXME: Bug with values such as: 0.045
	; Check if E < 23
	CMP ECX, 23
	JG @end					; FIXME: Create computation if E > 23
	MOV EDX, ECX
	MOV ECX, 23
	SUB ECX, EDX
	SHR EAX, CL	; Get INT Value from F
	MOV VALUE, 0AH
	invoke NumToStr, EAX, TextBuff
	MOV EBX, x
	AND EBX, 080000000h ; Check Sign
	JZ @loop
	DEC ECX
	MOV BYTE PTR[EAX + ECX], '-'
	; Create an empty space before INT value
@loop:
	MOV BYTE PTR [EAX + ECX - 1], ' '
	DEC ECX
	JNZ @loop
	MOV EDX, EAX
	MOV EBX, 0CH
	MOV BYTE PTR [EDX + 0BH], '.'

	; Save only FLOAT Value
	MOV EAX, x
	MOV ECX, index
	ADD ECX, 05H
	SHL EAX, CL
	AND EAX, 00FFFFFFFH
	; Printing FLOAT Number
@loop2:
	IMUL EAX, 0AH
	MOV ECX, EAX
	AND EAX, 00FFFFFFFH
	SHR ECX, 28
	ADD ECX, 48
	MOV BYTE PTR [EDX + EBX], CL
	INC EBX
	CMP EBX, 18
	JNE @loop2
@end:
	MOV EAX, TextBuff
	RET
FloatToStr_ ENDP

AddSTR PROC uses ESI STR1:DWORD, STR2:DWORD, dst:DWORD
	; Save data in regs EAX, EDX, ECX to the stack
	PUSH EDX
	PUSH ECX

	MOV EAX, STR1
	MOV EDX, dst
	CMP EAX, 00H
	JE @SL2

@L1:
	MOV CL, BYTE PTR [EAX]
	MOV BYTE PTR [EDX], CL
	INC EDX
	INC EAX
	CMP BYTE PTR [EAX], 0
	JNE @L1

@SL2:
	MOV EAX, STR2
	CMP EAX, 00H
	JE @END
@L2:
	MOV CL, BYTE PTR [EAX]
	MOV BYTE PTR [EDX], CL
	INC EAX
	INC EDX
	CMP BYTE PTR [EAX], 0
	JNE @L2

@END:
	MOV EAX, dst
	POP ECX
	POP EDX
	RET
AddSTR ENDP

CompareSTR PROC uses ESI STR1:DWORD, STR2:DWORD
	; Save data in regs EAX, EDX, ECX to the stack
	PUSH EBX
	PUSH ECX

	MOV EBX, STR2
	XOR ECX, ECX

	CMP STR1, EBX	; Check if both string is Empty
	MOV EAX, 01H	; Set result as True
	JE @END
	MOV EAX, STR1
	CMP EAX, 00H	; Check if STR1 is empty
	JE @ENDF
	CMP EBX, 00H	; Check if STR2 is empty
	JE @ENDF

@L1:
	MOV CL, BYTE PTR [EAX]
	CMP CL, BYTE PTR [EBX]
	JNE @ENDF
	INC EAX
	INC EBX
	CMP BYTE PTR [EAX], 00H
	JNE @L1

	; Check if STR2 is also finished
	MOV EAX, 01H
	CMP BYTE PTR [EBX], 00H
	JE @END
@ENDF:
	MOV EAX, 00H
@END:
	POP ECX
	POP EBX
	RET
CompareSTR ENDP

; User Functions
$FUNC

start:
$START
	invoke ExitProcess, 0
end start
`;
