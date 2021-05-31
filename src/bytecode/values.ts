import { Type, TypeCheckError } from "../types";
import { BuiltInFnName } from "./builtin_decls";

export class ValueError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export type NilValue = {
    typ: Type.NilType;
};

export type IntValue = {
    typ: Type.IntType;
    value: number;
};

export type BoolValue = {
    typ: Type.BoolType;
    value: boolean;
};

export type Closure = {
    arity: number;
    captures: Value[];
    pc: number;
};

export type BuiltInFnRef = {
    typ: Type.BuiltInFnType;
    name: BuiltInFnName;
    arity: number;
};

export type ClosureRef = {
    typ: Type.FnType;
    heapIndex: number;
    arity: number;
};

export type Value = NilValue | BoolValue | IntValue | BuiltInFnRef | ClosureRef;

function valueSize(value: Value): number {
    // prettier-ignore
    switch (value.typ) {
        case Type.IntType: return 4;
        case Type.NilType: return 1;
        case Type.FnType: return 9;
        case Type.BuiltInFnType: return 5 + value.name.length * 2;
        case Type.BoolType: return 1;
    }
}

function sum(nums: number[]): number {
    return nums.reduce((acc, cur) => acc + cur, 0);
}

export function closureSize(closure: Closure): number {
    return 8 + sum(closure.captures.map(valueSize));
}

export function getFn(value: Value): BuiltInFnRef | ClosureRef {
    if (value.typ !== Type.BuiltInFnType && value.typ !== Type.FnType) {
        throw new TypeCheckError(Type.FnType, value.typ);
    }
    return value;
}

export function getAs<T extends Type>(
    value: Value,
    typ: T
): T extends Type.BoolType
    ? BoolValue
    : T extends Type.IntType
    ? IntValue
    : T extends Type.NilType
    ? NilValue
    : T extends Type.FnType
    ? ClosureRef
    : T extends Type.BuiltInFnType
    ? BuiltInFnRef
    : never {
    if (typ !== value.typ) throw new TypeCheckError(typ, value.typ);
    return value as any;
}

export function print(value: Value): string {
    // prettier-ignore
    switch (value.typ) {
        case Type.BuiltInFnType: return `<built-in-fn ${value.name}>`;
        case Type.FnType: return `<compiled-fn>`;
        case Type.BoolType: return value.value.toString();
        case Type.IntType: return value.value.toString(10);
        case Type.NilType: return "nil";
    }
}
