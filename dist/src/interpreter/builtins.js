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
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: "BoolType", value: x.value === y.value };
    });
    evaluator.installBuiltInFn("-", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: "IntType", value: x.value - y.value };
    });
    evaluator.installBuiltInFn("*", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: "IntType", value: x.value * y.value };
    });
    evaluator.installBuiltInFn("<", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: "BoolType", value: x.value < y.value };
    });
    evaluator.installBuiltInFn("+", (left, right) => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: "IntType", value: x.value + y.value };
    });
    evaluator.installBuiltInFn("isnil", (arg) => {
        const value = evaluator.evaluate(arg);
        const isNil = value.typ === "NilType";
        return { typ: "BoolType", value: isNil };
    });
}
exports.installBuiltIns = installBuiltIns;
