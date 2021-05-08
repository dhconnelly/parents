import { LexerError } from "../lexer";
import { parse, ParserError } from "../parser";
import { evaluate, EvaluationError } from "./evaluator";

export function runScript(name: string, script: string) {
    try {
        const ast = parse(script);
        evaluate(ast);
    } catch (error) {
        if (
            error instanceof LexerError ||
            error instanceof ParserError ||
            error instanceof EvaluationError
        ) {
            console.error(`${name}: ${error.message}`);
        } else {
            throw error;
        }
    }
}
