import { SizedInstr, readInstr, Instr } from "../instr";

export function disasm(bytes: DataView): SizedInstr[] {
    const instrs: SizedInstr[] = [];
    let i = 0;
    while (i < bytes.byteLength) {
        const instr = readInstr(bytes, i);
        instrs.push(instr);
        i += instr.size;
    }
    return instrs;
}
