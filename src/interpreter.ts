import fs from "fs";

import { lex } from "./lexer.js";

export function runFile(path: string) {
    const prog = fs.readFileSync(path, "utf8");
    const toks = lex(prog);
    console.log(toks);
}
