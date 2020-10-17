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
$HEADER
.const
$CONST
.data
VALUE dd 0
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
	RET
NumToStr ENDP


$FUNC

start:
$START
	invoke ExitProcess, 0
end start
`;
