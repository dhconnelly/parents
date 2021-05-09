"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const values_1 = require("../values");
const instr_1 = require("../instr");
const util_1 = require("../util");
class ExecutionError extends util_1.RootError {
    constructor(message) {
        super(message);
    }
}
class VM {
    constructor(program, debug = false) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.debug = debug;
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
            console.log(JSON.stringify(instr));
            console.log();
        }
        switch (instr.op) {
            case instr_1.Opcode.Push:
                this.stack.push(instr.value);
                break;
            case instr_1.Opcode.Pop:
                this.popStack();
                break;
            case instr_1.Opcode.Add: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: values_1.Type.IntType, value: a + b });
                break;
            }
            case instr_1.Opcode.Sub: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: values_1.Type.IntType, value: a - b });
                break;
            }
            case instr_1.Opcode.Eq: {
                const b = this.popStack();
                const a = this.popStack();
                let c;
                // prettier-ignore
                switch (a.typ) {
                    case values_1.Type.IntType:
                        c = a.value === values_1.getInt(b);
                        break;
                    case values_1.Type.BoolType:
                        c = a.value === values_1.getBool(b);
                        break;
                    case values_1.Type.NilType:
                        c = b.typ === values_1.Type.NilType;
                        break;
                    case values_1.Type.BuiltInFnType:
                    case values_1.Type.FnType:
                        throw new Error("unimplemented");
                }
                this.stack.push({ typ: values_1.Type.BoolType, value: c });
                break;
            }
            case instr_1.Opcode.Lt: {
                const b = values_1.getInt(this.popStack());
                const a = values_1.getInt(this.popStack());
                this.stack.push({ typ: values_1.Type.BoolType, value: a < b });
                break;
            }
            case instr_1.Opcode.Assert: {
                const value = values_1.getBool(this.popStack());
                if (!value)
                    console.log("assertion failed");
                this.stack.push({ typ: values_1.Type.NilType });
                break;
            }
            case instr_1.Opcode.Display:
                console.log(values_1.print(this.popStack()));
                this.stack.push({ typ: values_1.Type.NilType });
                break;
        }
        this.pc += size;
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
