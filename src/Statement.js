function checkExp({ type, line }, expected, currLine) {
  return type.includes(expected) && line == currLine;
}

function cutParams(currLine) {
  let params = [];

  while (!this.checkExp(this.tokens[this.index], "Close", currLine)) {
    let { value, line } = this.tokens[this.index];
    if (!isInclude(this.tokens[this.index++], "Variable", "Number", "Char", "String") && currLine != line)
      this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.index - 1]);
    params.push(value);
    this.index += this.checkExp(this.tokens[this.index], "Comma", line);
  }

  return params;

  // Additional params
  function isInclude({ type }, ...arr) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }
}

function parseFunc() {
  let { line } = this.tokens[this.index++];

  if (!this.checkExp(this.tokens[this.index++], "Space", line)) this.errorMessageHandler(`Start Function not define`, this.tokens[this.index - 1]);

  this.deleteSpacesInLine(line);
  let name = this.tokens[this.index++].value;

  if (!this.checkExp(this.tokens[this.index++], "Open Parentheses", line))
    this.errorMessageHandler(`Open Parentheses are missing`, this.tokens[this.index - 1]);

  let params = this.cutParams(line);

  if (!this.checkExp(this.tokens[this.index++], "Close Parentheses", line))
    this.errorMessageHandler(`Close Parentheses are missing`, this.tokens[this.index - 1]);

  if (!this.checkExp(this.tokens[this.index++], "Start Block", line)) this.errorMessageHandler(`Indented Block is missing`, this.tokens[this.index - 1]);

  return { name: name, params: params };
}

function parseReturn() {
  let { line } = this.tokens[this.index++];

  if (!this.checkExp(this.tokens[this.index++], "Space", line)) this.errorMessageHandler(`Return is not define`, this.tokens[this.index - 1]);

  this.deleteSpacesInLine(line);

  if (!isInclude(this.tokens[this.index], "Variable", "Number", "Char", "String", "Unary", "Parentheses"))
    this.errorMessageHandler(`Type error`, this.tokens[this.index - 1]);

  this.currLine = line;

  return { type: "RET", Expression: this.parseExpression({}) };

  // Additional func

  function isInclude({ type }, ...arr) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }
}

function parseVariable() {
  let { value, line } = this.tokens[this.index++];
  this.deleteSpacesInLine(line);

  if (!this.checkExp(this.tokens[this.index++], "Assignment", line)) {
    if (this.checkExp(this.tokens[this.index - 1], "Open Parentheses", line)) return this.parseFuncCaller(value);
    else this.errorMessageHandler(`Such syntax is not allowed`, this.tokens[this.index - 1]);
  }

  if (!isInclude(this.tokens[this.index], "Number", "Char", "String", "Unary", "Parentheses"))
    this.errorMessageHandler(`Type error`, this.tokens[this.index - 1]);

  this.currLine = line;

  return { type: "VAR", name: value, Expression: this.parseExpression({}) };

  // Additional func

  function isInclude({ type }, ...arr) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }
}

function parseFuncCaller(name) {
  let { line } = this.tokens[this.index];

  let params = this.cutParams(line);

  // Should handle Values input!!
  if (!this.checkExp(this.tokens[this.index++], "Close Parentheses", line))
    this.errorMessageHandler(`Close Parentheses are missing`, this.tokens[this.index - 1]);

  return { type: "FUNC_CALL", name: name, params: params };
}

exports.parseFunc = parseFunc;
exports.parseFuncCaller = parseFuncCaller;
exports.parseReturn = parseReturn;
exports.parseVariable = parseVariable;
exports.cutParams = cutParams;
exports.checkExp = checkExp;
