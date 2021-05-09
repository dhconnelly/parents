import { Value, deserialize, serialize } from "./values";

export enum Opcode {
    Push = 1,
    Pop = 2,
    Add = 3,
    Sub = 4,
    Eq = 5,
    Lt = 6,
    Assert = 7,
    Display = 8,
}

export type Instr =
    | PushInstr
    | PopInstr
    | AddInstr
    | SubInstr
    | LtInstr
    | EqInstr
    | AssertInstr
    | DisplayInstr;

type PushInstr = { readonly op: Opcode.Push; readonly value: Value };
type PopInstr = { readonly op: Opcode.Pop };
type AddInstr = { readonly op: Opcode.Add };
type SubInstr = { readonly op: Opcode.Sub };
type LtInstr = { readonly op: Opcode.Lt };
type EqInstr = { readonly op: Opcode.Eq };
type DisplayInstr = { readonly op: Opcode.Display };
type AssertInstr = { readonly op: Opcode.Assert };

export type SizedInstr = {
    readonly instr: Instr;
    readonly size: number;
};

function cannot(x: never): never {
    throw new Error("never");
}

// bytecode format:
// - variable-length instructions
// - many are one byte, unless they carry a value
//
// layout:
// without value: [ opcode ]
// with value: [ opcode | type | value bytes... ]
//
// See values.ts for details on the value serialization format.
export function writeInstr(instr: Instr, data: number[]): SizedInstr {
    data.push(instr.op);
    switch (instr.op) {
        case Opcode.Push:
            const bytes = serialize(instr.value);
            data.push(...bytes);
            return { instr, size: bytes.length + 1 };
        case Opcode.Pop:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Assert:
        case Opcode.Display:
            return { instr, size: 1 };
        default:
            cannot(instr);
    }
}

export function readInstr(bytes: DataView): SizedInstr {
    const op = bytes.getUint8(0);
    switch (op) {
        case Opcode.Push:
            const subview = new DataView(bytes.buffer, bytes.byteOffset + 1);
            const { value, size } = deserialize(subview);
            return { instr: { op, value: value }, size: size + 1 };
        case Opcode.Pop:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Assert:
        case Opcode.Display:
            return { instr: { op }, size: 1 };
        default:
            throw new Error(`invalid opcode ${op} at byte ${bytes.byteOffset}`);
    }
}
