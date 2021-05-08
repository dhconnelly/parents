"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = exports.Evaluator = exports.EvaluationError = void 0;
const assert_1 = require("assert");
const builtins_1 = require("./builtins");
const scope_1 = require("./scope");
class EvaluationError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.EvaluationError = EvaluationError;
function defineAtRootError(expr) {
    return new EvaluationError(`${expr.line}:${expr.col}: define only allowed at root scope`);
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
class Evaluator {
    constructor() {
        this.global = new scope_1.Scope();
        this.top = this.global;
        this.nil = { typ: "NilType" };
    }
    lookup(expr) {
        let value = this.top.lookup(expr.value) || this.global.lookup(expr.value);
        if (!value)
            throw lookupError(expr);
        return value;
    }
    define(name, binding) {
        this.top.define(name, binding);
        return this.nil;
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
        const top = new scope_1.Scope(this.top);
        this.top = top;
    }
    popScope() {
        assert_1.strict.ok(this.top.up);
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
            value = this.nil;
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
        return last || this.nil;
    }
    evaluateLet(expr) {
        this.pushScope();
        this.define(expr.name, this.evaluate(expr.binding));
        const val = this.evaluate(expr.body);
        this.popScope();
        return val;
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
            scope: this.top.snapshot(),
        };
    }
    evaluate(expr) {
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
exports.Evaluator = Evaluator;
function evaluate(ast) {
    const evaluator = new Evaluator();
    builtins_1.installBuiltIns(evaluator);
    for (const expr of ast.exprs) {
        evaluator.evaluate(expr);
    }
}
exports.evaluate = evaluate;
