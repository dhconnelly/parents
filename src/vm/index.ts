import { readFileSync } from "fs";

import { RootError } from "../errors";
import { execute } from "../vm/vm";

export function executeFile(file: string) {
    console.log(`> executing bytecode from ${file}`);
    const bytes = readFileSync(file);
    execute(bytes);
}
