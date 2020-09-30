class Parser {
  constructor(tokens) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");

    this.tokens = [...tokens];
    this.syntaxTree = {};
  }

  startParser() {
    this.index = 0; // Curr Index for tokens
    this.level = 0; // Define Statement Depth

    try {
      this.syntaxTree = { type: "Program", body: [{ Declaration: this.parseDeclaration() }] };
    } catch (err) {
      console.log("\x1b[31m", `~ Error:\n\t${err.message}`, "\x1b[0m");
      this.syntaxTree = undefined;
      return {};
    }

    console.dir(this.syntaxTree, { depth: null });

    return this.syntaxTree;
  }

  parseDeclaration() {
    if (this.tokens[this.index++].type != "Function Keyword")
      throw Error(`Start Function not define. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);

    let name = this.tokens[this.index++].value;

    if (this.tokens[this.index++].type != "Open Parentheses")
      throw Error(`Open Parentheses are missing. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);
    // Should handle Values input!!
    if (this.tokens[this.index++].type != "Close Parentheses")
      throw Error(`Close Parentheses are missing. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);

    if (this.tokens[this.index].type != "Start Block" || this.tokens[this.index + 1].type != "Block")
      throw Error(`Indented Block is missing. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);
    this.level++;

    return { name: name, Statement: this.parseStatement() };
  }

  parseStatement() {
    // console.log(this.tokens[this.index + this.level]);

    for (var i = this.index + this.level; i > this.index; i--) {
      if (this.tokens[i].type != "Block") this.level--;
    }
    this.index += this.level + 1;

    if (this.tokens[this.index++].type != "Return Keyword")
      throw Error(`Return is not define. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);

    if (!isInclude(this.tokens[this.index], "Number", "Char", "String", "Unary", "Parentheses"))
      throw Error(`Type error. Error in line ${this.tokens[this.index].line}, col ${this.tokens[this.index].char}`);

    return { Expression: this.parseExpression() };

    // Additional func

    function isInclude({ type }, ...arr) {
      for (let i of arr) if (type.includes(i)) return true;
      return false;
    }
  }

  parseExpression(params = {}, priority = false) {
    let { type } = this.tokens[this.index] || { type: "" };

    switch (type.split(/\ /g)[1] || type) {
      case "String":
      case "Char":
      case "Number":
        let constant = this.parseConstExpression();
        this.prevType = this.prevType || constant.type;
        if (constant.type != this.prevType)
          throw Error(`Wrong arithmetic type. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);

        // Check if priority is important, if not then parser next
        //    else return the const
        if (!priority) return this.parseExpression(constant);
        else return constant;

      case "Unary":
        // Check if prev value is an another exp, if not then "-" is a Unary Operation
        //    else Binary Operation
        if (!params.type) return this.parseUnaryExpression(priority);

      case "Operator":
        return this.parserOperatorExpression(params);

      case "Parentheses":
        this.index++;
        // Check if it Open Parentheses, if so then check next element
        //    else if it Close, then return created value
        if (type.includes("Open")) {
          // Check if priority is important, if not then parser next
          //    else return the value in a Parentheses
          if (!priority) return this.parseExpression(this.parseExpression());
          else return this.parseExpression();
        } else if (!params.type) throw Error("Error2!!!");
        else return params;
    }

    return params;
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

    throw Error(`Convert Type Error. Error in line ${this.tokens[this.index - 1].line}, col ${this.tokens[this.index - 1].char}`);
  }

  parseUnaryExpression(priority) {
    let { value, type } = this.tokens[this.index++];

    if (!priority) return this.parseExpression({ type: "Unary Operation", value: value, exp: this.parseExpression({}, true) }, priority);
    else return { type: "Unary Operator", value: value, exp: this.parseExpression({}, true) };
  }

  parserOperatorExpression(params) {
    let { value, type } = this.tokens[this.index++];

    // Check if left is not an empty Object, else it's an Error!
    if (!params.type) throw Error("Error!!!");

    switch (type.split(/\ /g)[0] || type) {
      case "Power":
      case "Div":
      case "Mult":
        return this.parseExpression({ type: "Binary Operation", value: value, left: params, right: this.parseExpression({}, true) });
    }

    // if (priority.type) {
    //   priority.right = params;
    //   return { type: "Binary Operation", value: value, left: priority, right: this.parseExpression() };
    // }
    return { type: "Binary Operation", value: value, left: params, right: this.parseExpression() };
  }

  getTree() {
    return this.syntaxTree;
  }
}

module.exports = Parser;
