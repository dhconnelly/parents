import { Type } from "../types";
import {
    BuiltInFn,
    getBool,
    getInt,
    print,
    Value,
    ExecutionError,
} from "./values";

export const BUILT_IN_FNS = {
    "+": 0,
    "-": 1,
    "<": 2,
    "=": 3,
    assert: 4,
    display: 5,
    "*": 6,
    isnil: 7,
    memory: 9,
};
export const BUILT_INS = {
    ...BUILT_IN_FNS,
    nil: 8,
};

export const BUILT_IN_NAMES = Object.keys(
    BUILT_INS
) as (keyof typeof BUILT_INS)[];
export const NUM_BUILT_INS = BUILT_IN_NAMES.length;

export const BUILT_IN_VALUES: Record<keyof typeof BUILT_INS, Value> = {
    "+": { typ: Type.BuiltInFnType, arity: 2, name: "+" },
    "*": { typ: Type.BuiltInFnType, arity: 2, name: "*" },
    "-": { typ: Type.BuiltInFnType, arity: 2, name: "-" },
    "<": { typ: Type.BuiltInFnType, arity: 2, name: "<" },
    "=": { typ: Type.BuiltInFnType, arity: 2, name: "=" },
    assert: { typ: Type.BuiltInFnType, arity: 1, name: "assert" },
    display: { typ: Type.BuiltInFnType, arity: 1, name: "display" },
    isnil: { typ: Type.BuiltInFnType, arity: 1, name: "isnil" },
    memory: { typ: Type.BuiltInFnType, arity: 0, name: "memory" },
    nil: { typ: Type.NilType },
};

export const BUILT_IN_FN_IMPLS: Record<keyof typeof BUILT_IN_FNS, BuiltInFn> = {
    "+": {
        name: "+",
        arity: 2,
        impl: (...args: Value[]) => {
            return {
                typ: Type.IntType,
                value: getInt(args[0]) + getInt(args[1]),
            };
        },
    },

    "-": {
        name: "-",
        arity: 2,
        impl: (...args: Value[]) => {
            return {
                typ: Type.IntType,
                value: getInt(args[0]) - getInt(args[1]),
            };
        },
    },

    "<": {
        name: "<",
        arity: 2,
        impl: (...args: Value[]) => {
            return {
                typ: Type.BoolType,
                value: getInt(args[0]) < getInt(args[1]),
            };
        },
    },

    "=": {
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
    },

    assert: {
        name: "assert",
        arity: 1,
        impl: (...args: Value[]) => {
            // TODO: use source information to improve this message
            if (!getBool(args[0])) throw new ExecutionError("assertion failed");
            return { typ: Type.NilType };
        },
    },

    display: {
        name: "display",
        arity: 1,
        impl: (...args: Value[]) => {
            console.log(print(args[0]));
            return { typ: Type.NilType };
        },
    },

    "*": {
        name: "*",
        arity: 2,
        impl: (...args: Value[]) => {
            return {
                typ: Type.IntType,
                value: getInt(args[0]) * getInt(args[1]),
            };
        },
    },

    isnil: {
        name: "isnil",
        arity: 1,
        impl: (...args: Value[]) => {
            return {
                typ: Type.BoolType,
                value: args[0].typ === Type.NilType,
            };
        },
    },

    memory: {
        name: "memory",
        arity: 0,
        impl: () => {
            return {
                typ: Type.IntType,
                value: process.memoryUsage().heapUsed,
            };
        },
    },
};
