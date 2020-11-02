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
    this.func = { header: [], body: [] };

    this.globalCount = 0;
    this.labelCount = 0;
    this.allocateFreeSpace = 0;
    this.forcedType = undefined;
    this.masmCommands = require("./MasmCommands");
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start(fileName) {
    if (!this.syntaxTree) return;

    this.parseBody(this.syntaxTree.body);
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

  parseBody(body, params = {}) {
    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) this.redirect(k, body[i][k], params);
    }
  }

  redirect(name, tree, params = {}) {
    let { type } = tree;

    switch (name) {
      case "Declaration": {
        console.log("\t=> Created: " + name, { type: tree.type });
        // TODO: Maybe at some point of time create func in func declaration
        // To do it Just check if this.func.header[0] ? if it contain something
        // Then save it and create an empty this.func and after that just restore data

        // Add input params if demands of
        this.code.header.push(`${tree.name} PROTO\ ` + tree.params.map((arg) => ":DWORD").join(","));
        this.func.header.push(`${tree.name} PROC\ ` + tree.params.map((arg) => `_${arg}:DWORD`).join(","));

        this.labelCount = 0;
        this.parseBody(tree.body, { func: tree.name });
        this.createPROC(tree.name);
        break;
      }

      case "Statement": {
        console.log("\t=> Created: " + name, { type: tree.type });

        switch (type) {
          case "VAR":
            this.redirect("Expression", tree.Expression, { value: tree.name, defined: tree.defined, ...params });

            // We're certain that we declare new variable by another variable
            // There for we need to check if this is our first time or not
            if (this.isInclude(this.func.header, "PROC") && !this.isInclude(this.func.header, `LOCAL\ ${tree.name}:`)) {
              this.func.header.push(`LOCAL ${tree.name}:DWORD`);
            }
            break;

          case "RET":
            // Create a bool return (00H or 01H) if type is not equal to INT
            this.forcedType = this.isInclude(tree.Expression.value, "==", "not") && tree.type != "INT" ? { type: "INT", kind: 10 } : 0;
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

          case "IF":
            // this.func.body.push("");
            this.func.body.push(`; IF Statement ${this.labelCount}`);
            this.redirect("Expression", tree.Expression, { value: tree.name, defined: tree.defined, ...params });
            this.func.body.push("CMP EAX, 00H");
            this.createIfDistribution(tree, params, this.labelCount++);
            break;
        }

        break;
      }

      case "Expression": {
        // Get the right commands for the specific type
        this.commands = this.masmCommands[params.defined.type];
        this.createCommand = this.commands.createCommand.bind(this);
        this.allocateFreeSpace = params.defined.length || 0; // This param needed for declaration an array in ASM

        switch (type) {
          case "Binary Operation":
            this.parseExpression(tree, { func: params.func, defined: { ...params.defined } });
            console.log(params.value, params);
            if (params.value) this.func.body.push(this.commands.setValue({ dst: params.value, src: "EAX" }));
            // Check if params have any type such as ("RET", "SAVE") and it a FLOAT type
            //  if so then it save current calculated value in a new created var
            // And copied it to a reg "EAX"
            else if (params.type && params.defined.type == "FLOAT") {
              let name = this.masmCommands.FLOAT.createValue.call(this, {});
              this.func.body.push(`FST ${name}`);
              this.func.body.push(`MOV EAX, ${name}`);
            }
            break;

          default:
            params.var = params.value;
            params.value = "EAX";
            this.assignValue(this.func.body, { src: tree, dst: params });
        }

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

  createIfDistribution(tree, params, label) {
    this.func.body.push(`JE @ELSE${label}`);

    // Parse then statements
    this.parseBody(tree.body, params);
    if (!tree.else) {
      this.func.body.push(`\r@ELSE${label}:`);
      return;
    }

    this.func.body.push(`JMP @ENDIF${label}`);
    this.func.body.push(`\r@ELSE${label}:`);

    // Parse Else Statements
    this.parseBody(tree.else, params);
    this.func.body.push(`\r@ENDIF${label}:`);
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
