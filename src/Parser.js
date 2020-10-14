class Parser {
  constructor(tokens) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");
    // Input modules
    this.inputModule(require("./Expression"));
    this.inputModule(require("./Statement"));

    this.tokens = [...tokens];
    this.syntaxTree = {};
    this.parenthesesCounter = 0;
    this.currLevel = 0;
    this.prevType = undefined;
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start() {
    this.index = 0; // Curr Index for tokens
    this.level = 0; // Define Statement Depth

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
    throw Error(`${message}. Error in line ${line}, col ${char}`);
  }

  initStateMachine(level = 0, prevLine = 0, forcedBlock = false) {
    let { type, line } = this.tokens[this.index] || { type: "EOF", line: -1 };

    switch (type.split(" ")[0]) {
      case "Function":
        console.log(`FUNCTION: PREV ${prevLine} L ${line} LEVEL ${level}`, this.tokens[this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return [];
        this.currLevel++;

        let func = { type: "FUNC", ...this.parseFunc(), body: [...this.initStateMachine(level + 1, this.tokens[this.index - 1].line, true)] };
        return [{ Declaration: func }, ...this.initStateMachine(level, (this.tokens[this.index] || {}).line)];

      case "Return":
        console.log(`RETURN:   PREV ${prevLine} L ${line} LEVEL ${level}`, this.tokens[this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return [];
        return [{ Statement: this.parseReturn() }, ...this.initStateMachine(0, line)];

      case "Variable":
        // console.log(`VARIABLE: PREV ${prevLine} L ${line} LEVEL ${level}`, this.tokens[this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return [];
        return [{ Statement: this.parseVariable() }, ...this.initStateMachine(0, line)];

      case "Block":
        level = prevLine == line ? level : 0;
        // console.log(`BLOCK: \t  PREV ${prevLine} L ${line} LEVEL ${level}`);

        this.index++;
        return this.initStateMachine(level + 1, line, forcedBlock);

      case "EOF":
        return [];

      default:
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.index]);
    }

    // Addition Functions
    function checkLevel(level, force) {
      if (this.currLevel - level < 0 || (force && this.currLevel != level)) this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.index]);

      if (this.currLevel - level != 0) {
        console.log(`CHANGE LEVEL FROM ${this.currLevel} TO ${level}`);
        this.currLevel = level;
        return false;
      }

      return true;
    }
  }

  deleteSpacesInLine(currLine) {
    let i = this.index;
    let { line } = this.tokens[i];

    while (line == currLine) {
      let { type } = this.tokens[i];

      if (type == "Space") this.tokens.splice(i, 1);
      else i++;

      // line + 1  --  for handling file end
      line = this.tokens[i] ? this.tokens[i].line : line + 1;
    }
  }
  getTree() {
    return this.syntaxTree;
  }
}

module.exports = Parser;
