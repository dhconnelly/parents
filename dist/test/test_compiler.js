"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert_1 = __importDefault(require("assert"));
const instr_1 = require("../src/instr");
const compiler_1 = require("../src/compiler/compiler");
const parser_1 = require("../src/parser");
const values_1 = require("../src/values");
const disasm_1 = require("../src/disasm");
function compile(text) {
    const prog = parser_1.parse(text);
    const bytes = compiler_1.compile(prog);
    return disasm_1.disasm(new DataView(bytes.buffer)).map((si) => si.instr);
}
mocha_1.describe("compiler", function () {
    mocha_1.it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 5 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 15 } },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 11 } },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 11 } },
            { op: instr_1.Opcode.Eq },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 9 } },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 4 } },
            { op: instr_1.Opcode.Lt },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 7 } },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.Sub },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 5 } },
            { op: instr_1.Opcode.Push, value: { typ: values_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.Add },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(expected, instrs);
    });
});
