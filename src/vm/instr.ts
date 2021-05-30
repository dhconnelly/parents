import {
    SerializableValue,
    deserialize,
    serialize,
    serializeNumber,
    print,
} from "./values";

export enum Opcode {
    Push = 1,
    Pop = 2,
    Get = 3,
    DefGlobal = 4,
    GetGlobal = 5,
    JmpIf = 6,
    Jmp = 7,
    Call = 8,
    Return = 9,
    MakeLambda = 10,
}

export type Instr =
    | PushInstr
    | PopInstr
    | JmpIfInstr
    | JmpInstr
    | DefGlobalInstr
    | GetGlobalInstr
    | CallInstr
    | ReturnInstr
    | GetStackInstr
    | MakeLambdaInstr;

type PushInstr = { op: Opcode.Push; value: SerializableValue };
type PopInstr = { op: Opcode.Pop };
type JmpIfInstr = { op: Opcode.JmpIf; pc: number };
type JmpInstr = { op: Opcode.Jmp; pc: number };
type DefGlobalInstr = { op: Opcode.DefGlobal };
type GetGlobalInstr = { op: Opcode.GetGlobal; index: number };
type CallInstr = { op: Opcode.Call; arity: number };
type ReturnInstr = { op: Opcode.Return };
type GetStackInstr = { op: Opcode.Get; index: number };
type MakeLambdaInstr = {
    op: Opcode.MakeLambda;
    pc: number;
    arity: number;
    captures: number;
};

export type SizedInstr = {
    instr: Instr;
    size: number;
};

type FixedSizeInstrOpcode =
    | Opcode.Pop
    | Opcode.Get
    | Opcode.DefGlobal
    | Opcode.GetGlobal
    | Opcode.JmpIf
    | Opcode.Jmp
    | Opcode.Call
    | Opcode.Return
    | Opcode.MakeLambda;

function fixedInstrSizes(op: FixedSizeInstrOpcode): number {
    // prettier-ignore
    switch (op) {
        case Opcode.Pop: return 1;
        case Opcode.Get: return 5;
        case Opcode.DefGlobal: return 1;
        case Opcode.GetGlobal: return 5;
        case Opcode.JmpIf: return 5;
        case Opcode.Jmp: return 5;
        case Opcode.Call: return 5;
        case Opcode.Return: return 1;
        case Opcode.MakeLambda: return 13;
    }
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
        case Opcode.Jmp:
        case Opcode.JmpIf: {
            const bytes = serializeNumber(instr.pc);
            data.push(...bytes);
            return { instr, size: fixedInstrSizes(instr.op) };
        }

        case Opcode.Get: {
            data.push(...serializeNumber(instr.index));
            return { instr, size: fixedInstrSizes(instr.op) };
        }

        case Opcode.GetGlobal: {
            const bytes = serializeNumber(instr.index);
            data.push(...bytes);
            return { instr, size: fixedInstrSizes(instr.op) };
        }

        case Opcode.Push: {
            const bytes = serialize(instr.value);
            data.push(...bytes);
            return { instr, size: bytes.length + 1 };
        }

        case Opcode.Call:
            data.push(...serializeNumber(instr.arity));
            return { instr, size: fixedInstrSizes(instr.op) };

        case Opcode.Return:
        case Opcode.DefGlobal:
        case Opcode.Pop:
            return { instr, size: fixedInstrSizes(instr.op) };

        case Opcode.MakeLambda: {
            data.push(...serializeNumber(instr.pc));
            data.push(...serializeNumber(instr.arity));
            data.push(...serializeNumber(instr.captures));
            return { instr, size: fixedInstrSizes(instr.op) };
        }
    }
}

export function readInstr(bytes: DataView, at: number): SizedInstr {
    const op = bytes.getUint8(at);
    switch (op) {
        case Opcode.Push: {
            const { value, size } = deserialize(bytes, at + 1);
            return { instr: { op, value }, size: size + 1 };
        }

        case Opcode.GetGlobal: {
            const index = bytes.getInt32(at + 1);
            return { instr: { op, index }, size: fixedInstrSizes(op) };
        }

        case Opcode.Jmp:
        case Opcode.JmpIf: {
            const pc = bytes.getInt32(at + 1);
            return { instr: { op, pc }, size: fixedInstrSizes(op) };
        }

        case Opcode.Call: {
            const arity = bytes.getInt32(at + 1);
            return { instr: { op, arity }, size: fixedInstrSizes(op) };
        }

        case Opcode.Get: {
            const index = bytes.getInt32(at + 1);
            return {
                instr: { op, index },
                size: fixedInstrSizes(op),
            };
        }

        case Opcode.MakeLambda: {
            const pc = bytes.getInt32(at + 1);
            const arity = bytes.getInt32(at + 5);
            const captures = bytes.getInt32(at + 9);
            return {
                instr: { op, pc, arity, captures },
                size: fixedInstrSizes(op),
            };
        }

        case Opcode.Return:
        case Opcode.DefGlobal:
        case Opcode.Pop:
            return { instr: { op }, size: fixedInstrSizes(op) };

        default:
            throw new Error(`invalid opcode ${op} at byte ${at}`);
    }
}

export function printInstr(instr: Instr): string {
    // prettier-ignore
    switch (instr.op) {
        case Opcode.Push: return `push ${print(instr.value)}`;
        case Opcode.Jmp: return `jmp ${instr.pc}`;
        case Opcode.JmpIf: return `jmp_if ${instr.pc}`;
        case Opcode.Pop: return "pop";
        case Opcode.DefGlobal: return `def_global`;
        case Opcode.GetGlobal: return `get_global ${instr.index}`;
        case Opcode.Call: return `call arity=${instr.arity}`;
        case Opcode.Return: return "return";
        case Opcode.Get:
            return `get_stack index=${instr.index}`;
        case Opcode.MakeLambda:
            return `make_lambda pc=${instr.pc} arity=${instr.arity} captures=${instr.captures}`;
    }
}
