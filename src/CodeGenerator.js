var Code = require("./MasmTemplate").template;
const { readFileSync, writeFileSync } = require("fs");

class Generator {
  constructor(syntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");
    this.inputModule(require("./AsmOperation"));

    this.keys = ["Declaration", "Statement", "Expression"];
    this.regs = { available: ["EDX", "ECX", "EBX"], inUse: [] };

    if (!syntaxTree) return;
    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree));
    this.code = { header: [], const: [], data: [], func: [], start: [] };
    this.proc = { header: [], body: [] };

    // this.CodeTemplate = readFileSync("./BasicInclude.txt", "ascii");
    this.CodeTemplate = Code;
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start(fileName) {
    if (!this.syntaxTree) return;

    this.code.data.push(`Caption db "${this.syntaxTree.type}", 0`);
    this.code.data.push(`Output db 20 dup(?), 0`);

    this.parseBody(this.syntaxTree);
    this.replaceMarks();
    writeFileSync(fileName, this.CodeTemplate);
  }

  replaceMarks() {
    this.CodeTemplate = this.CodeTemplate.replace("$HEADER", this.code.header.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$CONST", this.code.const.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$DATA", this.code.data.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$FUNC", this.code.func.join("\n") || "");
    this.CodeTemplate = this.CodeTemplate.replace("$START", "\t" + this.code.start.join("\n\t"));
  }

  parseBody({ body }) {
    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) this.redirect(k, body[i][k]);
    }
  }

  redirect(name, tree) {
    switch (name) {
      case "Declaration": {
        console.log("\t=> Created: " + name);

        this.code.header.push(`_${tree.name} PROTO`);
        this.proc.header.push(`_${tree.name} PROC`);

        // Add input params
        let { length } = tree.params;
        for (let i = 0; i < length; i++) {
          let comma = i + 1 != length ? "," : "";
          this.code.header.push(this.code.header.pop() + ` :DWORD${comma}`);
          this.proc.header.push(this.proc.header.pop() + ` _${tree.params[i]}:DWORD${comma}`);
        }
        this.parseBody(tree);

        this.code.func.push(this.proc.header.join("\n\t") + "\n\t" + this.proc.body.join("\n\t") + `\n_${tree.name} ENDP`);
        this.proc = { header: [], body: [] };

        break;
      }

      case "Statement": {
        console.log("\t=> Created: " + name);

        switch (tree.type) {
          case "VAR":
            // TODO:
            // Initialize variable
            if (!this.isInclude(this.proc.header, `\ _${tree.name}:`)) this.proc.header.push(`LOCAL _${tree.name}:DWORD`);
            this.redirect("Expression", tree.Expression);
            this.proc.body.push(`POP _${tree.name}`);

            break;

          case "RET":
            // this.parseBody(tree);
            this.redirect("Expression", tree.Expression);

            this.proc.body.push(`POP EAX`);
            this.proc.body.push("RET");
            break;

          case "FUNC_CALL":
            let body = this.proc.header[0] ? this.proc.body : this.code.start;
            body.push(`invoke ${["_" + tree.name, ...tree.params].join(", ")}`);
            this.setOutput(tree.defined, body);
            break;
        }

        break;
      }

      case "Expression": {
        switch (tree.type) {
          case "STR":
          case "CHAR":
          case "INT":
            return this.constExpression(tree);

          case "VAR":
            let { value } = tree;
            this.proc.body.push(`PUSH _${value}`);
            break;

          // TODO: Finish this in a future...
          case "FUNC_CALL":
            let body = this.proc.header[0] ? this.proc.body : this.code.start;
            body.push(`invoke ${"_" + tree.value}`);
            body.push(`PUSH EAX`);
            this.setOutput(tree.defined, body);
            break;

          case "Binary Operation":
            this.redirect(name, tree.left);
            this.redirect(name, tree.right);
            this.binaryOperation(tree);
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

  setOutput({ type, kind = 0 }, body) {
    console.log("\t=> Created: Expression");

    switch (type) {
      case "INT": {
        body.push(`MOV VALUE, 0${kind}`);
        body.push(`invoke NumToStr, EAX, ADDR Output`);
        body.push("invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0");
        break;
      }

      case "STR": {
        body.push(`invoke MessageBoxA, 0, ADDR [EAX], ADDR Caption, 0`);
        break;
      }
    }
  }

  constExpression(tree) {
    switch (tree.type) {
      case "INT":
        this.proc.body.push(`PUSH 0${tree.value}`);
        break;

      // TODO: Think about changing creating string as a pointer but create it as array of char
      case "STR":
        let name = "TEMP" + parseInt(Math.random() * 100);
        this.code.data.push(`${name} db "${tree.value}", 0`);
        this.proc.body.push(`PUSH offset [${name}] `);
        break;
    }
  }

  isInclude(arr, value) {
    for (let a of arr) if (a.includes(value)) return true;
    return false;
  }
}
module.exports = Generator;
