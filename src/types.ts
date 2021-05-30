export enum Type {
    NilType = 1,
    IntType = 2,
    BoolType = 3,
    FnType = 4,
    BuiltInFnType = 5,
}

function printType(typ: Type): string {
    // prettier-ignore
    switch (typ) {
        case Type.NilType: return "NilType";
        case Type.BoolType: return "BoolType";
        case Type.BuiltInFnType: return "BuiltInFnType";
        case Type.FnType: return "FnType";
        case Type.IntType: return "IntType";
    }
}

export class TypeCheckError extends Error {
    constructor(want: Type, got: Type) {
        super(`type error: want ${printType(want)}, got ${printType(got)}`);
    }
}
