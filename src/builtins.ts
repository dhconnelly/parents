import { Expr } from "./ast.js";
import { Value, Null, print } from "./values.js";
import { Evaluator } from "./evaluator";

export function installBuiltIns(evaluator: Evaluator) {
    evaluator.define("nil", Null);

    evaluator.installBuiltInFn("display", (arg: Expr) => {
        console.log(print(evaluator.evaluate(arg)));
        return Null;
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
            const isNil = value.typ === "NullType";
            return { typ: "BoolType", value: isNil };
        }
    );
}
