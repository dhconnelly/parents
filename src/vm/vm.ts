import {
    BUILT_INS,
    NUM_BUILT_INS,
    Opcode,
    printInstr,
    readInstr,
} from "../instr";
import { Err, fail, Ok, Result, unwrap } from "../util";
import { Type } from "../values";
import {
    BuiltInFn,
    BuiltInFnRef,
    Closure,
    ClosureRef,
    getBool,
    getFn,
    getInt,
    print,
    Value,
} from "./values";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

// prettier-ignore
const BUILT_IN_FNS: Map<keyof typeof BUILT_INS, BuiltInFn> = new Map([
    ["+", {
        name: "+",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.IntType, value: getInt(args[0]) + getInt(args[1]) };
        },
    }],

    ["-", {
        name: "-",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.IntType, value: getInt(args[0]) - getInt(args[1]) };
        },
    }],

    ["<", {
        name: "<",
        arity: 2,
        impl: (...args: Value[]) => {
            return { typ: Type.BoolType, value: getInt(args[0]) < getInt(args[1]) };
        },
    }],

    ["=", {
        name: "=",
        arity: 2,
        impl: (...args: Value[]) => {
            const x = args[0];
            let value;
            switch (x.typ) {
                case Type.BoolType:
                    value = getBool(args[1]) === x.value;
                    break;
                case Type.IntType:
                    value = getInt(args[1]) === x.value;
                    break;
                default:
                    throw new ExecutionError(`invalid arg for =: ${x.typ}`);
            }
            return { typ: Type.BoolType, value };
        },
    }],

    ["assert", {
        name: "assert",
        arity: 1,
        impl: (...args: Value[]) => {
            // TODO: use source information to improve this message
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
        name: "*",
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
const BUILT_INS_LOOKUP: Map<string, BuiltInFn> = BUILT_IN_FNS;

type StackFrame = {
    stackBase: number;
    returnAddress: number;
};

class VM {
    debug: boolean;
    program: DataView;
    pc: number;
    stack: Value[];
    heap: Closure[];
    globals: Value[];
    nil: Value;
    frames: StackFrame[];

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
        this.frames = [];
    }

    error(message: string): never {
        throw new ExecutionError(`execution error: pc=${this.pc}: ${message}`);
    }

    popStack(): Value {
        if (this.stack.length === 0) {
            this.error("execution error: can't pop empty stack");
        }
        return unwrap(this.stack.pop());
    }

    pushStack(value: Value) {
        if (value === null) {
            this.log();
            fail("pushing null value!");
        }
        this.stack.push(value);
    }

    popN(n: number): Value[] {
        const values = new Array(n);
        for (let i = 0; i < n; i++) {
            values[i] = this.popStack();
        }
        return values;
    }

    log() {
        console.log(`[pc=${this.pc}]
            frames=${JSON.stringify(this.frames)}
            stack=${JSON.stringify(this.stack)}
            heap=${JSON.stringify(this.heap)}
        `);
    }

    callBuiltIn(ref: BuiltInFnRef) {
        const fn = BUILT_INS_LOOKUP.get(ref.name);
        if (fn === undefined) {
            this.error(`undefined: ${ref.name}`);
        }
        if (fn.arity !== ref.arity) {
            this.error(`${fn.name} wants ${fn.arity} args, got ${ref.arity}`);
        }
        const args = this.popN(fn.arity);
        args.reverse();
        try {
            const result = fn.impl(...args);
            this.pushStack(result);
        } catch (err) {
            if (err instanceof ExecutionError) {
                this.error(err.message);
            } else {
                throw err;
            }
        }
    }

    call(ref: ClosureRef, returnAddress: number) {
        const fn: Closure = this.heap[ref.heapIndex];
        if (fn.arity !== ref.arity) {
            this.error(`function wants ${fn.arity} args, got ${ref.arity}`);
        }
        this.frames.push({
            stackBase: this.stack.length - ref.arity,
            returnAddress,
        });
        this.pushStack(ref);
        fn.captures.forEach((cap) => this.pushStack(cap));
        this.pc = fn.pc;
    }

    step() {
        const { instr, size } = readInstr(this.program, this.pc);
        if (this.debug) {
            this.log();
            console.log(printInstr(instr));
            console.log();
        }
        switch (instr.op) {
            case Opcode.Push: {
                this.pushStack(instr.value);
                this.pc += size;
                break;
            }

            case Opcode.Pop: {
                this.popStack();
                this.pc += size;
                break;
            }

            case Opcode.Get: {
                const top = this.frames[this.frames.length - 1];
                const stackBase = top === undefined ? 0 : top.stackBase;
                const value = this.stack[stackBase + instr.index];
                this.pushStack(value);
                this.pc += size;
                break;
            }

            case Opcode.JmpIf: {
                if (getBool(this.popStack())) {
                    this.pc = instr.pc;
                } else {
                    this.pc += size;
                }
                break;
            }

            case Opcode.Jmp: {
                this.pc = instr.pc;
                break;
            }

            case Opcode.DefGlobal: {
                this.globals.push(this.popStack());
                this.pushStack(this.nil);
                this.pc += size;
                break;
            }

            case Opcode.GetGlobal: {
                if (instr.index >= this.globals.length) {
                    this.error("invalid global reference");
                }
                this.pushStack(this.globals[instr.index]);
                this.pc += size;
                break;
            }

            case Opcode.MakeLambda: {
                const caps = this.popN(instr.captures);
                caps.reverse();
                this.pushStack({
                    typ: Type.FnType,
                    arity: instr.arity,
                    heapIndex: this.heap.length,
                });
                this.heap.push({
                    arity: instr.arity,
                    captures: caps,
                    pc: instr.pc,
                });
                this.pc += size;
                break;
            }

            case Opcode.Return: {
                const value = this.popStack();
                const frame = this.frames[this.frames.length - 1];
                this.stack.length = frame.stackBase;
                this.pc = frame.returnAddress;
                this.frames.pop();
                this.pushStack(value);
                break;
            }

            case Opcode.Call: {
                const fn = getFn(this.popStack());
                // prettier-ignore
                switch (fn.typ) {
                    case Type.BuiltInFnType:
                        this.callBuiltIn(fn);
                        this.pc += size;
                        break;
                    case Type.FnType:
                        this.call(fn, this.pc + size);
                        break;
                }
            }
        }
    }

    run() {
        while (this.pc < this.program.byteLength) {
            this.step();
        }
    }
}

export function execute(bytes: Uint8Array): Result<null, ExecutionError> {
    const vm = new VM(
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    );
    try {
        vm.run();
        return Ok(null);
    } catch (err) {
        if (err instanceof ExecutionError) {
            return Err(err);
        } else {
            throw err;
        }
    }
}
