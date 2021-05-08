"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
class Scope {
    constructor(up) {
        this.up = up;
        this.bindings = new Map();
    }
    define(name, binding) {
        this.bindings.set(name, binding);
    }
    snapshot() {
        const root = this.up ? this.up.snapshot() : new Scope();
        for (const [name, binding] of this.bindings) {
            root.define(name, binding);
        }
        return root;
    }
    lookup(name) {
        let scope = this;
        while (scope) {
            let value = scope.bindings.get(name);
            if (value)
                return value;
            scope = scope.up;
        }
        return undefined;
    }
}
exports.Scope = Scope;
