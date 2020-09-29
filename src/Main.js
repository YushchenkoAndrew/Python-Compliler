const Lexing = module.require("./Lexing");
const Parser = module.require("./Parser");
const Generator = module.require("./CodeGenerator");

function main() {
  let lexing = new Lexing("1-26-NodeJS-IO-82-Yushchenko-Andrew.txt");
  lexing.defineTokens();
  // lexing.showTable();

  let parser = new Parser(lexing.getTokens());
  parser.startParser();

  let generator = new Generator(parser.getTree());
  generator.start("1-26-NodeJS-IO-82-Yushchenko-Andrew.asm");

  console.log("Done");
}

main();
console.log("Test");
