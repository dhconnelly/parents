#!/usr/bin/env node
import process from "process";
import { runFile } from "./interpreter.js";
function main(args) {
    args.forEach(runFile);
}
main(process.argv.slice(2));
