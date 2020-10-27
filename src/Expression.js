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

  switch (type.split(/\ /g)[1] || type) {
    case "String":
    case "Char":
    case "Number":
      let constant = this.parseConstExpression();
      this.type = defineType(this.type, { ...constant });

      // If this.ast is not define then call parseExpression, it's need for start
      // up the recursion
      if (!this.ast && priority != -1) return this.parseExpression({ params: constant });
      return constant;

    case "Variable":
      let { value } = this.tokens[this.line][this.index++];
      type = "VAR";

      let varType = this.getDefinedToken(["Statement", "Declaration"], "name", `_${value}`, this.currLevel);

      // TODO: Create better solution for FUNC_CALL
      if (varType.type == "FUNC") this.index += 2;
      varType = varType.defined;

      this.type = defineType(this.type, { ...varType });

      if (!this.ast && priority != -1) return this.parseExpression({ params: { value: `_${value}`, type: type, defined: varType } });
      return { value: `_${value}`, type: type, defined: varType };

    // TODO: CREATE UNARY Operation that based on priority table!!
    case "Unary":
      // Check if prev value is an another exp, if not then "-" is a Unary Operation
      //    else Binary Operation
      // TODO: handle Negative Unary Sign and Negative Operation

      if (!this.ast)
        return this.parseExpression({
          params: { type: "Unary Operation", value: this.tokens[this.line][this.index++].value, exp: this.parseExpression({ priority: -1 }) },
        });
      return { type: "Unary Operation", value: this.tokens[this.line][this.index++].value, exp: this.parseExpression({ priority: priority }) };

    case "Operator":
      let currPriority = priorityTable[type];
      let operator = this.tokens[this.line][this.index++].value;

      this.ast = this.ast || { type: "Binary Operation", value: operator, left: params, right: undefined, priority: currPriority };
      let right = this.parseExpression({ priority: currPriority });
      this.stateChecker("type", this.type.curr, "Such arithmetic syntax don't allow", ...this.allowedOperations[operator][this.type.prev.type]);

      // Initialize a basic AST if the AST is not define
      if (!priority) {
        this.ast.right = right;
        return this.parseExpression({ priority: currPriority });
      }

      let branch = getLastBrach("right", currPriority, this.ast);

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

      return this.parseExpression({ priority: currPriority });

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
    default:
      drawExpression(this.ast || params);
      return this.ast || params;
  }

  function getLastBrach(key, priority, branch) {
    return branch[key] && branch.priority >= priority ? getLastBrach(key, priority, branch[key]) || branch : undefined;
  }

  function updateBranch(branch, data) {
    data = JSON.parse(JSON.stringify(data));
    for (let key in data) branch[key] = JSON.parse(JSON.stringify(data[key]));
  }

  function defineType({ prev, curr }, next) {
    delete next.value;
    if (!curr.type) curr = { ...next };
    else if (curr.type == "STR") next.length += curr.length;
    return { prev: { ...curr }, curr: curr.type == "FLOAT" && next.type == "INT" ? { ...curr } : { ...next } };
  }
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
      return { value: `0${value.substr(2)}H`, type: "INT", kind: 16 };

    case "Float":
      if (parseInt(value) == value) return { value: parseInt(value), type: "INT", kind: "10" };
      return { value: Number(value), type: "FLOAT" };

    case "Number":
      return { value: value, type: "INT", kind: "10" };

    case "String":
      return { value: value, type: "STR", length: value.length };
  }

  this.errorMessageHandler(`Convert Type Error`, this.tokens[this.line][this.index - 1]);
}

// Create simple implementation splice for String
String.prototype.splice = function (index, rm, str) {
  return this.substr(0, index) + str + this.substr(index + Math.abs(rm));
};

// Create a simple algorithm for drawing AST, it will improve
// Expression debugging
function drawExpression(brach, i, j, lines) {
  let { value, type } = brach;
  switch (i && type) {
    case "FLOAT":
    case "STR":
    case "VAR":
    case "INT":
      value += "";
      lines[i] = lines[i].splice(j, value.length, value);
      break;

    // Initialize state run only when "i" equal to 0 || undefined
    case undefined:
      lines = [];
      lines.push(`+${"=".repeat(22)} Exp AST ${"=".repeat(22)}+`);
      for (let i = 0; i < 20; i++) lines.push(`|${" ".repeat(53)}|`);
      lines.push(`+${"=".repeat(53)}+\n`);

      drawExpression(brach, 2, 30, lines);
      console.log();
      for (let line of lines) console.log(" ".repeat(30) + line);
      break;

    default:
      lines[i] = lines[i].splice(j - 3, value.length + 2, `[${value}]`);
      lines[++i] = lines[i].splice(j - 4, 5, "/   \\");

      // Check the Left and Right side
      drawExpression(brach.left, ++i, j - 5, lines);
      drawExpression(brach.right, i, brach.right.type.includes("Operation") ? j + 4 : j + 1, lines);
  }
}

exports.parseExpression = parseExpression;
exports.parseConstExpression = parseConstExpression;
