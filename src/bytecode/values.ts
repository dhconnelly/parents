import { Type, TypeCheckError } from "../types";
import { BuiltInFnName } from "./builtin_decls";

export class ExecutionError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export interface NilValue {
    typ: Type.NilType;
}

export interface IntValue {
    typ: Type.IntType;
    value: number;
}

export interface BoolValue {
    typ: Type.BoolType;
    value: boolean;
}

// return the bytes of |num| in big-endian order
export function serializeNumber(num: number): number[] {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, num, false);
    return [
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3),
    ];
}

export class ValueError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export type SerializableValue = IntValue | BoolValue | NilValue;

export type SizedValue = {
    value: SerializableValue;
    size: number;
};

export function deserialize(view: DataView, at: number): SizedValue {
    const typ = view.getUint8(at);
    switch (typ) {
        case Type.IntType: {
            const num = view.getInt32(at + 1);
            const value: SerializableValue = { typ: Type.IntType, value: num };
            return { value, size: 5 };
        }

        case Type.BoolType: {
            const bool = view.getUint8(at + 1);
            if (bool !== 0 && bool !== 1)
                throw new ValueError(
                    `bad boolean value at byte offset ${
                        view.byteOffset + at
                    }: ${bool}`
                );
            const value = bool === 0 ? false : true;
            return { value: { typ: Type.BoolType, value }, size: 2 };
        }

        case Type.NilType:
            return { value: { typ: Type.NilType }, size: 1 };

        default:
            throw new ValueError(
                `bad value at byte offset ${view.byteOffset + at}`
            );
    }
}

// serializes |value| to bytes, prefixed by a single byte representing the
// type of the value (see enum Type for the value).
//
// layouts:
// int: big-endian signed 32-bit int
// others: not yet implemented
export function serialize(value: SerializableValue): number[] {
    const nums: number[] = [];
    nums.push(value.typ);
    switch (value.typ) {
        case Type.IntType:
            nums.push(...serializeNumber(value.value));
            break;

        case Type.BoolType:
            nums.push(value.value ? 1 : 0);
            break;

        case Type.NilType:
            break;
    }
    return nums;
}

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
        case Type.BoolType: return value.value.toString();
        case Type.IntType: return value.value.toString(10);
        case Type.NilType: return "nil";
    }
}
