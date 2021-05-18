#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const index_1 = require("../disasm/index");
const index_2 = require("../compiler/index");
const index_3 = require("../interpreter/index");
const index_4 = require("../vm/index");
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
            args.slice(1).forEach(index_3.runFile);
            break;
        case "compile":
            args.slice(1).forEach(index_2.compileFile);
            break;
        case "vm":
            args.slice(1).forEach(index_4.executeFile);
            break;
        case "disasm":
            args.slice(1).forEach(index_1.printDisassembled);
            break;
        default:
            console.error("error: invalid command. run 'parents help'");
            process.exit(1);
    }
}
main(process_1.argv.slice(2));
