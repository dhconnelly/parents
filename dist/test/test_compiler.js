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
const types_1 = require("../src/types");
const disasm_1 = require("../src/disasm/disasm");
const lexer_1 = require("../src/lexer");
const util_1 = require("../src/util");
function compile(text) {
    return util_1.Ok(text)
        .flatMap(lexer_1.lex)
        .flatMap(parser_1.parse)
        .flatMap(compiler_1.compile)
        .flatMap((bytes) => util_1.Ok(disasm_1.disasm(new DataView(bytes.buffer)).map((si) => si.instr)))
        .unwrap();
}
mocha_1.describe("compiler", function () {
    mocha_1.it("compiles numbers", function () {
        const instrs = compile("5 10 15");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 5 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 15 } },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles booleans", function () {
        const instrs = compile("#t #f");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: true } },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: false } },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles =", function () {
        const instrs = compile("(= 11 11)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 11 } },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 11 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["="] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles <", function () {
        const instrs = compile("(< 9 4)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 9 } },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 4 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["<"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles -", function () {
        const instrs = compile("(- 7 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 7 } },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["-"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles +", function () {
        const instrs = compile("(+ 5 10)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 5 } },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["+"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles assert", function () {
        const instrs = compile("(assert #f)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: false } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["assert"] },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles display", function () {
        const instrs = compile("(display -42)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: -42 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["display"] },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles if", function () {
        const instrs = compile("(if #t 7 9)");
        // prettier-ignore
        const expected = [
            /* 0 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: true } },
            /* 3 */ { op: instr_1.Opcode.JmpIf, pc: 19 },
            /* 8 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 9 } },
            /* 14 */ { op: instr_1.Opcode.Jmp, pc: 25 },
            /* 19 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 7 } },
            /* 25 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles define", function () {
        const instrs = compile("(define foo #f) (define bar 7)");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: false } },
            { op: instr_1.Opcode.DefGlobal },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 7 } },
            { op: instr_1.Opcode.DefGlobal },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles global lookups", function () {
        const instrs = compile("(define foo -7) (define bar #f) bar");
        const expected = [
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: -7 } },
            { op: instr_1.Opcode.DefGlobal },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.BoolType, value: false } },
            { op: instr_1.Opcode.DefGlobal },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS + 1 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles no-capture unnamed lambda with no params", function () {
        const instrs = compile("(lambda () 10)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 12 },
            /*  5 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            /* 11 */ { op: instr_1.Opcode.Return },
            /* 12 */ { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            /* 25 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("calls no-capture unnamed lambda literal with no args", function () {
        const instrs = compile("((lambda () 10))");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 12 },
            /*  5 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            /* 11 */ { op: instr_1.Opcode.Return },
            /* 12 */ { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            /* 25 */ { op: instr_1.Opcode.Call, arity: 0 },
            /* 30 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("calls no-capture unnamed lambda global with no args", function () {
        const instrs = compile("(define f (lambda () 10)) (f)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 12 },
            /* 10 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 10 } },
            /* 11 */ { op: instr_1.Opcode.Return },
            /* 12 */ { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 0, captures: 0 },
            /* 25 */ { op: instr_1.Opcode.DefGlobal },
            /* 26 */ { op: instr_1.Opcode.Pop },
            /* 27 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS },
            /* 32 */ { op: instr_1.Opcode.Call, arity: 0 },
            /* 37 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles no-capture unnamed lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 15 },
            /*  5 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 14 */ { op: instr_1.Opcode.Return },
            /* 12 */ { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            /* 25 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("calls no-capture global lambda with arg", function () {
        const instrs = compile("(define (f x) x) (define x 3) (f x)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 15 },
            /*  5 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 14 */ { op: instr_1.Opcode.Return },
            /* 15 */ { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            /* 28 */ { op: instr_1.Opcode.DefGlobal },
            /* 29 */ { op: instr_1.Opcode.Pop },
            /* 30 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 3 } },
            /* 36 */ { op: instr_1.Opcode.DefGlobal },
            /* 37 */ { op: instr_1.Opcode.Pop },
            /* 38 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS + 1 },
            /* 43 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS + 0 },
            /* 48 */ { op: instr_1.Opcode.Call, arity: 1 },
            /* 53 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("calls no-capture literal lambda with arg", function () {
        const instrs = compile("((lambda (x) x) 3)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 3 } },
            /*  6 */ { op: instr_1.Opcode.Jmp, pc: 21 },
            /* 11 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 20 */ { op: instr_1.Opcode.Return },
            /* 21 */ { op: instr_1.Opcode.MakeLambda, pc: 11, arity: 1, captures: 0 },
            /* 34 */ { op: instr_1.Opcode.Call, arity: 1 },
            /* 39 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles no-capture unnamed nested lambda with arg", function () {
        const instrs = compile("(lambda (x) x)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 15 },
            /*  5 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 14 */ { op: instr_1.Opcode.Return },
            /* 15 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
            /* 26 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles global capture lambda with arg", function () {
        const instrs = compile("(define z 3) (lambda foo (y) z)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 3 } },
            /*  6 */ { op: instr_1.Opcode.DefGlobal },
            /*  7 */ { op: instr_1.Opcode.Pop },
            /*  8 */ { op: instr_1.Opcode.Jmp, pc: 19 },
            /* 13 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS },
            /* 18 */ { op: instr_1.Opcode.Return },
            /* 19 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 0, pc: 13 },
            /* 32 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles local capture lambda with arg", function () {
        const instrs = compile("(lambda (x) (lambda (y) (+ x y)))");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Jmp, pc: 62 },
            /*  5 */ { op: instr_1.Opcode.Jmp, pc: 39 },
            /* 10 */ { op: instr_1.Opcode.Get, index: 2 },
            /* 19 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 28 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["+"] },
            /* 33 */ { op: instr_1.Opcode.Call, arity: 2 },
            /* 38 */ { op: instr_1.Opcode.Return },
            /* 39 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 48 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 1, pc: 10 },
            /* 61 */ { op: instr_1.Opcode.Return },
            /* 62 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 0, pc: 5 },
            /* 75 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("calls local capture lambda with arg", function () {
        const instrs = compile("((lambda (x) ((lambda (y) (+ x y)) 5)) 7)");
        // prettier-ignore
        const expected = [
            /*  0 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 7 } },
            /*  6 */ { op: instr_1.Opcode.Jmp, pc: 79 },
            /* 11 */ { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 5 } },
            /* 17 */ { op: instr_1.Opcode.Jmp, pc: 51 },
            /* 22 */ { op: instr_1.Opcode.Get, index: 2 },
            /* 27 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 40 */ { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["+"] },
            /* 45 */ { op: instr_1.Opcode.Call, arity: 2 },
            /* 50 */ { op: instr_1.Opcode.Return },
            /* 51 */ { op: instr_1.Opcode.Get, index: 0 },
            /* 60 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 1, pc: 22 },
            /* 73 */ { op: instr_1.Opcode.Call, arity: 1 },
            /* 78 */ { op: instr_1.Opcode.Return },
            /* 79 */ { op: instr_1.Opcode.MakeLambda, arity: 1, captures: 0, pc: 11 },
            /* 92 */ { op: instr_1.Opcode.Call, arity: 1 },
            /* 97 */ { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles higher order functions", function () {
        const instrs = compile("((lambda (f) (f 1)) (lambda (x) (+ x 1)))");
        const expected = [
            { op: instr_1.Opcode.Jmp, pc: 31 },
            { op: instr_1.Opcode.Get, index: 0 },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 1 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["+"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Return },
            { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: instr_1.Opcode.Jmp, pc: 70 },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 1 } },
            { op: instr_1.Opcode.Get, index: 0 },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.Return },
            { op: instr_1.Opcode.MakeLambda, pc: 49, arity: 1, captures: 0 },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
    mocha_1.it("compiles recursive lambda", function () {
        const instrs = compile(`
            (define (sum n)
                (if (= n 0)
                    0
                    (+ n (sum (- n 1)))))
            (sum 3)
        `);
        const expected = [
            { op: instr_1.Opcode.Jmp, pc: 105 },
            { op: instr_1.Opcode.Get, index: 0 },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 0 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["="] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.JmpIf, pc: 98 },
            { op: instr_1.Opcode.Get, index: 0 },
            { op: instr_1.Opcode.Get, index: 0 },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 1 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["-"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Get, index: 1 },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.BUILT_INS["+"] },
            { op: instr_1.Opcode.Call, arity: 2 },
            { op: instr_1.Opcode.Jmp, pc: 104 },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 0 } },
            { op: instr_1.Opcode.Return },
            { op: instr_1.Opcode.MakeLambda, pc: 5, arity: 1, captures: 0 },
            { op: instr_1.Opcode.DefGlobal },
            { op: instr_1.Opcode.Pop },
            { op: instr_1.Opcode.Push, value: { typ: types_1.Type.IntType, value: 3 } },
            { op: instr_1.Opcode.GetGlobal, index: instr_1.NUM_BUILT_INS },
            { op: instr_1.Opcode.Call, arity: 1 },
            { op: instr_1.Opcode.Pop },
        ];
        assert_1.default.deepStrictEqual(instrs, expected);
    });
});
