"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printInstr = exports.readInstr = exports.writeInstr = exports.Opcode = exports.NUM_BUILT_INS = exports.BUILT_INS = void 0;
const values_1 = require("./values");
// prettier-ignore
exports.BUILT_INS = {
    "+": 0,
    "-": 1,
    "<": 2,
    "=": 3,
    "assert": 4,
    "display": 5,
    "*": 6,
    "isnil": 7,
    "nil": 8,
};
exports.NUM_BUILT_INS = Object.keys(exports.BUILT_INS).length;
var Opcode;
(function (Opcode) {
    Opcode[Opcode["Push"] = 1] = "Push";
    Opcode[Opcode["Pop"] = 2] = "Pop";
    Opcode[Opcode["Get"] = 3] = "Get";
    Opcode[Opcode["DefGlobal"] = 4] = "DefGlobal";
    Opcode[Opcode["GetGlobal"] = 5] = "GetGlobal";
    Opcode[Opcode["JmpIf"] = 6] = "JmpIf";
    Opcode[Opcode["Jmp"] = 7] = "Jmp";
    Opcode[Opcode["Call"] = 8] = "Call";
    Opcode[Opcode["Return"] = 9] = "Return";
    Opcode[Opcode["MakeLambda"] = 10] = "MakeLambda";
})(Opcode = exports.Opcode || (exports.Opcode = {}));
function fixedInstrSizes(op) {
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
function writeInstr(instr, data) {
    data.push(instr.op);
    switch (instr.op) {
        case Opcode.Jmp:
        case Opcode.JmpIf: {
            const bytes = values_1.serializeNumber(instr.pc);
            data.push(...bytes);
            return { instr, size: fixedInstrSizes(instr.op) };
        }
        case Opcode.Get: {
            data.push(...values_1.serializeNumber(instr.index));
            return { instr, size: fixedInstrSizes(instr.op) };
        }
        case Opcode.GetGlobal: {
            const bytes = values_1.serializeNumber(instr.index);
            data.push(...bytes);
            return { instr, size: fixedInstrSizes(instr.op) };
        }
        case Opcode.Push: {
            const bytes = values_1.serialize(instr.value);
            data.push(...bytes);
            return { instr, size: bytes.length + 1 };
        }
        case Opcode.Call:
            data.push(...values_1.serializeNumber(instr.arity));
            return { instr, size: fixedInstrSizes(instr.op) };
        case Opcode.Return:
        case Opcode.DefGlobal:
        case Opcode.Pop:
            return { instr, size: fixedInstrSizes(instr.op) };
        case Opcode.MakeLambda: {
            data.push(...values_1.serializeNumber(instr.pc));
            data.push(...values_1.serializeNumber(instr.arity));
            data.push(...values_1.serializeNumber(instr.captures));
            return { instr, size: fixedInstrSizes(instr.op) };
        }
    }
}
exports.writeInstr = writeInstr;
function readInstr(bytes, at) {
    const op = bytes.getUint8(at);
    switch (op) {
        case Opcode.Push: {
            const { value, size } = values_1.deserialize(bytes, at + 1);
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
exports.readInstr = readInstr;
function printInstr(instr) {
    // prettier-ignore
    switch (instr.op) {
        case Opcode.Push: return `push ${values_1.print(instr.value)}`;
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
exports.printInstr = printInstr;
