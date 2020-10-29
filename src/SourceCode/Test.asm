
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
	LOCAL _b:DWORD
	LOCAL _c:DWORD
	LOCAL _d:DWORD
	MOV EAX, 5
	MOV EDX, 8
	XOR EDX, 0FFFFFFFFH
	ADD EAX, EDX
	MOV EDX, EAX
	MOV EAX, 3
	IMUL EAX, 2
	ADD EAX, EDX
	MOV _b, EAX
	MOV EAX, 2
	IMUL EAX, 4
	MOV EDX, EAX
	MOV EAX, 5
	IMUL EAX, 1
	ADD EAX, EDX
	ADD EAX, _b
	CMP EAX, 00H
	SETE AL
	AND EAX, 0FFH
	MOV _c, EAX
	MOV EAX, _c
	MOV _d, EAX
	RET
_main ENDP

start:
	invoke _main
	MOV VALUE, 10
	invoke NumToStr, EAX, ADDR Output
	invoke MessageBoxA, 0, EAX, ADDR Caption, 0
	invoke ExitProcess, 0
end start
