import fs from "fs";
import { lex } from "./lexer.js";
import { parse } from "./parser.js";
export function runFile(path) {
    try {
        const prog = fs.readFileSync(path, "utf8");
        const toks = lex(prog);
        const exprs = parse(toks);
        console.log(JSON.stringify(exprs, null, 4));
    }
    catch (error) {
        console.error(`${path}: ${error.message}`);
    }
}
