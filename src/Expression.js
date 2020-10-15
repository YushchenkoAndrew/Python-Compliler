/**
 *
 * @param {*} param0
 * @param params   --   Previous param
 * @param priority --   priority is important
 * @param sign     --   is NegSign out of parentheses
 */
function parseExpression({ params = {}, priority = false, sign = false }) {
  let { type } = this.tokens[this.line][this.index] || { type: "" };
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
      if (!priority) return this.parseExpression({ params: constant, sign: sign });
      else return constant;

    case "Variable":
      let { value } = this.tokens[this.line][this.index++];
      let varType = this.getDefinedToken("Statement", "name", value, this.currLevel).defined;

      this.prevType = this.prevType || varType;
      if (varType != this.prevType) this.errorMessageHandler(`Wrong arithmetic type`, this.tokens[this.line][this.index - 1]);

      if (!priority) return this.parseExpression({ params: { value: value, type: "VAR", defined: varType }, sign: sign });
      return { value: value, type: "VAR" };

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
        this.errorMessageHandler(`Wrong arithmetic style`, this.tokens[this.line][this.index - 1]);
      } else {
        this.parenthesesCounter--;
        return params;
      }

    default:
      if (!params.type) this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.line][this.index - 1]);
  }

  return params;
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

function parseUnaryExpression(priority, sign) {
  let { value, type } = this.tokens[this.line][this.index++];

  if (!priority)
    return this.parseExpression({ params: { type: "Unary Operation", value: value, exp: this.parseExpression({ priority: true, sign: sign }) }, sign: sign });
  else return { type: "Unary Operation", value: value, exp: this.parseExpression({ priority: true, sign: sign }) };
}

function parserOperatorExpression(params, sign) {
  let { value, type } = this.tokens[this.line][this.index++];

  // Check if left is not an empty Object, else it's an Error!
  if (!params.type) this.errorMessageHandler(`Such arithmetic syntax don't allow`, this.tokens[this.line][this.index - 1]);

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

exports.parseExpression = parseExpression;
exports.parseConstExpression = parseConstExpression;
exports.parseUnaryExpression = parseUnaryExpression;
exports.parserOperatorExpression = parserOperatorExpression;
