function parseExpression(tree) {
  let state = tree.left.type.includes("Operation") + tree.right.type.includes("Operation") * 2;

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

function binaryOperation({ value }, body, { src = 0, dst = "EAX" }) {
  src = src.value || src;
  dst = dst.value || dst;

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

    // TODO: Create this based on type ???
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
  if (src.type == "STR") {
    let name = `LOCAL${this.localCount++}`;
    this.code.data.push(`${name} db "${src.value}", 0`);
    src = `ADDR ${name}`;
  } else src = src.value || src;

  // TODO: Set appropriate size for new STR
  let name = `LOCAL${this.localCount++}`;
  this.code.data.push(`${name} db ${this.allocateFreeSpace} dup(0), 0`);

  switch (value) {
    case "+":
      body.push(`invoke AddSTR, ${dst}, ${src}, ADDR ${name}`);
      body.push(`LEA ${dst}, ${name}`);
      break;
  }
}

exports.binaryOperation = binaryOperation;
exports.strOperation = strOperation;
exports.parseExpression = parseExpression;
