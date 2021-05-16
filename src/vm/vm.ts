import { Type, Value, getInt, print, getBool } from "../values";
import { Opcode, printInstr, readInstr } from "../instr";
import { Option, unwrap } from "../util";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class VM {
    program: DataView;
    pc: number;
    stack: Value[];
    debug: boolean;
    globals: Value[];
    nil: Value;

    constructor(program: DataView, debug: boolean = false) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.globals = [];
        this.debug = debug;
        this.nil = { typ: Type.NilType };
    }

    error(message: string) {
        throw new ExecutionError(`execution error: pc=${this.pc}: ${message}`);
    }

    popStack(): Value {
        if (this.stack.length === 0) {
            this.error("execution error: can't pop empty stack");
        }
        return unwrap(this.stack.pop());
    }

    log() {
        console.log(`[pc=${this.pc}] [stack=${JSON.stringify(this.stack)}]`);
    }

    step() {
        const { instr, size } = readInstr(this.program, this.pc);
        if (this.debug) {
            this.log();
            console.log(printInstr(instr));
            console.log();
        }
        switch (instr.op) {
            case Opcode.Push:
                this.stack.push(instr.value);
                this.pc += size;
                break;

            case Opcode.Pop:
                this.popStack();
                this.pc += size;
                break;

            case Opcode.Add: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.IntType, value: a + b });
                this.pc += size;
                break;
            }

            case Opcode.Sub: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.IntType, value: a - b });
                this.pc += size;
                break;
            }

            case Opcode.Eq: {
                const b = this.popStack();
                const a = this.popStack();
                let c: Option<boolean>;
                // prettier-ignore
                switch (a.typ) {
                    case Type.IntType: c = a.value === getInt(b); break;
                    case Type.BoolType: c = a.value === getBool(b); break;
                    case Type.NilType: c = b.typ === Type.NilType; break;
                    case Type.BuiltInFnType:
                    case Type.FnType:
                        throw new Error("unimplemented");
                }
                this.stack.push({ typ: Type.BoolType, value: c });
                this.pc += size;
                break;
            }

            case Opcode.Lt: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.BoolType, value: a < b });
                this.pc += size;
                break;
            }

            case Opcode.Assert: {
                const value = getBool(this.popStack());
                if (!value) console.log("assertion failed");
                this.stack.push({ typ: Type.NilType });
                this.pc += size;
                break;
            }

            case Opcode.Display:
                console.log(print(this.popStack()));
                this.stack.push({ typ: Type.NilType });
                this.pc += size;
                break;

            case Opcode.JmpIf:
                if (getBool(this.popStack())) {
                    this.pc = instr.pc;
                } else {
                    this.pc += size;
                }
                break;

            case Opcode.Jmp:
                this.pc = instr.pc;
                break;

            case Opcode.DefGlobal: {
                this.globals.push(this.popStack());
                this.stack.push(this.nil);
                this.pc += size;
                break;
            }

            case Opcode.GetStack:
            case Opcode.MakeLambda:
            case Opcode.Return:
            case Opcode.Call: {
                throw new Error();
            }

            case Opcode.GetGlobal: {
                if (instr.index >= this.globals.length) {
                    throw new ExecutionError("invalid global reference");
                }
                this.stack.push(this.globals[instr.index]);
                this.pc += size;
                break;
            }

            default:
                const __fail: never = instr;
        }
    }

    run() {
        while (this.pc < this.program.byteLength) {
            this.step();
        }
    }
}

export function execute(bytes: Uint8Array) {
    const vm = new VM(
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    );
    vm.run();
}
