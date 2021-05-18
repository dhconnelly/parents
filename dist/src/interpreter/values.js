"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
const types_1 = require("../types");
const values_1 = require("../values");
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
