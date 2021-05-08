import { Expr } from "./ast";
import { Scope } from "./interpreter/scope";

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
