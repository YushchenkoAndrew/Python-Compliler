const { readFileSync, writeFileSync } = require("fs");

class Generator {
  constructor(syntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");

    this.keys = ["Declaration", "Statement", "Expression"];
    this.regs = { available: ["EDX", "ECX", "EBX", "EAX"], inUse: [] };

    this.syntaxTree = syntaxTree;
    this.code = { header: [], const: [], data: [], func: [], start: [] };
    this.stack = [];

    // this.CodeTemplate = readFileSync("./BasicInclude.txt", "ascii");
    this.CodeTemplate = Code;
  }

  start(fileName) {
    if (!this.syntaxTree) return;

    this.code.data.push(`Caption db "${this.syntaxTree.type}", 0`);
    this.code.data.push(`Output db 11 dup(?), 0`);

    for (let i in this.syntaxTree.body) {
      for (let k of this.keys) if (this.syntaxTree.body[i][k]) this.redirect(k, this.syntaxTree.body[i][k]);
    }

    this.CodeTemplate = this.CodeTemplate.replace("$HEADER", this.code.header.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$CONST", this.code.const.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$DATA", this.code.data.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$FUNC", this.code.func.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$START", this.code.start.join("\n\t") || "");

    // console.log(this.CodeTemplate);
    writeFileSync(fileName, this.CodeTemplate);
    // console.log(this.code);
  }

  redirect(name, tree) {
    switch (name) {
      case "Declaration": {
        console.log("\t=> Created: " + name);

        this.code.header.push(`${tree.name} PROTO`);
        this.code.start.push(`\tinvoke ${tree.name}`);

        this.stack.push(`${tree.name} PROC`);
        this.redirect("Statement", tree.Statement);
        // this.stack.push(`\n);

        this.code.func.push(this.stack.join("\n\t") + `\n${tree.name} ENDP`);
        this.stack = [];

        break;
      }

      case "Statement": {
        console.log("\t=> Created: " + name);

        console.log();

        this.regs.inUse.push(this.regs.available.pop());
        this.redirect("Expression", tree.Expression);

        console.log();

        let reg = this.regs.inUse.pop();
        this.regs.available.push(reg);
        console.log(`POP ${reg}`);

        console.log();

        this.stack.push("RET");

        break;
      }

      case "Expression": {
        // console.log("\t=> Created: " + name);

        switch (tree.type) {
          case "STR":
          case "CHAR":
          case "INT":
            // console.log(tree);
            return this.constExpression(tree);

          case "Binary Operation":
            // reg MOV approach
            // this.regs.inUse.push({ name: this.regs.available.pop() });
            // let exp = this.redirect(name, tree.left);
            this.redirect(name, tree.left);
            this.redirect(name, tree.right);
            // let value = this.redirect(name, tree.right) || exp;

            // TODO: Create swap func
            // if (exp) this.swapReg(this.regs.inUse.slice(-1)[0].name, exp);

            // FIXME: Fix bug with exp: (...) - (...)
            this.binaryOperation(tree);

            // return this.regs.inUse.pop().name;
            break;

          case "Unary Operation":
            this.redirect(name, tree.exp);
            this.unaryOperation(tree);
            break;
        }

        break;
      }

      default:
        console.log("\nFailed: " + name);
    }
  }

  constExpression(tree) {
    // let reg = this.regs.available.pop();
    // this.regs.inUse.push(reg);
    let reg = this.regs.inUse.slice(-1)[0];

    switch (tree.type) {
      case "CHAR": {
        this.stack.push(`MOV ${reg}, ${tree.value}`);
        this.code.start.push(`MOV DWORD ptr [Output], ${reg}`);

        this.code.const.push(`VALUE dd 1`);
        this.code.start.push("invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0");
        break;
      }

      case "INT": {
        // Using MOV approach
        // if (reg.define) return `0${tree.value}`;
        // reg.define = true;
        // console.log(`MOV ${reg.name}, 0${tree.value}`);

        console.log(`PUSH 0${tree.value} `);

        this.stack.push(`MOV ${reg.name}, 0${tree.value}`);
        this.code.start.push(`invoke NumToStr, ${reg.name}, ADDR Output`);

        this.code.const.push(`VALUE dd ${tree.kind}`);
        this.code.start.push("invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0");
        break;
      }

      case "STR": {
        let name = "TEMP" + parseInt(Math.random() * 100);
        this.code.data.push(`${name} db "${tree.value}", 0`);
        this.stack.push(`MOV ${reg}, offset [${name}] `);

        this.code.const.push(`VALUE dd 1`);
        this.code.start.push(`invoke MessageBoxA, 0, ADDR [${reg}], ADDR Caption, 0`);
        break;
      }
    }
  }

  binaryOperation({ value }, exp) {
    // console.log({ type: type, value: value, exp: exp });
    let regs = this.regs.available.slice(-2);
    console.log(`POP ${regs[1]}`);
    console.log(`POP ${regs[0]}`);

    switch (value) {
      case "-":
        console.log(`SUB ${regs[0]}, ${regs[1]}`);
        console.log(`PUSH ${regs[0]}`);
        // console.log(`SUB ${reg.name}, ${exp} `);
        // this.stack.push(`SUB ${reg.name}, ${exp} `);
        break;

      case "+":
        console.log(`ADD ${regs[0]}, ${regs[1]}`);
        console.log(`PUSH ${regs[0]}`);
        // console.log(`ADD ${reg.name}, ${exp} `);
        // this.stack.push(`ADD ${reg.name}, ${exp} `);
        break;

      case "*":
        console.log(`MOV EAX, ${regs[0]}`);
        console.log(`MUL ${regs[1]}`);
        console.log(`PUSH EAX`);
        break;

      case "/":
        console.log(`MOV EAX, ${regs[0]}`);
        console.log(`DIV ${regs[1]}`);
        console.log(`PUSH EAX`);
        break;
    }
  }

  unaryOperation({ type, value }) {
    console.log({ type: type, value: value });
  }
}
module.exports = Generator;

var Code = `
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
