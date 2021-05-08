import { Option } from "../util";
import { Value } from "../values";

export class Scope {
    up?: Scope;
    bindings: Map<string, Value>;

    constructor(up?: Scope) {
        this.up = up;
        this.bindings = new Map<string, Value>();
    }

    define(name: string, binding: Value) {
        this.bindings.set(name, binding);
    }

    snapshot(): Scope {
        const root = this.up ? this.up.snapshot() : new Scope();
        for (const [name, binding] of this.bindings) {
            root.define(name, binding);
        }
        return root;
    }

    lookup(name: string): Option<Value> {
        let scope: Option<Scope> = this;
        while (scope) {
            let value = scope.bindings.get(name);
            if (value) return value;
            scope = scope.up;
        }
        return undefined;
    }
}
