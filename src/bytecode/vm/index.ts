import { readFileSync } from "fs";

import { execute } from "./vm";

export function executeFile(file: string) {
    console.log(`> executing bytecode from ${file}`);
    const bytes = readFileSync(file);
    execute(bytes).unwrap();
}
