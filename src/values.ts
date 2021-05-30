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
    }
}

export class TypeCheckError extends Error {
    constructor(want: Type, got: Type) {
        super(`type error: want ${printType(want)}, got ${printType(got)}`);
    }
}

export interface AbstractValue {
    typ: Type;
}

export interface NilValue extends AbstractValue {
    typ: Type.NilType;
}

export interface IntValue extends AbstractValue {
    typ: Type.IntType;
    value: number;
}

export interface BoolValue extends AbstractValue {
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

export function print(value: SerializableValue): string {
    // prettier-ignore
    switch (value.typ) {
        case Type.BoolType: return value.value.toString();
        case Type.IntType: return value.value.toString(10);
        case Type.NilType: return "null";
    }
}
