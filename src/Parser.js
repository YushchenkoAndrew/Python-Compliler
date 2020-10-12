const FUNC_DECLARATION = 0;
const VARIABLE_DECLARATION = 1;
const RETURN_DECLARATION = 2;
const BLOCK_STATE = 3;

class Parser {
  constructor(tokens) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");

    this.tokens = [...tokens];
    this.syntaxTree = {};
    this.parenthesesCounter = 0;
  }

  start() {
    this.index = 0; // Curr Index for tokens
    this.level = 0; // Define Statement Depth

    try {
      // this.syntaxTree = { type: "Program", body: [{ Declaration: this.parseDeclaration() }] };
      this.initStateMachine();

      if (this.parenthesesCounter)
        this.errorMessageHandler(`Missed ${this.parenthesesCounter > 0 ? "Closing" : "Opening"} Parentheses`, this.tokens[this.index - 1]);
    } catch (err) {
      console.log("\x1b[31m", `~ Error:\n\t${err.message}`, "\x1b[0m");
      this.syntaxTree = undefined;
      return {};
    }

    console.dir(this.syntaxTree, { depth: null });

    return this.syntaxTree;
  }

  errorMessageHandler(message, { line, char }) {
    throw Error(`${message}. Error in line ${line}, col ${char}`);
  }

  stateMachine(state) {
    switch (state) {
      case FUNC_DECLARATION:
        let func = {};
        func.name = this.parseFunc();
        this.stateMachine(BLOCK_STATE);
        // func.Statement = this.parseStatement();
        this.initStateMachine();
        break;

      case VARIABLE_DECLARATION:
        this.parseVariable();
        break;

      case RETURN_DECLARATION:
        console.log(this.parseReturn());
        break;

      case BLOCK_STATE:
        console.log("Here!!!!");
        if (this.tokens[this.index++].type != "Block") this.errorMessageHandler(`Indented Block is missing`, this.tokens[this.index - 1]);
        // this.initStateMachine();
        break;
    }
  }

  initStateMachine() {
    let { type } = this.tokens[this.index] || { type: "EOF" };
    console.log(type);

    switch (type.split(" ")[0]) {
      case "Function":
        console.log("Function", this.tokens[this.index]);
        this.stateMachine(FUNC_DECLARATION);
        break;

      case "Return":
        console.log("Return", this.tokens[this.index]);
        this.stateMachine(RETURN_DECLARATION);
        this.initStateMachine();
        break;

      case "Variable":
        console.log("Statement", this.tokens[this.index]);
        this.stateMachine(VARIABLE_DECLARATION);
        this.initStateMachine();
        break;

      case "Block":
        if (this.level) this.stateMachine(BLOCK_STATE);
        this.initStateMachine();
        break;

      case "EOF":
        break;

      default:
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.index]);
    }
  }

  checkExp({ type, line }, expected, currLine) {
    return type.includes(expected) && line == currLine;
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

  parseFunc() {
    let { line } = this.tokens[this.index];

    if (!this.checkExp(this.tokens[this.index++], "Function Keyword", line)) this.errorMessageHandler(`Start Function not define`, this.tokens[this.index - 1]);
    if (!this.checkExp(this.tokens[this.index++], "Space", line)) this.errorMessageHandler(`Start Function not define`, this.tokens[this.index - 1]);

    this.deleteSpacesInLine(line);

    let name = this.tokens[this.index++].value;

    if (!this.checkExp(this.tokens[this.index++], "Open Parentheses", line))
      this.errorMessageHandler(`Open Parentheses are missing`, this.tokens[this.index - 1]);
    // Should handle Values input!!
    if (!this.checkExp(this.tokens[this.index++], "Close Parentheses", line))
      this.errorMessageHandler(`Close Parentheses are missing`, this.tokens[this.index - 1]);

    if (!this.checkExp(this.tokens[this.index++], "Start Block", line)) this.errorMessageHandler(`Indented Block is missing`, this.tokens[this.index - 1]);
    this.level++;

    return name;
    // return { name: name, Statement: this.parseStatement() };
  }

  parseReturn() {
    // console.log(this.tokens[this.index + this.level]);

    // for (var i = this.index + this.level; i > this.index; i--) {
    //   if (this.tokens[i].type != "Block") this.level--;
    // }
    // this.index += this.level + 1;
    let { line } = this.tokens[this.index++];

    // if (this.checkExp(this.tokens[this.index++].type, "Return Keyword", line)) this.errorMessageHandler(`Return is not define`, this.tokens[this.index - 1]);
    if (!this.checkExp(this.tokens[this.index++], "Space", line)) this.errorMessageHandler(`Return is not define`, this.tokens[this.index - 1]);

    this.deleteSpacesInLine(line);

    if (!isInclude(this.tokens[this.index], "Number", "Char", "String", "Unary", "Parentheses"))
      this.errorMessageHandler(`Type error`, this.tokens[this.index - 1]);

    this.currLine = line;

    return { Expression: this.parseExpression({}) };

    // Additional func

    function isInclude({ type }, ...arr) {
      for (let i of arr) if (type.includes(i)) return true;
      return false;
    }
  }

  parseVariable() {
    // console.log(this.tokens[this.index + this.level]);

    // for (var i = this.index + this.level; i > this.index; i--) {
    //   if (this.tokens[i].type != "Block") this.level--;
    // }
    // this.index += this.level + 1;
    let { line } = this.tokens[this.index++];
    this.deleteSpacesInLine(line);

    // if (this.checkExp(this.tokens[this.index++].type, "Variable", line)) this.errorMessageHandler(``, this.tokens[this.index - 1]);
    if (!this.checkExp(this.tokens[this.index++], "Assignment", line))
      if (this.checkExp(this.tokens[this.index - 1], "Open Parentheses", line)) return this.parseFuncCaller();
      else this.errorMessageHandler(`Such syntax is not allowed`, this.tokens[this.index - 1]);

    if (!isInclude(this.tokens[this.index], "Number", "Char", "String", "Unary", "Parentheses"))
      this.errorMessageHandler(`Type error`, this.tokens[this.index - 1]);

    this.currLine = line;

    return { Expression: this.parseExpression({}) };

    // Additional func

    function isInclude({ type }, ...arr) {
      for (let i of arr) if (type.includes(i)) return true;
      return false;
    }
  }

  parseFuncCaller() {
    console.log("Hii");

    let { line } = this.tokens[this.index];

    // Should handle Values input!!
    if (!this.checkExp(this.tokens[this.index], "Close Parentheses", line))
      this.errorMessageHandler(`Close Parentheses are missing`, this.tokens[this.index - 1]);

    this.index++;
  }

  /**
   *
   * @param {*} param0
   * @param params   --   Previous param
   * @param priority --   priority is important
   * @param sign     --   is NegSign out of parentheses
   */
  parseExpression({ params = {}, priority = false, sign = false }) {
    let { type, line } = this.tokens[this.index] || { type: "", line: 0 };
    if (line != this.currLine) return params;

    switch (type.split(/\ /g)[1] || type) {
      case "String":
      case "Char":
      case "Number":
        let constant = this.parseConstExpression();
        this.prevType = this.prevType || constant.type;
        if (constant.type != this.prevType) this.errorMessageHandler(`Wrong arithmetic type`, this.tokens[this.index - 1]);

        // Check if priority is important, if not then parser next
        //    else return the const
        if (!priority) return this.parseExpression({ params: constant, sign: sign });
        else return constant;

      case "Unary":
        // Check if prev value is an another exp, if not then "-" is a Unary Operation
        //    else Binary Operation
        if (!params.type) return this.parseUnaryExpression(priority, sign);

      case "Operator":
        return this.parserOperatorExpression(params, sign);

      case "Parentheses":
        this.index++;
        // Check if it Open Parentheses, if so then check next element
        //    else if it Close, then return created value
        if (type.includes("Open")) {
          this.parenthesesCounter++;
          // Check if priority is important, if not then parser next
          //    else return the value in a Parentheses
          if (!priority) return this.parseExpression({ params: this.parseExpression({}), sign: sign });
          else return this.parseExpression({});
        } else if (!params.type) {
          this.errorMessageHandler(`Wrong arithmetic style`, this.tokens[this.index - 1]);
        } else {
          this.parenthesesCounter--;
          return params;
        }

      default:
        if (!params.type) this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.index - 1]);
    }

    // return params;
  }

  parseConstExpression() {
    let { value, type } = this.tokens[this.index++];

    // Type converting
    switch (type.split(/\ /g)[0] || type) {
      case "Bin":
        if (isNaN(parseInt(value.substr(2), 2))) break;
        return { value: `${value.substr(2)}B`, type: "INT", kind: 2 };

      case "Oct":
        if (isNaN(parseInt(value.substr(2), 8))) break;
        return { value: `${value.substr(2)}O`, type: "INT", kind: 8 };

      case "Hex":
        if (isNaN(parseInt(value.substr(2), 16))) break;
        return { value: `${value.substr(2)}H`, type: "INT", kind: 16 };

      case "Float":
        if (parseInt(value) == value) return { value: parseInt(value), type: "INT", kind: "10" };
        return { value: Number(value), type: "FLOAT" };

      case "Number":
        return { value: value, type: "INT", kind: "10" };

      case "Char":
        value = value.charCodeAt(0);
        if (isNaN(value)) break;
        return { value: value, type: "CHAR" };

      case "String":
        return { value: value, type: "STR" };
    }

    this.errorMessageHandler(`Convert Type Error`, this.tokens[this.index - 1]);
  }

  parseUnaryExpression(priority, sign) {
    let { value, type } = this.tokens[this.index++];

    if (!priority)
      return this.parseExpression({ params: { type: "Unary Operation", value: value, exp: this.parseExpression({ priority: true, sign: sign }) }, sign: sign });
    else return { type: "Unary Operation", value: value, exp: this.parseExpression({ priority: true, sign: sign }) };
  }

  parserOperatorExpression(params, sign) {
    let { value, type } = this.tokens[this.index++];

    // Check if left is not an empty Object, else it's an Error!
    if (!params.type) this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.index - 1]);

    switch (type.split(/\ /g)[0] || type) {
      case "Power":
      case "Div":
      case "Mult":
        return this.parseExpression({
          params: { type: "Binary Operation", value: value, left: params, right: this.parseExpression({ priority: true, sign: sign }) },
          sign: sign,
        });

      case "Neg":
        if (sign) value = "+";
        else sign ^= true;
        break;

      case "Add":
        if (sign) {
          value = "-";
          sign ^= true;
        }
        break;
    }

    return { type: "Binary Operation", value: value, left: params, right: this.parseExpression({ sign: sign }) };
  }

  getTree() {
    return this.syntaxTree;
  }
}

module.exports = Parser;
