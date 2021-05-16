import { readFileSync } from "fs";
import { Ok } from "src/util";

import { lex } from "../lexer";
import { parse } from "../parser";
import { evaluate } from "./evaluator";

export function runFile(file: string) {
    console.log(`> running ${file}`);
    try {
        lex(readFileSync(file, "utf8"))
            .flatMap(parse)
            .flatMap(evaluate)
            .unwrap();
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
