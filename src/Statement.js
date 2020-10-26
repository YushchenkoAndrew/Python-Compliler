const { changeToken } = require("./Lexing");

function stateChecker(key, token, error, ...expect) {
  if (!token || !this.isInclude(token[key], ...expect)) this.errorMessageHandler(error, token || { line: this.line, char: 0 });
}

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

  let params = this.getParams("Variable");

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
      this.currLevel.body.push(...header);
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
      this.currLevel.body.push(...header);
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
    return { type: "RET", Expression: { value: 0, type: "INT", kind: 10 }, defined: "INT" };
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

  // Check if it's assign with an operation
  if (this.isInclude(type, "Add", "Sub", "Mul", "Div")) changeToken(this.tokens[this.line], this.index - 1);
  return { type: "VAR", name: `_${value}`, Expression: this.parseExpression({}), defined: this.type.curr };
}

function parseFuncCaller() {
  let { value } = this.tokens[this.line][this.index - 1];
  this.index++;

  // TODO: params, I don't know should I declare each params as own Expression, because it's seems like that
  // But for now it would be a simple declaration
  // let params = [];
  let params = this.getParams("Variable", "Number", "Char", "String", "Unary", "Parentheses");
  let type = this.getDefinedToken("Declaration", "name", `_${value}`, this.currLevel).defined;

  this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");
  return { type: "FUNC_CALL", name: `_${value}`, params: params, defined: type };
}

exports.parseFunc = parseFunc;
exports.parseFuncCaller = parseFuncCaller;
exports.parseReturn = parseReturn;
exports.parseVariable = parseVariable;
exports.parseVariableAssign = parseVariableAssign;
exports.parseIf = parseIf;
exports.parseElse = parseElse;
exports.getParams = getParams;
exports.stateChecker = stateChecker;
