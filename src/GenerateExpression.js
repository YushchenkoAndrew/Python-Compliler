function parseExpression(tree) {
  let state = tree.left.type.includes("Operation") + tree.right.type.includes("Operation") * 2;

  switch (state) {
    // Next left and right values a Constant
    case 0:
      // Save first input const in reg EAX
      console.log(`MOV EAX, ${tree.left.value}`);
      this.createCommand(tree)(tree, { src: tree.right.value });
      break;

    // Next Left value is Operation and the right is Constant
    case 1:
      this.parseExpression(tree.left);
      this.createCommand(tree)(tree, { src: tree.right.value });
      break;

    // Next right value is Operation and the left is Constant
    case 2:
      this.parseExpression(tree.right);
      this.createCommand(tree)(tree, { src: tree.left.value, dst: "EAX" });
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
        console.log(`MOV ${reg}, EAX`);
        this.parseExpression(tree.right);
        this.createCommand(tree)(tree, { src: reg, dst: "EAX" });

        this.regs.available.push(this.regs.inUse.pop());
        break;
      }

      // Else If reg is defined and in used
      this.createCommand(tree)(tree, { src: "EAX", dst: reg });
      this.redirect("Expression", tree.right);

      break;
  }
}

function binaryOperation({ value }, { src = 0, dst = "EAX" }) {
  switch (value) {
    case "%":
    case "/": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("EDX");
      let reg = this.regs.available[0];

      // If yes, then save data in the stack
      if (flag) console.log(`PUSH EDX`);

      console.log(`XOR EDX, EDX`);
      console.log(`MOV ${reg}, ${src}`);
      console.log(`${this.commands[value]} ${reg}`);
      if (value == "%") console.log(`MOV EAX, EDX`);

      // Get data from the stack
      if (flag) console.log(`POP EDX`);
      break;
    }

    case ">>":
    case "<<": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("ECX");

      // If yes, then save data in the stack
      if (flag) console.log(`PUSH ECX`);

      console.log(`MOV ECX, ${src}`);
      console.log(`${this.commands[value]} ${dst}, CL`);

      // Get data from the stack
      if (flag) console.log(`POP ECX`);
      break;
    }

    case "==":
    case ">":
    case "<":
    case ">=":
    case "<=": {
      console.log(`; LOGIC "${value}"`);
      console.log(`CMP ${dst}, ${src}`);
      console.log(`${this.commands[value]} ${dst[1]}L`); // Set value only in low byte (example: "AL")
      console.log(`AND ${dst}, 0FFH`); // Save only last byte (example: "AL")
      break;
    }

    // TODO: Think about better solution...
    case "and": {
      let reg = this.regs.available[0];
      console.log("; Logic AND");
      console.log(`XOR ${reg}, ${reg}`);
      console.log(`CMP ${dst}, 00H`);
      console.log(`SETE ${reg[1]}L`);
      console.log(`DEC ${reg}`);
      console.log(`MOV ${dst}, ${src}`);
      console.log(`AND ${dst}, ${reg}`);
      break;
    }

    case "or": {
      let reg = this.regs.available[0];
      console.log("; Logic OR");
      console.log(`XOR ${reg}, ${reg}`);
      console.log(`CMP ${dst}, 00H`);
      console.log(`SETE ${reg[1]}L`);
      console.log(`DEC ${reg}`);
      console.log(`AND ${dst}, ${reg}`);
      console.log(`XOR ${reg}, 0FFFFFFFFH`);
      console.log(`AND ${reg}, ${src}`);
      console.log(`OR ${dst}, ${reg}`);
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

//     // // TODO: Check if reg EDX is save to use
//     // case "and":
//     //   this.proc.body.push(`XOR EDX, EDX`);
//     //   this.proc.body.push(`CMP ${regs[0]}, 00H`);
//     //   this.proc.body.push(`SETE DL`);
//     //   this.proc.body.push(`DEC EDX`);
//     //   this.proc.body.push(`AND ${regs[1]}, EDX`);
//     //   this.proc.body.push(`PUSH ${regs[1]}`);
//     //   break;

//     // // TODO: Check if reg EDX is save to use
//     // case "or":
//     //   this.proc.body.push(`XOR EDX, EDX`);
//     //   this.proc.body.push(`CMP ${regs[0]}, 00H`);
//     //   this.proc.body.push(`SETE DL`);
//     //   this.proc.body.push(`DEC EDX`);
//     //   this.proc.body.push(`AND ${regs[0]}, EDX`);
//     //   this.proc.body.push(`XOR EDX, 0FFFFFFFFH`);
//     //   this.proc.body.push(`AND ${regs[1]}, EDX`);
//     //   this.proc.body.push(`OR ${regs[0]}, ${regs[1]}`);
//     //   this.proc.body.push(`PUSH ${regs[0]}`);
//     //   break;

//   }
// }

function strOperation() {}

exports.binaryOperation = binaryOperation;
exports.strOperation = strOperation;
exports.parseExpression = parseExpression;
