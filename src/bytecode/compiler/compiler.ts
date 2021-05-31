import {
    CallExpr,
    DefineExpr,
    Expr,
    IdentExpr,
    IfExpr,
    LambdaExpr,
    Prog,
} from "../../ast";
import { BUILT_INS, BUILT_IN_NAMES } from "../builtin_decls";
import { Instr, Opcode, writeInstr } from "../instr";
import { Err, fail, Ok, Result } from "../../util";
import { SerializableValue, serializeNumber } from "../values";
import { Type } from "../../types";

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

function writeInt(into: number[], at: number, val: number) {
    for (const b of serializeNumber(val)) {
        into[at++] = b;
    }
}

class LexicalFrame {
    locals: Map<string, number>;
    captures: StackRef[];

    constructor() {
        this.locals = new Map();
        this.captures = [];
    }

    def(name: string) {
        if (!this.locals.has(name)) this.locals.set(name, this.locals.size);
    }

    get(name: string): number {
        const index = this.locals.get(name);
        if (index === undefined) {
            throw new CompilerError(`${name} is not defined in this frame`);
        }
        return index;
    }
}

class Compiler {
    bytes: number[];
    frames: LexicalFrame[];
    globals: Map<string, number>;

    constructor() {
        this.bytes = [];
        this.frames = [];
        this.globals = new Map();
        for (const name of BUILT_IN_NAMES) {
            this.globals.set(name, BUILT_INS[name].index);
        }
    }

    pushInstr(instr: Instr) {
        writeInstr(instr, this.bytes);
    }

    push(value: SerializableValue) {
        this.pushInstr({ op: Opcode.Push, value });
    }

    lookup(name: string): Ref {
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

    propagateCapture(fromFrame: number, toFrame: number, name: string) {
        // each lambda between the two frames must capture it
        for (let index = fromFrame + 1; index <= toFrame; index++) {
            const frame = this.frames[index];
            const captures = frame.captures;
            const upLocals = this.frames[index - 1].locals;
            const upStackIndex = upLocals.get(name);
            if (upStackIndex === undefined) {
                fail(`invalid capture of ${name} from ${fromFrame}`);
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

    compileLambda(expr: LambdaExpr) {
        const frame = new LexicalFrame();
        this.frames.push(frame);

        // jump over the compiled code while running. leave the jump target
        // blank until we know how far ahead to jump
        this.pushInstr({ op: Opcode.Jmp, pc: 0 });
        const jmpTargetOffset = this.bytes.length - 4;

        // define locals and compile the function body
        const lambdaStart = this.bytes.length;
        expr.params.forEach((param) => frame.def(param));
        frame.def(expr.name || "");
        this.compile(expr.body);
        this.pushInstr({ op: Opcode.Return });

        // fix the jump target to land after the compiled function
        writeInt(this.bytes, jmpTargetOffset, this.bytes.length);

        // push captures and lambda onto the heap
        frame.captures.forEach(({ index }) => {
            this.pushInstr({ op: Opcode.Get, index });
        });
        this.pushInstr({
            op: Opcode.MakeLambda,
            pc: lambdaStart,
            arity: expr.params.length,
            captures: frame.captures.length,
        });

        this.frames.pop();
    }

    compileCall(expr: CallExpr) {
        expr.args.forEach((arg) => this.compile(arg));
        this.compile(expr.f);
        this.pushInstr({ op: Opcode.Call, arity: expr.args.length });
    }

    compileIf(expr: IfExpr) {
        this.compile(expr.cond);
        this.pushInstr({ op: Opcode.JmpIf, pc: 0 });
        const jmp1 = this.bytes.length - 4;
        this.compile(expr.alt);
        this.pushInstr({ op: Opcode.Jmp, pc: 0 });
        const jmp2 = this.bytes.length - 4;
        const pc1 = this.bytes.length;
        this.compile(expr.cons);
        const pc2 = this.bytes.length;
        writeInt(this.bytes, jmp1, pc1);
        writeInt(this.bytes, jmp2, pc2);
    }

    compileDefine(expr: DefineExpr) {
        if (this.globals.has(expr.name)) {
            throw new CompilerError(`${expr.name} already defined`);
        }
        this.compile(expr.binding);
        this.globals.set(expr.name, this.globals.size);
        this.pushInstr({ op: Opcode.DefGlobal });
    }

    compileIdent(expr: IdentExpr) {
        const ref = this.lookup(expr.value);
        // ident binds to a global: just access it
        if (ref.typ === "GlobalRef") {
            return this.pushInstr({ op: Opcode.GetGlobal, index: ref.index });
        }
        // stack ref binds to a param, or to a capture we already pushed: access
        // it in local scope
        if (ref.frameDist === 0) {
            return this.pushInstr({ op: Opcode.Get, index: ref.index });
        }
        // ref binds to a frame up the stack: capture it in all frames between
        // top frame and its local frame
        const top = this.frames[this.frames.length - 1];
        this.propagateCapture(
            this.frames.length - 1 - ref.frameDist,
            this.frames.length - 1,
            expr.value
        );
        // after propagation the value will sit in the local stack and we
        // can access it from there
        top.def(expr.value);
        this.pushInstr({ op: Opcode.Get, index: top.get(expr.value) });
    }

    compile(expr: Expr) {
        switch (expr.typ) {
            case "IntExpr":
                return this.push({ typ: Type.IntType, value: expr.value });
            case "BoolExpr":
                return this.push({ typ: Type.BoolType, value: expr.value });
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

    compileStmt(expr: Expr) {
        this.compile(expr);
        this.pushInstr({ op: Opcode.Pop });
    }
}

export function compile(prog: Prog): Result<Uint8Array, CompilerError> {
    try {
        const compiler = new Compiler();
        prog.exprs.forEach((expr) => compiler.compileStmt(expr));
        return Ok(Uint8Array.from(compiler.bytes));
    } catch (err) {
        if (err instanceof CompilerError) return Err(err);
        else throw err;
    }
}
