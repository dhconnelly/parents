import { describe, it } from "mocha";
import assert from "assert";

import { Instr, Opcode, BUILT_INS, NUM_BUILT_INS } from "../src/instr";
import { compile as compileAST } from "../src/compiler/compiler";
import { parse } from "../src/parser";
import { Type } from "../src/values";
import { disasm } from "../src/disasm/disasm";
import { lex } from "../src/lexer";
import { Ok } from "../src/util";

function compile(text: string): Instr[] {
    return Ok(text)
        .flatMap(lex)
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
            { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 1 },
            { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with no params", function () {
        const instrs = compile("(lambda () 10)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 12 },
        /*  5 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 11 */ { op: Opcode.Return },
        /* 12 */ { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
        /* 25 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda literal with no args", function () {
        const instrs = compile("((lambda () 10))");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 12 },
        /*  5 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 11 */ { op: Opcode.Return },
        /* 12 */ { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
        /* 25 */ { op: Opcode.Call, arity: 0 },
        /* 30 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture unnamed lambda global with no args", function () {
        const instrs = compile("(define f (lambda () 10)) (f)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 12 },
        /* 10 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 10 } },
        /* 11 */ { op: Opcode.Return },
        /* 12 */ { op: Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
        /* 25 */ { op: Opcode.DefGlobal },
        /* 26 */ { op: Opcode.Pop },
        /* 27 */ { op: Opcode.GetGlobal, index: NUM_BUILT_INS},
        /* 32 */ { op: Opcode.Call, arity: 0 },
        /* 37 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 15 },
        /*  5 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 14 */ { op: Opcode.Return },
        /* 12 */ { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
        /* 25 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture global lambda with arg", function () {
        const instrs = compile("(define (f x) x) (define x 3) (f x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 15 },
        /*  5 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 14 */ { op: Opcode.Return },
        /* 15 */ { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
        /* 28 */ { op: Opcode.DefGlobal },
        /* 29 */ { op: Opcode.Pop },
        /* 30 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 3 }},
        /* 36 */ { op: Opcode.DefGlobal },
        /* 37 */ { op: Opcode.Pop },
        /* 38 */ { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 1 },
        /* 43 */ { op: Opcode.GetGlobal, index: NUM_BUILT_INS + 0 },
        /* 48 */ { op: Opcode.Call, arity: 1 },
        /* 53 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls no-capture literal lambda with arg", function () {
        const instrs = compile("((lambda (x) x) 3)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
        /*  6 */ { op: Opcode.Jmp, pc: 21 },
        /* 11 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 20 */ { op: Opcode.Return },
        /* 21 */ { op: Opcode.MakeLambda, pc: 11, arity: 1, captures: 0 },
        /* 34 */ { op: Opcode.Call, arity: 1 },
        /* 39 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles no-capture unnamed nested lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 15 },
        /*  5 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
        /* 14 */ { op: Opcode.Return },
        /* 15 */ { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
        /* 26 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles global capture lambda with arg", function () {
        const instrs = compile("(define z 3) (lambda foo (y) z)");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 3 } },
        /*  6 */ { op: Opcode.DefGlobal },
        /*  7 */ { op: Opcode.Pop },
        /*  8 */ { op: Opcode.Jmp, pc: 19 },
        /* 13 */ { op: Opcode.GetGlobal, index: NUM_BUILT_INS },
        /* 18 */ { op: Opcode.Return },
        /* 19 */ { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 13 },
        /* 32 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles local capture lambda with arg", function () {
        const instrs = compile("(lambda (x) (lambda (y) (+ x y)))");
        // prettier-ignore
        const expected: Instr[] = [
        /*  0 */ { op: Opcode.Jmp, pc: 62 },
        /*  5 */ { op: Opcode.Jmp, pc: 39 },
        /* 10 */ { op: Opcode.GetStack,frameDist: 0, index: 2 },
        /* 19 */ { op: Opcode.GetStack,frameDist: 0, index: 0 },
        /* 28 */ { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
        /* 33 */ { op: Opcode.Call, arity: 2 },
        /* 38 */ { op: Opcode.Return },
        /* 39 */ { op: Opcode.GetStack, frameDist: 1, index: 0 },
        /* 48 */ { op: Opcode.MakeLambda, arity: 1, captures: 1, pc: 10 },
        /* 61 */ { op: Opcode.Return },
        /* 62 */ { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
        /* 75 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("calls local capture lambda with arg", function () {
        const instrs = compile("((lambda (x) ((lambda (y) (+ x y)) 5)) 7)");
        // prettier-ignore
        const expected: Instr[] = [
            /*  0 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 7 } },
            /*  6 */ { op: Opcode.Jmp, pc: 79 },
            /* 11 */ { op: Opcode.Push, value: { typ: Type.IntType, value: 5 } },
            /* 17 */ { op: Opcode.Jmp, pc: 51 },
            /* 22 */ { op: Opcode.GetStack, frameDist: 0, index: 2 },
            /* 27 */ { op: Opcode.GetStack, frameDist: 0, index: 0 },
            /* 40 */ { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            /* 45 */ { op: Opcode.Call, arity: 2 },
            /* 50 */ { op: Opcode.Return },
            /* 51 */ { op: Opcode.GetStack, frameDist: 1, index: 0 },
            /* 60 */ { op: Opcode.MakeLambda, arity: 1, captures: 1, pc: 22 },
            /* 73 */ { op: Opcode.Call, arity: 1 },
            /* 78 */ { op: Opcode.Return },
            /* 79 */ { op: Opcode.MakeLambda, arity: 1, captures: 0, pc: 11 },
            /* 92 */ { op: Opcode.Call, arity: 1 },
            /* 97 */ { op: Opcode.Pop },
        ];
        assert.deepStrictEqual(instrs, expected);
    });

    it("compiles higher order functions", function () {
        const instrs = compile("((lambda (f) (f 1)) (lambda (x) (+ x 1)))");
        const expected: Instr[] = [
            { op: Opcode.Jmp, pc: 31 },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: Opcode.Jmp, pc: 70 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.Return },
            { op: Opcode.MakeLambda, pc: 49, arity: 1, captures: 0 },
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
            { op: Opcode.Jmp, pc: 105 },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 0 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["="] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.JmpIf, pc: 98 },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.Push, value: { typ: Type.IntType, value: 1 } },
            { op: Opcode.GetGlobal, index: BUILT_INS["-"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.GetStack, frameDist: 0, index: 0 },
            { op: Opcode.Call, arity: 1 },
            { op: Opcode.GetGlobal, index: BUILT_INS["+"] },
            { op: Opcode.Call, arity: 2 },
            { op: Opcode.Jmp, pc: 104 },
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
