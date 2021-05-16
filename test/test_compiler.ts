import { describe, it } from "mocha";
import assert from "assert";

import { Instr, Opcode } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser";
import { Type } from "../src/values";
import { disasm } from "../src/disasm/disasm";
import { lex } from "../src/lexer";

function compile(text: string): Instr[] {
    const toks = lex(text);
    const prog = parse(toks);
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
            { op: Opcode.Eq },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 9 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 4 } },
            { op: Opcode.Lt },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Sub },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
            { op: Opcode.Add },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles assert", function () {
        const instrs = compile("(assert #f)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.BoolType, value: false } },
            { op: Opcode.Assert },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles display", function () {
        const instrs = compile("(display -42)");
        const expected: Instr[] = [
            { op: Opcode.Push, value: { typ: Type.IntType, value: -42 } },
            { op: Opcode.Display },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles if", function () {
        const instrs = compile("(if #t 7 9)");
        // prettier-ignore
        const expected: Instr[] = [
        /* 0 */ { op: Opcode.Push, value: { typ: Type.BoolType, value: true } },
        /* 3 */ { op: Opcode.JmpIf, pc: 19 },
        /* 8 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 9 } },
        /* 14 */ { op: Opcode.Jmp, pc: 25 },
        /* 19 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
        /* 25 */ { op: Opcode.Pop },
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
            { op: Opcode.GetGlobal, index: 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with no params", function () {
        const instrs = compile("(lambda () 10)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 17 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 0 },
        /* 10 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 16 */ { op: Opcode.Return },
        /* 17 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 23 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda literal with no args", function () {
        const instrs = compile("((lambda () 10))");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 17 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 0 },
        /* 10 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 16 */ { op: Opcode.Return },
        /* 17 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 23 */ { op: Opcode.Call, arity: 0 },
        /* 28 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda global with no args", function () {
        const instrs = compile("(define f (lambda () 10)) (f)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 17 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 0 },
        /* 10 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 16 */ { op: Opcode.Return },
        /* 17 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 23 */ { op: Opcode.DefGlobal },
        /* 24 */ { op: Opcode.Pop },
        /* 25 */ { op: Opcode.GetGlobal, index: 0 },
        /* 30 */ { op: Opcode.Call, arity: 0 },
        /* 35 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 20 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 1 },
        /* 10 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 19 */ { op: Opcode.Return },
        /* 20 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 26 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture global lambda with arg", function () {
        const instrs = compile("(define (f x) x) (define x 3) (f x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 20 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 1 },
        /* 10 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 19 */ { op: Opcode.Return },
        /* 20 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 26 */ { op: Opcode.DefGlobal },
        /* 27 */ { op: Opcode.Pop },
        /* 28 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 3 }},
        /* 34 */ { op: Opcode.DefGlobal },
        /* 35 */ { op: Opcode.Pop },
        /* 36 */ { op: Opcode.GetGlobal, index: 1 },
        /* 41 */ { op: Opcode.GetGlobal, index: 0 },
        /* 46 */ { op: Opcode.Call, arity: 1 },
        /* 51 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture literal lambda with arg", function () {
        const instrs = compile("((lambda (x) x) 3)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
        /*  6 */ { op: Opcode.Jmp, pc: 26 },
        /* 11 */ { op: Opcode.MakeLambda, arity: 1 },
        /* 16 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 25 */ { op: Opcode.Return },
        /* 26 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 11 } },
        /* 38 */ { op: Opcode.Call, arity: 1 },
        /* 43 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed nested lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 20 },
        /*  5 */ { op: Opcode.MakeLambda, arity: 1 },
        /* 10 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 19 */ { op: Opcode.Return },
        /* 20 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
        /* 26 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles global capture lambda with arg", function () {
        const instrs = compile("(define z 3) (lambda foo (y) (* y z)");
        const expected: Instr[] = [];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles local capture lambda with arg", function () {
        const instrs = compile("(let (z 5) (lambda foo (y) (* y z)))");
        const expected: Instr[] = [];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls local lambda with arg and captures", function () {
        const instrs = compile(
            "(let (x 1) (let (f (lambda (y) (+ y x))) (f 3)))"
        );
        const expected: Instr[] = [];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles multiple arguments with captures", function () {
        const instrs = compile(
            `((let (x 2)
                  (lambda (y z) (* x (+ y z))))
              4 3)`
        );
        const expected: Instr[] = [];
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
        const expected: Instr[] = [];
        assert.deepStrictEqual(instrs, expected);
    });
});
