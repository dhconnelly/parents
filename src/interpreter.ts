import { lex, LexerError } from "./lexer.js";
import { parse, ParserError } from "./parser.js";
import { evaluate, EvaluationError } from "./evaluator.js";

export function runScript(script: string) {
    try {
        const toks = lex(script);
        const ast = parse(toks);
        evaluate(ast);
    } catch (error) {
        if (error instanceof LexerError) {
            console.error(error.message);
        } else if (error instanceof ParserError) {
            console.error(error.message);
        } else if (error instanceof EvaluationError) {
            console.error(error.message);
        } else {
            throw error;
        }
    }
}
