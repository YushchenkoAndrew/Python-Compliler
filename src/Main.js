const { Lexing } = module.require("./Lexing");
const Parser = module.require("./Parser");
const Generator = module.require("./CodeGenerator");

function main() {
  // let lexing = new Lexing("6-26-NodeJS-IO-82-Yushchenko-Andrew.txt");
  let lexing = new Lexing("./SourceCode/Test.py");
  lexing.defineTokens();
  // lexing.showTable();

  let parser = new Parser(lexing.getTokens());
  parser.start();

  let generator = new Generator(parser.getTree());
  // generator.start("6-26-NodeJS-IO-82-Yushchenko-Andrew.asm");
  generator.start("./SourceCode/Test.asm");

  console.log("Done");
}

main();
