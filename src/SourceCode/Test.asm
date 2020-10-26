
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
LOCAL0 db "a = ", 0
LOCAL1 db "0", 0
LOCAL2 db 5 dup(0), 0
LOCAL3 db "1", 0
LOCAL4 db 5 dup(0), 0
LOCAL5 db "2", 0
LOCAL6 db 5 dup(0), 0
LOCAL7 db "3", 0
LOCAL8 db 5 dup(0), 0
LOCAL9 db "default", 0
LOCAL10 db 11 dup(0), 0

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
	LEA EAX, LOCAL0
	MOV _test, EAX
	MOV _a, 0
	; IF Statement 0
	MOV EAX, _a
	
	; LOGIC "=="
	CMP EAX, 0
	SETE AL
	AND EAX, 0FFH
	
	CMP EAX, 00H
	JE @ELSE0
	MOV EAX, _test
	invoke AddSTR, EAX, ADDR LOCAL1, ADDR LOCAL2
	MOV _test, EAX
	JMP @ENDIF0
	@ELSE0:
	; IF Statement 1
	MOV EAX, _a
	
	; LOGIC "=="
	CMP EAX, 1
	SETE AL
	AND EAX, 0FFH
	
	CMP EAX, 00H
	JE @ELSE1
	MOV EAX, _test
	invoke AddSTR, EAX, ADDR LOCAL3, ADDR LOCAL4
	MOV _test, EAX
	JMP @ENDIF1
	@ELSE1:
	; IF Statement 2
	MOV EAX, _a
	
	; LOGIC "=="
	CMP EAX, 2
	SETE AL
	AND EAX, 0FFH
	
	CMP EAX, 00H
	JE @ELSE2
	MOV EAX, _test
	invoke AddSTR, EAX, ADDR LOCAL5, ADDR LOCAL6
	MOV _test, EAX
	JMP @ENDIF2
	@ELSE2:
	; IF Statement 3
	MOV EAX, _a
	
	; LOGIC "=="
	CMP EAX, 3
	SETE AL
	AND EAX, 0FFH
	
	CMP EAX, 00H
	JE @ELSE3
	MOV EAX, _test
	invoke AddSTR, EAX, ADDR LOCAL7, ADDR LOCAL8
	MOV _test, EAX
	JMP @ENDIF3
	@ELSE3:
	MOV EAX, _test
	invoke AddSTR, EAX, ADDR LOCAL9, ADDR LOCAL10
	MOV _test, EAX
	@ENDIF3:
	@ENDIF2:
	@ENDIF1:
	@ENDIF0:
	MOV EAX, _test
	RET
_main ENDP

start:
	invoke _main
	invoke MessageBoxA, 0, EAX, ADDR Caption, 0
	invoke ExitProcess, 0
end start
