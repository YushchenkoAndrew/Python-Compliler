const { readFileSync } = require("fs");
const lexemes = require("./TokenTypes.json");

class Lexing {
  constructor(path) {
    console.log("\x1b[34m", "~ Start Lexing:", "\x1b[0m");

    // Text filtration
    // Read code and delete all commentaries from it
    this.lines = readFileSync(path, "utf-8")
      .split("\n")
      .map((line) => {
        line = `${line} `.slice(0, line.indexOf("#"));

        // Delete Commentaries on top of that if line become empty
        // after deleting commentary that it will 'erase' it
        // in other word replace with empty string
        if (line.replace(/ /g, "").length) return line;
        return "";
      });
    this.text = this.lines.join("");
    console.log(this.text);
    // console.log(lexemes);
    this.lineNum = 0;
    this.delta = 0;

    this.tokens = [];
  }

  isNewLine(i) {}

  defineTokens() {
    let str = "";
    let variable = "";
    let i = 0;

    while (i < this.text.length) {
      str += this.text[i];

      var prevLine = this.lineNum;

      // Need a while loop for come over '\n' symbol, because in the this.text it's missed
      // That mean that al symbols '\n' erased, while loop will find the spot where this.text[i]
      // located in other words it' find the specific lineNum despite empty one
      while (this.lines[this.lineNum][i - this.delta] != this.text[i]) {
        this.delta += this.lines[this.lineNum].length;
        this.lineNum++;
      }

      // Python can handle Not ASCII Character!!
      // Handler of not ASCII Symbols
      // if (this.text[i].charCodeAt(0) > 127) {
      //   console.log("Nooooooooo");
      //   break;
      // }

      // Find tokens in the code
      let result = [];
      for (let j in lexemes) {
        let begin = i - str.length + 1;

        if (j.includes(str) && j == this.text.substring(begin, begin + j.length))
          result.push({ value: j, type: lexemes[j], line: this.lineNum, char: this.lines[this.lineNum].indexOf(j) });
      }

      // if (result.length) console.log(result);

      switch (result.length) {
        // Some symbol not exist
        case 0: {
          if (variable.length && prevLine != this.lineNum) {
            this.tokens.push({ value: variable, type: "Variable", line: prevLine, char: this.lines[prevLine].indexOf(variable) });
            variable = "";
          }

          let { type } = this.tokens[this.tokens.length - 1] || { type: "" };
          if (type == "Define Char") this.tokens[this.tokens.length - 1].value += this.text[i];
          else variable += str;

          str = "";
          i++;
          break;
        }
        case 1: {
          // Add a variable, variable is not define in TokenTypes
          // if (variable.length && variable.replace(/\ /g, "").length) {
          if (variable.length) {
            this.tokens.push({ value: variable, type: "Variable", line: prevLine, char: this.lines[prevLine].indexOf(variable) });
            variable = "";
          }

          let { type, line, char } = this.tokens[this.tokens.length - 1] || { type: "", line: 0, char: 0 };

          // Check if curr and prev items is a Number if so then add them together
          if (result[0].type.includes("Number") && type.includes("Number")) {
            let prev = this.tokens.pop();
            let { value } = result[0];
            this.tokens.push({ value: prev.value + value, type: value == "." ? result[0].type : prev.type, line: prev.line, char: prev.char });
          } else {
            // Check if prev item was a Char
            if (type == "Define Char") {
              let { value } = this.tokens.pop();
              // Check if String is ended, if so then make a proper cut and define correct type
              //    else statement need for adding str which is define in TokenTypes.json
              if ((result[0].value == "'" || result[0].value == '"') && result[0].value == value[0])
                this.tokens.push({ value: value.substring(1), type: value.length > 2 ? "String" : "Char", line: line, char: char });
              else this.tokens.push({ value: value + result[0].value, type: type, line: line, char: char });
            } else this.tokens.push(result[0]);
          }

          i += result[0].value.length - str.length + 1;

          str = "";
          break;
        }
        // If some symbol meets twice or more, then try get more information
        default:
          i++;
      }
    }

    console.log(this.tokens);

    return this.tokens;
  }

  getTokens() {
    return this.tokens;
  }

  showTable() {
    console.log(`\n   Value\t|\tType\n${"_".repeat(16)}|${"_".repeat(35)}`);

    for (let i in this.tokens) console.log(`   '${this.tokens[i].value}'  \t|\t${this.tokens[i].type}`);
  }
}

module.exports = Lexing;
