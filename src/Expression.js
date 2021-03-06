var priorityTable = require("./PriorityTable.json");

/**
 *
 * @param {*} param0
 * @param params   --   Previous param
 * @param priority --   priority is important
 */
function parseExpression({ params = {}, priority }) {
  let { type } = this.tokens[this.line][this.index] || { type: "LINE_END" };

  switch (type.split(/\ /g)[1] || type) {
    case "String":
    case "Char":
    case "Number":
      let constant = this.parseConstExpression();
      this.type = defineType(this.type, { ...constant }, this.ast);

      // Change value of this.neg to unary because after a number can be only
      // a binary operation
      this.neg = "Binary";

      // FIXME: Fix the bug with such syntax => "a = 2 3"

      // If this.ast is not define then call parseExpression, it's need for start
      // up the recursion
      if (!this.ast && priority != -1) return this.parseExpression({ params: constant });
      return constant;

    case "Variable":
      let { value } = this.tokens[this.line][this.index++];

      // Change value of this.neg to unary because after a number can be only
      // a binary operation
      this.neg = "Binary";
      let varType = this.checkOnBasicFunc(value) || this.getDefinedToken(["Statement", "Declaration"], "name", `_${value}`, this.currLevel);

      // Create Expression that depends on type, if it FUNC then call parserFuncCaller
      varType = varType.type == "FUNC" ? this.parseFuncCaller() : { value: `_${value}`, type: "VAR", defined: varType.defined };
      this.type = defineType(this.type, { ...varType.defined }, this.ast);

      if (!this.ast && priority != -1) return this.parseExpression({ params: varType });
      return varType;

    case "Unary": {
      let currPriority = priorityTable[type];
      let operator = this.tokens[this.line][this.index++].value;

      // Check Operation type and if it a Neg but also it should be a binary
      // operation then change tokens type and recall parseExpression function
      if (this.neg == "Binary" && operator == "-") {
        this.tokens[this.line][--this.index].type = "Neg Operator";
        return this.parseExpression({ params: params, priority: priority });
      }

      // Get an expression with priority -1, that mean that after finding a
      // constant value or variable return it immediately, this need when this.ast is undefined
      let exp = this.parseExpression({ priority: -1 });
      this.stateChecker("type", this.type.curr, "Such Unary opinions is not allowed", ...this.allowedOperations[operator][this.type.prev.type]);

      if (!priority) return this.parseExpression({ params: { type: "Unary Operation", value: operator, exp: exp, priority: currPriority } });
      return { type: "Unary Operation", value: operator, exp: exp, priority: currPriority };
    }

    case "Operator": {
      let currPriority = priorityTable[type];
      let operator = this.tokens[this.line][this.index++].value;

      // Change the neg value to "Unary" because after Binary operations could can be only
      // Unary operation
      this.neg = "Unary";

      this.ast = this.ast || { type: "Binary Operation", value: operator, left: params, right: undefined, priority: currPriority };
      let right = this.parseExpression({ priority: currPriority });

      this.stateChecker("type", this.type.curr, "Such arithmetic syntax don't allow", ...this.allowedOperations[operator][this.type.prev.type]);

      // Initialize a basic AST if the AST is not define
      if (!priority) {
        let branch = getLastBranch(["left", "exp"], currPriority, params);

        // If Unary operation have a lower priority than the Binary operation, then swap them
        if (branch && branch.priority != currPriority) {
          branch.exp = { type: "Binary Operation", value: operator, left: branch.exp, right: right, priority: currPriority };
          this.ast = copyTree(params);
        } else this.ast.right = right;

        return this.parseExpression({ priority: currPriority });
      }

      let branch = getLastBranch(["right", "exp"], currPriority, this.ast);
      let key = branch && branch.exp ? "exp" : "right";

      // 1 * 2 + 3
      if (priority - currPriority <= 0) {
        // The main idea here, it's to dynamically change prev priority
        // if it was too high, this approach helps to build new branch
        // on top of another if they've had the same priority
        priority = branch?.priority <= currPriority ? branch.priority : priority;

        if (branch && priority != currPriority)
          branch[key] = { type: "Binary Operation", value: operator, left: branch[key], right: right, priority: currPriority };
        else {
          branch = branch || this.ast;
          updateBranch(branch, { type: "Binary Operation", value: operator, left: branch, right: right, priority: currPriority });
        }
      }
      // 1 + 2 * 3
      else branch[key] = { type: "Binary Operation", value: operator, left: branch[key], right: right, priority: currPriority };

      return this.parseExpression({ priority: currPriority });
    }

    case "Parentheses": {
      if (this.parentheses || !type.includes("Close")) this.index++;
      let right = undefined;

      if (type.includes("Open")) {
        let saveTree = this.ast ? copyTree(this.ast) : undefined;
        this.parentheses++;
        this.ast = undefined;
        right = this.parseExpression({});

        // Check If Expression in Parentheses is Empty or not
        if (!right.type) this.errorMessageHandler("Such Operation with Empty Parentheses not allowed", this.tokens[this.line][this.index]);

        // Check if Expression in Parentheses is any type of Operation ?
        // If so then set the highest Operation Branch to the maximum
        // priority level that means '0', that need for future ast building
        if (right.type.includes("Operation")) right.priority = priorityTable[type.split(" ")[1]];
        this.ast = saveTree;
        defineAnyType(this.type.curr, this.ast);

        // Check if this.ast is undefined this mean one of this situation:
        // (1 + 2) * 3   --   In this case I send received right value
        // as a "constant" (send it as a left params)
        if (!this.ast && priority != -1) return this.parseExpression({ params: right });
      } else this.parentheses--;

      return right || this.ast || params;
    }

    case "LINE_END":
    default:
      if (this.ast) drawExpression(this.ast);
      if (this.parentheses != 0) this.errorMessageHandler("Error with Parentheses", { line: this.line, char: 0 });
      return this.ast || params;
  }

  function getLastBranch(keys, priority, branch) {
    for (let key of keys) if (branch[key] && branch.priority >= priority) return getLastBranch(keys, priority, branch[key]) || branch;
    return undefined;
  }

  function updateBranch(branch, data) {
    // FIXME: Bug with coping, example a % 2 == 0 it will
    // create a strange tree where it'll check '==' twice

    // data = copyTree(data);
    data = JSON.parse(JSON.stringify(data));

    if (branch.exp) {
      delete branch.exp;
      branch.left = {};
      branch.right = {};
    }

    for (let key in data) branch[key] = JSON.parse(JSON.stringify(data[key]));
  }

  function defineType({ prev, curr }, next, branch) {
    delete next.value;
    defineAnyType(next, branch);
    if (!curr.type || curr.type == "ANY") curr = { ...next };
    else if (curr.type == "STR") next.length += curr.length;
    return { prev: { ...curr }, curr: (curr.type == "FLOAT" && next.type == "INT") || next.type == "ANY" ? { ...curr } : { ...next } };
  }

  function defineAnyType(type, branch = {}) {
    if (branch.left) defineAnyType(type, branch.left);
    if (branch.right) defineAnyType(type, branch.right);
    if (branch.exp) defineAnyType(type, branch.exp);
    if (branch.type == "VAR" && branch.defined.type == "ANY") updateBranch(branch.defined, type);
  }

  function copyTree(branch) {
    let obj = {};
    for (let key in branch) obj[key] = obj[key] instanceof Object && key != "defined" ? copyTree(branch[key]) : branch[key];

    return obj;
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
      if (parseInt(value) == value) return { value: parseInt(value) + "", type: "INT", kind: "10" };
      return { value: Number(value) + "", type: "FLOAT" };

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
function drawExpression(branch, i, j, lines) {
  let { value, type, name } = branch;
  switch (i && type) {
    case "FLOAT":
    case "STR":
    case "VAR":
    case "INT":
      value += "";
      lines[i] = lines[i].splice(j, value.length, value);
      break;

    case "FUNC_CALL":
      lines[i] = lines[i].splice(j, name.length, name);
      break;

    case "Binary Operation":
      lines[i] = lines[i].splice(j - 3, value.length + 3, `[${value}]\ `);
      lines[++i] = lines[i].splice(j - 4, 5, "/   \\");
      lines[++i] = lines[i].splice(j - 5, 7, "/     \\");

      // Check the Left and Right side
      type = branch.left.type;
      drawExpression(branch.left, i + (type.includes("Operation") ? 1 : 0), j - 5, lines);
      if (branch.right.type.includes("Operation")) drawExpression(branch.right, ++i, j + 4, lines);
      else drawExpression(branch.right, i, j + 1, lines);
      break;

    case "Unary Operation":
      lines[i] = lines[i].splice(j - 3, value.length + 3, `[${value}]\ `);
      lines[++i] = lines[i].splice(j - 2, 1, "|");
      drawExpression(branch.exp, ++i, j - 2, lines);
      break;

    // Initialize state run only when "i" equal to 0 || undefined
    case undefined:
      lines = [];
      lines.push(`+${"=".repeat(22)} Exp AST ${"=".repeat(22)}+`);
      for (let i = 0; i < 20; i++) lines.push(`|${" ".repeat(53)}|`);
      lines.push(`+${"=".repeat(53)}+\n`);

      drawExpression(branch, 2, 30, lines);
      console.log();
      for (let line of lines) console.log(" ".repeat(30) + line);
      break;
  }
}

exports.parseExpression = parseExpression;
exports.parseConstExpression = parseConstExpression;
