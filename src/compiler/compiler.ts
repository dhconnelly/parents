import { Expr, Prog } from "../ast";
import { serializeNumber, Type, Value } from "../values";
import { Instr, Opcode, writeInstr } from "../instr";
import { RootError } from "../util";

export class CompilerError extends RootError {
    constructor(message: string) {
        super(message);
    }
}

function notImplemented() {
    throw new Error("not implemented");
}

const BUILT_INS = new Set(["+", "-", "=", "<", "assert", "display"]);

function writeInt(into: number[], at: number, val: number) {
    for (const b of serializeNumber(val)) {
        into[at++] = b;
    }
}

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

            case "BoolExpr":
                this.pushValue({ typ: Type.BoolType, value: expr.value });
                break;

            case "CallExpr":
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                if (expr.f.typ == "IdentExpr" && BUILT_INS.has(expr.f.value)) {
                    this.compileBuiltIn(expr.f.value);
                } else {
                    notImplemented();
                }
                break;

            case "IfExpr":
                this.compile(expr.cond);
                this.push({ op: Opcode.JmpIf, pc: 0 });
                const jmp1 = this.bytes.length - 4;
                this.compile(expr.alt);
                this.push({ op: Opcode.Jmp, pc: 0 });
                const jmp2 = this.bytes.length - 4;
                const pc1 = this.bytes.length;
                this.compile(expr.cons);
                const pc2 = this.bytes.length;
                writeInt(this.bytes, jmp1, pc1);
                writeInt(this.bytes, jmp2, pc2);
                break;

            case "DefineExpr":
            case "IdentExpr":
            case "IntExpr":
            case "LambdaExpr":
            case "LetExpr":
            case "SeqExpr":
                notImplemented();
        }
    }

    compileStmt(expr: Expr) {
        this.compile(expr);
        this.push({ op: Opcode.Pop });
    }
}

export function compile(prog: Prog): Uint8Array {
    const compiler = new Compiler();
    for (const expr of prog.exprs) {
        compiler.compileStmt(expr);
    }
    return Uint8Array.from(compiler.bytes);
}
