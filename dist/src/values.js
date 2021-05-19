"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.serialize = exports.deserialize = exports.ValueError = exports.serializeNumber = exports.TypeCheckError = exports.Type = void 0;
var Type;
(function (Type) {
    Type[Type["NilType"] = 1] = "NilType";
    Type[Type["IntType"] = 2] = "IntType";
    Type[Type["BoolType"] = 3] = "BoolType";
    Type[Type["FnType"] = 4] = "FnType";
    Type[Type["BuiltInFnType"] = 5] = "BuiltInFnType";
})(Type = exports.Type || (exports.Type = {}));
function printType(typ) {
    // prettier-ignore
    switch (typ) {
        case Type.NilType: return "NilType";
        case Type.BoolType: return "BoolType";
        case Type.BuiltInFnType: return "BuiltInFnType";
        case Type.FnType: return "FnType";
        case Type.IntType: return "IntType";
        default:
            const __fail = typ;
            throw new Error("never");
    }
}
class TypeCheckError extends Error {
    constructor(want, got) {
        super(`type error: want ${printType(want)}, got ${printType(got)}`);
    }
}
exports.TypeCheckError = TypeCheckError;
// return the bytes of |num| in big-endian order
function serializeNumber(num) {
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
exports.serializeNumber = serializeNumber;
class ValueError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ValueError = ValueError;
function deserialize(view, at) {
    const typ = view.getUint8(at);
    switch (typ) {
        case Type.IntType: {
            const num = view.getInt32(at + 1);
            const value = { typ: Type.IntType, value: num };
            return { value, size: 5 };
        }
        case Type.BoolType: {
            const bool = view.getUint8(at + 1);
            if (bool !== 0 && bool !== 1)
                throw new ValueError(`bad boolean value at byte offset ${view.byteOffset + at}: ${bool}`);
            const value = bool === 0 ? false : true;
            return { value: { typ: Type.BoolType, value }, size: 2 };
        }
        case Type.NilType:
            return { value: { typ: Type.NilType }, size: 1 };
        default:
            throw new ValueError(`bad value at byte offset ${view.byteOffset + at}`);
    }
}
exports.deserialize = deserialize;
// serializes |value| to bytes, prefixed by a single byte representing the
// type of the value (see enum Type for the value).
//
// layouts:
// int: big-endian signed 32-bit int
// others: not yet implemented
function serialize(value) {
    const nums = [];
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
exports.serialize = serialize;
function print(value) {
    // prettier-ignore
    switch (value.typ) {
        case Type.BoolType: return value.value.toString();
        case Type.IntType: return value.value.toString(10);
        case Type.NilType: return "null";
    }
}
exports.print = print;
