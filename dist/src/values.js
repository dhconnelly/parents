"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.serialize = exports.deserialize = exports.Type = void 0;
var Type;
(function (Type) {
    Type[Type["NilType"] = 0] = "NilType";
    Type[Type["IntType"] = 1] = "IntType";
    Type[Type["BoolType"] = 2] = "BoolType";
    Type[Type["FnType"] = 3] = "FnType";
    Type[Type["BuiltInFnType"] = 4] = "BuiltInFnType";
})(Type = exports.Type || (exports.Type = {}));
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
class ValueError extends Error {
    constructor(message) {
        super(message);
    }
}
function deserialize(view) {
    const typ = view.getUint8(0);
    switch (typ) {
        case Type.BoolType:
        case Type.BuiltInFnType:
        case Type.FnType:
        case Type.NilType:
            throw new Error("not implemented");
        case Type.IntType:
            const num = view.getInt32(1);
            const value = { typ: Type.IntType, value: num };
            return { value, size: 5 };
        default:
            throw new ValueError(`bad value at byte offset ${view.byteOffset}`);
    }
}
exports.deserialize = deserialize;
function serialize(value) {
    const nums = [];
    nums.push(value.typ);
    switch (value.typ) {
        case Type.BoolType:
        case Type.BuiltInFnType:
        case Type.FnType:
        case Type.NilType:
            throw new Error("not implemented");
        case Type.IntType:
            nums.push(...serializeNumber(value.value));
            break;
    }
    return nums;
}
exports.serialize = serialize;
function print(value) {
    switch (value.typ) {
        case Type.BoolType:
            return value.value.toString();
        case Type.BuiltInFnType:
            return `<built-in-fn ${value.name}>`;
        case Type.FnType:
            return value.name ? `<fn ${value.name}>` : "<anonymous fn>";
        case Type.IntType:
            return value.value.toString(10);
        case Type.NilType:
            return "null";
    }
}
exports.print = print;
