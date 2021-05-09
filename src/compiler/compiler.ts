import { Expr, Prog } from "../ast";
import { Type, Value } from "../values";
import { Instr, Opcode, writeInstr } from "../instr";

class CompilerError extends Error {
    constructor(message: string) {
        super(message);
    }
}

const BUILT_INS = new Set(["+", "-", "=", "<", "assert", "display"]);

class Compiler {
    bytes: number[];

    constructor() {
        this.bytes = [];
    }

    push(instr: Instr) {
        writeInstr(instr, this.bytes);
    }

    pushValue(value: Value) {
        this.push({ op: Opcode.Push, value });
    }

    compileBuiltIn(name: string) {
        // prettier-ignore
        switch (name) {
            case "+": return this.push({ op: Opcode.Add });
            case "-": return this.push({ op: Opcode.Sub });
            case "=": return this.push({ op: Opcode.Eq });
            case "<": return this.push({ op: Opcode.Lt });
            case "assert": return this.push({ op: Opcode.Assert });
            case "display": return this.push({ op: Opcode.Display });
        }
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
                if (expr.f.typ == "IdentExpr" && BUILT_INS.has(expr.f.value)) {
                    this.compileBuiltIn(expr.f.value);
                } else {
                    throw new Error("not implemented");
                }
                break;

            case "BoolExpr":
            case "DefineExpr":
            case "IdentExpr":
            case "IfExpr":
            case "IntExpr":
            case "LambdaExpr":
            case "LetExpr":
            case "SeqExpr":
                throw new Error("not implemented");
        }
    }

    compileStmt(expr: Expr) {
        this.compile(expr);
        this.push({ op: Opcode.Pop });
    }
}

export function compile(prog: Prog): Uint8Array {
    const compiler = new Compiler();
    prog.exprs.forEach((expr) => compiler.compileStmt(expr));
    return Uint8Array.from(compiler.bytes);
}
