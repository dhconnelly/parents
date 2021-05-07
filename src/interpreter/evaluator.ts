import { strict as assert } from "assert";

import {
    Prog,
    Expr,
    IdentExpr,
    IfExpr,
    LetExpr,
    SeqExpr,
    CallExpr,
    LambdaExpr,
} from "../ast.js";
import { installBuiltIns } from "./builtins.js";
import {
    Value,
    Scope,
    Type,
    BoolValue,
    FnValue,
    BuiltInFnValue,
    IntValue,
    NilValue,
} from "./values.js";

export class EvaluationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

function defineAtRootError(expr: Expr): EvaluationError {
    return new EvaluationError(
        `${expr.line}:${expr.col}: define only allowed at root scope`
    );
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

export class Evaluator {
    top: Scope;
    global: Scope;
    nil: NilValue;

    constructor() {
        this.global = new Scope();
        this.top = this.global;
        this.nil = { typ: "NilType" };
    }

    lookup(expr: IdentExpr): Value {
        let value =
            this.top.lookup(expr.value) || this.global.lookup(expr.value);
        if (!value) throw lookupError(expr);
        return value;
    }

    define(name: string, binding: Value): Value {
        this.top.define(name, binding);
        return this.nil;
    }

    installBuiltInFn(name: string, fn: (...args: Expr[]) => Value) {
        this.define(name, {
            typ: "BuiltInFnType",
            arity: fn.length,
            name: name,
            impl: (args) => fn.apply(null, args),
        });
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
            value = this.nil;
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
        return last || this.nil;
    }

    evaluateLet(expr: LetExpr): Value {
        this.pushScope();
        this.define(expr.name, this.evaluate(expr.binding));
        const val = this.evaluate(expr.body);
        this.popScope();
        return val;
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
            this.top.define(f.name, f);
        }
        for (let i = 0; i < f.params.length; i++) {
            this.top.define(f.params[i], args[i]);
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

    makeLambda(expr: LambdaExpr): FnValue {
        return {
            typ: "FnType",
            body: expr.body,
            params: expr.params,
            name: expr.name,
            scope: this.top.snapshot(),
        };
    }

    evaluate(expr: Expr): Value {
        switch (expr.typ) {
            case "CallExpr":
                return this.evaluateCall(expr);
            case "DefineExpr":
                if (this.top !== this.global) {
                    throw defineAtRootError(expr);
                }
                return this.define(expr.name, this.evaluate(expr.binding));
            case "LetExpr":
                return this.evaluateLet(expr);
            case "IdentExpr":
                return this.lookup(expr);
            case "BoolExpr":
                return { typ: "BoolType", value: expr.value };
            case "IfExpr":
                return this.evaluateIf(expr);
            case "IntExpr":
                return { typ: "IntType", value: expr.value };
            case "LambdaExpr":
                return this.makeLambda(expr);
            case "SeqExpr":
                return this.evaluateSeq(expr);
        }
    }
}

export function evaluate(ast: Prog) {
    const evaluator = new Evaluator();
    installBuiltIns(evaluator);
    for (const expr of ast.exprs) {
        evaluator.evaluate(expr);
    }
}
