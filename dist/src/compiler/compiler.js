"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const values_1 = require("../values");
const instr_1 = require("../instr");
class CompilerError extends Error {
    constructor(message) {
        super(message);
    }
}
const BUILT_INS = new Set(["+", "-", "=", "<", "assert", "display"]);
class Compiler {
    constructor() {
        this.bytes = [];
    }
    push(instr) {
        instr_1.writeInstr(instr, this.bytes);
    }
    pushValue(value) {
        this.push({ op: instr_1.Opcode.Push, value });
    }
    compileBuiltIn(name) {
        // prettier-ignore
        switch (name) {
            case "+": return this.push({ op: instr_1.Opcode.Add });
            case "-": return this.push({ op: instr_1.Opcode.Sub });
            case "=": return this.push({ op: instr_1.Opcode.Eq });
            case "<": return this.push({ op: instr_1.Opcode.Lt });
            case "assert": return this.push({ op: instr_1.Opcode.Assert });
            case "display": return this.push({ op: instr_1.Opcode.Display });
        }
    }
    compile(expr) {
        switch (expr.typ) {
            case "IntExpr":
                this.pushValue({ typ: values_1.Type.IntType, value: expr.value });
                break;
            case "BoolExpr":
                this.pushValue({ typ: values_1.Type.BoolType, value: expr.value });
                break;
            case "CallExpr":
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                if (expr.f.typ == "IdentExpr" && BUILT_INS.has(expr.f.value)) {
                    this.compileBuiltIn(expr.f.value);
                }
                else {
                    throw new Error("not implemented");
                }
                break;
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
    compileStmt(expr) {
        this.compile(expr);
        this.push({ op: instr_1.Opcode.Pop });
    }
}
function compile(prog) {
    const compiler = new Compiler();
    prog.exprs.forEach((expr) => compiler.compileStmt(expr));
    return Uint8Array.from(compiler.bytes);
}
exports.compile = compile;
