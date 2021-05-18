"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFile = void 0;
const fs_1 = require("fs");
const lexer_1 = require("../lexer");
const parser_1 = require("../parser");
const evaluator_1 = require("./evaluator");
const util_1 = require("../util");
function runFile(file) {
    console.log(`> running ${file}`);
    try {
        util_1.Ok(fs_1.readFileSync(file, "utf8"))
            .flatMap(lexer_1.lex)
            .flatMap(parser_1.parse)
            .flatMap(evaluator_1.evaluate)
            .unwrap();
    }
    catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
exports.runFile = runFile;
