export class Scope {
    constructor(up) {
        this.up = up;
        this.bindings = new Map();
    }
}
export const Null = { typ: "NullType" };
export function print(value) {
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
