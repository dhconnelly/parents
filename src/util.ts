export type Option<T> = T | undefined;

export function unwrap<T>(x: Option<T>): T {
    if (x === undefined) throw new Error("unwrap");
    return x;
}
