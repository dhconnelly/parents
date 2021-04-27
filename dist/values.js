export class Scope {
    constructor(up) {
        this.up = up;
        this.bindings = new Map();
    }
    lookup(name) {
        let scope = this;
        while (scope) {
            let value = scope.bindings.get(name);
            if (value)
                return value;
            scope = scope.up;
        }
        return undefined;
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
