// exception is an array of command that need two or more line for realization its logic
var exception = ["-", "/", "%", "<<", ">>", "==", ">=", "<=", ">", "<", "or", "and"];

exports.INT = {
  // Allowed operations Symbols and it synonym for Assembler
  "+": "ADD ",
  "-": "SUB ",
  "*": "IMUL ",
  "/": "IDIV ",
  "%": "IDIV ",
  "&": "AND ",
  "|": "OR ",
  "^": "XOR ",
  "<<": "SAL",
  ">>": "SAR",
  "==": "SETE ",
  ">": "SETG ",
  "<": "SETL ",
  ">=": "SELGE ",
  "<=": "SETLE ",

  // TODO: Think how to insert unary Operation Checker
  // This method should be called like a part of CodeGenerator Class
  createCommand({ value, right, left }) {
    if (this.isInclude(value, ...exception)) return this.binaryOperation;
    return ({ value }, body, { src, dst = "EAX" }) => body.push(`${this.commands[value]}${dst},\ ${src.value || src}`);
  },

  swap(body, { src, dst }) {
    body.push(`MOV ${dst}, ${src}`);
  },
};

// TODO:
exports.FLOAT = {
  // Allowed operations Symbols and it synonym for Assembler
  "+": "FADD ",
  "-": "FSUB ",
  "*": "FMUL ",
  "/": "FDIV ",

  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    return ({ value }, body, { src }) => {
      // Get the name of GLOBAL variable that contain src value, or return src if it's a reg
      src = src.value ? this.masmCommands.FLOAT.createValue.call(this, { src: src }) : src;

      // Check if src is a local variable or a reg_name, if src == reg_name
      // that means that at the current moment it's perform a swap
      if (!src.includes("LOCAL")) body.push(`${this.commands[value]}st(0), st(1)`);
      else body.push(`${this.commands[value]}${src}`);
    };
  },

  createValue({ src, dst }) {
    // This simply create a local variable is demand of
    // And return the name of created variable
    let name = `LOCAL${this.globalCount++}`;
    this.code.data.push(`${name}\ dd\ ${src.value + (src.type == "INT" ? "." : "")}`);
    return name;
  },

  swap() {},
};

exports.STR = {
  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    if (this.isInclude(value, "or", "and")) return this.binaryOperation;
    return this.strOperation;
  },

  createValue({ src, prefix = "", dst = "" }) {
    // Check if str is not empty but if so then return a zero
    if (!src.length) return dst ? `MOV\ ${dst},\ 00H` : "00H";

    // This simply create a local variable is demand of
    // And return the name of created variable
    let name = `LOCAL${this.globalCount++}`;
    this.code.data.push(`${name}\ db\ "${src.value}",\ 0`);
    return dst ? `LEA\ ${dst},\ ${name}` : `${prefix}${name}`;
  },

  swap() {},
};
