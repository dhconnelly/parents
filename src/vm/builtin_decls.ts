export const BUILT_INS = {
    "+": { index: 0, typ: "function" },
    "-": { index: 1, typ: "function" },
    "<": { index: 2, typ: "function" },
    "=": { index: 3, typ: "function" },
    assert: { index: 4, typ: "function" },
    display: { index: 5, typ: "function" },
    "*": { index: 6, typ: "function" },
    isnil: { index: 7, typ: "function" },
    nil: { index: 8, typ: "value" },
    memory: { index: 9, typ: "function" },
} as const;

export const NUM_BUILT_INS = Object.keys(BUILT_INS).length;

type BuiltIns = typeof BUILT_INS;
export type BuiltInName = keyof BuiltIns;

export const BUILT_IN_NAMES = Object.keys(BUILT_INS) as BuiltInName[];

type BuiltInFn = { typ: "function" };
export type BuiltInFnName = {
    [K in BuiltInName]: BuiltIns[K] extends BuiltInFn ? K : never;
}[BuiltInName];
