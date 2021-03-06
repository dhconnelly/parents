import { BuiltInName, BuiltInFnName } from "../builtin_decls";
import { getBool, getInt, print, Value } from "../values";
import { ExecutionError } from "../errors";
import { Type } from "../../types";

export const BUILT_IN_VALUES: Record<BuiltInName, Value> = {
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

export type BuiltInFn = {
    name: string;
    arity: number;
    impl: (...args: Value[]) => Value;
};

export const BUILT_IN_FN_IMPLS: Record<BuiltInFnName, BuiltInFn> = {
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
