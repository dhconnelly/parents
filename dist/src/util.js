"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = exports.Ok = exports.Result = exports.hasValue = exports.unwrap = void 0;
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
class Result {
    constructor(result) {
        this.result = result;
    }
    flatMap(f) {
        switch (this.result.typ) {
            case "ok":
                return f(this.result.value);
            case "err":
                return new Result(this.result);
        }
    }
    unwrap() {
        if (this.result.typ === "ok")
            return this.result.value;
        throw this.result.error;
    }
}
exports.Result = Result;
function Ok(t) {
    return new Result({ typ: "ok", value: t });
}
exports.Ok = Ok;
function Err(e) {
    return new Result({ typ: "err", error: e });
}
exports.Err = Err;
