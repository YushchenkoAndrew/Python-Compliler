// exception is an array of command that need two or more line for realization its logic
var exception = ["-", "/", "%", "<<", ">>", "==", ">=", "<=", ">", "<", "or", "and"];

exports.INT = {
  "+": "ADD",
  "-": "SUB",
  "*": "IMUL",
  "/": "IDIV",
  "%": "IDIV",
  "&": "AND",
  "|": "OR",
  "^": "XOR",
  "<<": "SAL",
  ">>": "SAR",
  "==": "SETE",
  ">": "SETG",
  "<": "SETL",
  ">=": "SELGE",
  "<=": "SETLE",

  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    if (this.isInclude(value, ...exception)) return this.binaryOperation;
    return ({ value }, body, { src, dst = "EAX" }) => body.push(`${this.commands[value]} ${dst}, ${src.value || src}`);
  },

  assignValue(body, { dst, src }) {
    src = src.value || src;
    body.push(`MOV ${dst}, ${src}`);
  },
};

// TODO:
exports.FLOAT = {
  "+": "FADD",
  "-": "FSUB",
  "*": "FMUL",
  "/": "FDIV",

  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    return ({ value }, body, { src, dst = "EAX" }) => body.push(`${this.commands[value]} ${dst}, ${src}`);
  },

  assignValue() {},
};

exports.STR = {
  // This method should be called like a part of CodeGenerator Class
  createCommand() {
    return this.strOperation;
  },

  assignValue(body, { dst, src }) {
    // Check if src is defined in data then it's a variable
    // Else it's STR
    if (src.type == "STR") {
      let name = `LOCAL${this.localCount++}`;
      this.code.data.push(`${name} db "${src.value}", 0`);
      this.func.body.push(`LEA EAX, ${name}`);
    } else body.push(`MOV ${dst}, ${src}`);
  },
};
