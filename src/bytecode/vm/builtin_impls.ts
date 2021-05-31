import { BuiltInName, BuiltInFnName } from "../builtin_decls";
import { print, Value, getAs } from "../values";
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
            const left = getAs(args[0], Type.IntType).value;
            const right = getAs(args[1], Type.IntType).value;
            return { typ: Type.IntType, value: left + right };
        },
    },

    "-": {
        name: "-",
        arity: 2,
        impl: (...args: Value[]) => {
            const left = getAs(args[0], Type.IntType).value;
            const right = getAs(args[1], Type.IntType).value;
            return { typ: Type.IntType, value: left - right };
        },
    },

    "<": {
        name: "<",
        arity: 2,
        impl: (...args: Value[]) => {
            const left = getAs(args[0], Type.IntType).value;
            const right = getAs(args[1], Type.IntType).value;
            return { typ: Type.BoolType, value: left < right };
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
                    value = getAs(args[1], Type.BoolType).value === x.value;
                    break;
                case Type.IntType:
                    value = getAs(args[1], Type.IntType).value === x.value;
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
            if (!getAs(args[0], Type.BoolType).value)
                throw new ExecutionError("assertion failed");
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
            const left = getAs(args[0], Type.IntType).value;
            const right = getAs(args[1], Type.IntType).value;
            return { typ: Type.IntType, value: left * right };
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
