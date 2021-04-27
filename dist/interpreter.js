import { lex, LexerError } from "./lexer.js";
import { parse, ParserError } from "./parser.js";
import { evaluate, EvaluationError } from "./evaluator.js";
export function runScript(name, script) {
    try {
        const toks = lex(script);
        const ast = parse(toks);
        evaluate(ast);
    }
    catch (error) {
        if (error instanceof LexerError ||
            error instanceof ParserError ||
            error instanceof EvaluationError) {
            console.error(`${name}: ${error.message}`);
        }
        else {
            throw error;
        }
    }
}
