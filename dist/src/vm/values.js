"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.getFn = exports.getBool = exports.getInt = exports.closureSize = exports.ExecutionError = void 0;
const values_1 = require("../values");
class ExecutionError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ExecutionError = ExecutionError;
function valueSize(value) {
    // prettier-ignore
    switch (value.typ) {
        case values_1.Type.IntType: return 4;
        case values_1.Type.NilType: return 1;
        case values_1.Type.FnType: return 9;
        case values_1.Type.BuiltInFnType: return 5 + value.name.length * 2;
        case values_1.Type.BoolType: return 1;
    }
}
function sum(nums) {
    return nums.reduce((acc, cur) => acc + cur, 0);
}
function closureSize(closure) {
    return 8 + sum(closure.captures.map(valueSize));
}
exports.closureSize = closureSize;
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
