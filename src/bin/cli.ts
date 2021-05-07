#!/usr/bin/env node

import { readFileSync } from "fs";
import { argv } from "process";

import { runScript } from "../interpreter/index.js";

export function runFile(path: string) {
    console.log(">", path);
    let script = null;
    try {
        script = readFileSync(path, "utf8");
    } catch (error) {
        console.error(`can't read file ${path}: ${error.message}`);
        return;
    }
    runScript(path, script);
}

function main(args: string[]): void {
    args.forEach(runFile);
}

main(argv.slice(2));
