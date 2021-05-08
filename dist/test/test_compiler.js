"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert = __importStar(require("assert"));
const instr_1 = require("../src/instr");
const compiler_1 = require("../src/compiler/compiler");
const parser_1 = require("../src/parser");
function compile(text) {
    const prog = parser_1.parse(text);
    return compiler_1.compile(prog);
}
mocha_1.describe("compiler", () => {
    mocha_1.it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 15 } },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 11 } },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 11 } },
            { op: instr_1.Opcode.Eq },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 9 } },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 4 } },
            { op: instr_1.Opcode.Lt },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 7 } },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: instr_1.Opcode.Sub },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: instr_1.Opcode.Add },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
    mocha_1.it("adds numbers", function () {
        const instrs = compile("(+ 5 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: instr_1.Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: instr_1.Opcode.Add },
            { op: instr_1.Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
});
