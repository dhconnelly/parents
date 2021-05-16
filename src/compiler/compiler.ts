import { Expr, printExpr, Prog } from "../ast";
import { serializeNumber, Type, Value } from "../values";
import { Instr, Opcode, writeInstr, BUILT_INS } from "../instr";
import { Result, Ok, Err } from "../util";

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

    pushValue(value: Value) {
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
                this.locals.push(new Map());
                this.captures.push([]);
                this.locals[this.locals.length - 1].set(
                    expr.name || "",
                    this.locals.length - 1
                );
                for (let i = 0; i < expr.params.length; i++) {
                    this.locals[this.locals.length - 1].set(expr.params[i], i);
                }
                this.compile(expr.body);
                this.push({ op: Opcode.Return });

                // fix the jump target to land after the compiled function
                writeInt(this.bytes, jmp, this.bytes.length);

                // push the lambda onto the heap
                for (const { frameDist, index } of this.captures[
                    this.captures.length - 1
                ]) {
                    this.push({ op: Opcode.GetStack, frameDist, index });
                }
                this.push({
                    op: Opcode.MakeLambda,
                    pc: lambdaStart,
                    arity: expr.params.length,
                    captures: this.captures[this.captures.length - 1].length,
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
                            this.push({
                                op: Opcode.GetStack,
                                frameDist,
                                index,
                            });
                        } else {
                            const top = this.locals[this.locals.length - 1];
                            const localIndex = top.size;
                            top.set(ref.name, localIndex);
                            this.push({
                                op: Opcode.GetStack,
                                frameDist: 0,
                                index: localIndex,
                            });
                            this.captures[this.captures.length - 1].push(ref);
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
