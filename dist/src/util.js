"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasValue = exports.unwrap = exports.RootError = void 0;
class RootError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.RootError = RootError;
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
