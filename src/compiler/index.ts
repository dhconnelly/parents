import { readFileSync, writeFileSync } from "fs";

import { Ok } from "../util";
import { parse } from "../parser/parser";
import { compile } from "./compiler";

export function compileFile(file: string) {
    const outFile = file + ".bytecode";
    console.log(`> compiling ${file} to ${outFile}`);
    try {
        const bytes = Ok(readFileSync(file, "utf8"))
            .flatMap(parse)
            .flatMap(compile)
            .unwrap();
        writeFileSync(outFile, bytes);
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        process.exit(1);
    }
}
