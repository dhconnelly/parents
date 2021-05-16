import { readFileSync } from "fs";

import { lex } from "../lexer";
import { parse } from "../parser";
import { evaluate } from "./evaluator";
import { Ok } from "../util";

export function runFile(file: string) {
    console.log(`> running ${file}`);
    try {
        Ok(readFileSync(file, "utf8"))
            .flatMap(lex)
            .flatMap(parse)
            .flatMap(evaluate)
            .unwrap();
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
