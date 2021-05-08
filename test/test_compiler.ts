import { describe, it } from "mocha";
import * as assert from "assert";

import { Instr, Opcode } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser";
import { Type } from "../src/values";
import { disasm } from "../src/disasm";

function compile(text: string): Instr[] {
    const prog = parse(text);
    const bytes = compileAST(prog);
    return disasm(new DataView(bytes.buffer));
}

describe("compiler", () => {
    it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected: Instr[] = [
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 5 },
                size: 6,
            },
            { op: Opcode.Pop, size: 1 },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 10 },
                size: 6,
            },
            { op: Opcode.Pop, size: 1 },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 15 },
                size: 6,
            },
            { op: Opcode.Pop, size: 1 },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected: Instr[] = [
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 11 },
                size: 6,
            },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 11 },
                size: 6,
            },
            { op: Opcode.Eq, size: 1 },
            { op: Opcode.Pop, size: 1 },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected: Instr[] = [
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 9 },
                size: 6,
            },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 4 },
                size: 6,
            },
            { op: Opcode.Lt, size: 1 },
            { op: Opcode.Pop, size: 1 },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected: Instr[] = [
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 7 },
                size: 6,
            },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 10 },
                size: 6,
            },
            { op: Opcode.Sub, size: 1 },
            { op: Opcode.Pop, size: 1 },
        ];
        assert.deepStrictEqual(expected, instrs);
    });

    it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 5 },
                size: 6,
            },
            {
                op: Opcode.Push,
                value: { typ: Type.IntType, value: 10 },
                size: 6,
            },
            { op: Opcode.Add, size: 1 },
            { op: Opcode.Pop, size: 1 },
        ];
        assert.deepStrictEqual(expected, instrs);
    });
});
