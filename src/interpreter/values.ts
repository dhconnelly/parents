import { Expr } from "../ast";
import { Scope } from "./scope";
import {
    NilValue,
    IntValue,
    BoolValue,
    AbstractValue,
    print as printSerializable,
    Type,
} from "../values";

export type Value = NilValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

export interface FnValue extends AbstractValue {
    typ: Type.FnType;
    scope: Scope;
    params: string[];
    body: Expr;
    name?: string;
}

export interface BuiltInFnValue extends AbstractValue {
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
        case Type.IntType:
        case Type.NilType:
            return printSerializable(value);
    }
}
