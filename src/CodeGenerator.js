var masmCommands = require("./MasmCommands");
const { writeFileSync } = require("fs");
const { timeStamp } = require("console");

class Generator {
  constructor(syntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");
    this.inputModule(require("./GenerateExpression"));

    this.keys = ["Declaration", "Statement", "Expression"];
    this.regs = { available: ["EBX", "ECX", "EDX"], inUse: [] };

    if (!syntaxTree) return;
    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree));

    this.code = { header: [], const: [], data: [], func: [], start: [] };
    this.func = { header: [], body: [] };

    this.localCount = 0;
    this.allocateFreeSpace = 0;
    this.forcedType = undefined;
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start(fileName) {
    if (!this.syntaxTree) return;

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

  parseBody({ body }, params = {}) {
    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) this.redirect(k, body[i][k], params);
    }
  }

  redirect(name, tree, params = {}) {
    let { type } = tree;

    switch (name) {
      case "Declaration": {
        console.log("\t=> Created: " + name);
        // TODO: Maybe at some point of time create func in func declaration
        // To do it Just check if this.func.header[0] ? if it contain something
        // Then save it and create an empty this.func and after that just restore data

        // Add input params if demands of
        this.code.header.push(`${tree.name} PROTO\ ` + tree.params.map((arg) => ":DWORD").join(","));
        this.func.header.push(`${tree.name} PROC\ ` + tree.params.map((arg) => `_${arg}:DWORD`).join(","));

        this.parseBody(tree, { func: tree.name });
        this.createPROC(tree.name);
        break;
      }

      case "Statement": {
        console.log("\t=> Created: " + name);

        switch (type) {
          case "VAR":
            this.redirect("Expression", tree.Expression, { var: tree.name, defined: tree.defined, ...params });

            // We're certain that we declare new variable by another variable
            // There for we need to check if this is our first time or not
            if (this.isInclude(this.func.header, "PROC") && !this.isInclude(this.func.header, `\ ${tree.name}:`)) {
              this.func.header.push(`LOCAL ${tree.name}:DWORD`);
            }
            break;

          case "RET":
            // Create a bool return (00H or 01H) if type is not equal to INT
            this.forcedType = this.isInclude(tree.Expression.value, "==") && tree.type != "INT" ? { type: "INT", kind: 10 } : 0;
            this.redirect("Expression", tree.Expression, { type: tree.type, defined: tree.defined, ...params });
            break;

          case "FUNC_CALL":
            // This Checks if func is called from another func or not
            let body = this.func.header[0] ? this.func.body : this.code.start;
            body.push(`invoke ${[tree.name, ...tree.params].join(", ")}`);
            this.convertType(this.forcedType || tree.defined, body);
            // Reset force type
            this.forcedType = 0;
            break;
        }

        break;
      }

      case "Expression": {
        switch (type) {
          case "STR":
            // Define STR as a GLOBAL Variable
            this.func.body.push(masmCommands.STR.createValue.call(this, { src: tree, dst: "EAX" }));

            // If variable is declared then put address of this string to this variable
            // else save it in the EAX reg
            if (params.type != "RET") this.func.body.push(`MOV ${params.var}, EAX`);
            break;

          // TODO: Work on FLOAT Type
          case "FLOAT":
          case "INT":
            this.func.body.push(`MOV ${params.var ? params.var : "EAX"}, ${tree.value}`);
            break;

          case "VAR":
            this.func.body.push(`MOV EAX, ${tree.value}`);
            if (params.var) this.func.body.push(`MOV ${params.var}, EAX`);
            break;

          case "Binary Operation":
            // Get the right commands for the specific type
            this.commands = masmCommands[params.defined.type];
            this.createCommand = this.commands.createCommand.bind(this);
            this.allocateFreeSpace = params.defined.length || 0; // This param needed for declaration an array in ASM

            this.parseExpression(tree);
            if (params.var) this.func.body.push(`MOV ${params.var}, EAX`);
            break;
        }

        // TODO:
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

  createPROC(name) {
    this.code.func.push(this.func.header.join("\n\t") + "\n\t" + this.func.body.join("\n\t") + "\n\tRET" + `\n${name} ENDP`);
    this.func = { header: [], body: [] };
  }

  convertType({ type, kind = 0 }, body) {
    switch (type) {
      case "INT":
        body.push(`MOV VALUE, ${kind}`);
        body.push(`invoke NumToStr, EAX, ADDR Output`);
        break;

      // TODO:
      case "FLOAT":
        break;
    }
    body.push("invoke MessageBoxA, 0, EAX, ADDR Caption, 0");
  }

  isInclude(value, ...arr) {
    if (Array.isArray(value)) return this.isIncludeArr(value, ...arr);
    for (let i in arr) if (value.includes(arr[i])) return Number(i) + 1;
    return false;
  }

  isIncludeArr(arr, value) {
    for (let i in arr) if (arr[i].includes(value)) return Number(i) + 1;
    return false;
  }
}
module.exports = Generator;
