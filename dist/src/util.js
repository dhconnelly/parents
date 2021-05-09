"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasValue = exports.unwrap = void 0;
function unwrap(x) {
    if (x === undefined)
        throw new Error("unwrap");
    return x;
}
exports.unwrap = unwrap;
function hasValue(x) {
    return x !== undefined;
}
exports.hasValue = hasValue;
