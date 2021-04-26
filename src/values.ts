import { Expr } from "./ast";

export class Scope {
    up?: Scope;
    bindings: Map<string, Value>;

    constructor(up?: Scope) {
        this.up = up;
        this.bindings = new Map<string, Value>();
    }
}

export type Value = NullValue | IntValue | FunctionValue;

export interface NullValue {
    toString(): string;
}

export const Null: NullValue = {
    toString(): string {
        return "null";
    },
};

export class IntValue {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    toString() {
        return this.value.toString(10);
    }
}

export class FunctionValue {
    scope: Scope;
    params: string[];
    body: Expr;
    name?: string;

    constructor(scope: Scope, params: string[], body: Expr, name?: string) {
        this.scope = scope;
        this.name = name;
        this.params = params;
        this.body = body;
    }

    toString() {
        return this.name ? `[function ${this.name}]` : "[anonymous function]";
    }
}
