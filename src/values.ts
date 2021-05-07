import { Expr } from "./ast";
import { Option } from "./util";

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

export type Type =
    | "NilType"
    | "IntType"
    | "BoolType"
    | "FnType"
    | "BuiltInFnType";

interface AbstractValue {
    readonly typ: Type;
}

export type Value = NilValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

export interface NilValue extends AbstractValue {
    readonly typ: "NilType";
}

export interface IntValue extends AbstractValue {
    readonly typ: "IntType";
    readonly value: number;
}

export interface BoolValue extends AbstractValue {
    readonly typ: "BoolType";
    readonly value: boolean;
}

export interface FnValue extends AbstractValue {
    readonly typ: "FnType";
    readonly scope: Scope;
    readonly params: string[];
    readonly body: Expr;
    readonly name?: string;
}

export interface BuiltInFnValue extends AbstractValue {
    readonly typ: "BuiltInFnType";
    readonly name: string;
    readonly arity: number;
    readonly impl: (args: Expr[]) => Value;
}

export function print(value: Value): string {
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
