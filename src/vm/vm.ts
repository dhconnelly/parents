import { Type, Value, getInt, print, getBool } from "../values";
import { Opcode, readInstr } from "../instr";
import { Option, RootError, unwrap } from "../util";

class ExecutionError extends RootError {
    constructor(message: string) {
        super(message);
    }
}

class VM {
    program: DataView;
    pc: number;
    stack: Value[];
    debug: boolean;

    constructor(program: DataView, debug: boolean = false) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.debug = debug;
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
            console.log(JSON.stringify(instr));
            console.log();
        }
        switch (instr.op) {
            case Opcode.Push:
                this.stack.push(instr.value);
                break;

            case Opcode.Pop:
                this.popStack();
                break;

            case Opcode.Add: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.IntType, value: a + b });
                break;
            }

            case Opcode.Sub: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.IntType, value: a - b });
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
                break;
            }

            case Opcode.Lt: {
                const b = getInt(this.popStack());
                const a = getInt(this.popStack());
                this.stack.push({ typ: Type.BoolType, value: a < b });
                break;
            }

            case Opcode.Assert: {
                const value = getBool(this.popStack());
                if (!value) console.log("assertion failed");
                this.stack.push({ typ: Type.NilType });
                break;
            }

            case Opcode.Display:
                console.log(print(this.popStack()));
                this.stack.push({ typ: Type.NilType });
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

export function execute(bytes: Uint8Array) {
    const vm = new VM(
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    );
    vm.run();
}
