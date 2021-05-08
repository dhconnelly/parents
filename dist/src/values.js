"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
function print(value) {
    switch (value.typ) {
        case "BoolType":
            return value.value.toString();
        case "BuiltInFnType":
            return `<built-in-fn ${value.name}>`;
        case "FnType":
            return value.name ? `<fn ${value.name}>` : "<anonymous fn>";
        case "IntType":
            return value.value.toString(10);
        case "NilType":
            return "null";
    }
}
exports.print = print;
