function parseExpression(tree, params = {}) {
  let state = getState("type", "Binary Operation", tree, "left", "right");
  let body = this.func.body;

  switch (state) {
    // Next left and right values a Constant
    case 0:
      // Save first input const in reg EAX
      this.assignValue(body, { src: tree.left, dst: "EAX" }, params);
      analyzeParams.call(this, "src", tree, body, { src: tree.right });
      break;

    // Next Left value is Operation and the right is Constant
    case 1:
      this.parseExpression(tree.left, params);
      analyzeParams.call(this, "src", tree, body, { src: tree.right });
      break;

    // Next right value is Operation and the left is Constant
    case 2:
      this.parseExpression(tree.right, params);
      analyzeParams.call(this, "src", tree, body, { src: tree.left });
      break;

    // Both left and right are Operations
    case 3:
      this.parseExpression(tree.left, params);

      // Get the last used reg
      let reg = this.regs.inUse.slice(-1)[0];

      // If it's undefined then use the next available one
      if (!reg) {
        reg = this.regs.available.pop();
        this.regs.inUse.push(reg);

        // Store current progress in the reg
        this.assignValue(body, { src: "EAX", dst: reg });
        this.parseExpression(tree.right, params);
        this.createCommand(tree)(tree, body, { src: reg, dst: "EAX" });

        this.regs.available.push(this.regs.inUse.pop());
        break;
      }

      // Else If reg is defined and in used
      this.createCommand(tree)(tree, body, { src: "EAX", dst: reg });
      this.redirect("Expression", tree.right, params);

      break;
  }

  function getState(type, value, obj, ...keys) {
    let state = 0;
    let pow2 = 1;
    for (let key of keys) {
      state += obj[key] ? obj[key][type].includes(value) * pow2 : 0;
      pow2 <<= 1;
    }
    return state;
  }

  function analyzeParams(key, tree, body, params) {
    // Check on Unary Operation
    if (this.isInclude(params[key].type, "Unary")) {
      this.assignValue(body, { src: params[key], dst: "EDX" });
      params[key] = "EDX";
    }

    this.createCommand(tree)(tree, body, params);
  }
}

// TODO: To improve this function to receiving prev (dst) not like a simple str value
// but as an Object for better future analyzing which proc should I use...
function binaryOperation({ value }, body, { src = 0, dst = "EAX" }) {
  src = src.value !== undefined ? src.value : src;
  dst = dst.value !== undefined ? dst.value : dst;

  switch (value) {
    case "-":
      //     //   this.proc.body.push(`SUB ${regs[0]}, ${regs[1]}`);
      //     //   this.proc.body.push(`PUSH ${regs[0]}`);
      //     //   break;
      break;

    case "%":
    case "/": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("EDX");
      let reg = this.regs.available[0];

      // If yes, then save data in the stack
      if (flag) body.push(`PUSH\ EDX`);

      body.push(`XOR\ EDX,\ EDX`);
      body.push(`MOV\ ${reg},\ ${src}`);
      body.push(`${this.commands[value]}${reg}`);
      if (value == "%") body.push(`MOV\ EAX,\ EDX`);

      // Get data from the stack
      if (flag) body.push(`POP\ EDX`);
      break;
    }

    case ">>":
    case "<<": {
      // Check if reg EDX contained any data
      let flag = this.regs.inUse.includes("ECX");

      // If yes, then save data in the stack
      if (flag) body.push(`PUSH\ ECX`);

      body.push(`MOV\ ECX,\ ${src}`);
      body.push(`${this.commands[value]}${dst},\ CL`);

      // Get data from the stack
      if (flag) body.push(`POP\ ECX`);
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
      body.push(`;\ LOGIC\ "${value}\"\ `);
      body.push(`CMP\ ${dst},\ ${src}`);
      body.push(`${this.commands[value]}${dst[1]}L`); // Set value only in low byte (example: "AL")
      body.push(`AND\ ${dst},\ 0FFH`); // Save only last byte (example: "AL")
      body.push("");
      break;
    }

    case "and": {
      let reg = this.regs.available[0];
      body.push("");
      body.push("; Logic AND");
      body.push(`XOR\ ${reg},\ ${reg}`);
      body.push(`CMP\ ${dst},\ 00H`);
      body.push(`SETE\ ${reg[1]}L`);
      body.push(`DEC\ ${reg}`);
      body.push(`MOV\ ${dst},\ ${src}`);
      body.push(`AND\ ${dst},\ ${reg}`);
      body.push("");
      break;
    }

    case "or": {
      let reg = this.regs.available[0];
      body.push("");
      body.push("; Logic OR");
      body.push(`XOR\ ${reg},\ ${reg}`);
      body.push(`CMP\ ${dst},\ 00H`);
      body.push(`SETE\ ${reg[1]}L`);
      body.push(`DEC\ ${reg}`);
      body.push(`AND\ ${dst},\ ${reg}`);
      body.push(`XOR\ ${reg},\ 0FFFFFFFFH`);
      body.push(`AND\ ${reg},\ ${src}`);
      body.push(`OR\ ${dst},\ ${reg}`);
      body.push("");
      break;
    }
  }
}

function unaryOperation({ value }, body, dst) {
  switch (value) {
    case "-":
      // Create neg depends on type
      body.push(this.commands.neg(dst));
      break;

    case "~":
      body.push(`XOR\ ${dst},\ 0FFFFFFFFH`);
      break;

    case "not":
      body.push(`CMP\ ${dst},\ 00H`);
      body.push(`SETE\ ${dst[1]}L`); // Set value only in low byte (example: "AL")
      body.push(`AND\ ${dst},\ 0FFH`); // Save only last byte (example: "AL")

      // Change type and createCommand from "ANY" to INT
      this.commands = this.masmCommands.INT;
      this.createCommand = this.commands.createCommand.bind(this);
      break;
  }
}

/**
 *
 * @param {*} body   - An array where created commands should append
 * @param {*} obj    - Contain Source (can be an Obj or a reg_name) and Destination
 *                     (can be an Obj or a reg_name)
 * @param {*} params - This arg only needs when Unary operation suddenly
 *                     need to parse Binary Operation
 */
function assignValue(body, { dst, src }, params = {}) {
  let isFloat = (params) => params.defined && params.defined.type == "FLOAT";

  switch (src.type) {
    // Check if src is defined in data then it's a variable
    // Else it's STR
    case "STR":
      // Initialize STR as a GLOBAL variable in ASM
      body.push(this.masmCommands.STR.createValue.call(this, { src: src, dst: dst.value || dst }));

      // If dst is a LOCAL variable after all, then mov
      // defined address from reg (reg_name = dst.value) to LOCAL variable
      if (dst.var) body.push(`MOV ${dst.var}, ${dst.value}`);
      break;

    case "INT":
      // Check if the value expected to be a FLOAT but it's an INT value
      // by default, then just go to next step
      if (!isFloat(params)) {
        // Check if dst is a variable, if no then dst should be a reg_name
        body.push(`MOV ${dst.var || dst}, ${src.value !== undefined ? src.value : src}`);
        break;
      }

    case "VAR":
      if (!isFloat(params)) {
        // Check if dst is a variable if so then write data to the reg
        // and then write down it to the variable
        body.push(`MOV ${dst.value || dst}, ${src.value !== undefined ? src.value : src}`);
        if (dst.var) body.push(`MOV ${dst.var}, EAX`);
        break;
      }

    // TODO: Think about transformation from INT to FLOAT if value contains in variable
    // or reg
    case "FLOAT":
      // Initialize FLOAT as a GLOBAL variable in ASM
      src = this.masmCommands.FLOAT.createValue.call(this, { src: src, dst: dst });
      if (!src) break;

      if (dst.var) {
        body.push(`LEA ${dst.value},\ ${src}`);
        body.push(`MOV ${dst.var},\ ${dst.value}`);
      } else body.push(`FLD ${src}`);

      break;

    // Check if it suddenly an Unary Operation
    // Then go deeper to a level
    case "Unary Operation":
      // Check if dst is a variable then in dst.value == reg_name
      // if dst is not an object that it's a reg_name

      // TODO: Find better solution to the bug "return not -b + 2 and 5" -> "(not (-b + 2)) and 5"
      // In this example first runs and "Binary Operation" and not the "Unary Operation" (T o T)
      params.defined = params.defined || dst.defined || { type: "INT", kind: 10 };

      this.assignValue(body, { dst: dst.value || dst, src: src.exp }, JSON.parse(JSON.stringify(params)));
      this.unaryOperation(src, body, dst.value || dst);
      if (dst.var) body.push(this.commands.setValue({ src: "EAX", dst: dst.var }));
      // body.push(dst.defined.type == "FLOAT" ? `FST ${dst.var}` : `MOV ${dst.var}, EAX`);
      break;

    // This state only needs when after low Priority Unary Operation
    // Suddenly comes the binary operations, so I just redirect it
    // to func that handle that binary operations and constant assignment
    case "Binary Operation":
      params.value = undefined;

      // Here I add new key "type" = "SAVE" that needs for temporal
      // Saving calculated value in a variable
      this.redirect("Expression", src, { ...params, type: "SAVE" });
      break;

    // If src.type == undefined that mean that src == reg_name, so in this
    // situation just simply mov src to dst
    default:
      this.commands.swap(body, { src: src, dst: dst });
  }
}

function strOperation({ value }, body, { src, dst = "EAX" }) {
  // Check if src is defined in data then it's a variable
  // Else it's STR
  if (src.type == "STR") src = this.commands.createValue.call(this, { src, prefix: "ADDR " });
  else src = src.value !== undefined ? src.value : src;

  switch (value) {
    case "+":
      // Check If allocateSpace not equal to Empty, but if so then finish
      // Operation because it useless
      if (!this.allocateFreeSpace) return;

      let name = `LOCAL${this.localCount++}`;
      this.code.data.push(`${name}\ db\ ${this.allocateFreeSpace}\ dup(0),\ 0`);
      body.push(`invoke\ AddSTR,\ ${dst},\ ${src},\ ADDR\ ${name}`);
      break;

    case "==":
      body.push(`invoke\ CompareSTR,\ ${dst},\ ${src}`);
      break;
  }
}

exports.binaryOperation = binaryOperation;
exports.unaryOperation = unaryOperation;
exports.strOperation = strOperation;
exports.parseExpression = parseExpression;
exports.assignValue = assignValue;
