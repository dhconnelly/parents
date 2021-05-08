#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFile = void 0;
const fs_1 = require("fs");
const process_1 = require("process");
const index_1 = require("../interpreter/index");
function runFile(path) {
    console.log(">", path);
    let script = null;
    try {
        script = fs_1.readFileSync(path, "utf8");
    }
    catch (error) {
        console.error(`can't read file ${path}: ${error.message}`);
        return;
    }
    index_1.runScript(path, script);
}
exports.runFile = runFile;
function main(args) {
    args.forEach(runFile);
}
main(process_1.argv.slice(2));
