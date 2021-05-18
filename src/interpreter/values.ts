import { Expr } from "../ast";
import { Scope } from "./scope";
import { Type, TypeCheckError } from "../types";
import {
    NilValue,
    IntValue,
    BoolValue,
    AbstractValue,
    print as printSerializable,
} from "../values";

export type Value = NilValue | IntValue | BoolValue | FnValue | BuiltInFnValue;

export interface FnValue extends AbstractValue {
    readonly typ: Type.FnType;
    readonly scope: Scope;
    readonly params: string[];
    readonly body: Expr;
    readonly name?: string;
}

export interface BuiltInFnValue extends AbstractValue {
    readonly typ: Type.BuiltInFnType;
    readonly name: string;
    readonly arity: number;
    readonly impl: (args: Expr[]) => Value;
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

export function getInt(value: Value): number {
    if (value.typ !== Type.IntType) {
        throw new TypeCheckError(Type.IntType, value.typ);
    }
    return value.value;
}

export function getBool(value: Value): boolean {
    if (value.typ !== Type.BoolType) {
        throw new TypeCheckError(Type.BoolType, value.typ);
    }
    return value.value;
}
