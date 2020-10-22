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
    return ({ value }, { src, dst = "EAX" }) => console.log(`${this.commands[value]} ${dst}, ${src}`);
  },
};

exports.FLOAT = {
  "+": "FADD",
  "-": "FSUB",
  "*": "FMUL",
  "/": "FDIV",

  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    return ({ value }, { src, dst = "EAX" }) => console.log(`${this.commands[value]} ${dst}, ${src}`);
  },
};

exports.STR = {
  // This method should be called like a part of CodeGenerator Class
  createCommand() {
    return this.strOperation;
  },
};
