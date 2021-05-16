import { Expr, printExpr, Prog } from "../ast";
import { serializeNumber, Type, Value, NilValue } from "../values";
import { Instr, Opcode, writeInstr } from "../instr";

type Ref = GlobalRef | StackRef;

type GlobalRef = {
    typ: "GlobalRef";
    name: string;
    index: number;
};

type StackRef = {
    typ: "StackRef";
    name: string;
    frameDist: number;
    index: number;
};

export class CompilerError extends Error {
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
    locals: Map<string, number>[];

    constructor() {
        this.bytes = [];
        this.globals = new Map();
        this.locals = [];
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
        for (let frameDist = 0; frameDist < this.locals.length; frameDist++) {
            const scope = this.locals[this.locals.length - frameDist - 1];
            let index = scope.get(name);
            if (index !== undefined) {
                return { typ: "StackRef", name, frameDist, index };
            }
        }
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

            case "CallExpr": {
                // Push arguments
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                // Resolve function
                this.compile(expr.f);
                // Call
                this.push({ op: Opcode.Call, arity: expr.args.length });
                break;
            }

            case "LambdaExpr": {
                // jump over the function
                this.push({ op: Opcode.Jmp, pc: 0 });
                const jmp = this.bytes.length - 4;

                // compile the function
                const lambdaStart = this.bytes.length;
                this.push({ op: Opcode.MakeLambda, arity: expr.params.length });
                this.locals.push(new Map());
                if (expr.name !== undefined) {
                    // handle name
                }
                for (let i = 0; i < expr.params.length; i++) {
                    this.locals[this.locals.length - 1].set(expr.params[i], i);
                }
                this.compile(expr.body);
                this.push({ op: Opcode.Return });
                this.locals.pop();

                // fix the jump target to land after the compiled function
                writeInt(this.bytes, jmp, this.bytes.length);

                // push the pointer onto the stack
                this.pushValue({ typ: Type.IntType, value: lambdaStart });
                break;
            }

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

            case "IdentExpr":
                const ref = this.lookup(expr.value);
                switch (ref.typ) {
                    case "GlobalRef":
                        this.push({ op: Opcode.GetGlobal, index: ref.index });
                        break;
                    case "StackRef":
                        this.push({
                            op: Opcode.GetStack,
                            frameDist: ref.frameDist,
                            index: ref.index,
                        });
                        break;
                    default:
                        const __fail: never = ref;
                }
                break;

            case "DefineExpr":
                if (this.globals.has(expr.name)) {
                    throw new CompilerError(`${expr.name} already defined`);
                }
                this.compile(expr.binding);
                this.globals.set(expr.name, this.globals.size);
                this.push({ op: Opcode.DefGlobal });
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
