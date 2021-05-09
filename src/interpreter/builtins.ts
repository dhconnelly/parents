import { Expr, printExpr } from "../ast";
import { Value, print } from "../values";
import { Evaluator } from "./evaluator";

export function installBuiltIns(evaluator: Evaluator) {
    evaluator.define("nil", evaluator.nil);

    evaluator.installBuiltInFn("display", (arg: Expr) => {
        console.log(print(evaluator.evaluate(arg)));
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

    evaluator.installBuiltInFn(
        "=",
        (left: Expr, right: Expr): Value => {
            const x = evaluator.evaluateInt(left);
            const y = evaluator.evaluateInt(right);
            return { typ: "BoolType", value: x.value === y.value };
        }
    );

    evaluator.installBuiltInFn(
        "-",
        (left: Expr, right: Expr): Value => {
            const x = evaluator.evaluateInt(left);
            const y = evaluator.evaluateInt(right);
            return { typ: "IntType", value: x.value - y.value };
        }
    );

    evaluator.installBuiltInFn(
        "*",
        (left: Expr, right: Expr): Value => {
            const x = evaluator.evaluateInt(left);
            const y = evaluator.evaluateInt(right);
            return { typ: "IntType", value: x.value * y.value };
        }
    );

    evaluator.installBuiltInFn(
        "<",
        (left: Expr, right: Expr): Value => {
            const x = evaluator.evaluateInt(left);
            const y = evaluator.evaluateInt(right);
            return { typ: "BoolType", value: x.value < y.value };
        }
    );

    evaluator.installBuiltInFn(
        "+",
        (left: Expr, right: Expr): Value => {
            const x = evaluator.evaluateInt(left);
            const y = evaluator.evaluateInt(right);
            return { typ: "IntType", value: x.value + y.value };
        }
    );

    evaluator.installBuiltInFn(
        "isnil",
        (arg): Value => {
            const value = evaluator.evaluate(arg);
            const isNil = value.typ === "NilType";
            return { typ: "BoolType", value: isNil };
        }
    );
}