"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.getFn = exports.getBool = exports.getInt = void 0;
const values_1 = require("../values");
function getInt(value) {
    if (value.typ !== values_1.Type.IntType) {
        throw new values_1.TypeCheckError(values_1.Type.IntType, value.typ);
    }
    return value.value;
}
exports.getInt = getInt;
function getBool(value) {
    if (value.typ !== values_1.Type.BoolType) {
        throw new values_1.TypeCheckError(values_1.Type.BoolType, value.typ);
    }
    return value.value;
}
exports.getBool = getBool;
function getFn(value) {
    if (value.typ !== values_1.Type.BuiltInFnType && value.typ !== values_1.Type.FnType) {
        throw new values_1.TypeCheckError(values_1.Type.FnType, value.typ);
    }
    return value;
}
exports.getFn = getFn;
function print(value) {
    // prettier-ignore
    switch (value.typ) {
        case values_1.Type.BuiltInFnType: return `<built-in-fn ${value.name}>`;
        case values_1.Type.FnType: return `<compiled-fn>`;
        case values_1.Type.BoolType:
        case values_1.Type.IntType:
        case values_1.Type.NilType:
            return values_1.print(value);
    }
}
exports.print = print;
