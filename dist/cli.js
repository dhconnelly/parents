#!/usr/bin/env node
import { readFileSync } from "fs";
import { argv } from "process";
import { runScript } from "./interpreter.js";
export function runFile(path) {
    console.log(">", path);
    let script = null;
    try {
        script = readFileSync(path, "utf8");
    }
    catch (error) {
        console.error(`can't read file ${path}: ${error.message}`);
        return;
    }
    runScript(path, script);
}
function main(args) {
    args.forEach(runFile);
}
main(argv.slice(2));
