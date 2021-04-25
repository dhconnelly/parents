import fs from "fs";

import { lex } from "./lexer.js";
import { parse } from "./parser.js";

export function runFile(path: string) {
    try {
        const prog = fs.readFileSync(path, "utf8");
        const toks = lex(prog);
        const exprs = parse(toks);
        console.log(toks);
    } catch (error) {
        console.error(`${path}: ${error.message}`);
    }
}
