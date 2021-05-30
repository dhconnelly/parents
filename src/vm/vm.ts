import { Opcode, readInstr } from "./instr";
import { Err, fail, Ok, Result, unwrap } from "../util";
import { Type } from "../types";
import {
    BUILT_INS,
    BUILT_INS_LOOKUP,
    BUILT_IN_FNS,
    NUM_BUILT_INS,
} from "./builtins";
import {
    BuiltInFnRef,
    Closure,
    ClosureRef,
    getBool,
    getFn,
    Value,
    ExecutionError,
} from "./values";
import { Heap } from "./heap";

type StackFrame = {
    stackBase: number;
    returnAddress: number;
};

class VM {
    program: DataView;
    pc: number;
    stack: Value[];
    globals: Value[];
    frames: StackFrame[];
    heap: Heap;

    constructor(program: DataView, maxHeap: number = 100000) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.heap = new Heap(maxHeap);
        this.frames = [];
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

    call(ref: ClosureRef, numArgs: number, returnAddress: number) {
        const fn: Closure = this.heap.get(ref.heapIndex);
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

    *roots(): Iterable<Value> {
        for (const value of this.globals) yield value;
        for (const value of this.stack) yield value;
    }

    step() {
        this.heap.gc(this.roots());
        const { instr, size } = readInstr(this.program, this.pc);
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
                this.pushStack({ typ: Type.NilType });
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
                const ptr = this.heap.alloc({
                    arity: instr.arity,
                    captures: caps,
                    pc: instr.pc,
                });
                this.pushStack({
                    typ: Type.FnType,
                    arity: instr.arity,
                    heapIndex: ptr,
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
                switch (fn.typ) {
                    case Type.BuiltInFnType:
                        this.callBuiltIn(fn, instr.arity);
                        this.pc += size;
                        break;
                    case Type.FnType:
                        this.call(fn, instr.arity, this.pc + size);
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
