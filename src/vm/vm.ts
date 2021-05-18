import {
    BUILT_INS,
    NUM_BUILT_INS,
    Opcode,
    printInstr,
    readInstr,
} from "../instr";
import { Option, unwrap } from "../util";
import { Type } from "../types";
import {
    print,
    Value,
    Closure,
    getInt,
    getBool,
    BuiltInFnRef,
    BuiltInFn,
} from "./values";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

// prettier-ignore
const BUILT_IN_FNS: Map<keyof typeof BUILT_INS, BuiltInFn> = new Map([
    ["+", {
        name: "add",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.IntType, value: getInt(args[0]) + getInt(args[1]) };
        },
    }],

    ["-", {
        name: "sub",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.IntType, value: getInt(args[0]) - getInt(args[1]) };
        },
    }],

    ["<", {
        name: "lt",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.BoolType, value: getInt(args[0]) < getInt(args[1]) };
        },
    }],

    ["=", {
        name: "eq",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.BoolType, value: getInt(args[0]) === getInt(args[1]) };
        },
    }],

    ["assert", {
        name: "assert",
        arity: 1,
        impl: (...args: Value[]) => {
            if (!getBool(args[0])) throw new ExecutionError("assertion failed");
            return { typ: Type.NilType };
        },
    }],

    ["display", {
        name: "display",
        arity: 1,
        impl: (...args: Value[]) => {
            console.log(print(args[0]));
            return { typ: Type.NilType };
        },
    }],

    ["*", {
        name: "mul",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.IntType, value: getInt(args[0]) * getInt(args[1]) };
        },
    }],

    ["isnil", {
        name: "isnil",
        arity: 1,
        impl: (...args: Value[]) => {
            return { typ: Type.BoolType, value: args[0].typ === Type.NilType };
        },
    }],
]);

class VM {
    debug: boolean;
    program: DataView;
    pc: number;
    stack: Value[];
    heap: Closure[];
    globals: Value[];
    nil: Value;

    constructor(program: DataView, debug: boolean = false) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.globals = new Array(NUM_BUILT_INS);
        for (const [name, fn] of BUILT_IN_FNS) {
            const ref: BuiltInFnRef = {
                typ: Type.BuiltInFnType,
                arity: fn.arity,
                name: fn.name,
            };
            this.globals[BUILT_INS[name]] = ref;
        }
        this.globals[BUILT_INS["nil"]] = { typ: Type.NilType };
        this.debug = debug;
        this.nil = { typ: Type.NilType };
        this.heap = [];
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

            case Opcode.MakeLambda:
            case Opcode.Get:
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
