#!/usr/bin/env node

import { argv } from "process";

import { printDisassembled } from "../disasm/index";
import { compileFile } from "../bytecode/compiler/index";
import { runFile } from "../interpreter/index";
import { executeFile } from "../bytecode/vm/index";

function main(args: string[]): void {
    if (args.length === 0) {
        console.error("usage: parents command [args ...]");
        process.exit(1);
    }
    switch (args[0]) {
        case "help":
            console.log("available commands: help, run, compile, vm, disasm");
            break;
        case "run":
            args.slice(1).forEach(runFile);
            break;
        case "compile":
            args.slice(1).forEach(compileFile);
            break;
        case "vm":
            args.slice(1).forEach(executeFile);
            break;
        case "disasm":
            args.slice(1).forEach(printDisassembled);
            break;
        default:
            console.error("error: invalid command. run 'parents help'");
            process.exit(1);
    }
}

main(argv.slice(2));
