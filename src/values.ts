import { Expr } from "./ast";
import { Option } from "./util";

export class Scope {
    up?: Scope;
    bindings: Map<string, Value>;

    constructor(up?: Scope) {
        this.up = up;
        this.bindings = new Map<string, Value>();
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
    | "NullType"
    | "IntType"
    | "BoolType"
    | "FnType"
    | "BuiltInFnType";

export type Value = NullValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

interface AbstractValue {
    typ: Type;
}

export interface NullValue extends AbstractValue {
    typ: "NullType";
}
export const Null: Value = { typ: "NullType" };

export interface IntValue extends AbstractValue {
    typ: "IntType";
    value: number;
}

export interface BoolValue extends AbstractValue {
    typ: "BoolType";
    value: boolean;
}

export interface FnValue extends AbstractValue {
    typ: "FnType";
    scope: Scope;
    params: string[];
    body: Expr;
    name?: string;
}

export interface BuiltInFnValue extends AbstractValue {
    typ: "BuiltInFnType";
    name: string;
    arity: number;
    impl: (args: Expr[]) => Value;
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
        case "NullType":
            return "null";
    }
}
