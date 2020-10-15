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
    this.currLevel = {
      level: 0, // Define Statement Depth
      header: [], // Put created upper head variables in header
      body: [],
    };
  }

  inputModule(mod) {
    for (let key in mod) this[key] = mod[key].bind(this);
  }

  start() {
    try {
      this.initStateMachine();

      if (this.parenthesesCounter)
        this.errorMessageHandler(`Missed ${this.parenthesesCounter > 0 ? "Closing" : "Opening"} Parentheses`, this.tokens[this.index - 1]);
    } catch (err) {
      console.log("\x1b[31m", `~ Error:\n\t${err.message}`, "\x1b[0m");
      this.syntaxTree = undefined;
      return {};
    }

    this.syntaxTree = { type: "Program", body: this.currLevel.body };

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

        if (!checkLevel.call(this, level, forcedBlock)) return;
        this.index++;
        this.currLevel.level++;
        this.currLevel.body.push({ Declaration: { type: "FUNC", ...this.parseFunc() } });

        // Save previous data
        let header = JSON.parse(JSON.stringify(this.currLevel.header));
        let body = JSON.parse(JSON.stringify(this.currLevel.body));

        // TODO: Not the best solution, have some issues
        // Put created upper head variables in header
        this.currLevel.header.push(...this.currLevel.body);
        this.currLevel.body = [];

        // Function this.initStateMachine will always return the undefined state, so I decided to write in such way
        //  because it's much compact solution, that means that the body value will be this.currLevel.body()
        body.slice(-1)[0].Declaration.body = this.initStateMachine(level + 1, true) || this.currLevel.body;

        this.currLevel.level--;
        this.currLevel.header = header;
        this.currLevel.body = body;
        break;

      case "Pass":
      case "Return":
        console.log(`RETURN:   LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!checkLevel.call(this, level, forcedBlock)) return;
        this.index++;
        this.currLevel.body.push({ Statement: this.parseReturn() });
        break;

      case "Variable":
        console.log(`VARIABLE: LEVEL ${level}`, this.tokens[this.line][this.index]);
        if (!checkLevel.call(this, level, forcedBlock)) return;
        this.index++;
        this.currLevel.body.push({ Statement: this.parseVariable() });
        break;

      case "Block":
        console.log(`BLOCK: \t  LEVEL ${level}`);
        this.index++;
        this.initStateMachine(level + 1, forcedBlock);
        return;

      case "NEXT":
        this.line++;
        this.index = 0;
        this.initStateMachine(0, forcedBlock);
        return;

      case "EOF":
        return;

      default:
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);
    }

    this.initStateMachine(level);

    //
    // Addition Functions
    //
    function checkLevel(level, force) {
      if (this.currLevel.level - level < 0 || (force && this.currLevel.level != level))
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);

      if (this.currLevel.level - level != 0) {
        console.log(`CHANGE LEVEL FROM ${this.currLevel.level} TO ${level}`);
        // this.currLevel.level = level;
        return false;
      }

      return true;
    }
  }

  isInclude(type, ...arr) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }

  getDefinedToken(type, key, value, { body = [], header = [] }) {
    // Get all data that already defined
    let defined = [...body, ...header];

    // Check if variable is defined in the body or in the header (in the prev level)
    let index = defined.map((obj) => obj[type] && obj[type][key]).lastIndexOf(value);

    // If the variables is not defined then throw an Error
    if (index == -1) this.errorMessageHandler(`Variable ${value} is not defined`, this.tokens[this.line][this.index - 1]);

    return defined[index][type];
  }

  getTree() {
    return this.syntaxTree;
  }
}

module.exports = Parser;
