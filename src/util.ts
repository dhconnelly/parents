export type Option<T> = T | undefined;

export function unwrap<T>(x: Option<T>): T {
    if (x === undefined) throw new Error("unwrap");
    return x;
}

export function hasValue<T>(x: Option<T>): x is T {
    return x !== undefined;
}

type result<T, E extends Error> =
    | { typ: "ok"; value: T }
    | { typ: "err"; error: E };

export class Result<T, E extends Error> {
    result: result<T, E>;

    constructor(result: result<T, E>) {
        this.result = result;
    }

    flatMap<U>(f: (t: T) => Result<U, E>): Result<U, E> {
        switch (this.result.typ) {
            case "ok":
                return f(this.result.value);
            case "err":
                return new Result(this.result);
        }
    }

    unwrap(): T {
        if (this.result.typ === "ok") return this.result.value;
        throw this.result.error;
    }
}

export function Ok<T, E extends Error>(t: T): Result<T, E> {
    return new Result({ typ: "ok", value: t });
}

export function Err<T, E extends Error>(e: E): Result<T, E> {
    return new Result({ typ: "err", error: e });
}
