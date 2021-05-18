"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileFile = void 0;
const fs_1 = require("fs");
const util_1 = require("../util");
const lexer_1 = require("../lexer");
const parser_1 = require("../parser");
const compiler_1 = require("./compiler");
function compileFile(file) {
    const outFile = file + ".bytecode";
    console.log(`> compiling ${file} to ${outFile}`);
    try {
        const bytes = util_1.Ok(fs_1.readFileSync(file, "utf8"))
            .flatMap(lexer_1.lex)
            .flatMap(parser_1.parse)
            .flatMap(compiler_1.compile)
            .unwrap();
        fs_1.writeFileSync(outFile, bytes);
    }
    catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
exports.compileFile = compileFile;
