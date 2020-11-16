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
  ">=": "SETGE ",
  "<=": "SETLE ",

  // This method should be called like a part of CodeGenerator Class
  createCommand({ value, right, left }) {
    if (this.isInclude(value, ...exception)) return this.binaryOperation;
    return ({ value }, body, { src, dst = "EAX" }) => body.push(`${this.commands[value]}${dst},\ ${src.value || src}`);
  },

  swap(body, { src, dst }) {
    body.push(`MOV ${dst}, ${src}`);
  },

  setValue({ dst, src }) {
    return `MOV ${dst}, ${src}`;
  },

  neg: (dst) => `NEG\ ${dst}`,
};

exports.FLOAT = {
  // Allowed operations Symbols and it synonym for Assembler
  "+": "FADD ",
  "-": "FSUB ",
  "*": "FMUL ",
  "/": "FDIV ",

  stackIndex: 1,

  // TODO: Implement Logic Operations such as "OR", "AND", "==", ">", "<"...
  // This method should be called like a part of CodeGenerator Class
  createCommand({ value }) {
    return ({ value }, body, { src }) => {
      // Get the name of GLOBAL variable that contain src value, or return src if it's a reg
      src = src.value ? this.masmCommands.FLOAT.createValue.call(this, { src: src }) : src;

      // Check if src is a local variable or a reg_name, if src == reg_name
      // that means that at the current moment it's perform a swap
      //
      // this.commands.stackIndex point at the FPU Stack where located previously
      //  calculated Result
      if (this.isEqual(src, "EAX", "EBX", "ECX", "EDX") || !src) body.push(`${this.commands[value]}st(0), st(${this.commands.stackIndex++})`);
      else body.push(`${this.commands[value]}${src}`);
    };
  },

  createValue({ src = {} }) {
    // This simply create a local variable is demand of
    // And return the name of created variable
    let name = `LOCAL${this.globalCount}`;

    // Reset FPU Stack Index, stackIndex = 1, that means that
    // the next value with which you need to do some operation
    // located at the st(1)
    this.commands.stackIndex = 1;

    switch (src.type) {
      case "INT":
        this.code.data.push(`${name}\ dd\ ${src.value + "."}`);
        break;

      case "FLOAT":
        this.code.data.push(`${name}\ dd\ ${src.value}`);
        break;

      case "VAR":
        if (src.defined.type != "INT") return src.value;

        this.func.body.push("");
        this.func.body.push("; Transform INT -> FLOAT");
        this.func.body.push(`FILD ${src.value}`);
        return "";

      case "FUNC_CALL":
        this.code.data.push(`${name}\ dd ?`);
        this.func.body.push(`MOV ${name}, EAX`);
        if (src.defined.type != "INT") this.func.body.push(`FLD\ ${name}`);
        else this.func.body.push(`FILD\ ${name}`);
        break;

      default:
        this.code.data.push(`${name}\ dd ?`);
        break;
    }

    this.globalCount++;
    return name;
  },

  swap() {},

  setValue({ dst }) {
    return `FST ${dst}`;
  },

  neg: () => "FCHS",
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

  setValue({ dst, src }) {
    return `MOV ${dst}, ${src}`;
  },

  unaryOperation() {},
};
