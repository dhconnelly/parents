import {
    BUILT_INS,
    NUM_BUILT_INS,
    Opcode,
    printInstr,
    readInstr,
} from "../instr";
import { Err, fail, Ok, Result, unwrap } from "../util";
import { Type } from "../values";
import { BUILT_INS_LOOKUP, BUILT_IN_FNS } from "./builtins";
import {
    BuiltInFnRef,
    Closure,
    ClosureRef,
    closureSize,
    getBool,
    getFn,
    Value,
} from "./values";
import { inspect } from "util";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

type StackFrame = {
    stackBase: number;
    returnAddress: number;
};

class VM {
    debug: boolean;
    program: DataView;
    pc: number;
    stack: Value[];
    globals: Value[];
    nil: Value;
    frames: StackFrame[];
    heap: Map<number, Closure>;
    heapSize: number;
    maxHeap: number;
    nextHeapIndex: number;

    constructor(
        program: DataView,
        maxHeap: number = 100000,
        debug: boolean = false
    ) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.debug = debug;
        this.nil = { typ: Type.NilType };
        this.heap = new Map();
        this.frames = [];
        this.heapSize = 0;
        this.maxHeap = maxHeap;
        this.nextHeapIndex = 0;
        this.globals = new Array(NUM_BUILT_INS);
        this.globals[BUILT_INS["nil"]] = { typ: Type.NilType };
        for (const [name, fn] of BUILT_IN_FNS) {
            this.globals[BUILT_INS[name]] = {
                typ: Type.BuiltInFnType,
                arity: fn.arity,
                name: fn.name,
            };
        }
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

    callBuiltIn(ref: BuiltInFnRef, numArgs: number) {
        const fn = BUILT_INS_LOOKUP.get(ref.name);
        if (fn === undefined) {
            this.error(`undefined: ${ref.name}`);
        }
        if (fn.arity !== numArgs) {
            this.error(`${fn.name} wants ${fn.arity} args, got ${numArgs}`);
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

    mark(value: Value, live: Set<number>) {
        if (value.typ !== Type.FnType) return;
        const ptr = value.heapIndex;
        if (live.has(ptr)) return;
        live.add(ptr);
        for (const capture of this.heapGet(ptr).captures) {
            this.mark(capture, live);
        }
    }

    gc() {
        if (this.heapSize < this.maxHeap) return;
        const live: Set<number> = new Set();
        this.stack.forEach((value) => this.mark(value, live));
        this.globals.forEach((value) => this.mark(value, live));
        const remove: Set<number> = new Set();
        for (const ptr of this.heap.keys()) {
            if (!live.has(ptr)) remove.add(ptr);
        }
        for (const ptr of remove) {
            this.heapSize -= closureSize(this.heapGet(ptr));
            this.heap.delete(ptr);
        }
    }

    heapGet(i: number): Closure {
        const closure = this.heap.get(i);
        if (closure === undefined) {
            throw new Error(`bad heap access: ${i}`);
        }
        return closure;
    }

    call(ref: ClosureRef, numArgs: number, returnAddress: number) {
        const fn: Closure = this.heapGet(ref.heapIndex);
        if (fn.arity !== numArgs) {
            this.error(`function wants ${fn.arity} args, got ${numArgs}`);
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
        this.gc();
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
                const ptr = this.nextHeapIndex++;
                this.pushStack({
                    typ: Type.FnType,
                    arity: instr.arity,
                    heapIndex: ptr,
                });
                const closure = {
                    arity: instr.arity,
                    captures: caps,
                    pc: instr.pc,
                };
                this.heap.set(ptr, closure);
                this.heapSize += closureSize(closure);
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
                        this.callBuiltIn(fn, instr.arity);
                        this.pc += size;
                        break;
                    case Type.FnType:
                        try {
                        this.call(fn, instr.arity, this.pc + size);
                        } catch (err) {
                            console.log(fn);
                            console.log(this.stack[this.stack.length-1]);
                            console.log(instr);
                        }
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
