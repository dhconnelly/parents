"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeCheckError = exports.Type = void 0;
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
