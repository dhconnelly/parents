import { Expr } from "./ast";
import { Scope } from "./interpreter/scope";
import { RootError } from "./util";

export enum Type {
    NilType = 1,
    IntType = 2,
    BoolType = 3,
    FnType = 4,
    BuiltInFnType = 5,
}

function printType(typ: Type): string {
    // prettier-ignore
    switch (typ) {
        case Type.NilType: return "NilType";
        case Type.BoolType: return "BoolType";
        case Type.BuiltInFnType: return "BuiltInFnType";
        case Type.FnType: return "FnType";
        case Type.IntType: return "IntType";
        default: const __fail: never = typ; throw new Error("never");
    }
}

class TypeCheckError extends RootError {
    constructor(message: string) {
        super(message);
    }
}

function typeError(want: Type, got: Type) {
    throw new TypeCheckError(
        `type error: want ${printType(want)}, got ${printType(got)}`
    );
}

export type Value = NilValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

interface AbstractValue {
    readonly typ: Type;
}

export interface NilValue extends AbstractValue {
    readonly typ: Type.NilType;
}

export interface IntValue extends AbstractValue {
    readonly typ: Type.IntType;
    readonly value: number;
}

export interface BoolValue extends AbstractValue {
    readonly typ: Type.BoolType;
    readonly value: boolean;
}

export interface FnValue extends AbstractValue {
    readonly typ: Type.FnType;
    readonly scope: Scope;
    readonly params: string[];
    readonly body: Expr;
    readonly name?: string;
}

export interface BuiltInFnValue extends AbstractValue {
    readonly typ: Type.BuiltInFnType;
    readonly name: string;
    readonly arity: number;
    readonly impl: (args: Expr[]) => Value;
}

export function getInt(value: Value): number {
    if (value.typ !== Type.IntType) {
        throw typeError(Type.IntType, value.typ);
    }
    return value.value;
}

export function getBool(value: Value): boolean {
    if (value.typ !== Type.BoolType) {
        throw typeError(Type.BoolType, value.typ);
    }
    return value.value;
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

type SizedValue = {
    value: Value;
    size: number;
};

class ValueError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export function deserialize(view: DataView, at: number): SizedValue {
    const typ = view.getUint8(at);
    switch (typ) {
        case Type.IntType: {
            const num = view.getInt32(at + 1);
            const value: Value = { typ: Type.IntType, value: num };
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

        case Type.BuiltInFnType:
        case Type.FnType:
        case Type.NilType:
            throw new Error("not implemented");
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
export function serialize(value: Value): number[] {
    const nums: number[] = [];
    nums.push(value.typ);
    switch (value.typ) {
        case Type.IntType:
            nums.push(...serializeNumber(value.value));
            break;

        case Type.BoolType:
            nums.push(value.value ? 1 : 0);
            break;

        case Type.BuiltInFnType:
        case Type.FnType:
        case Type.NilType:
            throw new Error("not implemented");
    }
    return nums;
}

export function print(value: Value): string {
    // prettier-ignore
    switch (value.typ) {
        case Type.BoolType: return value.value.toString();
        case Type.BuiltInFnType: return `<built-in-fn ${value.name}>`;
        case Type.FnType:
            return value.name ? `<fn ${value.name}>` : "<anonymous fn>";
        case Type.IntType: return value.value.toString(10);
        case Type.NilType: return "null";
    }
}
