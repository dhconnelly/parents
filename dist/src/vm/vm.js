"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const instr_1 = require("../instr");
const util_1 = require("../util");
const values_1 = require("../values");
const builtins_1 = require("./builtins");
const values_2 = require("./values");
const heap_1 = require("./heap");
class VM {
    constructor(program, maxHeap = 100000) {
        this.program = program;
        this.pc = 0;
        this.stack = [];
        this.heap = new heap_1.Heap(maxHeap);
        this.frames = [];
        this.globals = new Array(instr_1.NUM_BUILT_INS);
        this.globals[instr_1.BUILT_INS["nil"]] = { typ: values_1.Type.NilType };
        for (const [name, fn] of builtins_1.BUILT_IN_FNS) {
            this.globals[instr_1.BUILT_INS[name]] = {
                typ: values_1.Type.BuiltInFnType,
                arity: fn.arity,
                name: fn.name,
            };
        }
    }
    error(message) {
        throw new values_2.ExecutionError(`execution error: pc=${this.pc}: ${message}`);
    }
    popStack() {
        if (this.stack.length === 0) {
            this.error("execution error: can't pop empty stack");
        }
        return util_1.unwrap(this.stack.pop());
    }
    pushStack(value) {
        if (value === null) {
            util_1.fail("pushing null value!");
        }
        this.stack.push(value);
    }
    popN(n) {
        const values = new Array(n);
        for (let i = 0; i < n; i++) {
            values[i] = this.popStack();
        }
        return values;
    }
    callBuiltIn(ref, numArgs) {
        const fn = builtins_1.BUILT_INS_LOOKUP.get(ref.name);
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
        }
        catch (err) {
            if (err instanceof values_2.ExecutionError) {
                this.error(err.message);
            }
            else {
                throw err;
            }
        }
    }
    call(ref, numArgs, returnAddress) {
        const fn = this.heap.get(ref.heapIndex);
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
    *roots() {
        for (const value of this.globals)
            yield value;
        for (const value of this.stack)
            yield value;
    }
    step() {
        this.heap.gc(this.roots());
        const { instr, size } = instr_1.readInstr(this.program, this.pc);
        switch (instr.op) {
            case instr_1.Opcode.Push: {
                this.pushStack(instr.value);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Pop: {
                this.popStack();
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Get: {
                const top = this.frames[this.frames.length - 1];
                const stackBase = top === undefined ? 0 : top.stackBase;
                const value = this.stack[stackBase + instr.index];
                this.pushStack(value);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.JmpIf: {
                if (values_2.getBool(this.popStack())) {
                    this.pc = instr.pc;
                }
                else {
                    this.pc += size;
                }
                break;
            }
            case instr_1.Opcode.Jmp: {
                this.pc = instr.pc;
                break;
            }
            case instr_1.Opcode.DefGlobal: {
                this.globals.push(this.popStack());
                this.pushStack({ typ: values_1.Type.NilType });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.GetGlobal: {
                if (instr.index >= this.globals.length) {
                    this.error("invalid global reference");
                }
                this.pushStack(this.globals[instr.index]);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.MakeLambda: {
                const caps = this.popN(instr.captures);
                caps.reverse();
                const ptr = this.heap.alloc({
                    arity: instr.arity,
                    captures: caps,
                    pc: instr.pc,
                });
                this.pushStack({
                    typ: values_1.Type.FnType,
                    arity: instr.arity,
                    heapIndex: ptr,
                });
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Return: {
                const value = this.popStack();
                const frame = this.frames[this.frames.length - 1];
                this.stack.length = frame.stackBase;
                this.pc = frame.returnAddress;
                this.frames.pop();
                this.pushStack(value);
                break;
            }
            case instr_1.Opcode.Call: {
                const fn = values_2.getFn(this.popStack());
                switch (fn.typ) {
                    case values_1.Type.BuiltInFnType:
                        this.callBuiltIn(fn, instr.arity);
                        this.pc += size;
                        break;
                    case values_1.Type.FnType:
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
function execute(bytes) {
    const vm = new VM(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    try {
        vm.run();
        return util_1.Ok(null);
    }
    catch (err) {
        if (err instanceof values_2.ExecutionError) {
            return util_1.Err(err);
        }
        else {
            throw err;
        }
    }
}
exports.execute = execute;
