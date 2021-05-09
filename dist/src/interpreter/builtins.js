"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installBuiltIns = void 0;
const ast_1 = require("../ast");
const values_1 = require("../values");
function installBuiltIns(evaluator) {
    evaluator.define("nil", evaluator.nil);
    evaluator.installBuiltInFn("display", (arg) => {
        console.log(values_1.print(evaluator.evaluate(arg)));
        return evaluator.nil;
    });
    evaluator.installBuiltInFn("assert", (arg) => {
        const value = evaluator.evaluateBool(arg);
        if (!value.value) {
            const s = ast_1.printExpr(arg);
            console.error(`${arg.line}:${arg.col}: assertion failed: ${s}`);
        }
        return evaluator.nil;
    });
    evaluator.installBuiltInFn("=", (left, right) => {
        const a = evaluator.evaluate(left);
        let c;
        switch (a.typ) {
            case values_1.Type.IntType:
                c = a.value === evaluator.evaluateInt(right).value;
                break;
            case values_1.Type.BoolType:
                c = a.value === evaluator.evaluateBool(right).value;
                break;
            case values_1.Type.NilType:
                c = evaluator.evaluate(right).typ === values_1.Type.NilType;
                break;
            case values_1.Type.BuiltInFnType:
            case values_1.Type.FnType:
                throw new Error("unimplemented");
        }
        return { typ: values_1.Type.BoolType, value: c };
    });
    evaluator.installBuiltInFn("-", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: values_1.Type.IntType, value: x.value - y.value };
    });
    evaluator.installBuiltInFn("*", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: values_1.Type.IntType, value: x.value * y.value };
    });
    evaluator.installBuiltInFn("<", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: values_1.Type.BoolType, value: x.value < y.value };
    });
    evaluator.installBuiltInFn("+", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: values_1.Type.IntType, value: x.value + y.value };
    });
    evaluator.installBuiltInFn("isnil", (arg) => {
        const value = evaluator.evaluate(arg);
        const isNil = value.typ === values_1.Type.NilType;
        return { typ: values_1.Type.BoolType, value: isNil };
    });
}
exports.installBuiltIns = installBuiltIns;
