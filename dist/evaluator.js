import { strict as assert } from "assert";
import { installBuiltIns } from "./builtins.js";
import { Scope, Null, } from "./values.js";
export class EvaluationError extends Error {
    constructor(message) {
        super(message);
    }
}
function arityError(want, got, expr) {
    return new EvaluationError(`${expr.line}:${expr.col}: fn expected ${want} args, got ${got}`);
}
function lookupError(expr) {
    return new EvaluationError(`${expr.line}:${expr.col}: ${expr.value} is not defined`);
}
function typeError(want, got, expr) {
    return new EvaluationError(`type error at ${expr.line}:${expr.col}: want ${want}, got ${got}`);
}
export class Evaluator {
    constructor() {
        this.top = new Scope();
    }
    lookup(expr) {
        let value = this.top.lookup(expr.value);
        if (!value)
            throw lookupError(expr);
        return value;
    }
    define(name, binding) {
        this.top.bindings.set(name, binding);
        return Null;
    }
    installBuiltInFn(name, fn) {
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
    evaluateBool(expr) {
        const value = this.evaluate(expr);
        if (value.typ !== "BoolType") {
            throw typeError("BoolType", value.typ, expr);
        }
        return value;
    }
    evaluateInt(expr) {
        const value = this.evaluate(expr);
        if (value.typ !== "IntType") {
            throw typeError("IntType", value.typ, expr);
        }
        return value;
    }
    evaluateFn(expr) {
        const value = this.evaluate(expr);
        if (value.typ !== "FnType" && value.typ !== "BuiltInFnType") {
            throw typeError("FnType or BuiltInFnType", value.typ, expr);
        }
        return value;
    }
    evaluateIf(expr) {
        this.pushScope();
        let value;
        if (this.evaluateBool(expr.cond).value) {
            value = this.evaluate(expr.cons);
        }
        else if (expr.alt) {
            value = this.evaluate(expr.alt);
        }
        else {
            value = Null;
        }
        this.popScope();
        return value;
    }
    evaluateSeq(expr) {
        this.pushScope();
        let last;
        for (const e of expr.exprs) {
            last = this.evaluate(e);
        }
        this.popScope();
        return last || Null;
    }
    evaluateUserCall(f, expr) {
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
    evaluateBuiltInCall(f, expr) {
        if (f.arity !== expr.args.length) {
            throw arityError(f.arity, expr.args.length, expr);
        }
        return f.impl(expr.args);
    }
    evaluateCall(expr) {
        const f = this.evaluateFn(expr.f);
        if (f.typ === "FnType") {
            return this.evaluateUserCall(f, expr);
        }
        else {
            return this.evaluateBuiltInCall(f, expr);
        }
    }
    makeLambda(expr) {
        return {
            typ: "FnType",
            body: expr.body,
            params: expr.params,
            name: expr.name,
            scope: this.top,
        };
    }
    evaluate(expr) {
        switch (expr.typ) {
            case "CallExpr":
                return this.evaluateCall(expr);
            case "DefineExpr":
                return this.define(expr.name, this.evaluate(expr.binding));
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
export function evaluate(ast) {
    const evaluator = new Evaluator();
    installBuiltIns(evaluator);
    for (const expr of ast.exprs) {
        evaluator.evaluate(expr);
    }
}