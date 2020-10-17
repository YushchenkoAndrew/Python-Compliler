function binaryOperation({ value }) {
  let regs = this.regs.available.slice(-2);
  this.proc.body.push(`POP ${regs[1]}`);
  this.proc.body.push(`POP ${regs[0]}`);

  switch (value) {
    case "-":
      this.proc.body.push(`SUB ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "+":
      this.proc.body.push(`ADD ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "*":
      this.proc.body.push(`MOV EAX, ${regs[0]}`);
      this.proc.body.push(`MUL ${regs[1]}`);
      this.proc.body.push(`PUSH EAX`);
      break;

    // TODO: Check if reg EDX is save to use
    case "/":
      this.proc.body.push(`MOV EAX, ${regs[0]}`);
      this.proc.body.push(`XOR EDX, EDX`);
      this.proc.body.push(`DIV ${regs[1]}`);
      this.proc.body.push(`PUSH EAX`);
      break;

    // TODO: Check if reg EDX is save to use
    case "%":
      this.proc.body.push(`MOV EAX, ${regs[0]}`);
      this.proc.body.push(`XOR EDX, EDX`);
      this.proc.body.push(`DIV ${regs[1]}`);
      this.proc.body.push(`PUSH EDX`);
      break;

    case "&":
      this.proc.body.push(`AND ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "|":
      this.proc.body.push(`OR ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "^":
      this.proc.body.push(`XOR ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case ">>":
      this.proc.body.push(`SAR ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "<<":
      this.proc.body.push(`SAL ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    // TODO: Check if reg EDX is save to use
    case "and":
      this.proc.body.push(`XOR EDX, EDX`);
      this.proc.body.push(`CMP ${regs[0]}, 00H`);
      this.proc.body.push(`SETE DL`);
      this.proc.body.push(`DEC EDX`);
      this.proc.body.push(`AND ${regs[1]}, EDX`);
      this.proc.body.push(`PUSH ${regs[1]}`);
      break;

    // TODO: Check if reg EDX is save to use
    case "or":
      this.proc.body.push(`XOR EDX, EDX`);
      this.proc.body.push(`CMP ${regs[0]}, 00H`);
      this.proc.body.push(`SETE DL`);
      this.proc.body.push(`DEC EDX`);
      this.proc.body.push(`AND ${regs[0]}, EDX`);
      this.proc.body.push(`XOR EDX, 0FFFFFFFFH`);
      this.proc.body.push(`AND ${regs[1]}, EDX`);
      this.proc.body.push(`OR ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "==":
      this.proc.body.push(`CMP ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`SETE ${regs[0][1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${regs[0]}, 0FFH`); // Save only last byte (example: "AL")
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case ">":
      this.proc.body.push(`CMP ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`SETG ${regs[0][1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${regs[0]}, 0FFH`); // Save only last byte (example: "AL")
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case ">=":
      this.proc.body.push(`CMP ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`SETGE ${regs[0][1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${regs[0]}, 0FFH`); // Save only last byte (example: "AL")
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "<":
      this.proc.body.push(`CMP ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`SETL ${regs[0][1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${regs[0]}, 0FFH`); // Save only last byte (example: "AL")
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;

    case "<=":
      this.proc.body.push(`CMP ${regs[0]}, ${regs[1]}`);
      this.proc.body.push(`SETLE ${regs[0][1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${regs[0]}, 0FFH`); // Save only last byte (example: "AL")
      this.proc.body.push(`PUSH ${regs[0]}`);
      break;
  }
}

function unaryOperation({ value }) {
  // console.log({ type: type, value: value });
  let reg = this.regs.available.slice(-1)[0];
  this.proc.body.push(`POP ${reg}`);

  switch (value) {
    case "-":
      this.proc.body.push(`NEG ${reg}`);
      break;

    case "~":
      this.proc.body.push(`XOR ${reg}, 0FFFFFFFFH`);
      break;

    case "not":
      this.proc.body.push(`CMP ${reg}, 00H`);
      this.proc.body.push(`SETE ${reg[1]}L`); // Set value only in low byte (example: "AL")
      this.proc.body.push(`AND ${reg}, 0FFH`); // Save only last byte (example: "AL")
      break;
  }

  this.proc.body.push(`PUSH ${reg}`);
}

exports.binaryOperation = binaryOperation;
exports.unaryOperation = unaryOperation;
