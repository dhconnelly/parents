import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import { evaluate } from "./evaluator.js";

export function runScript(script: string) {
    try {
        const toks = lex(script);
        const ast = parse(toks);
        evaluate(ast);
    } catch (error) {
        console.error(error.message);
    }
}
