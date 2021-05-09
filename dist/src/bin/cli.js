#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const index_1 = require("../compiler/index");
const index_2 = require("../interpreter/index");
const index_3 = require("../vm/index");
function main(args) {
    if (args.length === 0) {
        console.error("usage: parents command [args ...]");
        process.exit(1);
    }
    switch (args[0]) {
        case "help":
            console.log("available commands: help, run, compile, vm");
            break;
        case "run":
            args.slice(1).map(index_2.runFile);
            break;
        case "compile":
            args.slice(1).map(index_1.compileFile);
            break;
        case "vm":
            args.slice(1).map(index_3.executeFile);
            break;
        default:
            console.error("error: invalid command. run 'parents help'");
            process.exit(1);
    }
}
main(process_1.argv.slice(2));
