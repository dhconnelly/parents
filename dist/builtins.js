import { Null, print } from "./values.js";
export function installBuiltIns(evaluator) {
    evaluator.define("nil", Null);
    evaluator.installBuiltInFn("display", (arg) => {
        console.log(print(evaluator.evaluate(arg)));
        return Null;
    });
    evaluator.installBuiltInFn("assert", (arg) => {
        const value = evaluator.evaluateBool(arg);
        if (!value.value)
            console.error(`${arg.line}:${arg.col}: assertion failed`);
        return Null;
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
        const isNil = value.typ === "NullType";
        return { typ: "BoolType", value: isNil };
    });
}
