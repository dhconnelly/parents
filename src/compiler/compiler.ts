import { Expr, Prog } from "../ast";
import { serialize, Type, Value } from "../values";
import { Instr, Opcode } from "../instr";

class CompilerError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class Compiler {
    bytes: number[];

    constructor() {
        this.bytes = [];
    }

    pushValue(value: Value) {
        this.bytes.push(Opcode.Push);
        this.bytes.push(...serialize(value));
    }

    push(op: Opcode) {
        this.bytes.push(op);
    }

    compileStmt(expr: Expr) {
        this.compile(expr);
        this.bytes.push(Opcode.Pop);
    }

    compile(expr: Expr) {
        switch (expr.typ) {
            case "IntExpr":
                this.pushValue({ typ: Type.IntType, value: expr.value });
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

export function compile(prog: Prog): Uint8Array {
    const compiler = new Compiler();
    prog.exprs.forEach((expr) => compiler.compileStmt(expr));
    return Uint8Array.from(compiler.bytes);
}
