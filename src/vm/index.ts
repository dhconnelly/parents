import { readFileSync } from "fs";

import { RootError } from "../util";
import { execute } from "../vm/vm";

export function executeFile(file: string) {
    console.log(`> executing bytecode from ${file}`);
    try {
        const bytes = readFileSync(file);
        execute(bytes);
    } catch (error) {
        if (error instanceof RootError) {
            console.error(`${file}: ${error.message}`);
        } else {
            throw error;
        }
    }
}
