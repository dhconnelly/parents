"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScript = void 0;
const lexer_1 = require("../lexer");
const parser_1 = require("../parser");
const evaluator_1 = require("./evaluator");
function runScript(name, script) {
    try {
        const ast = parser_1.parse(script);
        evaluator_1.evaluate(ast);
    }
    catch (error) {
        if (error instanceof lexer_1.LexerError ||
            error instanceof parser_1.ParserError ||
            error instanceof evaluator_1.EvaluationError) {
            console.error(`${name}: ${error.message}`);
        }
        else {
            throw error;
        }
    }
}
exports.runScript = runScript;
