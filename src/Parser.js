class Parser {
  constructor(tokens) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");

    this.tokens = [...tokens];
    this.syntaxTree = {};
    this.parenthesesCounter = 0;
  }

  startParser() {
    this.index = 0; // Curr Index for tokens
    this.level = 0; // Define Statement Depth

    try {
      this.syntaxTree = { type: "Program", body: [{ Declaration: this.parseDeclaration() }] };

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

  parseDeclaration() {
    if (this.tokens[this.index++].type != "Function Keyword") this.errorMessageHandler(`Start Function not define`, this.tokens[this.index - 1]);

    let name = this.tokens[this.index++].value;

    if (this.tokens[this.index++].type != "Open Parentheses") this.errorMessageHandler(`Open Parentheses are missing`, this.tokens[this.index - 1]);
    // Should handle Values input!!
    if (this.tokens[this.index++].type != "Close Parentheses") this.errorMessageHandler(`Close Parentheses are missing`, this.tokens[this.index - 1]);

    if (this.tokens[this.index].type != "Start Block" || this.tokens[this.index + 1].type != "Block")
      this.errorMessageHandler(`Indented Block is missing`, this.tokens[this.index - 1]);
    this.level++;

    return { name: name, Statement: this.parseStatement() };
  }

  parseStatement() {
    // console.log(this.tokens[this.index + this.level]);

    for (var i = this.index + this.level; i > this.index; i--) {
      if (this.tokens[i].type != "Block") this.level--;
    }
    this.index += this.level + 1;

    if (this.tokens[this.index++].type != "Return Keyword") this.errorMessageHandler(`Return is not define`, this.tokens[this.index - 1]);

    if (!isInclude(this.tokens[this.index], "Number", "Char", "String", "Unary", "Parentheses"))
      this.errorMessageHandler(`Type error`, this.tokens[this.index - 1]);

    return { Expression: this.parseExpression({}) };

    // Additional func

    function isInclude({ type }, ...arr) {
      for (let i of arr) if (type.includes(i)) return true;
      return false;
    }
  }

  /**
   *
   * @param {*} param0
   * @param params   --   Previous param
   * @param priority --   priority is important
   * @param sign     --   is NegSign out of parentheses
   */
  parseExpression({ params = {}, priority = false, sign = false }) {
    let { type } = this.tokens[this.index] || { type: "" };

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
