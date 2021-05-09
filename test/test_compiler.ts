import { describe, it } from "mocha";
import assert from "assert";

import { Instr, Opcode } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser";
import { Type } from "../src/values";
import { disasm } from "../src/disasm";

function compile(text: string): Instr[] {
    const prog = parse(text);
    const bytes = compileAST(prog);
    return disasm(new DataView(bytes.buffer)).map((si) => si.instr);
}

describe("compiler", function () {
    it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 15 } },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles booleans", function () {
        const instrs = compile("#t #f");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: true } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 11 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 11 } },
            { op: Opcode.Eq },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 9 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 4 } },
            { op: Opcode.Lt },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Sub },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Add },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles assert", function () {
        const instrs = compile("(assert #f)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.Assert },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles display", function () {
        const instrs = compile("(display -42)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: -42 } },
            { op: Opcode.Display },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
});
