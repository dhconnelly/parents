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
            name: "+",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.IntType, value: values_1.getInt(args[0]) + values_1.getInt(args[1]) };
            },
        }],
    ["-", {
            name: "-",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.IntType, value: values_1.getInt(args[0]) - values_1.getInt(args[1]) };
            },
        }],
    ["<", {
            name: "<",
            arity: 2,
            impl: (...args) => {
                return { typ: types_1.Type.BoolType, value: values_1.getInt(args[0]) < values_1.getInt(args[1]) };
            },
        }],
    ["=", {
            name: "=",
            arity: 2,
            impl: (...args) => {
                const x = args[0];
                let value;
                switch (x.typ) {
                    case types_1.Type.BoolType:
                        value = values_1.getBool(args[1]) === x.value;
                        break;
                    case types_1.Type.IntType:
                        value = values_1.getInt(args[1]) === x.value;
                        break;
                    default:
                        throw new ExecutionError(`invalid arg for =: ${x.typ}`);
                }
                return { typ: types_1.Type.BoolType, value };
            },
        }],
    ["assert", {
            name: "assert",
            arity: 1,
            impl: (...args) => {
                // TODO: use source information to improve this message
                if (!values_1.getBool(args[0]))
                    console.log("assertion failed");
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
            name: "*",
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
const BUILT_INS_LOOKUP = BUILT_IN_FNS;
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
        this.frames = [];
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
    popN(n) {
        const values = new Array(n);
        for (let i = 0; i < n; i++) {
            values[i] = this.popStack();
        }
        return values;
    }
    log() {
        console.log(`[pc=${this.pc}]
            [stack=${JSON.stringify(this.stack)}]
            [heap=${JSON.stringify(this.heap)}]
        `);
    }
    callBuiltIn(ref) {
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
            this.stack.push(result);
        }
        catch (err) {
            if (err instanceof ExecutionError) {
                this.error(err.message);
            }
            else {
                throw err;
            }
        }
    }
    call(ref) {
        this.frames.push({
            stackBase: this.stack.length,
            returnAddress: this.pc + 1,
        });
        const fn = this.heap[ref.heapIndex];
        if (fn.arity !== ref.arity) {
            this.error(`function wants ${fn.arity} args, got ${ref.arity}`);
        }
        const args = this.popN(fn.arity);
        args.reverse();
        args.forEach((arg) => this.stack.push(arg));
        this.stack.push(ref);
        fn.captures.forEach((cap) => this.stack.push(cap));
        this.pc = fn.pc;
    }
    step() {
        const { instr, size } = instr_1.readInstr(this.program, this.pc);
        if (this.debug) {
            this.log();
            console.log(instr_1.printInstr(instr));
            console.log();
        }
        switch (instr.op) {
            case instr_1.Opcode.Push: {
                this.stack.push(instr.value);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Pop: {
                this.popStack();
                this.pc += size;
                break;
            }
            case instr_1.Opcode.Get: {
                const frameIndex = this.frames.length - 1 - instr.frameDist;
                const frame = this.frames[frameIndex];
                const value = this.stack[frame.stackBase + instr.index];
                this.stack.push(value);
                break;
            }
            case instr_1.Opcode.JmpIf: {
                if (values_1.getBool(this.popStack())) {
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
                this.stack.push(this.nil);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.GetGlobal: {
                if (instr.index >= this.globals.length) {
                    this.error("invalid global reference");
                }
                this.stack.push(this.globals[instr.index]);
                this.pc += size;
                break;
            }
            case instr_1.Opcode.MakeLambda: {
                this.stack.push({
                    typ: types_1.Type.FnType,
                    arity: instr.arity,
                    heapIndex: this.heap.length,
                });
                const caps = this.popN(instr.captures);
                caps.reverse();
                this.heap.push({
                    arity: instr.arity,
                    captures: caps,
                    pc: instr.pc,
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
                this.stack.push(value);
                break;
            }
            case instr_1.Opcode.Call: {
                const fn = values_1.getFn(this.popStack());
                // prettier-ignore
                switch (fn.typ) {
                    case types_1.Type.BuiltInFnType:
                        this.callBuiltIn(fn);
                        this.pc += size;
                        break;
                    case types_1.Type.FnType:
                        this.call(fn);
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
    const vm = new VM(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), true);
    try {
        vm.run();
        return util_1.Ok(null);
    }
    catch (err) {
        if (err instanceof ExecutionError) {
            return util_1.Err(err);
        }
        else {
            throw err;
        }
    }
}
exports.execute = execute;
