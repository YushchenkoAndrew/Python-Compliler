
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
_main PROTO
.const

.data
VALUE dd 0
Caption db "Program", 0
Output db 20 dup(?), 0

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
	RET
NumToStr ENDP


_main PROC
	LOCAL _a :DWORD
	PUSH 06
	POP _a
	PUSH _a
	PUSH 02
	POP EBX
	POP ECX
	MOV EAX, ECX
	XOR EDX, EDX
	DIV EBX
	PUSH EDX
	PUSH 05
	PUSH 02
	PUSH 03
	POP EBX
	POP ECX
	CMP ECX, EBX
	SETL CL
	AND ECX, 0FFH
	PUSH ECX
	POP EBX
	POP ECX
	XOR EDX, EDX
	CMP ECX, 00H
	SETE DL
	DEC EDX
	AND EBX, EDX
	PUSH EBX
	POP EBX
	POP ECX
	XOR EDX, EDX
	CMP ECX, 00H
	SETE DL
	DEC EDX
	AND ECX, EDX
	XOR EDX, 0FFFFFFFFH
	AND EBX, EDX
	OR ECX, EBX
	PUSH ECX
	POP EAX
	RET
_main ENDP

start:
	invoke _main
	MOV VALUE, 010
	invoke NumToStr, EAX, ADDR Output
	invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0
	invoke ExitProcess, 0
end start
