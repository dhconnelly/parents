"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFile = void 0;
const fs_1 = require("fs");
const parser_1 = require("../parser");
const evaluator_1 = require("./evaluator");
function runFile(file) {
    console.log(`> running ${file}`);
    try {
        const script = fs_1.readFileSync(file, "utf8");
        const ast = parser_1.parse(script);
        evaluator_1.evaluate(ast);
    }
    catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
exports.runFile = runFile;
