var priorityTable = require("./PriorityTable.json");

/**
 *
 * @param {*} param0
 * @param params   --   Previous param
 * @param priority --   priority is important
 * @param sign     --   is NegSign out of parentheses
 */
function parseExpression({ params = {}, priority }) {
  let { type } = this.tokens[this.line][this.index] || { type: "LINE_END" };
  // if (line != this.currLine) {
  //   this.prevType = undefined;
  //   return params;
  // }

  switch (type.split(/\ /g)[1] || type) {
    case "String":
    case "Char":
    case "Number":
      let constant = this.parseConstExpression();
      this.prevType = this.prevType || constant.type;
      if (constant.type != this.prevType) this.errorMessageHandler(`Wrong arithmetic type`, this.tokens[this.line][this.index - 1]);

      // Check if priority is important, if not then parser next
      //    else return the const
      // if (!priority) return this.parseExpression({ params: constant});
      // else return constant;
      if (this.ast || priority == -1) return constant;
      return this.parseExpression({ params: constant, priority: priority });
    // return constant;

    case "Variable":
      let { value } = this.tokens[this.line][this.index++];

      // TODO: Check Function params
      let varType = this.getDefinedToken("Statement", "name", value, this.currLevel).defined;

      this.prevType = this.prevType || varType;
      if (varType != this.prevType) this.errorMessageHandler(`Wrong arithmetic type`, this.tokens[this.line][this.index - 1]);

      if (this.ast || priority == -1) return { value: value, type: "VAR" };
      return this.parseExpression({ params: { value: value, type: "VAR", defined: varType }, priority: priority });

    case "Unary":
      // Check if prev value is an another exp, if not then "-" is a Unary Operation
      //    else Binary Operation
      // if (!params.type) return this.parseUnaryExpression(priority);
      // let operator = t
      // console.log(unary);
      if (this.ast || priority == -1)
        return { type: "Unary Operation", value: this.tokens[this.line][this.index++], exp: this.parseExpression({ priority: -1, unary: true }) };
      return this.parseExpression({
        params: { type: "Unary Operation", value: this.tokens[this.line][this.index++], exp: this.parseExpression({ priority: -1, unary: true }) },
        priority: priority,
        unary: false,
      });

    // let unaryOp = this.tokens[this.line][this.index++].value;
    // { type: "Unary Operation", value: unaryOp, exp: this.parseExpression({ priority: -1 }) };
    // let temp = this.parseUnaryExpression(priority);
    // if (this.ast || priority == -1) return unary;
    // return this.parseExpression({ params: temp, priority: priority });

    case "Operator":
      let currPriority = priorityTable[type];
      let operator = this.tokens[this.line][this.index++].value;

      this.ast = this.ast || { type: "Binary Operation", value: operator, left: params, right: undefined, priority: currPriority };

      // Initialize a basic AST if the AST is not define
      if (!priority) {
        this.ast.right = this.parseExpression({ priority: currPriority });

        // TODO: Create simplified version
        // Error handler
        if (!this.isInclude(this.ast.right.type, "INT", "STR", "FLOAT", "VAR", "Unary"))
          this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.line][this.index - 1]);

        this.parseExpression({ priority: currPriority });
        break;
      }

      let right = this.parseExpression({ priority: currPriority });
      let branch = getLastBrach("right", currPriority, this.ast);

      // TODO: Create simplified version
      // Error handler
      if (!this.isInclude(right.type, "INT", "STR", "FLOAT", "VAR", "Unary"))
        this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.line][this.index - 1]);

      // 1 * 2 + 3
      if (priority - currPriority <= 0) {
        if (branch && priority != currPriority)
          branch.right = { type: "Binary Operation", value: operator, left: branch.right, right: right, priority: currPriority };
        else {
          branch = branch || this.ast;
          updateBranch(branch, { type: "Binary Operation", value: operator, left: branch, right: right, priority: currPriority });
        }
      }
      // 1 + 2 * 3
      else branch.right = { type: "Binary Operation", value: operator, left: branch.right, right: right, priority: currPriority };

      this.parseExpression({ priority: currPriority });
      break;

    // TODO: To implement Parentheses
    // case "Parentheses":
    //   this.index++;
    //   // Check if it Open Parentheses, if so then check next element
    //   //    else if it Close, then return created value
    //   if (type.includes("Open")) {
    //     this.parenthesesCounter++;
    //     // Check if priority is important, if not then parser next
    //     //    else return the value in a Parentheses
    //     if (!priority) return this.parseExpression({ params: this.parseExpression({}), sign: sign });
    //     else return this.parseExpression({});
    //   } else if (!params.type) {
    //     this.errorMessageHandler(`Wrong arithmetic style`, this.tokens[this.line][this.index - 1]);
    //   } else {
    //     this.parenthesesCounter--;
    //     return params;
    //   }

    case "LINE_END":
      return this.ast || params;

    default:
      if (!params.type) this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.line][this.index - 1]);

      function getLastBrach(key, priority, branch) {
        return branch[key] && branch.priority >= priority ? getLastBrach(key, priority, branch[key]) || branch : undefined;
      }

      function updateBranch(branch, data) {
        data = JSON.parse(JSON.stringify(data));
        for (let key in data) branch[key] = JSON.parse(JSON.stringify(data[key]));
      }
  }

  return this.ast;
}

function parseConstExpression() {
  let { value, type } = this.tokens[this.line][this.index++];

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

  this.errorMessageHandler(`Convert Type Error`, this.tokens[this.line][this.index - 1]);
}

exports.parseExpression = parseExpression;
exports.parseConstExpression = parseConstExpression;
