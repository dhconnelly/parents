"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const instr_1 = require("../instr");
class CompilerError extends Error {
    constructor(message) {
        super(message);
    }
}
class Compiler {
    constructor() {
        this.instrs = [];
    }
    pushValue(value) {
        this.instrs.push({ op: instr_1.Opcode.Push, value });
    }
    push(op) {
        this.instrs.push({ op });
    }
    compileStmt(expr) {
        this.compile(expr);
        this.instrs.push({ op: instr_1.Opcode.Pop });
    }
    compile(expr) {
        switch (expr.typ) {
            case "IntExpr":
                this.pushValue({ typ: "IntType", value: expr.value });
                break;
            case "CallExpr":
                for (const arg of expr.args) {
                    this.compile(arg);
                }
                if (expr.f.typ == "IdentExpr") {
                    switch (expr.f.value) {
                        case "+":
                            this.push(instr_1.Opcode.Add);
                            break;
                        case "-":
                            this.push(instr_1.Opcode.Sub);
                            break;
                        case "<":
                            this.push(instr_1.Opcode.Lt);
                            break;
                        case "=":
                            this.push(instr_1.Opcode.Eq);
                            break;
                    }
                }
                else {
                    throw new Error("not implemented");
                }
                break;
        }
    }
}
function compile(prog) {
    const compiler = new Compiler();
    prog.exprs.forEach((expr) => compiler.compileStmt(expr));
    return compiler.instrs;
}
exports.compile = compile;
