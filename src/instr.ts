import {
    Value,
    deserialize,
    serialize,
    serializeNumber,
    print,
} from "./values";

export const BUILT_INS = {
    "+": 0,
    "-": 1,
    "<": 2,
    "=": 3,
    assert: 4,
    display: 5,
};
export const NUM_BUILT_INS = Object.keys(BUILT_INS).length;

export enum Opcode {
    Push = 1,
    Pop = 2,
    Add = 3,
    Sub = 4,
    Eq = 5,
    Lt = 6,
    Assert = 7,
    Display = 8,
    JmpIf = 9,
    Jmp = 10,
    DefGlobal = 11,
    GetGlobal = 12,
    MakeLambda = 13,
    Call = 14,
    Return = 15,
    GetStack = 16,
}

export type Instr =
    | PushInstr
    | PopInstr
    | AddInstr
    | SubInstr
    | LtInstr
    | EqInstr
    | AssertInstr
    | DisplayInstr
    | JmpIfInstr
    | JmpInstr
    | DefGlobalInstr
    | GetGlobalInstr
    | MakeLambdaInstr
    | CallInstr
    | ReturnInstr
    | GetStackInstr;

type PushInstr = { readonly op: Opcode.Push; readonly value: Value };
type PopInstr = { readonly op: Opcode.Pop };
type AddInstr = { readonly op: Opcode.Add };
type SubInstr = { readonly op: Opcode.Sub };
type LtInstr = { readonly op: Opcode.Lt };
type EqInstr = { readonly op: Opcode.Eq };
type DisplayInstr = { readonly op: Opcode.Display };
type AssertInstr = { readonly op: Opcode.Assert };
type JmpIfInstr = { readonly op: Opcode.JmpIf; readonly pc: number };
type JmpInstr = { readonly op: Opcode.Jmp; readonly pc: number };
type DefGlobalInstr = { readonly op: Opcode.DefGlobal };
type GetGlobalInstr = { readonly op: Opcode.GetGlobal; readonly index: number };
type MakeLambdaInstr = {
    readonly op: Opcode.MakeLambda;
    readonly arity: number;
};
type CallInstr = { readonly op: Opcode.Call; readonly arity: number };
type ReturnInstr = { readonly op: Opcode.Return };
type GetStackInstr = {
    readonly op: Opcode.GetStack;
    readonly frameDist: number;
    readonly index: number;
};

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
        case Opcode.Jmp:
        case Opcode.JmpIf: {
            const bytes = serializeNumber(instr.pc);
            data.push(...bytes);
            return { instr, size: 5 };
        }

        case Opcode.GetStack: {
            data.push(...serializeNumber(instr.frameDist));
            data.push(...serializeNumber(instr.index));
            return { instr, size: 5 };
        }

        case Opcode.GetGlobal: {
            const bytes = serializeNumber(instr.index);
            data.push(...bytes);
            return { instr, size: 5 };
        }

        case Opcode.Push: {
            const bytes = serialize(instr.value);
            data.push(...bytes);
            return { instr, size: bytes.length + 1 };
        }

        case Opcode.MakeLambda:
        case Opcode.Call:
            data.push(...serializeNumber(instr.arity));
            return { instr, size: 5 };

        case Opcode.Return:
        case Opcode.DefGlobal:
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

export function readInstr(bytes: DataView, at: number): SizedInstr {
    const op = bytes.getUint8(at);
    switch (op) {
        case Opcode.Push: {
            const { value, size } = deserialize(bytes, at + 1);
            return { instr: { op, value }, size: size + 1 };
        }

        case Opcode.GetGlobal: {
            const index = bytes.getInt32(at + 1);
            return { instr: { op, index }, size: 5 };
        }

        case Opcode.Jmp:
        case Opcode.JmpIf: {
            const pc = bytes.getInt32(at + 1);
            return { instr: { op, pc }, size: 5 };
        }

        case Opcode.Call:
        case Opcode.MakeLambda: {
            const arity = bytes.getInt32(at + 1);
            return { instr: { op, arity }, size: 5 };
        }

        case Opcode.GetStack: {
            const frameDist = bytes.getInt32(at + 1);
            const index = bytes.getInt32(at + 5);
            return { instr: { op, frameDist, index }, size: 9 };
        }

        case Opcode.Return:
        case Opcode.DefGlobal:
        case Opcode.Pop:
        case Opcode.Add:
        case Opcode.Sub:
        case Opcode.Eq:
        case Opcode.Lt:
        case Opcode.Assert:
        case Opcode.Display:
            return { instr: { op }, size: 1 };

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
        case Opcode.Add: return "add";
        case Opcode.Sub: return "sub";
        case Opcode.Eq: return "eq";
        case Opcode.Lt: return "lt";
        case Opcode.Assert: return "assert";
        case Opcode.Display: return "display";
        case Opcode.DefGlobal: return `def_global`;
        case Opcode.GetGlobal: return `get_global ${instr.index}`;
        case Opcode.MakeLambda: return `make_lambda arity=${instr.arity}`;
        case Opcode.Call: return `call arity=${instr.arity}`;
        case Opcode.Return: return "return";
        case Opcode.GetStack:
            return `get_stack frame=${instr.frameDist} index=${instr.index}`;
        default:
            const __fail: never = instr;
            throw new Error();
    }
}
