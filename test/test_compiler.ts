import { describe, it } from "mocha";
import * as assert from "assert";

import { Instr, Opcode } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser";
import { Value } from "src/values";

function compile(text: string): Instr[] {
    const prog = parse(text);
    return compileAST(prog);
}

describe("compiler", () => {
    it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: "IntType", value: 15 } },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 11 } },
            { op: Opcode.Push, value: { typ: "IntType", value: 11 } },
            { op: Opcode.Eq },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 9 } },
            { op: Opcode.Push, value: { typ: "IntType", value: 4 } },
            { op: Opcode.Lt },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 7 } },
            { op: Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: Opcode.Sub },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: Opcode.Add },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("adds numbers", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: "IntType", value: 5 } },
            { op: Opcode.Push, value: { typ: "IntType", value: 10 } },
            { op: Opcode.Add },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
});
