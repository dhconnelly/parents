import {
    NilValue,
    BoolValue,
    IntValue,
    print as printSerializable,
    Type,
    TypeCheckError,
} from "../values";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export type BuiltInFn = {
    name: string;
    arity: number;
    impl: (...args: Value[]) => Value;
};

export type Closure = {
    arity: number;
    captures: Value[];
    pc: number;
};

export type BuiltInFnRef = {
    typ: Type.BuiltInFnType;
    name: string;
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

export function getInt(value: Value): number {
    if (value.typ !== Type.IntType) {
        throw new TypeCheckError(Type.IntType, value.typ);
    }
    return value.value;
}

export function getBool(value: Value): boolean {
    if (value.typ !== Type.BoolType) {
        throw new TypeCheckError(Type.BoolType, value.typ);
    }
    return value.value;
}

export function getFn(value: Value): BuiltInFnRef | ClosureRef {
    if (value.typ !== Type.BuiltInFnType && value.typ !== Type.FnType) {
        throw new TypeCheckError(Type.FnType, value.typ);
    }
    return value;
}

export function print(value: Value): string {
    // prettier-ignore
    switch (value.typ) {
        case Type.BuiltInFnType: return `<built-in-fn ${value.name}>`;
        case Type.FnType: return `<compiled-fn>`;
        case Type.BoolType:
        case Type.IntType:
        case Type.NilType:
            return printSerializable(value);
    }
}
