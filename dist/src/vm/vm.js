"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.ExecutionError = void 0;
const instr_1 = require("../instr");
const util_1 = require("../util");
const types_1 = require("../types");
const values_1 = require("./values");
class ExecutionError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ExecutionError = ExecutionError;
// prettier-ignore
const BUILT_IN_FNS = new Map([
    ["+", {
            name: "add",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.IntType, value: values_1.getInt(args[0]) + values_1.getInt(args[1]) };
            },
        }],
    ["-", {
            name: "sub",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.IntType, value: values_1.getInt(args[0]) - values_1.getInt(args[1]) };
            },
        }],
    ["<", {
            name: "lt",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.BoolType, value: values_1.getInt(args[0]) < values_1.getInt(args[1]) };
            },
        }],
    ["=", {
            name: "eq",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.BoolType, value: values_1.getInt(args[0]) === values_1.getInt(args[1]) };
            },
        }],
    ["assert", {
            name: "assert",
            arity: 1,
            impl: (...args) => {
                if (!values_1.getBool(args[0]))
                    throw new ExecutionError("assertion failed");
                return { typ: types_1.Type.NilType };
            },
        }],
    ["display", {
            name: "display",
            arity: 1,
            impl: (...args) => {
                console.log(values_1.print(args[0]));
                return { typ: types_1.Type.NilType };
            },
        }],
    ["*", {
            name: "mul",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.IntType, value: values_1.getInt(args[0]) * values_1.getInt(args[1]) };
            },
        }],
    ["isnil", {
            name: "isnil",
            arity: 1,
            impl: (...args) => {
                return { typ: types_1.Type.BoolType, value: args[0].typ === types_1.Type.NilType };
            },
        }],
]);
class VM {
    constructor(program, debug = false) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.globals = new Array(instr_1.NUM_BUILT_INS);
        for (const [name, fn] of BUILT_IN_FNS) {
            const ref = {
                typ: types_1.Type.BuiltInFnType,
                arity: fn.arity,
                name: fn.name,
            };
            this.globals[instr_1.BUILT_INS[name]] = ref;
        }
        this.globals[instr_1.BUILT_INS["nil"]] = { typ: types_1.Type.NilType };
        this.debug = debug;
        this.nil = { typ: types_1.Type.NilType };
        this.heap = [];
    }
    error(message) {
        throw new ExecutionError(`execution error: pc=${this.pc}: ${message}`);
    }
    popStack() {
        if (this.stack.length === 0) {
            this.error("execution error: can't pop empty stack");
        }
        return util_1.unwrap(this.stack.pop());
    }
    log() {
        console.log(`[pc=${this.pc}] [stack=${JSON.stringify(this.stack)}]`);
    }
    step() {
        const { instr, size } = instr_1.readInstr(this.program, this.pc);
        if (this.debug) {
            this.log();
            console.log(instr_1.printInstr(instr));
            console.log();
        }
        switch (instr.op) {
            case instr_1.Opcode.Push:
                this.stack.push(instr.value);
                this.pc += size;
                break;
            case instr_1.Opcode.Pop:
                this.popStack();
                this.pc += size;
                break;
            case instr_1.Opcode.Add: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: types_1.Type.IntType, value: a + b });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Sub: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: types_1.Type.IntType, value: a - b });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Eq: {
                const b = this.popStack();
                const a = this.popStack();
                let c;
                // prettier-ignore
                switch (a.typ) {
                    case types_1.Type.IntType:
                        c = a.value === values_1.getInt(b);
                        break;
                    case types_1.Type.BoolType:
                        c = a.value === values_1.getBool(b);
                        break;
                    case types_1.Type.NilType:
                        c = b.typ === types_1.Type.NilType;
                        break;
                    case types_1.Type.BuiltInFnType:
                    case types_1.Type.FnType:
                        throw new Error("unimplemented");
                }
                this.stack.push({ typ: types_1.Type.BoolType, value: c });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Lt: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: types_1.Type.BoolType, value: a < b });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Assert: {
                const value = values_1.getBool(this.popStack());
                if (!value)
                    console.log("assertion failed");
                this.stack.push({ typ: types_1.Type.NilType });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Display:
                console.log(values_1.print(this.popStack()));
                this.stack.push({ typ: types_1.Type.NilType });
                this.pc += size;
                break;
            case instr_1.Opcode.JmpIf:
                if (values_1.getBool(this.popStack())) {
                    this.pc = instr.pc;
                }
                else {
                    this.pc += size;
                }
                break;
            case instr_1.Opcode.Jmp:
                this.pc = instr.pc;
                break;
            case instr_1.Opcode.DefGlobal: {
                this.globals.push(this.popStack());
                this.stack.push(this.nil);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.IsNil:
            case instr_1.Opcode.Mul:
            case instr_1.Opcode.MakeLambda:
            case instr_1.Opcode.GetStack:
            case instr_1.Opcode.StartLambda:
            case instr_1.Opcode.Return:
            case instr_1.Opcode.Call: {
                throw new Error();
            }
            case instr_1.Opcode.GetGlobal: {
                if (instr.index >= this.globals.length) {
                    throw new ExecutionError("invalid global reference");
                }
                this.stack.push(this.globals[instr.index]);
                this.pc += size;
                break;
            }
            default:
                const __fail = instr;
        }
    }
    run() {
        while (this.pc < this.program.byteLength) {
            this.step();
        }
    }
}
function execute(bytes) {
    const vm = new VM(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    vm.run();
}
exports.execute = execute;
