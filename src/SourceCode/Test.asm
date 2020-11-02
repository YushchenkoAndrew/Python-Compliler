
.386
.model flat, stdcall
option casemap:none
include \masm32\include\windows.inc
include \masm32\include\kernel32.inc
include \masm32\include\masm32.inc
includelib \masm32\lib\kernel32.lib
includelib \masm32\lib\masm32.lib
include \masm32\include\user32.inc
includelib \masm32\lib\user32.lib

NumToStr PROTO :DWORD,:DWORD
AddSTR PROTO :DWORD,:DWORD,:DWORD
CompareSTR PROTO :DWORD,:DWORD
_main PROTO 

.const


.data
VALUE dd 0
Caption db "Program", 0
Output db 20 dup(?), 0

; Created Variables
LOCAL0 db "Hello", 0
LOCAL1 dd 10.
LOCAL2 dd 1.5
LOCAL3 dd ?
LOCAL4 dd 25.
LOCAL5 dd 6.5
LOCAL6 dd 2.9
LOCAL7 dd 2.5
LOCAL8 dd 2.5
LOCAL9 dd 2.
LOCAL10 dd 1.
LOCAL11 dd 1.5
LOCAL12 dd ?

.code
NumToStr PROC uses ESI x:DWORD, TextBuff:DWORD
	MOV EBX, TextBuff
	MOV ECX, 0BH
@loop:
	MOV EDX, 00H
	XOR EDX, EDX
	DIV VALUE
	DEC ECX
	ADD DX, 48
	CMP DX, 58
	JL @store
	ADD DX, 7
@store:
	MOV BYTE ptr[EBX + ECX], DL
	CMP ECX, 0
	JNZ @loop
	LEA EAX, Output
	RET
NumToStr ENDP

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
_main PROC 
	LOCAL _test:DWORD
	LOCAL _a:DWORD
	LOCAL _b:DWORD
	LEA EAX, LOCAL0
	MOV _test, EAX
	MOV EAX, 1
	NEG EAX
	MOV _a, EAX
	FLD LOCAL1
	FLD LOCAL2
	FCHS
	FCHS
	FCHS
	FCHS
	FCHS
	FADD st(0), st(1)
	FST LOCAL3
	MOV EAX, LOCAL3
	CMP EAX, 00H
	SETE AL
	AND EAX, 0FFH
	CMP EAX, 00H
	SETE AL
	AND EAX, 0FFH
	MOV _b, EAX
	FLD LOCAL4
	FDIV LOCAL5
	FLD LOCAL6
	FMUL LOCAL7
	FADD st(0), st(1)
	FLD LOCAL8
	FMUL LOCAL9
	FADD st(0), st(1)
	FADD LOCAL10
	FST _a
	MOV EAX, _a
	undefinedLOCAL11
	FST LOCAL12
	MOV EAX, LOCAL12
	RET
_main ENDP

start:
	invoke _main
	invoke MessageBoxA, 0, EAX, ADDR Caption, 0
	invoke ExitProcess, 0
end start
