"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disassembleFile = exports.printDisassembled = void 0;
const fs_1 = require("fs");
const instr_1 = require("../instr");
const disasm_1 = require("./disasm");
function printDisassembled(path) {
    const instrs = disassembleFile(path);
    let i = 0;
    for (const instr of instrs) {
        console.log(`[${i}]\t`, instr_1.printInstr(instr.instr));
        i += instr.size;
    }
}
exports.printDisassembled = printDisassembled;
function disassembleFile(path) {
    const bytes = fs_1.readFileSync(path);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return disasm_1.disasm(view);
}
exports.disassembleFile = disassembleFile;
