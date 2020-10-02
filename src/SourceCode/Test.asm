
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
main PROTO
.const
VALUE dd 10
.data
Caption db "Program", 0
Output db 11 dup(?), 0

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


main PROC
	PUSH 01 
	POP EBX
	XOR EBX, 0FFFFFFFFH
	PUSH EBX
	POP EBX
	XOR EBX, 0FFFFFFFFH
	PUSH EBX
	PUSH 03 
	POP EBX
	XOR EBX, 0FFFFFFFFH
	PUSH EBX
	PUSH 04 
	POP EBX
	NEG EBX
	PUSH EBX
	PUSH 05 
	POP EBX
	CMP EBX, 00H
	SETE BL
	AND EBX, 0FFH
	PUSH EBX
	POP EBX
	CMP EBX, 00H
	SETE BL
	AND EBX, 0FFH
	PUSH EBX
	POP EBX
	NEG EBX
	PUSH EBX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	ADD ECX, EBX
	PUSH ECX
	POP EBX
	CMP EBX, 00H
	SETE BL
	AND EBX, 0FFH
	PUSH EBX
	PUSH 02 
	POP EBX
	POP ECX
	MOV EAX, ECX
	MUL EBX
	PUSH EAX
	PUSH 05 
	PUSH 08 
	PUSH 04 
	POP EBX
	POP ECX
	MOV EAX, ECX
	DIV EBX
	PUSH EAX
	PUSH 02 
	PUSH 01 
	PUSH 01 
	PUSH 05 
	PUSH 01 
	PUSH 02 
	POP EBX
	POP ECX
	MOV EAX, ECX
	MUL EBX
	PUSH EAX
	POP EBX
	POP ECX
	ADD ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EBX
	POP ECX
	SUB ECX, EBX
	PUSH ECX
	POP EAX
	RET
main ENDP

start:
	invoke main
	invoke NumToStr, EAX, ADDR Output
	invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0
	invoke ExitProcess, 0
end start
