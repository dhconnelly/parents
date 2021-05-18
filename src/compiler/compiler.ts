import { Expr, printExpr, Prog } from "../ast";
import { SerializableValue, serializeNumber } from "../values";
import { Instr, Opcode, writeInstr, BUILT_INS } from "../instr";
import { Result, Ok, Err, fail } from "../util";
import { Type } from "../types";

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

function writeInt(into: number[], at: number, val: number) {
    for (const b of serializeNumber(val)) {
        into[at++] = b;
    }
}

class Compiler {
    bytes: number[];
    globals: Map<string, number>;
    locals: Map<string, number>[];
    captures: StackRef[][];

    constructor() {
        this.bytes = [];
        this.locals = [];
        this.globals = new Map(Object.entries(BUILT_INS));
        this.captures = [];
    }

    push(instr: Instr) {
        writeInstr(instr, this.bytes);
    }

    pushValue(value: SerializableValue) {
        this.push({ op: Opcode.Push, value });
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

    propagateCapture(fromFrame: number, toFrame: number, name: string) {
        for (let frame = fromFrame + 1; frame <= toFrame; frame++) {
            const captures = this.captures[frame];
            const frameLocals = this.locals[frame - 1];
            const localIndex = frameLocals.get(name);
            if (localIndex === undefined) {
                fail(`invalid capture of ${name} from ${fromFrame}`);
            }
            captures.push({
                typ: "StackRef",
                frameDist: 0,
                index: localIndex,
                name,
            });
            const thisFrame = this.locals[frame];
            thisFrame.set(name, thisFrame.size);
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
                const locals = new Map();
                this.locals.push(locals);
                const captures: StackRef[] = [];
                this.captures.push(captures);
                for (let i = 0; i < expr.params.length; i++) {
                    locals.set(expr.params[i], i);
                }
                locals.set(expr.name || "", locals.size);
                this.compile(expr.body);
                this.push({ op: Opcode.Return });

                // fix the jump target to land after the compiled function
                writeInt(this.bytes, jmp, this.bytes.length);

                // push the lambda onto the heap
                for (const { index } of captures) {
                    this.push({ op: Opcode.Get, index });
                }
                this.push({
                    op: Opcode.MakeLambda,
                    pc: lambdaStart,
                    arity: expr.params.length,
                    captures: captures.length,
                });

                this.captures.pop();
                this.locals.pop();
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
                        const { frameDist, index } = ref;
                        if (frameDist === 0) {
                            this.push({ op: Opcode.Get, index });
                        } else {
                            const top = this.locals[this.locals.length - 1];
                            const localIndex = top.size;
                            this.propagateCapture(
                                this.captures.length - 1 - frameDist,
                                this.captures.length - 1,
                                expr.value
                            );
                            top.set(expr.value, localIndex);
                            this.push({ op: Opcode.Get, index: localIndex });
                        }
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

export function compile(prog: Prog): Result<Uint8Array, CompilerError> {
    try {
        const compiler = new Compiler();
        for (const expr of prog.exprs) {
            compiler.compileStmt(expr);
        }
        return Ok(Uint8Array.from(compiler.bytes));
    } catch (err) {
        if (err instanceof CompilerError) {
            return Err(err);
        } else {
            throw err;
        }
    }
}
