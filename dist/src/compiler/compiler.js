"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.CompilerError = void 0;
const ast_1 = require("../ast");
const values_1 = require("../values");
const instr_1 = require("../instr");
const util_1 = require("../util");
const types_1 = require("../types");
class CompilerError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.CompilerError = CompilerError;
function notImplemented(expr) {
    throw new Error(`not implemented: ${ast_1.printExpr(expr)}`);
}
function writeInt(into, at, val) {
    for (const b of values_1.serializeNumber(val)) {
        into[at++] = b;
    }
}
class Compiler {
    constructor() {
        this.bytes = [];
        this.locals = [];
        this.globals = new Map(Object.entries(instr_1.BUILT_INS));
        this.captures = [];
    }
    push(instr) {
        instr_1.writeInstr(instr, this.bytes);
    }
    pushValue(value) {
        this.push({ op: instr_1.Opcode.Push, value });
    }
    lookup(name) {
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
    compile(expr) {
        switch (expr.typ) {
            case "IntExpr":
                this.pushValue({ typ: types_1.Type.IntType, value: expr.value });
                break;
            case "BoolExpr":
                this.pushValue({ typ: types_1.Type.BoolType, value: expr.value });
                break;
            case "CallExpr": {
                // Push arguments
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                // Resolve function
                this.compile(expr.f);
                // Call
                this.push({ op: instr_1.Opcode.Call, arity: expr.args.length });
                break;
            }
            case "LambdaExpr": {
                // jump over the function
                this.push({ op: instr_1.Opcode.Jmp, pc: 0 });
                const jmp = this.bytes.length - 4;
                // compile the function
                const lambdaStart = this.bytes.length;
                this.locals.push(new Map());
                this.captures.push([]);
                this.locals[this.locals.length - 1].set(expr.name || "", this.locals.length - 1);
                for (let i = 0; i < expr.params.length; i++) {
                    this.locals[this.locals.length - 1].set(expr.params[i], i);
                }
                this.compile(expr.body);
                this.push({ op: instr_1.Opcode.Return });
                // fix the jump target to land after the compiled function
                writeInt(this.bytes, jmp, this.bytes.length);
                // push the lambda onto the heap
                for (const { frameDist, index } of this.captures[this.captures.length - 1]) {
                    this.push({ op: instr_1.Opcode.Get, frameDist, index });
                }
                this.push({
                    op: instr_1.Opcode.MakeLambda,
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
                this.push({ op: instr_1.Opcode.JmpIf, pc: 0 });
                const jmp1 = this.bytes.length - 4;
                this.compile(expr.alt);
                this.push({ op: instr_1.Opcode.Jmp, pc: 0 });
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
                        this.push({ op: instr_1.Opcode.GetGlobal, index: ref.index });
                        break;
                    case "StackRef":
                        const { frameDist, index } = ref;
                        if (frameDist === 0) {
                            this.push({
                                op: instr_1.Opcode.Get,
                                frameDist,
                                index,
                            });
                        }
                        else {
                            const top = this.locals[this.locals.length - 1];
                            const localIndex = top.size;
                            top.set(ref.name, localIndex);
                            this.push({
                                op: instr_1.Opcode.Get,
                                frameDist: 0,
                                index: localIndex,
                            });
                            this.captures[this.captures.length - 1].push(ref);
                        }
                        break;
                    default:
                        const __fail = ref;
                }
                break;
            case "DefineExpr":
                if (this.globals.has(expr.name)) {
                    throw new CompilerError(`${expr.name} already defined`);
                }
                this.compile(expr.binding);
                this.globals.set(expr.name, this.globals.size);
                this.push({ op: instr_1.Opcode.DefGlobal });
                break;
            default:
                const __fail = expr;
        }
    }
    compileStmt(expr) {
        this.compile(expr);
        this.push({ op: instr_1.Opcode.Pop });
    }
}
function compile(prog) {
    try {
        const compiler = new Compiler();
        for (const expr of prog.exprs) {
            compiler.compileStmt(expr);
        }
        return util_1.Ok(Uint8Array.from(compiler.bytes));
    }
    catch (err) {
        if (err instanceof CompilerError) {
            return util_1.Err(err);
        }
        else {
            throw err;
        }
    }
}
exports.compile = compile;
