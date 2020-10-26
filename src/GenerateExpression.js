function parseExpression(tree) {
  let state = tree.left.type.includes("Operation") + tree.right.type.includes("Operation") * 2;

  // TODO: Create a correct expression generator with a FUNC_CALL
  switch (state) {
    // Next left and right values a Constant
    case 0:
      // Save first input const in reg EAX
      this.assignValue(this.func.body, { src: tree.left, dst: "EAX" });
      this.createCommand(tree)(tree, this.func.body, { src: tree.right });
      break;

    // Next Left value is Operation and the right is Constant
    case 1:
      this.parseExpression(tree.left);
      this.createCommand(tree)(tree, this.func.body, { src: tree.right });
      break;

    // Next right value is Operation and the left is Constant
    case 2:
      this.parseExpression(tree.right);
      this.createCommand(tree)(tree, this.func.body, { src: tree.left, dst: "EAX" });
      break;

    // Both left and right are Operations
    case 3:
      this.parseExpression(tree.left);

      // Get the last used reg
      let reg = this.regs.inUse.slice(-1)[0];

      // If it's undefined then use the next available one
      if (!reg) {
        reg = this.regs.available.pop();
        this.regs.inUse.push(reg);

        // Store current progress in the reg
        this.assignValue(this.func.body, { src: "EAX", dst: reg });
        this.parseExpression(tree.right);
        this.createCommand(tree)(tree, this.func.body, { src: reg, dst: "EAX" });

        this.regs.available.push(this.regs.inUse.pop());
        break;
      }

      // Else If reg is defined and in used
      this.createCommand(tree)(tree, this.func.body, { src: "EAX", dst: reg });
      this.redirect("Expression", tree.right);

      break;
  }
}

// TODO: To improve this function to receiving prev (dst) not like a simple str value
// but as an Object for better future analyzing which proc should I use...
function binaryOperation({ value }, body, { src = 0, dst = "EAX" }) {
  let { type } = src;
  src = src.value !== undefined ? src.value : src;
  dst = dst.value !== undefined ? dst.value : dst;

  switch (value) {
    case "%":
    case "/": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("EDX");
      let reg = this.regs.available[0];

      // If yes, then save data in the stack
      if (flag) body.push(`PUSH EDX`);

      body.push(`XOR EDX, EDX`);
      body.push(`MOV ${reg}, ${src}`);
      body.push(`${this.commands[value]} ${reg}`);
      if (value == "%") body.push(`MOV EAX, EDX`);

      // Get data from the stack
      if (flag) body.push(`POP EDX`);
      break;
    }

    case ">>":
    case "<<": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("ECX");

      // If yes, then save data in the stack
      if (flag) body.push(`PUSH ECX`);

      body.push(`MOV ECX, ${src}`);
      body.push(`${this.commands[value]} ${dst}, CL`);

      // Get data from the stack
      if (flag) body.push(`POP ECX`);
      break;
    }

    // TODO: Find a better solution because if this will be deferent types
    // such as str it will check not a string exactly but the address to the string
    // So I need create better solution to this for covering all sort of possibilities
    // TODO: This problem may solve the solution above, If some day I would decide to do it
    case "==":
    case ">":
    case "<":
    case ">=":
    case "<=": {
      body.push("");
      body.push(`; LOGIC "${value}"`);
      body.push(`CMP ${dst}, ${src}`);
      body.push(`${this.commands[value]} ${dst[1]}L`); // Set value only in low byte (example: "AL")
      body.push(`AND ${dst}, 0FFH`); // Save only last byte (example: "AL")
      body.push("");
      break;
    }

    case "and": {
      let reg = this.regs.available[0];
      body.push("");
      body.push("; Logic AND");
      body.push(`XOR ${reg}, ${reg}`);
      body.push(`CMP ${dst}, 00H`);
      body.push(`SETE ${reg[1]}L`);
      body.push(`DEC ${reg}`);
      body.push(`MOV ${dst}, ${src}`);
      body.push(`AND ${dst}, ${reg}`);
      body.push("");
      break;
    }

    case "or": {
      let reg = this.regs.available[0];
      body.push("");
      body.push("; Logic OR");
      body.push(`XOR ${reg}, ${reg}`);
      body.push(`CMP ${dst}, 00H`);
      body.push(`SETE ${reg[1]}L`);
      body.push(`DEC ${reg}`);
      body.push(`AND ${dst}, ${reg}`);
      body.push(`XOR ${reg}, 0FFFFFFFFH`);
      body.push(`AND ${reg}, ${src}`);
      body.push(`OR ${dst}, ${reg}`);
      body.push("");
      break;
    }
  }
}

function assignValue(body, { dst, src }) {
  switch (src.type) {
    // Check if src is defined in data then it's a variable
    // Else it's STR
    case "STR":
      body.push(this.commands.createValue.call(this, { src: src, dst: dst }));
      break;

    // TODO: Work on float  (T _ T)
    case "FLOAT":
      break;

    // INT, VAR
    default:
      body.push(`MOV ${dst}, ${src.value !== undefined ? src.value : src}`);
  }
}

// function binaryOperation(body, { value }, { src = 0, dst = "EAX" }) {
//   // let regs = this.regs.available.slice(-2);
//   // this.proc.body.push(`POP ${regs[1]}`);
//   // this.proc.body.push(`POP ${regs[0]}`);

//   switch (value) {
// TODO:
//     // case "-":
//     //   this.proc.body.push(`SUB ${regs[0]}, ${regs[1]}`);
//     //   this.proc.body.push(`PUSH ${regs[0]}`);
//     //   break;

//   }
// }

function strOperation({ value }, body, { src, dst = "EAX" }) {
  // Check if src is defined in data then it's a variable
  // Else it's STR
  if (src.type == "STR") src = this.commands.createValue.call(this, { src, prefix: "ADDR" });
  else src = src.value !== undefined ? src.value : src;

  switch (value) {
    case "+":
      // Check If allocateSpace not equal to Empty, but if so then finish
      // Operation because it useless
      if (!this.allocateFreeSpace) return;

      let name = `LOCAL${this.localCount++}`;
      this.code.data.push(`${name} db ${this.allocateFreeSpace} dup(0), 0`);
      body.push(`invoke AddSTR, ${dst}, ${src}, ADDR ${name}`);
      break;

    case "==":
      body.push(`invoke CompareSTR, ${dst}, ${src}`);
      break;
  }
}

exports.binaryOperation = binaryOperation;
exports.strOperation = strOperation;
exports.parseExpression = parseExpression;
exports.assignValue = assignValue;
