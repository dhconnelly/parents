#!/usr/bin/env node

import { readFileSync } from "fs";
import { writeFileSync } from "fs";
import { argv } from "process";

import { compile } from "../bytecode/compiler/compiler";
import { execute } from "../bytecode/vm/vm";
import { parse } from "../parser/parser";
import { Ok } from "../util";
import { printInstr } from "../bytecode/instr";
import { disasm } from "../disasm/disasm";
import { evaluate } from "../interpreter/evaluator";

export function executeFile(file: string) {
    console.log(`> executing bytecode from ${file}`);
    const bytes = readFileSync(file);
    execute(bytes).unwrap();
}

export function compileFile(file: string) {
    const outFile = file + ".bytecode";
    console.log(`> compiling ${file} to ${outFile}`);
    try {
        const bytes = Ok(readFileSync(file, "utf8"))
            .flatMap(parse)
            .flatMap(compile)
            .unwrap();
        writeFileSync(outFile, bytes);
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        process.exit(1);
    }
}

export function printDisassembled(path: string) {
    const bytes = readFileSync(path);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const instrs = disasm(view);
    let i = 0;
    for (const instr of instrs) {
        console.log(`[${i}]\t`, printInstr(instr.instr));
        i += instr.size;
    }
}

export function runFile(file: string) {
    console.log(`> running ${file}`);
    try {
        Ok(readFileSync(file, "utf8"))
            .flatMap(parse)
            .flatMap(evaluate)
            .unwrap();
    } catch (error) {
        console.error(`${file}: ${error.message}`);
        return;
    }
}

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
