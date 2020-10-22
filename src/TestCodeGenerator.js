var masmCommands = require("./MasmCommands");
const { writeFileSync } = require("fs");

class Generator {
  constructor(syntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");
    this.inputModule(require("./GenerateExpression"));

    this.keys = ["Declaration", "Statement", "Expression"];
    this.regs = { available: ["EBX", "ECX", "EDX"], inUse: [] };

    if (!syntaxTree) return;
    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree));

    this.code = { header: [], const: [], data: [], func: [], start: [] };
    this.proc = { header: [], body: [] };

    this.constant = undefined;
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start(fileName) {
    if (!this.syntaxTree) return;

    this.code.data.push(`Caption db "${this.syntaxTree.type}", 0`);
    this.code.data.push(`Output db 20 dup(?), 0`);

    this.parseBody(this.syntaxTree);
    this.generateASM(fileName);
  }

  generateASM(name) {
    writeFileSync(
      name,
      require("./MasmTemplate")
        .template.replace("$HEADER", this.code.header.join("\n") || "")
        .replace("$CONST", this.code.const.join("\n") || "")
        .replace("$DATA", this.code.data.join("\n") || "")
        .replace("$FUNC", this.code.func.join("\n") || "")
        .replace("$START", "\t" + this.code.start.join("\n\t"))
    );
  }

  parseBody({ body }) {
    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) this.redirect(k, body[i][k]);
    }
  }

  redirect(name, tree, params = {}) {
    let { type } = tree;

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

        switch (type) {
          case "VAR":
            this.redirect("Expression", tree.Expression, { var: tree.name, defined: tree.defined });

            //   // TODO: Initialize variable
            //   // Initialize variable
            //   if (!this.isInclude(this.proc.header, `\ _${tree.name}:`)) this.proc.header.push(`LOCAL _${tree.name}:DWORD`);
            //   this.redirect("Expression", tree.Expression);
            //   this.proc.body.push(`POP _${tree.name}`);

            break;

          case "RET":
            this.redirect("Expression", tree.Expression, { type: tree.type, defined: tree.defined });

            this.proc.body.push("RET");
            break;

          // TODO:
          // case "FUNC_CALL":
          //   let body = this.proc.header[0] ? this.proc.body : this.code.start;
          //   body.push(`invoke ${["_" + tree.name, ...tree.params].join(", ")}`);
          //   this.setOutput(tree.defined, body);
          //   break;
        }

        break;
      }

      case "Expression": {
        switch (type) {
          case "STR":
            let name = params.var || params.type;
            // TODO: Put creating label at the bottom
            console.log(`L${name}:`);
            console.log(`db "${tree.value}", 0`);
            console.log(`LEA EAX, ${name}`);
            if (params.type != "RET") console.log(`MOV ${name}, EAX`);
            break;

          // TODO: Work on FLOAT Type
          case "FLOAT":
          case "INT":
            console.log(`MOV ${params.var ? params.var : "EAX"}, ${tree.value}`);
            break;

          case "VAR":
            console.log(`MOV EAX, ${tree.value}`);
            if (params.var) console.log(`MOV ${params.var}, EAX`);
            break;

          case "Binary Operation":
            // Get the right commands for the specific type
            this.commands = masmCommands[params.defined.type];
            this.createCommand = this.commands.createCommand.bind(this);

            this.parseExpression(tree);
            if (params.var) console.log(`MOV ${params.var}, EAX`);
            break;
        }

        // case "Unary Operation":
        //   this.redirect(name, tree.exp);
        //   this.unaryOperation(tree);
        //   break;
        // }

        break;
      }

      default:
        console.log("\nFailed: " + name);
    }
  }

  // setOutput({ type, kind = 0 }, body) {
  //   console.log("\t=> Created: Expression");

  //   switch (type) {
  //     case "INT": {
  //       body.push(`MOV VALUE, 0${kind}`);
  //       body.push(`invoke NumToStr, EAX, ADDR Output`);
  //       body.push("invoke MessageBoxA, 0, ADDR Output, ADDR Caption, 0");
  //       break;
  //     }

  //     case "STR": {
  //       body.push(`invoke MessageBoxA, 0, ADDR [EAX], ADDR Caption, 0`);
  //       break;
  //     }
  //   }
  // }

  isInclude(value, ...arr) {
    for (let a of arr) if (value.includes(a)) return true;
    return false;
  }
}
module.exports = Generator;
