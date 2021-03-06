import { Option } from "src/util";
import { Expr, print as printExpr } from "../ast";
import { Value, print as printValue } from "./values";
import { Type } from "../types";
import { Evaluator } from "./evaluator";

export function installBuiltIns(evaluator: Evaluator) {
    evaluator.define("nil", evaluator.nil);

    evaluator.installBuiltInFn("memory", () => {
        return { typ: Type.IntType, value: process.memoryUsage().heapUsed };
    });

    evaluator.installBuiltInFn("display", (arg: Expr) => {
        console.log(printValue(evaluator.evaluate(arg)));
        return evaluator.nil;
    });

    evaluator.installBuiltInFn("assert", (arg: Expr) => {
        const value = evaluator.evaluateBool(arg);
        if (!value.value) {
            const s = printExpr(arg);
            console.error(`${arg.line}:${arg.col}: assertion failed: ${s}`);
        }
        return evaluator.nil;
    });

    evaluator.installBuiltInFn("=", (left: Expr, right: Expr): Value => {
        const a = evaluator.evaluate(left);
        let c: Option<boolean>;
        switch (a.typ) {
            case Type.IntType:
                c = a.value === evaluator.evaluateInt(right).value;
                break;
            case Type.BoolType:
                c = a.value === evaluator.evaluateBool(right).value;
                break;
            case Type.NilType:
                c = evaluator.evaluate(right).typ === Type.NilType;
                break;
            case Type.BuiltInFnType:
            case Type.FnType:
                throw new Error("unimplemented");
        }
        return { typ: Type.BoolType, value: c };
    });

    evaluator.installBuiltInFn("-", (left: Expr, right: Expr): Value => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: Type.IntType, value: x.value - y.value };
    });

    evaluator.installBuiltInFn("*", (left: Expr, right: Expr): Value => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: Type.IntType, value: x.value * y.value };
    });

    evaluator.installBuiltInFn("<", (left: Expr, right: Expr): Value => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: Type.BoolType, value: x.value < y.value };
    });

    evaluator.installBuiltInFn("+", (left: Expr, right: Expr): Value => {
        const x = evaluator.evaluateInt(left);
        const y = evaluator.evaluateInt(right);
        return { typ: Type.IntType, value: x.value + y.value };
    });

    evaluator.installBuiltInFn("isnil", (arg): Value => {
        const value = evaluator.evaluate(arg);
        const isNil = value.typ === Type.NilType;
        return { typ: Type.BoolType, value: isNil };
    });
}
