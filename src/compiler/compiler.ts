import { Expr, printExpr, Prog } from "../ast";
import { serializeNumber, Type, Value, NilValue } from "../values";
import { Instr, Opcode, writeInstr } from "../instr";
import { RootError, Option } from "../util";

type Ref = GlobalRef;

type GlobalRef = {
    typ: "GlobalRef";
    name: string;
    index: number;
};

export class CompilerError extends RootError {
    constructor(message: string) {
        super(message);
    }
}

function notImplemented(expr: Expr) {
    throw new Error(`not implemented: ${printExpr(expr)}`);
}

const BUILT_INS = new Set(["+", "-", "=", "<", "assert", "display"]);

function writeInt(into: number[], at: number, val: number) {
    for (const b of serializeNumber(val)) {
        into[at++] = b;
    }
}

class Compiler {
    bytes: number[];
    globals: Map<string, number>;
    nil: NilValue;

    constructor() {
        this.bytes = [];
        this.globals = new Map();
        this.nil = { typ: Type.NilType };
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

    lookup(name: string): Ref {
        // TODO: locals
        const index = this.globals.get(name);
        if (index === undefined) {
            throw new CompilerError(`${name} is not defined`);
        }
        return { typ: "GlobalRef", name, index };
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
                    // TODO: invoke functions properly so vm can check arity
                    this.compileBuiltIn(expr.f.value);
                } else {
                    notImplemented(expr);
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

            case "SeqExpr": {
                const exprs = expr.exprs;
                if (exprs.length === 0) break;
                this.compile(exprs[0]);
                for (let i = 1; i < exprs.length; i++) {
                    this.push({ op: Opcode.Pop });
                    this.compile(exprs[i]);
                }
                break;
            }

            case "IdentExpr":
                const ref = this.lookup(expr.value);
                switch (ref.typ) {
                    case "GlobalRef":
                        this.push({ op: Opcode.GetGlobal, index: ref.index });
                        break;
                }
                break;

            case "DefineExpr":
                if (this.globals.has(expr.name)) {
                    throw new CompilerError(`${expr.name} already defined`);
                }
                this.compile(expr.binding);
                this.globals.set(expr.name, this.globals.size);
                this.push({ op: Opcode.DefGlobal });
                this.pushValue(this.nil);
                break;

            case "LambdaExpr":
                notImplemented(expr);
                break;

            default:
                const __fail: never = expr;
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
