import { Expr, Prog } from "src/ast";
import { Value } from "src/values";
import { Instr, Opcode } from "../instr";

class CompilerError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Compiler {
    instrs: Instr[];

    constructor() {
        this.instrs = [];
    }

    pushValue(value: Value) {
        this.instrs.push({ op: Opcode.Push, value });
    }

    push(op: Opcode) {
        this.instrs.push({ op });
    }

    compileStmt(expr: Expr) {
        this.compile(expr);
        this.instrs.push({ op: Opcode.Pop });
    }

    compile(expr: Expr) {
        switch (expr.typ) {
            case "IntExpr":
                this.pushValue({ typ: "IntType", value: expr.value });
                break;

            case "CallExpr":
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                if (expr.f.typ == "IdentExpr") {
                    switch (expr.f.value) {
                        case "+":
                            this.push(Opcode.Add);
                            break;
                        case "-":
                            this.push(Opcode.Sub);
                            break;
                        case "<":
                            this.push(Opcode.Lt);
                            break;
                        case "=":
                            this.push(Opcode.Eq);
                            break;
                    }
                } else {
                    throw new Error("not implemented");
                }
                break;
        }
    }
}

export function compile(prog: Prog): Instr[] {
    const compiler = new Compiler();
    prog.exprs.forEach((expr) => compiler.compileStmt(expr));
    return compiler.instrs;
}
