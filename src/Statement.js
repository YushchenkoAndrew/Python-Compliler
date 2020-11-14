const { changeToken } = require("./Lexing");

function stateChecker(key, token, error, ...expect) {
  if (!token || !token[key] || !this.isInclude(token[key], ...expect)) this.errorMessageHandler(error, token || { line: this.line, char: 0 });
}

// TODO: Improve this to be able to handle such syntax as => "def func(a, b = 2):"
function getParams(...allowed) {
  let params = [];

  while (this.tokens[this.line][this.index] && !this.tokens[this.line][this.index].type.includes("Close")) {
    let { value } = this.tokens[this.line][this.index];
    this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong Function declaration Syntax", ...allowed);
    params.push(value);
    this.stateChecker("type", this.tokens[this.line][this.index], "Wrong Function declaration Syntax", "Close", "Comma");
    this.index += this.tokens[this.line][this.index].type.includes("Comma");
  }
  return params;
}

// TODO: Create a simple default return statement or similar to this
function parseFunc() {
  // Delete all spaces
  this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  this.stateChecker("type", this.tokens[this.line][this.index], "Wrong Function Declaration", "Variable");
  let { value } = this.tokens[this.line][this.index++];

  this.stateChecker("type", this.tokens[this.line][this.index++], "Open Parentheses are missing", "Open Parentheses");

  // Create type "ANY" which is mean that variable is undefined
  // TODO: Think about do I need to create a arguments (params) as Statements ?
  // Complete Expression part
  let params = this.getParams("Variable").map((param) => ({ type: "VAR", name: `_${param}`, Expression: undefined, defined: { type: "ANY" } }));

  this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");
  this.stateChecker("type", this.tokens[this.line][this.index++], "Indented Block is missing", "Start Block");
  return { name: `_${value}`, params: params, body: [], defined: { type: "INT", kind: 10 } };
}

function parseIf() {
  // Delete all spaces
  this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  this.stateChecker("type", this.tokens[this.line][this.index], "Wrong If Statement declaration", "Variable", "Number", "String", "Unary", "Parentheses");
  let exp = this.parseExpression({});
  this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong If Statement declaration", "Start Block");
  return { type: "IF", Expression: exp, defined: this.type.curr };
}

// Continue of method Parse If but here we can handle the else and else-if statement
function parseElse(level, body) {
  let { type } = this.tokens[this.line][this.index];

  // Small parser for Else Statement and else if statement
  // In a switch I just get an array of elements without the last one
  switch (type.split(/\ /).slice(0, -1).join("-")) {
    case "ELSE": {
      // Delete all spaces
      this.tokens[this.line].push(...this.tokens[this.line].splice(this.index++).filter((token) => token.type != "Space"));
      this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong ELSE Statement declaration", "Start Block");

      // Save if body for using it as a header after that
      let header = JSON.parse(JSON.stringify(this.currLevel.body));

      // Create a new (Empty body)
      this.currLevel.header.push(...body.slice(0, -1));
      this.currLevel.body = [];

      level = this.initStateMachine(level + 1, true);
      body.slice(-1)[0].Statement.else = this.currLevel.body;
      this.currLevel.header.push(...header);
      break;
    }

    case "ELSE-IF": {
      // Change "ELSE IF" token to the ELSE-IF for calling the if parser
      // Because it should be a similar one
      this.tokens[this.line][this.index].type = "ELSE-IF Keyword";

      // Go down to the previous level, that needs because
      // "else if" statement doesn't create a "Depth Tree"
      this.currLevel.level--;

      // Save if body for using it as a header after that
      let header = JSON.parse(JSON.stringify(this.currLevel.body));

      // Create a new (Empty body)
      this.currLevel.header.push(...body.slice(0, -1));
      this.currLevel.body = [];

      level = this.initStateMachine(level, true);
      body.slice(-1)[0].Statement.else = this.currLevel.body;

      // Restore level
      this.currLevel.level++;
      this.currLevel.header.push(...header);
      break;
    }
  }

  return level;
}

function parseReturn() {
  // Delete all spaces
  this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));

  // Check the pass keyword, let's check if user put some variable after, if so throw an Error
  if (this.tokens[this.line][this.index - 1].type.includes("Pass") && this.tokens[this.line][this.index])
    this.errorMessageHandler("Invalid syntax", this.tokens[this.line][this.index - 1]);

  // Check if the function return any of the type, if not then put as a return value '0'
  let { type } = this.tokens[this.line][this.index] || { type: "" };
  if (!this.isInclude(type, "Variable", "Number", "Char", "String", "Unary", "Parentheses"))
    return { type: "RET", Expression: { value: "0", type: "INT", kind: 10 }, defined: { type: "INT", kind: 10 } };
  return { type: "RET", Expression: this.parseExpression({}), defined: this.type.curr };
}

function parseVariable() {
  // Delete all spaces
  this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  this.stateChecker("type", this.tokens[this.line][this.index], "Wrong Variable Syntax", "Assignment", "Open Parentheses");

  if (this.tokens[this.line][this.index].type.includes("Assignment")) return this.parseVariableAssign();
  return this.parseFuncCaller();
}

function parseVariableAssign() {
  let { value } = this.tokens[this.line][this.index - 1];
  let { type } = this.tokens[this.line][this.index++];

  this.stateChecker("type", this.tokens[this.line][this.index], "Type error", "Variable", "Number", "String", "Unary", "Parentheses");

  console.log(type);

  // Check if it's assign with an operation
  if (this.isInclude(type, "Add", "Sub", "Mul", "Div", "Mod", "Or", "And", "Xor", "SL", "SR")) changeToken(this.tokens[this.line], this.index - 1);
  return { type: "VAR", name: `_${value}`, Expression: this.parseExpression({}), defined: this.type.curr };
}

function getArgs(params) {
  let args = [];
  // TODO: Change ast copy from JSON to copyTree ...
  let prevState = { type: JSON.parse(JSON.stringify(this.type)), ast: this.ast && JSON.parse(JSON.stringify(this.ast)), parentheses: this.parentheses };

  for (let param of params) {
    let type = param.defined.type == "ANY" ? ["INT", "VAR", "STR", "FLOAT", "ANY"] : [param.defined.type];
    this.type = { prev: {}, curr: {} };
    this.ast = undefined;

    args.push(this.parseExpression({}));
    this.stateChecker("type", this.type.curr, "Wrong arguments declaration", ...type);

    // Check next step if it Close Parentheses then exit from the loop
    // Else check if the next token is comma
    if ((this.tokens[this.line][this.index] || {}).type == "Close Parentheses") break;
    this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong Function declaration Syntax", "Comma");
  }

  // Check on Closing Parentheses and restore previous State
  this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");
  this.type = prevState.type;
  this.ast = prevState.ast;
  this.parentheses = prevState.parentheses;

  return args;
}

function parseFuncCaller() {
  let { value } = this.tokens[this.line][this.index++ - 1];

  let { params, defined } = this.getDefinedToken("Declaration", "name", `_${value}`, this.currLevel);
  return { type: "FUNC_CALL", name: `_${value}`, params: this.getArgs(params), defined: defined };
}

exports.parseFunc = parseFunc;
exports.parseFuncCaller = parseFuncCaller;
exports.parseReturn = parseReturn;
exports.parseVariable = parseVariable;
exports.parseVariableAssign = parseVariableAssign;
exports.parseIf = parseIf;
exports.parseElse = parseElse;
exports.getParams = getParams;
exports.getArgs = getArgs;
exports.stateChecker = stateChecker;
