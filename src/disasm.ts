import { Instr, Opcode } from "./instr";
import { deserialize } from "./values";

function readInstr(bytes: DataView): Instr {
    const op = bytes.getUint8(0);
    switch (op) {
        case Opcode.Push:
            const from = bytes.byteOffset + 1;
            const value = deserialize(new DataView(bytes.buffer, from));
            return { op, value: value.value, size: value.size + 1 };
        case Opcode.Pop:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Assert:
        case Opcode.Display:
            return { op, size: 1 };
        default:
            throw new Error(
                `invalid opcode ${op} at byte offset ${bytes.byteOffset}`
            );
    }
}

export function disasm(bytes: DataView): Instr[] {
    const instrs: Instr[] = [];
    let i = 0;
    while (i < bytes.byteLength) {
        const instr = readInstr(new DataView(bytes.buffer, i));
        instrs.push(instr);
        i += instr.size;
    }
    return instrs;
}
