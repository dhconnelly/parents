"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileFile = void 0;
const fs_1 = require("fs");
const parser_1 = require("../parser");
const compiler_1 = require("./compiler");
function compileFile(file) {
    const outFile = file + ".bytecode";
    console.log(`> compiling ${file} to ${outFile}`);
    try {
        const text = fs_1.readFileSync(file, "utf8");
        const ast = parser_1.parse(text);
        const bytes = compiler_1.compile(ast);
        fs_1.writeFileSync(outFile, bytes);
    }
    catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
exports.compileFile = compileFile;
