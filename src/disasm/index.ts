import { readFileSync } from "fs";

import { printInstr, SizedInstr } from "../instr";
import { disasm } from "./disasm";

export function printDisassembled(path: string) {
    const instrs = disassembleFile(path);
    let i = 0;
    for (const instr of instrs) {
        console.log(`[${i}]\t`, printInstr(instr.instr));
        i += instr.size;
    }
}

export function disassembleFile(path: string): SizedInstr[] {
    const bytes = readFileSync(path);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return disasm(view);
}
