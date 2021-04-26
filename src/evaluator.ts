import { strict as assert } from "assert";

import { Prog, Expr, IdentExpr, IfExpr, SeqExpr, CallExpr } from "./ast.js";
import { Option } from "./util.js";
import {
    Value,
    Scope,
    Null,
    Type,
    BoolValue,
    FnValue,
    BuiltInFnValue,
    IntValue,
    print,
} from "./values.js";

export class EvaluationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

function arityError(want: number, got: number, expr: Expr): EvaluationError {
    return new EvaluationError(
        `${expr.line}:${expr.col}: fn expected ${want} args, got ${got}`
    );
}

function lookupError(expr: IdentExpr): EvaluationError {
    return new EvaluationError(
        `${expr.line}:${expr.col}: ${expr.value} is not defined`
    );
}

function typeError(want: string, got: Type, expr: Expr): EvaluationError {
    return new EvaluationError(
        `type error at ${expr.line}:${expr.col}: want ${want}, got ${got}`
    );
}

class Evaluator {
    globals: Scope;
    top: Scope;

    constructor() {
        this.globals = new Scope();
        this.top = this.globals;
        this.installBuiltIns();
    }

    lookup(expr: IdentExpr): Value {
        let scope: Option<Scope> = this.top;
        while (scope) {
            let value = scope.bindings.get(expr.value);
            if (value) return value;
            scope = scope.up;
        }
        throw lookupError(expr);
    }

    installBuiltInFn(name: string, fn: (...args: Expr[]) => Value) {
        this.define(name, {
            typ: "BuiltInFnType",
            arity: fn.length,
            name: name,
            impl: (args) => fn.apply(null, args),
        });
    }

    installBuiltIns() {
        this.define("nil", Null);
        this.installBuiltInFn("display", (arg: Expr) => {
            console.log(print(this.evaluate(arg)));
            return Null;
        });
        this.installBuiltInFn(
            "=",
            (left: Expr, right: Expr): Value => {
                const x = this.evaluateInt(left);
                const y = this.evaluateInt(right);
                return { typ: "BoolType", value: x.value === y.value };
            }
        );
        this.installBuiltInFn(
            "-",
            (left: Expr, right: Expr): Value => {
                const x = this.evaluateInt(left);
                const y = this.evaluateInt(right);
                return { typ: "IntType", value: x.value - y.value };
            }
        );
        this.installBuiltInFn(
            "*",
            (left: Expr, right: Expr): Value => {
                const x = this.evaluateInt(left);
                const y = this.evaluateInt(right);
                return { typ: "IntType", value: x.value * y.value };
            }
        );
        this.installBuiltInFn(
            "<",
            (left: Expr, right: Expr): Value => {
                const x = this.evaluateInt(left);
                const y = this.evaluateInt(right);
                return { typ: "BoolType", value: x.value < y.value };
            }
        );
        this.installBuiltInFn(
            "+",
            (left: Expr, right: Expr): Value => {
                const x = this.evaluateInt(left);
                const y = this.evaluateInt(right);
                return { typ: "IntType", value: x.value + y.value };
            }
        );
        this.installBuiltInFn(
            "isnil",
            (arg): Value => {
                const value = this.evaluate(arg);
                const isNil = value.typ === "NullType";
                return { typ: "BoolType", value: isNil };
            }
        );
    }

    pushScope() {
        const top = new Scope(this.top);
        this.top = top;
    }

    popScope() {
        assert.ok(this.top.up);
        this.top = this.top.up;
    }

    evaluateBool(expr: Expr): BoolValue {
        const value = this.evaluate(expr);
        if (value.typ !== "BoolType") {
            throw typeError("BoolType", value.typ, expr);
        }
        return value;
    }

    evaluateInt(expr: Expr): IntValue {
        const value = this.evaluate(expr);
        if (value.typ !== "IntType") {
            throw typeError("IntType", value.typ, expr);
        }
        return value;
    }

    evaluateFn(expr: Expr): FnValue | BuiltInFnValue {
        const value = this.evaluate(expr);
        if (value.typ !== "FnType" && value.typ !== "BuiltInFnType") {
            throw typeError("FnType or BuiltInFnType", value.typ, expr);
        }
        return value;
    }

    evaluateIf(expr: IfExpr): Value {
        this.pushScope();
        let value;
        if (this.evaluateBool(expr.cond).value) {
            value = this.evaluate(expr.cons);
        } else if (expr.alt) {
            value = this.evaluate(expr.alt);
        } else {
            value = Null;
        }
        this.popScope();
        return value;
    }

    evaluateSeq(expr: SeqExpr): Value {
        this.pushScope();
        let last;
        for (const e of expr.exprs) {
            last = this.evaluate(e);
        }
        this.popScope();
        return last || Null;
    }

    define(name: string, binding: Value): void {
        this.top.bindings.set(name, binding);
    }

    evaluateUserCall(f: FnValue, expr: CallExpr): Value {
        const args = expr.args.map((expr) => this.evaluate(expr));
        if (f.params.length !== args.length) {
            throw arityError(f.params.length, args.length, expr);
        }
        let oldTop = this.top;
        this.top = f.scope;
        this.pushScope();
        if (f.name) {
            this.top.bindings.set(f.name, f);
        }
        for (let i = 0; i < f.params.length; i++) {
            this.top.bindings.set(f.params[i], args[i]);
        }
        const value = this.evaluate(f.body);
        this.popScope();
        this.top = oldTop;
        return value;
    }

    evaluateBuiltInCall(f: BuiltInFnValue, expr: CallExpr): Value {
        if (f.arity !== expr.args.length) {
            throw arityError(f.arity, expr.args.length, expr);
        }
        return f.impl(expr.args);
    }

    evaluateCall(expr: CallExpr): Value {
        const f = this.evaluateFn(expr.f);
        if (f.typ === "FnType") {
            return this.evaluateUserCall(f, expr);
        } else {
            return this.evaluateBuiltInCall(f, expr);
        }
    }

    evaluate(expr: Expr): Value {
        switch (expr.typ) {
            case "CallExpr":
                return this.evaluateCall(expr);

            case "DefineExpr":
                this.define(expr.name, this.evaluate(expr.binding));
                return Null;

            case "IdentExpr":
                return this.lookup(expr);

            case "IfExpr":
                return this.evaluateIf(expr);

            case "IntExpr":
                return { typ: "IntType", value: expr.value };

            case "LambdaExpr":
                return {
                    typ: "FnType",
                    body: expr.body,
                    params: expr.params,
                    name: expr.name,
                    scope: this.top,
                };

            case "SeqExpr":
                return this.evaluateSeq(expr);
        }
    }
}

export function evaluate(ast: Prog) {
    const evaluator = new Evaluator();
    for (const expr of ast.exprs) {
        evaluator.evaluate(expr);
    }
}