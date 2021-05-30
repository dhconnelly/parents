import { Expr } from "../ast";
import { Scope } from "./scope";
import { Type } from "../types";

export type Value = NilValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

export interface NilValue {
    typ: Type.NilType;
}

export interface IntValue {
    typ: Type.IntType;
    value: number;
}

export interface BoolValue {
    typ: Type.BoolType;
    value: boolean;
}

export interface FnValue {
    typ: Type.FnType;
    scope: Scope;
    params: string[];
    body: Expr;
    name?: string;
}

export interface BuiltInFnValue {
    typ: Type.BuiltInFnType;
    name: string;
    arity: number;
    impl: (args: Expr[]) => Value;
}

export function print(value: Value): string {
    switch (value.typ) {
        case Type.BuiltInFnType:
            return `<built-in-fn ${value.name}>`;
        case Type.FnType:
            return value.name ? `<fn ${value.name}>` : "<anonymous fn>";
        case Type.BoolType:
            return value.value.toString();
        case Type.IntType:
            return value.value.toString(10);
        case Type.NilType:
            return "nil";
    }
}
