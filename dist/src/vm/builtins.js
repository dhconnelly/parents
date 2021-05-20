"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_INS_LOOKUP = exports.BUILT_IN_FNS = void 0;
const values_1 = require("../values");
const values_2 = require("./values");
exports.BUILT_IN_FNS = new Map([
    [
        "+",
        {
            name: "+",
            arity: 2,
            impl: (...args) => {
                return {
                    typ: values_1.Type.IntType,
                    value: values_2.getInt(args[0]) + values_2.getInt(args[1]),
                };
            },
        },
    ],
    [
        "-",
        {
            name: "-",
            arity: 2,
            impl: (...args) => {
                return {
                    typ: values_1.Type.IntType,
                    value: values_2.getInt(args[0]) - values_2.getInt(args[1]),
                };
            },
        },
    ],
    [
        "<",
        {
            name: "<",
            arity: 2,
            impl: (...args) => {
                return {
                    typ: values_1.Type.BoolType,
                    value: values_2.getInt(args[0]) < values_2.getInt(args[1]),
                };
            },
        },
    ],
    [
        "=",
        {
            name: "=",
            arity: 2,
            impl: (...args) => {
                const x = args[0];
                let value;
                switch (x.typ) {
                    case values_1.Type.BoolType:
                        value = values_2.getBool(args[1]) === x.value;
                        break;
                    case values_1.Type.IntType:
                        value = values_2.getInt(args[1]) === x.value;
                        break;
                    default:
                        throw new values_2.ExecutionError(`invalid arg for =: ${x.typ}`);
                }
                return { typ: values_1.Type.BoolType, value };
            },
        },
    ],
    [
        "assert",
        {
            name: "assert",
            arity: 1,
            impl: (...args) => {
                // TODO: use source information to improve this message
                if (!values_2.getBool(args[0]))
                    throw new values_2.ExecutionError("assertion failed");
                return { typ: values_1.Type.NilType };
            },
        },
    ],
    [
        "display",
        {
            name: "display",
            arity: 1,
            impl: (...args) => {
                console.log(values_2.print(args[0]));
                return { typ: values_1.Type.NilType };
            },
        },
    ],
    [
        "*",
        {
            name: "*",
            arity: 2,
            impl: (...args) => {
                return {
                    typ: values_1.Type.IntType,
                    value: values_2.getInt(args[0]) * values_2.getInt(args[1]),
                };
            },
        },
    ],
    [
        "isnil",
        {
            name: "isnil",
            arity: 1,
            impl: (...args) => {
                return {
                    typ: values_1.Type.BoolType,
                    value: args[0].typ === values_1.Type.NilType,
                };
            },
        },
    ],
    [
        "memory",
        {
            name: "memory",
            arity: 0,
            impl: () => {
                return {
                    typ: values_1.Type.IntType,
                    value: process.memoryUsage().heapUsed,
                };
            },
        },
    ],
]);
exports.BUILT_INS_LOOKUP = exports.BUILT_IN_FNS;
