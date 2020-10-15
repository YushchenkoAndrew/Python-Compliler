class Parser {
  constructor(tokens) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");
    // Input modules
    this.inputModule(require("./Expression"));
    this.inputModule(require("./Statement"));

    // Deep copy data, for remove linking
    this.tokens = JSON.parse(JSON.stringify(tokens));
    this.syntaxTree = {};
    this.parenthesesCounter = 0;
    this.prevType = undefined;

    this.line = 0; // Curr line
    this.index = 0; // Curr Index for tokens
    this.currLevel = 0; // Define Statement Depth
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start() {
    try {
      this.syntaxTree = { type: "Program", body: this.initStateMachine() };

      if (this.parenthesesCounter)
        this.errorMessageHandler(`Missed ${this.parenthesesCounter > 0 ? "Closing" : "Opening"} Parentheses`, this.tokens[this.index - 1]);
    } catch (err) {
      console.log("\x1b[31m", `~ Error:\n\t${err.message}`, "\x1b[0m");
      this.syntaxTree = undefined;
      return {};
    }

    console.log();
    console.dir(this.syntaxTree, { depth: null });

    return this.syntaxTree;
  }

  errorMessageHandler(message, { line, char }) {
    throw Error(`${message}. Error in line ${line + 1}, col ${char + 1}`);
  }

  // TODO: Create an Object of current body for searching some variables and functions

  initStateMachine(level = 0, forcedBlock = false) {
    let { type } = this.tokens[this.line][this.index] || { type: this.tokens[this.line + 1] ? "NEXT" : "EOF" };
    this.prevType = undefined;

    switch (type.split(" ")[0]) {
      case "Function":
        console.log(`FUNCTION: LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return [];
        this.currLevel++;
        this.index++;

        let func = { type: "FUNC", ...this.parseFunc(), body: [...this.initStateMachine(level + 1, true)] };
        // console.dir(func, { depth: null });
        return [{ Declaration: func }, ...this.initStateMachine(level)];

      case "Pass":
      case "Return":
        console.log(`RETURN:   LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return [];
        this.index++;
        return [{ Statement: this.parseReturn() }, ...this.initStateMachine(level)];

      case "Variable":
        console.log(`VARIABLE: LEVEL ${level}`, this.tokens[this.line][this.index]);
        if (!checkLevel.call(this, level, forcedBlock)) return [];
        this.index++;
        return [{ Statement: this.parseVariable() }, ...this.initStateMachine(level)];

      case "Block":
        console.log(`BLOCK: \t  LEVEL ${level}`);
        this.index++;
        return this.initStateMachine(level + 1, forcedBlock);

      case "NEXT":
        this.line++;
        this.index = 0;
        return this.initStateMachine(0, forcedBlock);

      case "EOF":
        return [];

      default:
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);
    }

    // Addition Functions
    function checkLevel(level, force) {
      if (this.currLevel - level < 0 || (force && this.currLevel != level)) this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);

      if (this.currLevel - level != 0) {
        console.log(`CHANGE LEVEL FROM ${this.currLevel} TO ${level}`);
        this.currLevel = level;
        return false;
      }

      return true;
    }
  }

  isInclude(type, ...arr) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }

  getTree() {
    return this.syntaxTree;
  }
}

module.exports = Parser;
