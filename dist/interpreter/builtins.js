import { printExpr } from "../ast.js";
import { print } from "./values.js";
export function installBuiltIns(evaluator) {
    evaluator.define("nil", evaluator.nil);
    evaluator.installBuiltInFn("display", (arg) => {
        console.log(print(evaluator.evaluate(arg)));
        return evaluator.nil;
    });
    evaluator.installBuiltInFn("assert", (arg) => {
        const value = evaluator.evaluateBool(arg);
        if (!value.value) {
            const s = printExpr(arg);
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
