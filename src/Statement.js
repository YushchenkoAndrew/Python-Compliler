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

function parseFunc() {
  // Delete all spaces
  this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  this.stateChecker("type", this.tokens[this.line][this.index], "Wrong Function Declaration", "Variable");
  let { value } = this.tokens[this.line][this.index++];

  this.stateChecker("type", this.tokens[this.line][this.index++], "Open Parentheses are missing", "Open Parentheses");

  let params = this.getParams("Variable");

  this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");
  this.stateChecker("type", this.tokens[this.line][this.index++], "Indented Block is missing", "Start Block");
  return { name: `_${value}`, params: params };
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
  return { type: "RET", Expression: this.parseExpression({}), defined: this.prevType };
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
  this.stateChecker("type", this.tokens[this.line][++this.index], "Type error", "Variable", "Number", "Char", "String", "Unary", "Parentheses");
  return { type: "VAR", name: `_${value}`, Expression: this.parseExpression({}), defined: this.prevType };
}

function parseFuncCaller() {
  let { value } = this.tokens[this.line][this.index - 1];
  this.index++;

  // TODO: params, I don't know should I declare each params as own Expression, because it's seems like that
  // But for now it would be a simple declaration
  // let params = [];
  let params = this.getParams("Variable", "Number", "Char", "String", "Unary", "Parentheses");

  // TODO: To write some code that could handle a situation where the user don't declare any return value in the function
  let type = this.getDefinedToken("Statement", "type", "RET", this.getDefinedToken("Declaration", "name", `_${value}`, this.currLevel)).defined;

  this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");
  return { type: "FUNC_CALL", name: `_${value}`, params: params, defined: type };
}

exports.parseFunc = parseFunc;
exports.parseFuncCaller = parseFuncCaller;
exports.parseReturn = parseReturn;
exports.parseVariable = parseVariable;
exports.parseVariableAssign = parseVariableAssign;
exports.getParams = getParams;
exports.stateChecker = stateChecker;
