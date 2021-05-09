import { readFileSync } from "fs";

import { parse } from "../parser";
import { evaluate } from "./evaluator";

export function runFile(file: string) {
    console.log(`> running ${file}`);
    try {
        const script = readFileSync(file, "utf8");
        const ast = parse(script);
        evaluate(ast);
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
