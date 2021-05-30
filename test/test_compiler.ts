import { describe, it } from "mocha";
import assert from "assert";

import { Instr, Opcode, BUILT_INS, NUM_BUILT_INS } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser/parser";
import { disasm } from "../src/disasm/disasm";
import { lex } from "../src/parser/lexer";
import { Ok } from "../src/util";
import { Type } from "../src/values";

function compile(text: string): Instr[] {
    return Ok(text)
        .flatMap(parse)
        .flatMap(compileAST)
        .flatMap((bytes) =>
            Ok(disasm(new DataView(bytes.buffer)).map((si) => si.instr))
        )
        .unwrap();
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
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles booleans", function () {
        const instrs = compile("#t #f");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: true } },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 11 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 11 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["="] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 9 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 4 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["<"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["-"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles assert", function () {
        const instrs = compile("(assert #f)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.GetGlobal, index: BUILT_INS["assert"] },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles display", function () {
        const instrs = compile("(display -42)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: -42 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["display"] },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles if", function () {
        const instrs = compile("(if #t 7 9)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: true } },
            { op: Opcode.JmpIf, pc: 19 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 9 } },
            { op: Opcode.Jmp, pc: 25 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles define", function () {
        const instrs = compile("(define foo #f) (define bar 7)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles global lookups", function () {
        const instrs = compile("(define foo -7) (define bar #f) bar");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: -7 } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with no params", function () {
        const instrs = compile("(lambda () 10)");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 12 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda literal with no args", function () {
        const instrs = compile("((lambda () 10))");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 12 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            { op: Opcode.Call, arity: 0 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda global with no args", function () {
        const instrs = compile("(define f (lambda () 10)) (f)");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 12 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS },
            { op: Opcode.Call, arity: 0 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 11 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture global lambda with arg", function () {
        const instrs = compile("(define (f x) x) (define x 3) (f x)");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 11 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 1 },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture literal lambda with arg", function () {
        const instrs = compile("((lambda (x) x) 3)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
            { op: Opcode.Jmp, pc: 17 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 11, arity: 1, captures: 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed nested lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 11 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles global capture lambda with arg", function () {
        const instrs = compile("(define z 3) (lambda foo (y) z)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.Jmp, pc: 19 },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 13 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles local capture lambda with arg", function () {
        const instrs = compile("(lambda (x) (lambda (y) (+ x y)))");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 50 },
            { op: Opcode.Jmp, pc: 31 },
            { op: Opcode.Get, index: 2 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Return },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.MakeLambda, arity: 1, captures: 1, pc: 10 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls local capture lambda with arg", function () {
        const instrs = compile("((lambda (x) ((lambda (y) (+ x y)) 5)) 7)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.Jmp, pc: 67 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            { op: Opcode.Jmp, pc: 43 },
            { op: Opcode.Get, index: 2 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Return },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.MakeLambda, arity: 1, captures: 1, pc: 22 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 11 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles higher order functions", function () {
        const instrs = compile("((lambda (f) (f 1)) (lambda (x) (+ x 1)))");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 27 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: Opcode.Jmp, pc: 62 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 45, arity: 1, captures: 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles recursive lambda", function () {
        const instrs = compile(`
            (define (sum n)
                (if (= n 0)
                    0
                    (+ n (sum (- n 1)))))
            (sum 3)
        `);
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 89 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 0 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["="] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.JmpIf, pc: 82 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Get, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["-"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Get, index: 1 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Jmp, pc: 88 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 0 } },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: Opcode.DefGlobal },
            { op: Opcode.Pop },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });
});
