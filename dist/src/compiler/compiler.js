"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.CompilerError = void 0;
const instr_1 = require("../instr");
const util_1 = require("../util");
const values_1 = require("../values");
class CompilerError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.CompilerError = CompilerError;
function writeInt(into, at, val) {
    for (const b of values_1.serializeNumber(val)) {
        into[at++] = b;
    }
}
class LexicalFrame {
    constructor() {
        this.locals = new Map();
        this.captures = [];
    }
    def(name) {
        if (!this.locals.has(name))
            this.locals.set(name, this.locals.size);
    }
    get(name) {
        const index = this.locals.get(name);
        if (index === undefined) {
            throw new CompilerError(`${name} is not defined in this frame`);
        }
        return index;
    }
}
class Compiler {
    constructor() {
        this.bytes = [];
        this.frames = [];
        this.globals = new Map(Object.entries(instr_1.BUILT_INS));
    }
    pushInstr(instr) {
        instr_1.writeInstr(instr, this.bytes);
    }
    push(value) {
        this.pushInstr({ op: instr_1.Opcode.Push, value });
    }
    lookup(name) {
        for (let frameDist = 0; frameDist < this.frames.length; frameDist++) {
            const frameIndex = this.frames.length - frameDist - 1;
            const scope = this.frames[frameIndex].locals;
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
    propagateCapture(fromFrame, toFrame, name) {
        // each lambda between the two frames must capture it
        for (let index = fromFrame + 1; index <= toFrame; index++) {
            const frame = this.frames[index];
            const captures = frame.captures;
            const upLocals = this.frames[index - 1].locals;
            const upStackIndex = upLocals.get(name);
            if (upStackIndex === undefined) {
                util_1.fail(`invalid capture of ${name} from ${fromFrame}`);
            }
            // a capture in an inner lambda is pushed onto the stack while
            // compiling the outer one, so it's always at stack depth 0
            captures.push({
                typ: "StackRef",
                frameDist: 0,
                index: upStackIndex,
                name,
            });
            frame.locals.set(name, frame.locals.size);
        }
    }
    compileLambda(expr) {
        const frame = new LexicalFrame();
        this.frames.push(frame);
        // jump over the compiled code while running. leave the jump target
        // blank until we know how far ahead to jump
        this.pushInstr({ op: instr_1.Opcode.Jmp, pc: 0 });
        const jmpTargetOffset = this.bytes.length - 4;
        // define locals and compile the function body
        const lambdaStart = this.bytes.length;
        expr.params.forEach((param) => frame.def(param));
        frame.def(expr.name || "");
        this.compile(expr.body);
        this.pushInstr({ op: instr_1.Opcode.Return });
        // fix the jump target to land after the compiled function
        writeInt(this.bytes, jmpTargetOffset, this.bytes.length);
        // push captures and lambda onto the heap
        frame.captures.forEach(({ index }) => {
            this.pushInstr({ op: instr_1.Opcode.Get, index });
        });
        this.pushInstr({
            op: instr_1.Opcode.MakeLambda,
            pc: lambdaStart,
            arity: expr.params.length,
            captures: frame.captures.length,
        });
        this.frames.pop();
    }
    compileCall(expr) {
        expr.args.forEach((arg) => this.compile(arg));
        this.compile(expr.f);
        this.pushInstr({ op: instr_1.Opcode.Call, arity: expr.args.length });
    }
    compileIf(expr) {
        this.compile(expr.cond);
        this.pushInstr({ op: instr_1.Opcode.JmpIf, pc: 0 });
        const jmp1 = this.bytes.length - 4;
        this.compile(expr.alt);
        this.pushInstr({ op: instr_1.Opcode.Jmp, pc: 0 });
        const jmp2 = this.bytes.length - 4;
        const pc1 = this.bytes.length;
        this.compile(expr.cons);
        const pc2 = this.bytes.length;
        writeInt(this.bytes, jmp1, pc1);
        writeInt(this.bytes, jmp2, pc2);
    }
    compileDefine(expr) {
        if (this.globals.has(expr.name)) {
            throw new CompilerError(`${expr.name} already defined`);
        }
        this.compile(expr.binding);
        this.globals.set(expr.name, this.globals.size);
        this.pushInstr({ op: instr_1.Opcode.DefGlobal });
    }
    compileIdent(expr) {
        const ref = this.lookup(expr.value);
        // ident binds to a global: just access it
        if (ref.typ === "GlobalRef") {
            return this.pushInstr({ op: instr_1.Opcode.GetGlobal, index: ref.index });
        }
        // stack ref binds to a param, or to a capture we already pushed: access
        // it in local scope
        if (ref.frameDist === 0) {
            return this.pushInstr({ op: instr_1.Opcode.Get, index: ref.index });
        }
        // ref binds to a frame up the stack: capture it in all frames between
        // top frame and its local frame
        const top = this.frames[this.frames.length - 1];
        this.propagateCapture(this.frames.length - 1 - ref.frameDist, this.frames.length - 1, expr.value);
        // after propagation the value will sit in the local stack and we
        // can access it from there
        top.def(expr.value);
        this.pushInstr({ op: instr_1.Opcode.Get, index: top.get(expr.value) });
    }
    compile(expr) {
        switch (expr.typ) {
            case "IntExpr":
                return this.push({ typ: values_1.Type.IntType, value: expr.value });
            case "BoolExpr":
                return this.push({ typ: values_1.Type.BoolType, value: expr.value });
            case "LambdaExpr":
                return this.compileLambda(expr);
            case "CallExpr":
                return this.compileCall(expr);
            case "IfExpr":
                return this.compileIf(expr);
            case "DefineExpr":
                return this.compileDefine(expr);
            case "IdentExpr":
                return this.compileIdent(expr);
        }
    }
    compileStmt(expr) {
        this.compile(expr);
        this.pushInstr({ op: instr_1.Opcode.Pop });
    }
}
function compile(prog) {
    try {
        const compiler = new Compiler();
        prog.exprs.forEach((expr) => compiler.compileStmt(expr));
        return util_1.Ok(Uint8Array.from(compiler.bytes));
    }
    catch (err) {
        if (err instanceof CompilerError)
            return util_1.Err(err);
        else
            throw err;
    }
}
exports.compile = compile;
