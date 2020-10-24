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
AddSTR PROTO :DWORD,:DWORD,:DWORD
$HEADER

.const
$CONST

.data
VALUE dd 0
Caption db "Program", 0
Output db 20 dup(?), 0

; Created Variables
$DATA

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
	POP ECX
	POP EDX
	POP EAX
	RET
AddSTR ENDP

; User Functions
$FUNC

start:
$START
	invoke ExitProcess, 0
end start
`;
