import { Prog, Expr } from "./ast.js";
import { Value, Scope, Null } from "./values.js";

class Interpreter {
    globals: Scope;

    constructor() {
        this.globals = new Scope();
    }

    evaluate(expr: Expr): Value {
        return Null;
    }
}

export function evaluate(ast: Prog) {
    const interpreter = new Interpreter();
    for (const expr of ast.exprs) {
        const result = interpreter.evaluate(expr);
        console.log(result.toString());
    }
}
