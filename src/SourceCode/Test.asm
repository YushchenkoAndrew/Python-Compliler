
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
_main PROTO :DWORD,:DWORD

.const


.data
VALUE dd 0
Caption db "Program", 0
Output db 20 dup(?), 0

; Created Variables
LOCAL0 db "_Second STR", 0
LOCAL1 db "Hello world", 0
LOCAL2 db 50 dup(0), 0
LOCAL3 db "Test2", 0
LOCAL4 db 50 dup(0), 0
LOCAL5 db 50 dup(0), 0
LOCAL6 db "TEST3", 0
LOCAL7 db 50 dup(0), 0

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
	PUSH EAX
	PUSH EDX
	PUSH ECX

	MOV EAX, STR1
	MOV EDX, dst
@L1:
	MOV CL, BYTE PTR [EAX]
	MOV BYTE PTR [EDX], CL
	INC EDX
	INC EAX
	CMP BYTE PTR [EAX], 0
	JNE @L1

	MOV EAX, STR2
@L2:
	MOV CL, BYTE PTR [EAX]
	MOV BYTE PTR [EDX], CL
	INC EAX
	INC EDX
	CMP BYTE PTR [EAX], 0
	JNE @L2

	POP ECX
	POP EDX
	POP EAX
	RET
AddSTR ENDP

; User Functions
_main PROC _q:DWORD,_d:DWORD
	LOCAL _test:DWORD
	LOCAL _b:DWORD
	LOCAL _c:DWORD
	LOCAL _a:DWORD
	LEA EAX, LOCAL0
	MOV _test, EAX
	LEA EAX, LOCAL1
	invoke AddSTR, EAX, _test, ADDR LOCAL2
	LEA EAX, LOCAL2
	invoke AddSTR, EAX, ADDR LOCAL3, ADDR LOCAL4
	LEA EAX, LOCAL4
	invoke AddSTR, EAX, _test, ADDR LOCAL5
	LEA EAX, LOCAL5
	invoke AddSTR, EAX, ADDR LOCAL6, ADDR LOCAL7
	LEA EAX, LOCAL7
	MOV _test, EAX
	MOV EAX, 2
	ADD EAX, 1
	MOV _b, EAX
	MOV EAX, _b
	MOV _c, EAX
	MOV EAX, 1
	SAL EAX, 2
	MOV _a, EAX
	MOV EAX, _a
	RET
_main ENDP

start:
	invoke _main
	MOV VALUE, 10
	invoke NumToStr, EAX, ADDR Output
	invoke MessageBoxA, 0, EAX, ADDR Caption, 0
	invoke ExitProcess, 0
end start
