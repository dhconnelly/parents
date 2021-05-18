"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.getBool = exports.getInt = void 0;
const types_1 = require("../types");
const values_1 = require("../values");
function getInt(value) {
    if (value.typ !== types_1.Type.IntType) {
        throw new types_1.TypeCheckError(types_1.Type.IntType, value.typ);
    }
    return value.value;
}
exports.getInt = getInt;
function getBool(value) {
    if (value.typ !== types_1.Type.BoolType) {
        throw new types_1.TypeCheckError(types_1.Type.BoolType, value.typ);
    }
    return value.value;
}
exports.getBool = getBool;
function print(value) {
    switch (value.typ) {
        case types_1.Type.BuiltInFnType:
            return `<built-in-fn ${value.name}>`;
        case types_1.Type.FnType:
            return value.name ? `<fn ${value.name}>` : "<anonymous fn>";
        case types_1.Type.BoolType:
        case types_1.Type.IntType:
        case types_1.Type.NilType:
            return values_1.print(value);
    }
}
exports.print = print;
