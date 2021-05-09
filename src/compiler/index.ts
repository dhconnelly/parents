import { readFileSync, writeFileSync } from "fs";

import { parse } from "../parser";
import { compile } from "./compiler";

export function compileFile(file: string) {
    const outFile = file + ".bytecode";
    console.log(`> compiling ${file} to ${outFile}`);
    try {
        const text = readFileSync(file, "utf8");
        const ast = parse(text);
        const bytes = compile(ast);
        writeFileSync(outFile, bytes);
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}
