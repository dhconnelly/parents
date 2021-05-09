"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInstr = exports.writeInstr = exports.Opcode = void 0;
const values_1 = require("./values");
var Opcode;
(function (Opcode) {
    Opcode[Opcode["Push"] = 1] = "Push";
    Opcode[Opcode["Pop"] = 2] = "Pop";
    Opcode[Opcode["Add"] = 3] = "Add";
    Opcode[Opcode["Sub"] = 4] = "Sub";
    Opcode[Opcode["Eq"] = 5] = "Eq";
    Opcode[Opcode["Lt"] = 6] = "Lt";
    Opcode[Opcode["Assert"] = 7] = "Assert";
    Opcode[Opcode["Display"] = 8] = "Display";
})(Opcode = exports.Opcode || (exports.Opcode = {}));
function cannot(x) {
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
function writeInstr(instr, data) {
    data.push(instr.op);
    switch (instr.op) {
        case Opcode.Push:
            const bytes = values_1.serialize(instr.value);
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
exports.writeInstr = writeInstr;
function readInstr(bytes, at) {
    const op = bytes.getUint8(at);
    switch (op) {
        case Opcode.Push:
            const { value, size } = values_1.deserialize(bytes, at + 1);
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
exports.readInstr = readInstr;
