"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disasm = void 0;
const instr_1 = require("./instr");
function disasm(bytes) {
    const instrs = [];
    let i = 0;
    while (i < bytes.byteLength) {
        const instr = instr_1.readInstr(new DataView(bytes.buffer, i));
        instrs.push(instr);
        i += instr.size;
    }
    return instrs;
}
exports.disasm = disasm;
